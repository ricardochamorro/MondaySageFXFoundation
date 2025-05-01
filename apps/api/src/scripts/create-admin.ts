import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create the admin role
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      permissions: ['admin'],
    },
  })

  console.log('Created admin role:', adminRole)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 