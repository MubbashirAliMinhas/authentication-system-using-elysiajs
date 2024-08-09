import Elysia from "elysia";
import { EmailVerificationDTO } from "../global-dtos/email.dto";
import { prisma } from "@/db/config";
import jwt from 'jsonwebtoken'
import { environment } from "@/env/env";
import { emailService } from "@/services/sendgrid";
import { PasswordDTO } from "./dtos/password.dto";
import { TokenVerificationDTO } from "../global-dtos/token.dto";
import type { VerificationPayload } from "@/utils/types";
import { errorMessage } from "@/utils/error-handler";
import { UserTypeQueryDTO } from "../global-dtos/user-type.dto";
import { generateAlnum } from "@/utils/alnum-generator";
import { v7 } from "uuid";

export const forgotPasswordModule = new Elysia({ prefix: '/forgot-password' })
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
      { id, resetId }, environment.JWT_FORGOT_PASSWORD_SECRET + otp, { expiresIn: '30m' }
    )
    const resetPasswordLink = `${environment.DOMAIN_URL}/forget-password?token=${token}`
    const dynamicTemplateData = {
      name,
      resetPasswordLink,
      otp
    }

    await prisma.oTPHandler.update({
      where: {
        userId_oTPPurpose: {
          userId: user.id,
          oTPPurpose: 'FORGOT_PASSWORD'
        }
      },
      data: { resetId }
    })

    await emailService.sendMail(
      data.email,
      'Reset password.',
      environment.SENDGRID_FORGOT_PASSWORD_TEMPLATE,
      dynamicTemplateData
    )

    return { message: 'Password reset request sent successfully.' }
  }, {
    body: EmailVerificationDTO,
    query: UserTypeQueryDTO
  })
  .patch('/reset', async (c) => {
    const data = c.body
    const token = c.headers.authorization.split(' ')[1]

    let payload: VerificationPayload

    try {
      payload = jwt.verify(token, environment.JWT_FORGOT_PASSWORD_SECRET + data.otp) as VerificationPayload
    } catch (err) {
      throw errorMessage(400, 'Invalid OTP.')
    }

    const findUser = await prisma.user.findUnique({
      where: {
        id: payload.id
      },
    })

    if (!findUser) {
      throw errorMessage(404, 'Account does not exist')
    }

    const oTPHandler = await prisma.oTPHandler.findUnique({
      where: {
        userId_oTPPurpose: {
          userId: findUser.id,
          oTPPurpose: 'FORGOT_PASSWORD'
        }
      }
    })

    if (oTPHandler?.resetId != payload.resetId) {
      throw errorMessage(400, 'Invalid OTP.')
    }

    await prisma.user.update({
      where: { id: payload.id },
      data: { password: Bun.password.hashSync(data.password, { algorithm: 'bcrypt', cost: 10 }) }
    })

    await prisma.oTPHandler.update({
      where: { id: oTPHandler.id },
      data: { resetId: null }
    })

    return { message: 'Password successfully updated!' }
  }, {
    body: PasswordDTO,
    headers: TokenVerificationDTO
  })