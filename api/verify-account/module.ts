import Elysia from "elysia";
import { EmailVerificationDTO } from "../global-dtos/email.dto";
import { prisma } from "@/db/config";
import jwt from 'jsonwebtoken'
import { environment } from "@/env/env";
import { emailService } from "@/services/sendgrid";
import { OTPDTO } from "./dtos/otp.dto";
import { TokenVerificationDTO } from "../global-dtos/token.dto";
import type { VerificationPayload } from "@/utils/types";
import { errorMessage } from "@/utils/error-handler";
import { UserTypeQueryDTO } from "../global-dtos/user-type.dto";
import { generateAlnum } from "@/utils/alnum-generator";
import { v7 } from "uuid";
import { verifyAccessToken } from "@/utils/jwt-token-handler";

export const verifyAccountModule = new Elysia({ prefix: '/verify-account' })
  .derive(verifyAccessToken)
  .post('/email', async (c) => {
    const data = c.body
    const userType = c.query.user_type

    const role = await prisma.role.findUnique({
      where: { userType }
    })

    const user = await prisma.user.findUnique({
      where: {
        email_roleId: {
          email: data.email,
          roleId: role!.id
        }
      },
    })

    if (!user) {
      throw errorMessage(404, 'Account does not exist.')
    }

    const name = user.name
    const id = user.id

    const otp = generateAlnum()
    const resetId = v7()

    const token = jwt.sign(
      { id, resetId }, environment.JWT_VERIFY_ACCOUNT_SECRET + otp, { expiresIn: '1d' }
    )
    const verifyAccountLink = `${environment.DOMAIN_URL}/verify-account?token=${token}`
    const dynamicTemplateData = {
      name,
      verifyAccountLink,
      otp
    }

    await prisma.oTPHandler.update({
      where: {
        userId_oTPPurpose: {
          userId: user.id,
          oTPPurpose: 'VERIFICATION'
        }
      },
      data: { resetId }
    })

    await emailService.sendMail(
      data.email,
      'Account verification',
      environment.SENDGRID_VERIFY_ACCOUNT_TEMPLATE,
      dynamicTemplateData
    )

    return { message: 'Account verification request sent successfully.' }
  }, {
    body: EmailVerificationDTO,
    query: UserTypeQueryDTO
  })
  .patch('/verify', async (c) => {
    const data = c.body
    const token = c.headers.authorization.split(' ')[1]

    let payload: VerificationPayload

    try {
      payload = jwt.verify(token, environment.JWT_VERIFY_ACCOUNT_SECRET + data.otp) as VerificationPayload
    } catch (err) {
      throw errorMessage(400, 'Invalid OTP.')
    }

    const findUser = await prisma.user.findUnique({
      where: {
        id: payload.id
      },
      include: { role: true }
    })

    if (!findUser) {
      throw errorMessage(404, 'Account does not exist')
    }

    const oTPHandler = await prisma.oTPHandler.findUnique({
      where: {
        userId_oTPPurpose: {
          userId: findUser.id,
          oTPPurpose: 'VERIFICATION'
        }
      }
    })

    if (oTPHandler?.resetId != payload.resetId) {
      throw errorMessage(400, 'Invalid OTP.')
    }

    await prisma.user.update({
      where: { id: payload.id },
      data: { verified: true }
    })

    await prisma.oTPHandler.update({
      where: { id: oTPHandler.id },
      data: { resetId: null }
    })

    return { message: 'Account successfully verified!' }
  }, {
    body: OTPDTO,
    headers: TokenVerificationDTO
  })