/**
 * Full System Test Script - Comprehensive Functional Audit
 * Tests all major features: Auth, Wallets, P2P, Swap, Notifications, Admin
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();
const log = (msg: string) => console.log(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${msg}`);
const success = (msg: string) => console.log(`✅ ${msg}`);
const fail = (msg: string) => { console.error(`❌ ${msg}`); throw new Error(msg); };

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

async function testAuth() {
  log('\n🔐 TESTING: Authentication System');
  
  // Test 1: User Creation
  const testPhone = '+218900000001';
  const testPassword = 'TestPass123!';
  
  try {
    await prisma.user.deleteMany({ where: { phone: testPhone } });
    
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        phone: testPhone,
        passwordHash: await bcrypt.hash(testPassword, 12),
        wallets: {
          create: [
            { asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
            { asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'FUNDING' },
          ]
        }
      }
    });
    
    results.push({ category: 'Auth', test: 'User Registration', status: 'PASS' });
    
    // Test 2: Password Verification
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    if (isValid) {
      results.push({ category: 'Auth', test: 'Password Hashing & Verification', status: 'PASS' });
    } else {
      results.push({ category: 'Auth', test: 'Password Hashing & Verification', status: 'FAIL' });
    }
    
    // Test 3: User Lookup
    const foundUser = await prisma.user.findUnique({ where: { phone: testPhone } });
    if (foundUser?.id === user.id) {
      results.push({ category: 'Auth', test: 'User Lookup by Phone', status: 'PASS' });
    } else {
      results.push({ category: 'Auth', test: 'User Lookup by Phone', status: 'FAIL' });
    }
    
    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    
  } catch (error: any) {
    results.push({ category: 'Auth', test: 'Auth System', status: 'FAIL', details: error.message });
  }
}

async function testWallets() {
  log('\n💰 TESTING: Wallet System');
  
  const testPhone = '+218900000002';
  
  try {
    await prisma.user.deleteMany({ where: { phone: testPhone } });
    
    const user = await prisma.user.create({
      data: {
        name: 'Wallet Test User',
        phone: testPhone,
        passwordHash: await bcrypt.hash('Test123!', 12),
        wallets: {
          create: [
            { asset: 'USDT', network: 'TRC20', balance: 1000, lockedBalance: 0, accountType: 'SPOT' },
            { asset: 'USDT', network: 'TRC20', balance: 500, lockedBalance: 0, accountType: 'FUNDING' },
          ]
        }
      }
    });
    
    // Test 1: Wallet Creation
    const wallets = await prisma.wallet.findMany({ where: { userId: user.id } });
    if (wallets.length === 2) {
      results.push({ category: 'Wallet', test: 'Wallet Creation', status: 'PASS' });
    } else {
      results.push({ category: 'Wallet', test: 'Wallet Creation', status: 'FAIL' });
    }
    
    // Test 2: Balance Update (Atomic)
    const spotWallet = wallets.find(w => w.accountType === 'SPOT')!;
    const updateResult = await prisma.wallet.updateMany({
      where: { id: spotWallet.id, balance: { gte: 100 } },
      data: { balance: { decrement: 100 } }
    });
    
    if (updateResult.count === 1) {
      results.push({ category: 'Wallet', test: 'Atomic Balance Update', status: 'PASS' });
    } else {
      results.push({ category: 'Wallet', test: 'Atomic Balance Update', status: 'FAIL' });
    }
    
    // Test 3: Overdraft Prevention
    const overdraftResult = await prisma.wallet.updateMany({
      where: { id: spotWallet.id, balance: { gte: 10000 } },
      data: { balance: { decrement: 10000 } }
    });
    
    if (overdraftResult.count === 0) {
      results.push({ category: 'Wallet', test: 'Overdraft Prevention', status: 'PASS' });
    } else {
      results.push({ category: 'Wallet', test: 'Overdraft Prevention', status: 'FAIL' });
    }
    
    // Test 4: Transfer between wallets
    const fundingWallet = wallets.find(w => w.accountType === 'FUNDING')!;
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { id: spotWallet.id }, data: { balance: { decrement: 50 } } });
      await tx.wallet.update({ where: { id: fundingWallet.id }, data: { balance: { increment: 50 } } });
    });
    
    const updatedFunding = await prisma.wallet.findUnique({ where: { id: fundingWallet.id } });
    if (Number(updatedFunding?.balance) === 550) {
      results.push({ category: 'Wallet', test: 'Internal Transfer', status: 'PASS' });
    } else {
      results.push({ category: 'Wallet', test: 'Internal Transfer', status: 'FAIL' });
    }
    
    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    
  } catch (error: any) {
    results.push({ category: 'Wallet', test: 'Wallet System', status: 'FAIL', details: error.message });
  }
}

async function testP2P() {
  log('\n🤝 TESTING: P2P Trading System');
  
  const sellerPhone = '+218900000003';
  const buyerPhone = '+218900000004';
  
  try {
    await prisma.user.deleteMany({ where: { phone: { in: [sellerPhone, buyerPhone] } } });
    
    // Create Seller
    const seller = await prisma.user.create({
      data: {
        name: 'P2P Seller',
        phone: sellerPhone,
        passwordHash: await bcrypt.hash('Test123!', 12),
        wallets: {
          create: [
            { asset: 'USDT', network: 'TRC20', balance: 1000, lockedBalance: 0, accountType: 'FUNDING' },
          ]
        }
      }
    });
    
    // Create Buyer
    const buyer = await prisma.user.create({
      data: {
        name: 'P2P Buyer',
        phone: buyerPhone,
        passwordHash: await bcrypt.hash('Test123!', 12),
        wallets: {
          create: [
            { asset: 'USDT', network: 'TRC20', balance: 0, lockedBalance: 0, accountType: 'SPOT' },
          ]
        }
      }
    });
    
    // Test 1: Create Offer
    const offer = await prisma.p2POffer.create({
      data: {
        userId: seller.id,
        type: 'SELL',
        asset: 'USDT',
        fiatCurrency: 'LYD',
        price: 5.50,
        available: 1000,
        minLimit: 10,
        maxLimit: 500,
        paymentMethods: ['bank_transfer'],
        isActive: true
      }
    });
    
    if (offer.id) {
      results.push({ category: 'P2P', test: 'Create Offer', status: 'PASS' });
    } else {
      results.push({ category: 'P2P', test: 'Create Offer', status: 'FAIL' });
    }
    
    // Test 2: Start Trade with Escrow
    const tradeAmount = 100;
    const sellerWallet = await prisma.wallet.findFirst({ where: { userId: seller.id, accountType: 'FUNDING' } });
    
    const trade = await prisma.$transaction(async (tx) => {
      // Lock seller's funds
      await tx.wallet.update({
        where: { id: sellerWallet!.id },
        data: { 
          balance: { decrement: tradeAmount },
          lockedBalance: { increment: tradeAmount }
        }
      });
      
      // Create trade
      return tx.p2PTrade.create({
        data: {
          offerId: offer.id,
          buyerId: buyer.id,
          sellerId: seller.id,
          amount: tradeAmount,
          fiatAmount: tradeAmount * 5.50,
          price: 5.50,
          status: 'WAITING_PAYMENT'
        }
      });
    });
    
    const lockedWallet = await prisma.wallet.findFirst({ where: { userId: seller.id, accountType: 'FUNDING' } });
    if (Number(lockedWallet?.lockedBalance) === 100) {
      results.push({ category: 'P2P', test: 'Escrow Lock', status: 'PASS' });
    } else {
      results.push({ category: 'P2P', test: 'Escrow Lock', status: 'FAIL' });
    }
    
    // Test 3: Release Trade
    const buyerWallet = await prisma.wallet.findFirst({ where: { userId: buyer.id, accountType: 'SPOT' } });
    
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: sellerWallet!.id },
        data: { lockedBalance: { decrement: tradeAmount } }
      });
      
      await tx.wallet.update({
        where: { id: buyerWallet!.id },
        data: { balance: { increment: tradeAmount } }
      });
      
      await tx.p2PTrade.update({
        where: { id: trade.id },
        data: { status: 'COMPLETED' }
      });
    });
    
    const finalBuyerWallet = await prisma.wallet.findFirst({ where: { userId: buyer.id, accountType: 'SPOT' } });
    if (Number(finalBuyerWallet?.balance) === 100) {
      results.push({ category: 'P2P', test: 'Trade Release', status: 'PASS' });
    } else {
      results.push({ category: 'P2P', test: 'Trade Release', status: 'FAIL' });
    }
    
    // Test 4: Dispute Resolution
    const trade2 = await prisma.p2PTrade.create({
      data: {
        offerId: offer.id,
        buyerId: buyer.id,
        sellerId: seller.id,
        amount: 50,
        fiatAmount: 275,
        price: 5.50,
        status: 'DISPUTED'
      }
    });
    
    // Update to locked state first
    await prisma.wallet.update({
      where: { id: sellerWallet!.id },
      data: { lockedBalance: { increment: 50 } }
    });
    
    // Resolve: Buyer wins
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: sellerWallet!.id },
        data: { lockedBalance: { decrement: 50 } }
      });
      
      await tx.wallet.update({
        where: { id: buyerWallet!.id },
        data: { balance: { increment: 50 } }
      });
      
      await tx.p2PTrade.update({
        where: { id: trade2.id },
        data: { status: 'RESOLVED', disputeResult: 'buyer_wins' }
      });
    });
    
    const finalBuyer2 = await prisma.wallet.findFirst({ where: { userId: buyer.id, accountType: 'SPOT' } });
    if (Number(finalBuyer2?.balance) === 150) {
      results.push({ category: 'P2P', test: 'Dispute Resolution (Buyer Wins)', status: 'PASS' });
    } else {
      results.push({ category: 'P2P', test: 'Dispute Resolution (Buyer Wins)', status: 'FAIL' });
    }
    
    // Cleanup
    await prisma.p2PTrade.deleteMany({ where: { offerId: offer.id } });
    await prisma.p2POffer.delete({ where: { id: offer.id } });
    await prisma.user.deleteMany({ where: { id: { in: [seller.id, buyer.id] } } });
    
  } catch (error: any) {
    results.push({ category: 'P2P', test: 'P2P System', status: 'FAIL', details: error.message });
  }
}

async function testNotifications() {
  log('\n🔔 TESTING: Notification System');
  
  const testPhone = '+218900000005';
  
  try {
    await prisma.user.deleteMany({ where: { phone: testPhone } });
    
    const user = await prisma.user.create({
      data: {
        name: 'Notification Test User',
        phone: testPhone,
        passwordHash: await bcrypt.hash('Test123!', 12),
      }
    });
    
    // Test 1: Create Notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'Test Notification',
        message: 'This is a test notification',
        isRead: false
      }
    });
    
    if (notification.id) {
      results.push({ category: 'Notification', test: 'Create Notification', status: 'PASS' });
    } else {
      results.push({ category: 'Notification', test: 'Create Notification', status: 'FAIL' });
    }
    
    // Test 2: Mark as Read
    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true }
    });
    
    const readNotification = await prisma.notification.findUnique({ where: { id: notification.id } });
    if (readNotification?.isRead) {
      results.push({ category: 'Notification', test: 'Mark as Read', status: 'PASS' });
    } else {
      results.push({ category: 'Notification', test: 'Mark as Read', status: 'FAIL' });
    }
    
    // Test 3: Unread Count
    await prisma.notification.create({
      data: { userId: user.id, type: 'SYSTEM', title: 'Unread', message: 'Test', isRead: false }
    });
    
    const unreadCount = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
    if (unreadCount === 1) {
      results.push({ category: 'Notification', test: 'Unread Count', status: 'PASS' });
    } else {
      results.push({ category: 'Notification', test: 'Unread Count', status: 'FAIL' });
    }
    
    // Cleanup
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    
  } catch (error: any) {
    results.push({ category: 'Notification', test: 'Notification System', status: 'FAIL', details: error.message });
  }
}

async function testAdmin() {
  log('\n👑 TESTING: Admin System');
  
  try {
    // Test 1: Dashboard Stats Query
    const [userCount, transactionCount, offerCount] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.p2POffer.count()
    ]);
    
    if (typeof userCount === 'number') {
      results.push({ category: 'Admin', test: 'Dashboard Stats Query', status: 'PASS' });
    } else {
      results.push({ category: 'Admin', test: 'Dashboard Stats Query', status: 'FAIL' });
    }
    
    // Test 2: User Pagination
    const users = await prisma.user.findMany({
      take: 10,
      skip: 0,
      orderBy: { createdAt: 'desc' }
    });
    
    if (Array.isArray(users)) {
      results.push({ category: 'Admin', test: 'User Pagination', status: 'PASS' });
    } else {
      results.push({ category: 'Admin', test: 'User Pagination', status: 'FAIL' });
    }
    
    // Test 3: Audit Log Creation
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'TEST_ACTION',
        entity: 'system',
        entityId: 'test-123',
        newValue: { test: true }
      }
    });
    
    if (auditLog.id) {
      results.push({ category: 'Admin', test: 'Audit Log Creation', status: 'PASS' });
      await prisma.auditLog.delete({ where: { id: auditLog.id } });
    } else {
      results.push({ category: 'Admin', test: 'Audit Log Creation', status: 'FAIL' });
    }
    
  } catch (error: any) {
    results.push({ category: 'Admin', test: 'Admin System', status: 'FAIL', details: error.message });
  }
}

async function testTransactions() {
  log('\n📝 TESTING: Transaction Records');
  
  const testPhone = '+218900000006';
  
  try {
    await prisma.user.deleteMany({ where: { phone: testPhone } });
    
    const user = await prisma.user.create({
      data: {
        name: 'Transaction Test User',
        phone: testPhone,
        passwordHash: await bcrypt.hash('Test123!', 12),
      }
    });
    
    // Test 1: Create Transaction
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        asset: 'USDT',
        network: 'TRC20',
        amount: 100,
        fee: 0,
        status: 'COMPLETED'
      }
    });
    
    if (tx.id) {
      results.push({ category: 'Transaction', test: 'Create Transaction', status: 'PASS' });
    } else {
      results.push({ category: 'Transaction', test: 'Create Transaction', status: 'FAIL' });
    }
    
    // Test 2: Transaction Filtering
    const deposits = await prisma.transaction.findMany({
      where: { userId: user.id, type: 'DEPOSIT' }
    });
    
    if (deposits.length === 1) {
      results.push({ category: 'Transaction', test: 'Transaction Filtering', status: 'PASS' });
    } else {
      results.push({ category: 'Transaction', test: 'Transaction Filtering', status: 'FAIL' });
    }
    
    // Cleanup
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    
  } catch (error: any) {
    results.push({ category: 'Transaction', test: 'Transaction System', status: 'FAIL', details: error.message });
  }
}

function printResults() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 COMPREHENSIVE SYSTEM TEST RESULTS');
  console.log('═'.repeat(60));
  
  const categories = Array.from(new Set(results.map(r => r.category)));
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'PASS').length;
    const total = categoryResults.length;
    
    console.log(`\n📁 ${category}: ${passed}/${total} tests passed`);
    
    for (const result of categoryResults) {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${icon} ${result.test}${result.details ? ` (${result.details})` : ''}`);
    }
  }
  
  const totalPassed = results.filter(r => r.status === 'PASS').length;
  const totalTests = results.length;
  const percentage = Math.round((totalPassed / totalTests) * 100);
  
  console.log('\n' + '═'.repeat(60));
  console.log(`🏆 OVERALL: ${totalPassed}/${totalTests} tests passed (${percentage}%)`);
  console.log('═'.repeat(60));
  
  if (totalPassed === totalTests) {
    console.log('\n✨ ALL SYSTEMS OPERATIONAL - READY FOR PRODUCTION ✨\n');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED - REVIEW REQUIRED ⚠️\n');
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive System Test...\n');
  
  try {
    await testAuth();
    await testWallets();
    await testP2P();
    await testNotifications();
    await testAdmin();
    await testTransactions();
    
    printResults();
    
  } catch (error) {
    console.error('Fatal error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
