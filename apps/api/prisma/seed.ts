import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { normalizePhoneNumber } from '../src/shared/utils/phone.util';

const prisma = new PrismaClient();

async function main() {
  // =============================================
  // 🔐 Create Admin User for Admin Dashboard
  // =============================================
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@usdt-p2p.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || '000000';
  const adminName = process.env.SEED_ADMIN_NAME || 'Administrator';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: adminName,
      role: 'superadmin',
      isActive: true,
    },
    update: {
      passwordHash: adminPasswordHash,
      name: adminName,
      isActive: true,
    },
  });

  console.log(`✅ Admin user created/updated: ${adminUser.email} (${adminUser.role})`);

  // =============================================
  // 👤 Create Demo User for Mobile App
  // =============================================
  const phoneRaw = process.env.SEED_USER_PHONE || '+218912345678';
  const password = process.env.SEED_USER_PASSWORD || 'ChangeMe123!';
  const name = process.env.SEED_USER_NAME || 'Demo User';
  const email = process.env.SEED_USER_EMAIL || undefined;

  const normalizedPhone = normalizePhoneNumber(phoneRaw, 'LY').full;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { phone: normalizedPhone },
    create: {
      phone: normalizedPhone,
      email,
      name,
      passwordHash,
      wallets: {
        create: [
          { asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
          { asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'FUNDING' },
          { asset: 'USDC', network: 'ERC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
        ],
      },
    },
    update: {
      email,
      name,
      passwordHash,
      isActive: true,
      isBanned: false,
    },
  });

  // Ensure wallets exist for existing users (upsert.update doesn't create wallets)
  const existingWallets = await prisma.wallet.count({ where: { userId: user.id } });
  if (existingWallets === 0) {
    await prisma.wallet.createMany({
      data: [
        { userId: user.id, asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
        { userId: user.id, asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'FUNDING' },
        { userId: user.id, asset: 'USDC', network: 'ERC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
      ],
    });
  }

  console.log(`✅ Demo user created/updated: ${user.phone}`);

  // =============================================
  // 📈 Create Staking Products
  // =============================================
  const products = [
    { asset: 'USDT', apy: 5.5, durationDays: 0, minAmount: 1, maxAmount: 50000 },
    { asset: 'USDT', apy: 8.2, durationDays: 30, minAmount: 100, maxAmount: 10000 },
    { asset: 'BTC', apy: 2.1, durationDays: 0, minAmount: 0.001, maxAmount: 1 },
    { asset: 'ETH', apy: 3.5, durationDays: 0, minAmount: 0.01, maxAmount: 10 },
    { asset: 'BNB', apy: 12.0, durationDays: 60, minAmount: 0.1, maxAmount: 100 },
  ];

  for (const p of products) {
    // Check if exists to avoid duplicates on re-seed (simple check by asset & duration)
    const existing = await prisma.stakingProduct.findFirst({
        where: { asset: p.asset, durationDays: p.durationDays, isActive: true }
    });

    if (!existing) {
        await prisma.stakingProduct.create({
            data: {
                asset: p.asset,
                apy: p.apy,
                durationDays: p.durationDays,
                minAmount: p.minAmount,
                maxAmount: p.maxAmount,
                isActive: true
            }
        });
        console.log(`✅ Created Staking Product: ${p.asset} (${p.durationDays === 0 ? 'Flexible' : p.durationDays + ' days'})`);
    }
  }

  // =============================================
  // 🌐 Create Network Configuration
  // =============================================
  const existingNetworkConfig = await prisma.networkConfig.findFirst({
    where: { isActive: true }
  });

  if (!existingNetworkConfig) {
    await prisma.networkConfig.create({
      data: {
        networkMode: 'TESTNET',
        displayName: 'Testnet',
        displayNameAr: 'شبكة الاختبار',
        description: 'Test environment - No real funds',
        descriptionAr: 'بيئة اختبار - لا أموال حقيقية',
        primaryColor: '#F0B90B',
        warningColor: '#F6465D',
        badgeColor: '#FF6B35',
        borderColor: '#FF6B35',
        showGlobalBanner: true,
        showWatermark: true,
        requireConfirmation: true,
        enableDeposits: true,
        enableWithdrawals: true,
        enableP2P: true,
        enableSwap: true,
        enableStaking: true,
        maxTransactionAmount: 10000,
        dailyLimit: 50000,
        blockchainConfig: {
          mainnet: {
            bsc: { chainId: 56, name: 'BNB Smart Chain', rpcUrl: 'https://bsc-dataseed.binance.org/' },
            tron: { chainId: 728126428, name: 'TRON Mainnet', rpcUrl: 'https://api.trongrid.io' },
            ethereum: { chainId: 1, name: 'Ethereum Mainnet', rpcUrl: 'https://eth.llamarpc.com' },
          },
          testnet: {
            bsc: { chainId: 97, name: 'BSC Testnet', rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/' },
            tron: { chainId: 2494104990, name: 'TRON Shasta Testnet', rpcUrl: 'https://api.shasta.trongrid.io' },
            ethereum: { chainId: 11155111, name: 'Sepolia Testnet', rpcUrl: 'https://rpc.sepolia.org' },
          },
        },
        isActive: true,
      }
    });
    console.log('✅ Network Configuration created (TESTNET mode)');
  } else {
    console.log('✅ Network Configuration already exists');
  }

  console.log('\n📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Admin Dashboard (http://localhost:3001):');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🌐 Network Mode: TESTNET (default)');
  console.log('   Switch to MAINNET from Admin Dashboard > Network Config');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });
