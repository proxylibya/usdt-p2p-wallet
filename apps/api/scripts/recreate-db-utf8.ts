#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

const DB_NAME = 'usdt_wallet';

async function recreateDatabaseWithUTF8() {
  console.log('\n🔧 بدء إعادة إنشاء قاعدة البيانات بترميز UTF8 الصحيح...\n');

  const originalDbUrl = process.env.DATABASE_URL;
  const postgresDbUrl = originalDbUrl?.replace(/\/[^\/]+(\?|$)/, '/postgres$1');

  if (!postgresDbUrl) {
    throw new Error('❌ لم يتم العثور على DATABASE_URL في متغيرات البيئة');
  }

  const adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: postgresDbUrl,
      },
    },
  });

  try {
    await adminPrisma.$connect();
    console.log('✅ تم الاتصال بخادم PostgreSQL بنجاح');

    console.log('\n📊 التحقق من إعدادات قاعدة البيانات الحالية...');
    
    try {
      const dbInfo = await adminPrisma.$queryRaw<Array<{
        datname: string;
        encoding: string;
        datcollate: string;
        datctype: string;
      }>>`
        SELECT 
          datname, 
          pg_encoding_to_char(encoding) as encoding, 
          datcollate, 
          datctype
        FROM pg_database
        WHERE datname = ${DB_NAME}
      `;
      
      if (dbInfo.length > 0) {
        const db = dbInfo[0];
        console.log(`\n📚 إعدادات قاعدة البيانات الحالية:`);
        console.log(`   Database: ${db.datname}`);
        console.log(`   Encoding: ${db.encoding}`);
        console.log(`   LC_COLLATE: ${db.datcollate}`);
        console.log(`   LC_CTYPE: ${db.datctype}`);

        if (db.encoding !== 'UTF8') {
          console.log(`\n⚠️  الترميز الحالي هو ${db.encoding} - يجب إعادة الإنشاء`);
        } else {
          console.log('\n✅ الترميز الحالي هو UTF8 - لا داعي لإعادة الإنشاء');
          await adminPrisma.$disconnect();
          return;
        }
      }
    } catch (error) {
      console.log('⚠️  قاعدة البيانات غير موجودة أو لا يمكن الوصول إليها');
    }

    console.log('\n🔄 إنهاء جميع الاتصالات النشطة...');
    try {
      await adminPrisma.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${DB_NAME}'
          AND pid <> pg_backend_pid()
      `);
      console.log('✅ تم إنهاء الاتصالات');
    } catch (error) {
      console.log('⚠️  لا توجد اتصالات نشطة لإنهائها');
    }

    console.log('\n🗑️  حذف قاعدة البيانات القديمة...');
    try {
      await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${DB_NAME}`);
      console.log('✅ تم حذف قاعدة البيانات القديمة');
    } catch (error: any) {
      console.log(`⚠️  خطأ في حذف القاعدة: ${error.message}`);
    }

    console.log('\n🆕 إنشاء قاعدة بيانات جديدة بترميز UTF8...');
    
    try {
      await adminPrisma.$executeRawUnsafe(`
        CREATE DATABASE ${DB_NAME}
        WITH 
        ENCODING = 'UTF8'
        LC_COLLATE = 'en_US.UTF-8'
        LC_CTYPE = 'en_US.UTF-8'
        TEMPLATE = template0
      `);
      console.log('✅ تم إنشاء قاعدة البيانات بنجاح');
    } catch (error: any) {
      if (error.message.includes('does not exist') || error.message.includes('not found')) {
        console.log('⚠️  اللغة en_US.UTF-8 غير متاحة، محاولة استخدام C...');
        
        await adminPrisma.$executeRawUnsafe(`
          CREATE DATABASE ${DB_NAME}
          WITH 
          ENCODING = 'UTF8'
          LC_COLLATE = 'C'
          LC_CTYPE = 'C'
          TEMPLATE = template0
        `);
        console.log('✅ تم إنشاء قاعدة البيانات بنجاح (مع إعدادات بديلة)');
      } else {
        throw error;
      }
    }

    await adminPrisma.$disconnect();

    console.log('\n📊 التحقق من إنشاء قاعدة البيانات الجديدة...');
    const verifyPrisma = new PrismaClient();
    await verifyPrisma.$connect();
    
    const newDbInfo = await verifyPrisma.$queryRaw<Array<{
      database: string;
      encoding: string;
      datcollate: string;
      datctype: string;
    }>>`
      SELECT 
        current_database() as database,
        pg_encoding_to_char(encoding) as encoding,
        datcollate,
        datctype
      FROM pg_database
      WHERE datname = current_database()
    `;
    
    const newDb = newDbInfo[0];
    
    console.log('\n📚 إعدادات قاعدة البيانات الجديدة:');
    console.log(`   Database: ${newDb.database}`);
    console.log(`   Encoding: ${newDb.encoding}`);
    console.log(`   LC_COLLATE: ${newDb.datcollate}`);
    console.log(`   LC_CTYPE: ${newDb.datctype}`);

    await verifyPrisma.$disconnect();

    if (newDb.encoding === 'UTF8') {
      console.log('\n✅ تم إنشاء قاعدة البيانات بترميز UTF8 بنجاح!');
    } else {
      throw new Error(`فشل في إنشاء قاعدة بيانات UTF8: الترميز الحالي هو ${newDb.encoding}`);
    }

    console.log('\n🔄 تطبيق Prisma schema...');
    try {
      const prismaPath = path.join(__dirname, '..');
      console.log('   - تطبيق db push...');
      execSync('npx prisma db push --accept-data-loss', {
        cwd: prismaPath,
        stdio: 'inherit',
      });
      console.log('✅ تم تطبيق schema بنجاح');
    } catch (error: any) {
      console.log('⚠️  حدث خطأ في تطبيق db push، محاولة migrate deploy...');
      try {
        const prismaPath = path.join(__dirname, '..');
        execSync('npx prisma migrate deploy', {
          cwd: prismaPath,
          stdio: 'inherit',
        });
        console.log('✅ تم تطبيق migrations بنجاح');
      } catch (deployError) {
        console.log('⚠️  فشل في تطبيق migrations، الرجاء تطبيقها يدوياً');
      }
    }

    console.log('\n🎉 تم إصلاح قاعدة البيانات بنجاح!');
    console.log('يمكنك الآن إنشاء حسابات أدمن بنصوص عربية دون مشاكل.\n');

  } catch (error: any) {
    console.error('\n❌ حدث خطأ:', error.message);
    console.error(error);
    process.exit(1);
  }
}

recreateDatabaseWithUTF8();
