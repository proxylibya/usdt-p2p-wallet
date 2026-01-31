
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Helper for logging with timestamps
const log = (msg: string) => console.log(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${msg}`);

async function runSimulation() {
  log('🚀 Starting World-Class System Simulation...');
  
  try {
    // ==========================================
    // 1. SETUP & INITIALIZATION
    // ==========================================
    log('\n👤 1. Setting up Users...');
    const seller = await createUser('Seller', '+218911111111', 'seller@test.com');
    const buyer = await createUser('Buyer', '+218922222222', 'buyer@test.com');
    
    // Fund Seller with 1000 USDT (Funding Wallet)
    log('💰 Funding Seller...');
    await prisma.wallet.updateMany({
      where: { userId: seller.id, asset: 'USDT', accountType: 'FUNDING' },
      data: { balance: 1000, lockedBalance: 0 }
    });
    
    // Reset Buyer
    await prisma.wallet.updateMany({
        where: { userId: buyer.id, asset: 'USDT', accountType: 'SPOT' },
        data: { balance: 0, lockedBalance: 0 }
    });
    // Ensure Buyer has Funding wallet too for transfers
    await prisma.wallet.updateMany({
        where: { userId: buyer.id, asset: 'USDT', accountType: 'FUNDING' },
        data: { balance: 0, lockedBalance: 0 }
    });

    const initialSellerWallet = await getWallet(seller.id, 'FUNDING');
    log(`   Seller Balance: ${initialSellerWallet?.balance} USDT`);

    // Create Offer
    log('\n📝 Creating P2P Sell Offer...');
    const offer = await prisma.p2POffer.create({
      data: {
        userId: seller.id,
        type: 'SELL',
        asset: 'USDT',
        fiatCurrency: 'LYD',
        price: 5.50,
        available: 1000,
        minLimit: 10,
        maxLimit: 1000,
        paymentMethods: ['bank_transfer'],
        isActive: true
      }
    });
    log(`   Offer Created: ${offer.id} | Price: ${offer.price} LYD`);

    // ==========================================
    // SCENARIO 1: SUCCESSFUL TRADE (Happy Path)
    // ==========================================
    log('\n🎬 SCENARIO 1: Successful Trade (100 USDT)');
    
    // 1. Start Trade
    const trade1Amount = 100;
    const trade1 = await startTradeSimulation(seller.id, buyer.id, offer, trade1Amount);
    log(`   Trade Started: ${trade1.id} | Status: ${trade1.status}`);

    // 2. Chat
    await prisma.p2PMessage.create({ data: { tradeId: trade1.id, senderId: buyer.id, text: 'Paying now...' } });
    
    // 3. Confirm Payment
    await prisma.p2PTrade.update({ where: { id: trade1.id }, data: { status: 'PAID', paidAt: new Date() } });
    log(`   Buyer Confirmed Payment`);

    // 4. Release (Simulating Service Logic with Atomic Transaction)
    await releaseCryptoSimulation(trade1.id, seller.id, buyer.id, trade1Amount);
    log(`   Seller Released Crypto`);

    // Verify
    const s1 = await getWallet(seller.id, 'FUNDING');
    const b1 = await getWallet(buyer.id, 'SPOT');
    log(`   Balances -> Seller: ${s1?.balance} (Locked: ${s1?.lockedBalance}) | Buyer: ${b1?.balance}`);
    
    if (Number(s1?.balance) !== 900 || Number(b1?.balance) !== 100) throw new Error('Scenario 1 Failed: Balance mismatch');
    log('   ✅ Scenario 1 Passed');


    // ==========================================
    // SCENARIO 2: CANCELLED TRADE
    // ==========================================
    log('\n🎬 SCENARIO 2: Cancelled Trade (50 USDT)');
    
    // 1. Start Trade
    const trade2Amount = 50;
    const trade2 = await startTradeSimulation(seller.id, buyer.id, offer, trade2Amount);
    log(`   Trade Started: ${trade2.id}`);

    // Verify Lock
    const s2Lock = await getWallet(seller.id, 'FUNDING');
    log(`   Seller Locked Balance: ${s2Lock?.lockedBalance} (Should be 50)`);
    if (Number(s2Lock?.lockedBalance) !== 50) throw new Error('Scenario 2 Failed: Locking failed');

    // 2. Cancel Trade
    await cancelTradeSimulation(trade2.id, seller.id, trade2Amount);
    log(`   Trade Cancelled`);

    // Verify Refund
    const s2Final = await getWallet(seller.id, 'FUNDING');
    log(`   Seller Balance: ${s2Final?.balance} (Locked: ${s2Final?.lockedBalance})`);
    
    if (Number(s2Final?.balance) !== 900 || Number(s2Final?.lockedBalance) !== 0) throw new Error('Scenario 2 Failed: Refund mismatch');
    log('   ✅ Scenario 2 Passed');


    // ==========================================
    // SCENARIO 3: DISPUTE & SELLER WINS
    // ==========================================
    log('\n🎬 SCENARIO 3: Dispute - Seller Wins (200 USDT)');
    
    // 1. Start Trade
    const trade3Amount = 200;
    const trade3 = await startTradeSimulation(seller.id, buyer.id, offer, trade3Amount);
    
    // 2. Buyer marks paid (but maybe didn't pay)
    await prisma.p2PTrade.update({ where: { id: trade3.id }, data: { status: 'PAID', paidAt: new Date() } });
    
    // 3. Seller opens dispute
    await prisma.p2PTrade.update({ where: { id: trade3.id }, data: { status: 'DISPUTED', disputeReason: 'No payment received' } });
    log(`   Dispute Opened`);

    // 4. Admin Resolves (Seller Wins -> Refund)
    await resolveDisputeSimulation(trade3.id, 'seller_wins', seller.id, buyer.id, trade3Amount);
    log(`   Dispute Resolved (Seller Wins)`);

    // Verify
    const s3Final = await getWallet(seller.id, 'FUNDING');
    log(`   Seller Balance: ${s3Final?.balance} (Locked: ${s3Final?.lockedBalance})`);
    
    if (Number(s3Final?.balance) !== 900) throw new Error('Scenario 3 Failed: Seller not refunded correctly');
    log('   ✅ Scenario 3 Passed');


    // ==========================================
    // SCENARIO 4: WALLET TRANSFERS & WITHDRAWAL
    // ==========================================
    log('\n🎬 SCENARIO 4: Wallet Operations');
    
    // Buyer has 100 USDT in SPOT. Transfer 50 to FUNDING.
    log('   Transferring 50 USDT from SPOT to FUNDING...');
    await transferSimulation(buyer.id, 50, 'SPOT', 'FUNDING');
    
    const bSpot = await getWallet(buyer.id, 'SPOT');
    const bFund = await getWallet(buyer.id, 'FUNDING');
    log(`   Buyer -> Spot: ${bSpot?.balance} | Funding: ${bFund?.balance}`);
    
    if (Number(bSpot?.balance) !== 50 || Number(bFund?.balance) !== 50) throw new Error('Scenario 4 Failed: Transfer mismatch');

    // Withdraw 20 USDT from SPOT
    log('   Requesting Withdrawal of 20 USDT...');
    const withdrawal = await prisma.transaction.create({
        data: {
            userId: buyer.id,
            type: 'WITHDRAW',
            asset: 'USDT',
            amount: 20,
            fee: 1,
            status: 'PENDING',
            toAddress: 'TFakeAddress123'
        }
    });
    // Deduct balance (including fee)
    await prisma.wallet.update({
        where: { id: bSpot!.id },
        data: { balance: { decrement: 21 } }
    });

    const bSpotFinal = await getWallet(buyer.id, 'SPOT');
    log(`   Buyer Spot Balance after Withdraw: ${bSpotFinal?.balance}`);
    
    if (Number(bSpotFinal?.balance) !== 29) throw new Error('Scenario 4 Failed: Withdrawal deduction mismatch');
    log('   ✅ Scenario 4 Passed');

    log('\n✨ ALL SYSTEMS OPERATIONAL - SIMULATION COMPLETE ✨');

  } catch (e) {
    console.error('\n❌ SIMULATION FAILED:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ==========================================
// LOGIC HELPERS (Mirroring Service Logic)
// ==========================================

async function startTradeSimulation(sellerId: string, buyerId: string, offer: any, amount: number) {
    return prisma.$transaction(async (tx) => {
        // Atomic Lock
        const update = await tx.wallet.updateMany({
            where: { 
                userId: sellerId, 
                asset: offer.asset, 
                accountType: 'FUNDING',
                balance: { gte: amount }
            },
            data: { 
                balance: { decrement: amount },
                lockedBalance: { increment: amount }
            }
        });

        if (update.count === 0) throw new Error('Insufficient balance for trade');

        return tx.p2PTrade.create({
            data: {
                offerId: offer.id,
                buyerId,
                sellerId,
                amount,
                fiatAmount: amount * Number(offer.price),
                price: offer.price,
                status: 'WAITING_PAYMENT'
            }
        });
    });
}

async function releaseCryptoSimulation(tradeId: string, sellerId: string, buyerId: string, amount: number) {
    return prisma.$transaction(async (tx) => {
        // Unlock Seller
        await tx.wallet.updateMany({
            where: { userId: sellerId, asset: 'USDT', accountType: 'FUNDING' },
            data: { lockedBalance: { decrement: amount } }
        });

        // Credit Buyer
        // Find buyer wallet to get ID
        const bWallet = await tx.wallet.findFirst({ where: { userId: buyerId, asset: 'USDT', accountType: 'SPOT' } });
        if(!bWallet) throw new Error("Buyer wallet not found");

        await tx.wallet.update({
            where: { id: bWallet.id },
            data: { balance: { increment: amount } }
        });

        await tx.p2PTrade.update({ where: { id: tradeId }, data: { status: 'COMPLETED', releasedAt: new Date() } });
    });
}

async function cancelTradeSimulation(tradeId: string, sellerId: string, amount: number) {
    return prisma.$transaction(async (tx) => {
        // Refund Seller
        await tx.wallet.updateMany({
            where: { userId: sellerId, asset: 'USDT', accountType: 'FUNDING' },
            data: { 
                balance: { increment: amount },
                lockedBalance: { decrement: amount }
            }
        });

        await tx.p2PTrade.update({ where: { id: tradeId }, data: { status: 'CANCELLED' } });
    });
}

async function resolveDisputeSimulation(tradeId: string, resolution: 'buyer_wins' | 'seller_wins', sellerId: string, buyerId: string, amount: number) {
    return prisma.$transaction(async (tx) => {
        if (resolution === 'seller_wins') {
            // Refund Seller
            await tx.wallet.updateMany({
                where: { userId: sellerId, asset: 'USDT', accountType: 'FUNDING' },
                data: { 
                    balance: { increment: amount },
                    lockedBalance: { decrement: amount }
                }
            });
        } else {
            // Release to Buyer
             await tx.wallet.updateMany({
                where: { userId: sellerId, asset: 'USDT', accountType: 'FUNDING' },
                data: { lockedBalance: { decrement: amount } }
            });
            const bWallet = await tx.wallet.findFirst({ where: { userId: buyerId, asset: 'USDT', accountType: 'SPOT' } });
             await tx.wallet.update({
                where: { id: bWallet!.id },
                data: { balance: { increment: amount } }
            });
        }

        await tx.p2PTrade.update({
            where: { id: tradeId },
            data: { status: 'RESOLVED', disputeResult: resolution }
        });
    });
}

async function transferSimulation(userId: string, amount: number, from: 'SPOT'|'FUNDING', to: 'SPOT'|'FUNDING') {
    return prisma.$transaction(async (tx) => {
        const source = await tx.wallet.findFirst({ where: { userId, asset: 'USDT', accountType: from } });
        const dest = await tx.wallet.findFirst({ where: { userId, asset: 'USDT', accountType: to } });
        
        await tx.wallet.update({ where: { id: source!.id }, data: { balance: { decrement: amount } } });
        await tx.wallet.update({ where: { id: dest!.id }, data: { balance: { increment: amount } } });
    });
}

async function createUser(name: string, phone: string, email: string) {
    const hash = await bcrypt.hash('password', 10);
    const user = await prisma.user.upsert({
        where: { phone },
        create: {
            phone,
            email,
            name,
            passwordHash: hash,
            wallets: {
                create: [
                    { asset: 'USDT', network: 'TRC20', accountType: 'SPOT', balance: 0, lockedBalance: 0 },
                    { asset: 'USDT', network: 'TRC20', accountType: 'FUNDING', balance: 0, lockedBalance: 0 },
                ]
            }
        },
        update: {}
    });
    
    // Ensure wallets exist
    const w = await prisma.wallet.findFirst({ where: { userId: user.id } });
    if (!w) {
         await prisma.wallet.createMany({
            data: [
                { userId: user.id, asset: 'USDT', network: 'TRC20', accountType: 'SPOT', balance: 0, lockedBalance: 0 },
                { userId: user.id, asset: 'USDT', network: 'TRC20', accountType: 'FUNDING', balance: 0, lockedBalance: 0 },
            ]
        });
    }
    return user;
}

async function getWallet(userId: string, type: 'SPOT' | 'FUNDING') {
    return prisma.wallet.findFirst({ where: { userId, asset: 'USDT', accountType: type } });
}

runSimulation();
