import { prisma } from "@/db/config";
import { environment } from "@/env/env";
import Elysia from "elysia";
import { google } from "googleapis";
import jwt from 'jsonwebtoken'

const redirectUrl = environment.DOMAIN_URL + '/api/auth/google/callback'
const googleScopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
]

const oauth2Client = new google.auth.OAuth2(
  environment.GOOGLE_CLIENT_ID,
  environment.GOOGLE_CLIENT_SECRET,
  redirectUrl
)

const googleTokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo'

export const googleAuthModule = new Elysia({ prefix: '/google' })
  .get('', (c) => {
    const consentScreenUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: googleScopes.join(' ')
    })

    return c.redirect(consentScreenUrl)
  })
  .get('/callback', async (c) => {
    const code = c.query.code

    const { tokens } = await oauth2Client.getToken(code!)
    
    const idTokenResponse = await fetch(`${googleTokenInfoUrl}?id_token=${tokens.id_token}`)

    const userData = await idTokenResponse.json()
    
    const userSavingData = { email: userData.email as string, name: userData.name as string }

    const userRole = await prisma.role.findUnique({
      where: { userType: 'USER' }
    })

    const findUser = await prisma.user.findUnique({
      where: {
        email_roleId: {
          email: userSavingData.email,
          roleId: userRole!.id
        }
      },
    })

    if (findUser?.password) {
      userSavingData.name = findUser.name
    }

    const user = await prisma.user.upsert({
      where: {
        email_roleId: {
          email: userSavingData.email,
          roleId: userRole!.id
        }
      },
      create: {
        name: userSavingData.name,
        email: userSavingData.email,
        roleId: userRole!.id,
        verified: false,
        oTPHandler: {
          createMany: {
            data: [
              { oTPPurpose: 'FORGOT_PASSWORD' },
              { oTPPurpose: 'VERIFICATION' }
            ]
          }
        }
      },
      update: {
        name: userSavingData.name
      },
    })

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

    return c.redirect(environment.DOMAIN_URL)
  })