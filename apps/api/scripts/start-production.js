#!/usr/bin/env node
/**
 * Production Start Script
 * Handles database migrations and graceful startup
 */

const { execSync, spawn } = require('child_process');

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        timeout: 60000 
      });
      console.log('✅ Migrations completed successfully');
      return true;
    } catch (error) {
      console.error(`❌ Migration attempt ${attempt}/${MAX_RETRIES} failed`);
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY/1000} seconds...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  console.error('❌ All migration attempts failed');
  return false;
}

async function startServer() {
  console.log('🚀 Starting production server...');
  
  const server = spawn('node', ['dist/main'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  server.on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code || 0);
  });
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  USDT P2P API - Production Startup');
  console.log('═══════════════════════════════════════');
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Database URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Missing'}`);
  console.log('═══════════════════════════════════════');

  // Run migrations
  const migrationsOk = await runMigrations();
  
  if (!migrationsOk) {
    console.warn('⚠️ Starting server without migrations (may cause issues)');
  }

  // Start the server
  await startServer();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
