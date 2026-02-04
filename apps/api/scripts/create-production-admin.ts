#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createProductionAdmin() {
  try {
    console.log('🔐 Creating production admin user...\n');

    // يمكنك تغيير البيانات هنا
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const name = process.env.ADMIN_NAME || 'Super Administrator';

    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Password: ${password.slice(0, 3)}***\n`);

    // Check if admin exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('⚠️  Admin already exists. Updating password...');
      
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.adminUser.update({
        where: { email },
        data: {
          passwordHash,
          isActive: true,
          name,
        },
      });
      
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      const passwordHash = await bcrypt.hash(password, 12);
      const admin = await prisma.adminUser.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'superadmin',
          isActive: true,
        },
      });
      
      console.log('✅ Admin created successfully!');
      console.log(`ID: ${admin.id}`);
    }

    console.log('\n✅ Done! You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Remember to change the password after first login!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();
