import Elysia from "elysia";
import { googleAuthModule } from "./google/module";
import { LoginUserDTO, UserDTO } from "./dtos/user.dto";
import { prisma } from "@/db/config";
import jwt from 'jsonwebtoken'
import { environment } from "@/env/env";
import { successResponse } from "@/utils/success-response";
import { verifyAccessToken } from "@/utils/jwt-token-handler";
import { prismaUniqueHandler } from "@/utils/prisma-unique-handler";
import { errorMessage } from "@/utils/error-handler";

export const authModule = new Elysia({ prefix: '/auth' })
  .use(googleAuthModule)
  .post('/login', async (c) => {
    const data = c.body

    const userRole = await prisma.role.findUnique({
      where: { userType: 'USER' }
    })

    const user = await prisma.user.findUnique({
      where: {
        email_roleId: {
          email: data.email,
          roleId: userRole!.id
        }
      },
    })

    if (!user) {
      throw errorMessage(404, 'User does not exist.')
    }

    if (!user.password || !Bun.password.verifySync(data.password, user.password)) {
      throw errorMessage(400, 'Incorrect password.')
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)

    const accessToken = jwt.sign(
      { 
        id: user.id,
        role: userRole, 
        name: user.name,
        verified: user.verified
      },
      environment.JWT_SECRET, {
      expiresIn: '7d'
    })

    const cookie = c.cookie.access_token
    cookie.set({
      value: accessToken,
      httpOnly: true,
      secure: true,
      expires: expiryDate,
    })

    return successResponse
  }, {
    body: LoginUserDTO
  })
  .post('/login-admin', async (c) => {
    const data = c.body

    const adminRole = await prisma.role.findUnique({
      where: { userType: 'ADMIN' }
    })

    const user = await prisma.user.findUnique({
      where: {
        email_roleId: {
          email: data.email,
          roleId: adminRole!.id
        }
      },
    })

    if (!user) {
      throw errorMessage(404, 'User does not exist.')
    }

    if (!user.password || !Bun.password.verifySync(data.password, user.password)) {
      throw errorMessage(400, 'Incorrect password.')
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)

    const accessToken = jwt.sign({ id: user.id, role: adminRole, name: user.name }, environment.JWT_SECRET, {
      expiresIn: '7d'
    })

    const cookie = c.cookie.access_token
    cookie.set({
      value: accessToken,
      httpOnly: true,
      secure: true,
      expires: expiryDate,
    })

    return successResponse
  }, {
    body: LoginUserDTO
  })
  .post('/signup', async (c) => {
    const data = c.body
    data.password = await Bun.password.hash(data.password, { algorithm: 'bcrypt', cost: 10 })

    const userRole = await prisma.role.findUnique({
      where: { userType: 'USER' }
    })
    
    const user = await prismaUniqueHandler(async () => await prisma.user.create({
      data: {
        name: data.name,
        password: data.password,
        email: data.email,
        roleId: userRole!.id,
        verified: false,
        oTPHandler: {
          createMany: {
            data: [
              { oTPPurpose: 'FORGOT_PASSWORD' },
              { oTPPurpose: 'VERIFICATION' },
            ]
          }
        }
      },
    }), 'User already exists with this email address.')
    
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)

    const accessToken = jwt.sign(
      { 
        id: user.id,
        role: userRole, 
        name: user.name,
        verified: user.verified
      },
      environment.JWT_SECRET, {
      expiresIn: '7d'
    })

    const cookie = c.cookie.access_token
    cookie.set({
      value: accessToken,
      httpOnly: true,
      secure: true,
      expires: expiryDate,
    })

    return successResponse
  }, {
    body: UserDTO
  })

authModule
  .derive(verifyAccessToken)
  .delete('/logout', async (c) => {
    const cookie = c.cookie.access_token
    cookie.remove()
    delete c.cookie.access_token

    return { message: "Logged out user from server" }
  })