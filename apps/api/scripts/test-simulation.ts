
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function runSimulation() {
  console.log('🚀 Starting Comprehensive System Simulation...');
  
  try {
    // 1. Setup Users
    console.log('\n👤 creating users...');
    const userA = await createUser('UserA', '+218911111111', 'seller@test.com');
    const userB = await createUser('UserB', '+218922222222', 'buyer@test.com');
    
    // 2. Fund User A (Seller) & Reset Buyer
    console.log('\n💰 Funding Seller & Resetting Buyer...');
    await prisma.wallet.updateMany({
      where: { userId: userA.id, asset: 'USDT', accountType: 'FUNDING' },
      data: { balance: 1000, lockedBalance: 0 }
    });
    await prisma.wallet.updateMany({
      where: { userId: userB.id, asset: 'USDT', accountType: 'SPOT' },
      data: { balance: 0, lockedBalance: 0 }
    });
    const sellerWallet = await prisma.wallet.findFirst({
        where: { userId: userA.id, asset: 'USDT', accountType: 'FUNDING' }
    });
    console.log(`   Seller Balance: ${sellerWallet?.balance} USDT`);

    // 3. Create P2P Offer
    console.log('\n📝 Creating P2P Sell Offer...');
    const offer = await prisma.p2POffer.create({
      data: {
        userId: userA.id,
        type: 'SELL',
        asset: 'USDT',
        fiatCurrency: 'LYD',
        price: 5.50,
        available: 500,
        minLimit: 50,
        maxLimit: 500,
        paymentMethods: ['bank_transfer'],
        terms: 'Fast trade',
        isActive: true
      }
    });
    console.log(`   Offer Created: ${offer.id} | Price: ${offer.price} LYD`);

    // 4. User B Starts Trade (Buy 100 USDT)
    console.log('\n🤝 User B starting trade (Buy 100 USDT)...');
    // Using transaction logic similar to P2PService.startTrade
    const tradeAmount = 100;
    
    // Simulating Service Logic
    const trade = await prisma.$transaction(async (tx) => {
        // Lock funds
        await tx.wallet.updateMany({
            where: { userId: userA.id, asset: 'USDT', accountType: 'FUNDING' },
            data: { 
                balance: { decrement: tradeAmount },
                lockedBalance: { increment: tradeAmount }
            }
        });
        
        return tx.p2PTrade.create({
            data: {
                offerId: offer.id,
                buyerId: userB.id,
                sellerId: userA.id,
                amount: tradeAmount,
                fiatAmount: tradeAmount * Number(offer.price),
                price: offer.price,
                status: 'WAITING_PAYMENT'
            }
        });
    });
    console.log(`   Trade Started: ${trade.id} | Status: ${trade.status}`);

    // Verify Locking
    const sellerWalletLocked = await prisma.wallet.findFirst({
        where: { userId: userA.id, asset: 'USDT', accountType: 'FUNDING' }
    });
    console.log(`   Seller Balance After Lock: ${sellerWalletLocked?.balance} (Locked: ${sellerWalletLocked?.lockedBalance})`);

    if (Number(sellerWalletLocked?.balance) !== 900 || Number(sellerWalletLocked?.lockedBalance) !== 100) {
        throw new Error('❌ CRITICAL: Escrow locking logic failed!');
    } else {
        console.log('   ✅ Escrow Locking Verified');
    }

    // 5. Chat Simulation
    console.log('\n💬 Simulating Chat...');
    await prisma.p2PMessage.create({
        data: { tradeId: trade.id, senderId: userB.id, text: 'Hello, I am sending payment now.' }
    });
    await prisma.p2PMessage.create({
        data: { tradeId: trade.id, senderId: userA.id, text: 'Okay, waiting.' }
    });
    console.log('   ✅ Chat messages saved');

    // 6. Confirm Payment
    console.log('\n💸 Buyer Confirming Payment...');
    await prisma.p2PTrade.update({
        where: { id: trade.id },
        data: { status: 'PAID', paidAt: new Date() }
    });
    console.log('   ✅ Trade Status: PAID');

    // 7. Release Crypto
    console.log('\n🔓 Seller Releasing Crypto...');
    await prisma.$transaction(async (tx) => {
        // Deduct from seller locked
        await tx.wallet.updateMany({
            where: { userId: userA.id, asset: 'USDT', accountType: 'FUNDING' },
            data: { lockedBalance: { decrement: tradeAmount } }
        });

        // Add to buyer spot
        const buyerWallet = await tx.wallet.findFirst({
            where: { userId: userB.id, asset: 'USDT', accountType: 'SPOT' }
        });
        
        if (buyerWallet) {
             await tx.wallet.update({
                where: { id: buyerWallet.id },
                data: { balance: { increment: tradeAmount } }
            });
        } else {
            // Create if not exists (simplified)
            // In real app, createOrGet logic handles this
        }

        await tx.p2PTrade.update({
            where: { id: trade.id },
            data: { status: 'COMPLETED', releasedAt: new Date() }
        });
    });

    // 8. Final Verification
    const finalSeller = await prisma.wallet.findFirst({ where: { userId: userA.id, asset: 'USDT', accountType: 'FUNDING' } });
    const finalBuyer = await prisma.wallet.findFirst({ where: { userId: userB.id, asset: 'USDT', accountType: 'SPOT' } });

    console.log('\n📊 Final Balances:');
    console.log(`   Seller: ${finalSeller?.balance} (Locked: ${finalSeller?.lockedBalance})`);
    console.log(`   Buyer:  ${finalBuyer?.balance}`);

    if (Number(finalBuyer?.balance) === 100 && Number(finalSeller?.balance) === 900 && Number(finalSeller?.lockedBalance) === 0) {
        console.log('\n✅ TEST PASSED: Full P2P Cycle Successful');
    } else {
        console.log('\n❌ TEST FAILED: Balance mismatch');
    }

  } catch (e) {
    console.error('\n❌ SIMULATION ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
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

runSimulation();
