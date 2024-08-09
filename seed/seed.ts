import { prisma } from "@/db/config";
import { adminPermissions, userPermissions } from "@/utils/permission";
import { UserType } from "@prisma/client";

async function seed() {
  const userRole = await prisma.role.findFirst({
    where: { userType: 'USER' }
  })

  const adminRole = await prisma.role.findFirst({
    where: { userType: 'ADMIN' }
  })

  if (userRole && adminRole) {
    await prisma.role.update({
      where: { id: userRole.id },
      data: { userType: UserType.USER, permissions: userPermissions }
    })

    await prisma.role.update({
      where: { id: adminRole.id },
      data: { userType: UserType.ADMIN, permissions: adminPermissions }
    })
  } else {
    await prisma.role.createMany({
      data: [
        { userType: UserType.ADMIN, permissions: adminPermissions },
        { userType: UserType.USER, permissions: userPermissions }
      ]
    })
  }
}

async function createAdmin() {
  const adminRole = await prisma.role.findFirst({
    where: {
      userType: UserType.ADMIN
    }
  })

  await prisma.user.upsert({
    where: {
      email_roleId: {
        email: 'admin@admin.com',
        roleId: adminRole!.id
      }
    },
    create: {
      name: 'Admin',
      email: 'admin@admin.com',
      password: Bun.password.hashSync('admin', { algorithm: 'bcrypt', cost: 10 }),
      roleId: adminRole!.id,
      verified: true
    },
    update: {}
  })
}

async function main() {
  await seed()
  await createAdmin()
}

main()