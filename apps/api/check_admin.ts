
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAdmin() {
  const email = 'admin@usdt-p2p.local';
  console.log(`Checking for admin user: ${email}`);

  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!admin) {
    console.log('❌ Admin user NOT found!');
    // Create it if missing
    const hash = await bcrypt.hash('000000', 12);
    const newAdmin = await prisma.adminUser.create({
        data: {
            email,
            passwordHash: hash,
            name: 'Administrator',
            role: 'superadmin',
            isActive: true
        }
    });
    console.log('✅ Admin user created:', newAdmin);
    return;
  }

  console.log('✅ Admin user found:', admin);
  
  const testPass = '000000';
  const isMatch = await bcrypt.compare(testPass, admin.passwordHash);
  console.log(`Password '000000' match: ${isMatch}`);

  if (!isMatch) {
      console.log('Updating password to 000000...');
      const newHash = await bcrypt.hash(testPass, 12);
      await prisma.adminUser.update({
          where: { id: admin.id },
          data: { passwordHash: newHash }
      });
      console.log('✅ Password updated.');
  }
}

checkAdmin()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
