import { PrismaClient } from '@prisma/client';

async function checkDatabaseEncoding() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 فحص إعدادات قاعدة البيانات...\n');

    const encodingResults = await prisma.$queryRaw<Array<{ name: string; setting: string }>>`
      SELECT name, setting 
      FROM pg_settings 
      WHERE name IN ('server_encoding', 'client_encoding', 'lc_collate', 'lc_ctype')
    `;

    console.log('📊 إعدادات الترميز:');
    encodingResults.forEach(row => {
      console.log(`  ${row.name}: ${row.setting}`);
    });

    const dbInfo = await prisma.$queryRaw<Array<{ datname: string; encoding: string; datcollate: string; datctype: string }>>`
      SELECT datname, pg_encoding_to_char(encoding) as encoding, datcollate, datctype
      FROM pg_database
      WHERE datname = current_database()
    `;

    console.log('\n📚 معلومات قاعدة البيانات:');
    dbInfo.forEach(row => {
      console.log(`  Database: ${row.datname}`);
      console.log(`  Encoding: ${row.encoding}`);
      console.log(`  LC_COLLATE: ${row.datcollate}`);
      console.log(`  LC_CTYPE: ${row.datctype}`);
    });

    console.log('\n✅ تم الفحص بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseEncoding();
