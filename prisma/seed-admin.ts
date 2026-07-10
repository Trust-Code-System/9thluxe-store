// prisma/seed-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'Fádé@gmail.com'
  const password = 'PASSWORD12'
  const hash = await bcrypt.hash(password, 10)

  const existing = await prisma.user.findUnique({ where: { email } })
  
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hash, name: 'Admin User', role: 'ADMIN' },
    })
    console.log('✅ Updated admin user password.')
  } else {
    await prisma.user.create({
      data: { 
        email, 
        passwordHash: hash, 
        name: 'Admin User',
        role: 'ADMIN',
        marketingEmails: false,
        smsNotifications: false,
      },
    })
    console.log('✅ Created admin user.')
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


