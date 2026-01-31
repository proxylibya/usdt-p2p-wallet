-- CreateEnum
CREATE TYPE "EidyaStatus" AS ENUM ('ACTIVE', 'DEPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StakingStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'COMPLETED');

-- CreateTable
CREATE TABLE "eidya" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "totalAmount" DECIMAL(20,8) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "message" TEXT,
    "code" TEXT NOT NULL,
    "claimedAmount" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "claimedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "EidyaStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "eidya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eidya_claims" (
    "id" TEXT NOT NULL,
    "eidyaId" TEXT NOT NULL,
    "claimerId" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eidya_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staking_products" (
    "id" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "apy" DECIMAL(5,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "minAmount" DECIMAL(20,8) NOT NULL,
    "maxAmount" DECIMAL(20,8),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staking_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staking_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "status" "StakingStatus" NOT NULL DEFAULT 'ACTIVE',
    "interestEarned" DECIMAL(20,8) NOT NULL DEFAULT 0,

    CONSTRAINT "staking_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eidya_code_key" ON "eidya"("code");

-- CreateIndex
CREATE INDEX "eidya_creatorId_idx" ON "eidya"("creatorId");

-- CreateIndex
CREATE INDEX "eidya_code_idx" ON "eidya"("code");

-- CreateIndex
CREATE UNIQUE INDEX "eidya_claims_eidyaId_claimerId_key" ON "eidya_claims"("eidyaId", "claimerId");

-- CreateIndex
CREATE INDEX "staking_subscriptions_userId_idx" ON "staking_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "staking_subscriptions_status_idx" ON "staking_subscriptions"("status");

-- AddForeignKey
ALTER TABLE "eidya" ADD CONSTRAINT "eidya_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eidya_claims" ADD CONSTRAINT "eidya_claims_eidyaId_fkey" FOREIGN KEY ("eidyaId") REFERENCES "eidya"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eidya_claims" ADD CONSTRAINT "eidya_claims_claimerId_fkey" FOREIGN KEY ("claimerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staking_subscriptions" ADD CONSTRAINT "staking_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staking_subscriptions" ADD CONSTRAINT "staking_subscriptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "staking_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
