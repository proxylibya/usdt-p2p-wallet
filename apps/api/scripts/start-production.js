#!/usr/bin/env node
/**
 * Production Start Script
 * Handles database migrations and graceful startup
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkEnvironment() {
  console.log('🔍 Checking environment variables...');
  const requiredVars = ['DATABASE_URL'];
  const missingVars = requiredVars.filter(env => !process.env[env]);

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  console.log('✅ Environment checks passed');
}

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  // Verify schema exists
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.warn(`⚠️ Schema file not found at ${schemaPath}, migration might fail.`);
  }

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
  
  const mainDistPath = path.join(process.cwd(), 'dist', 'main.js');
  if (!fs.existsSync(mainDistPath)) {
    console.error(`❌ Application entry point not found at ${mainDistPath}`);
    console.error('   Please ensure the build process completed successfully.');
    process.exit(1);
  }

  const server = spawn('node', ['dist/main'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  server.on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });

  server.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`Server exited with code ${code}`);
      process.exit(code);
    }
  });
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  USDT P2P API - Production Startup');
  console.log('═══════════════════════════════════════');
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════');

  checkEnvironment();

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
