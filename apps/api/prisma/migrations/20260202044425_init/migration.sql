-- CreateEnum
CREATE TYPE "NetworkMode" AS ENUM ('MAINNET', 'TESTNET');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'PROMO');

-- CreateTable
CREATE TABLE "network_config" (
    "id" TEXT NOT NULL,
    "networkMode" "NetworkMode" NOT NULL DEFAULT 'TESTNET',
    "displayName" TEXT NOT NULL DEFAULT 'Testnet',
    "displayNameAr" TEXT NOT NULL DEFAULT 'شبكة الاختبار',
    "description" TEXT,
    "descriptionAr" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#F0B90B',
    "warningColor" TEXT NOT NULL DEFAULT '#F6465D',
    "badgeColor" TEXT NOT NULL DEFAULT '#FF6B35',
    "borderColor" TEXT NOT NULL DEFAULT '#FF6B35',
    "showGlobalBanner" BOOLEAN NOT NULL DEFAULT true,
    "showWatermark" BOOLEAN NOT NULL DEFAULT true,
    "requireConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "blockchainConfig" JSONB NOT NULL DEFAULT '{}',
    "enableDeposits" BOOLEAN NOT NULL DEFAULT true,
    "enableWithdrawals" BOOLEAN NOT NULL DEFAULT true,
    "enableP2P" BOOLEAN NOT NULL DEFAULT true,
    "enableSwap" BOOLEAN NOT NULL DEFAULT true,
    "enableStaking" BOOLEAN NOT NULL DEFAULT true,
    "maxTransactionAmount" DECIMAL(20,8) NOT NULL DEFAULT 10000,
    "dailyLimit" DECIMAL(20,8) NOT NULL DEFAULT 50000,
    "confirmationCode" TEXT,
    "lastModeChangeAt" TIMESTAMP(3),
    "lastModeChangeBy" TEXT,
    "modeChangeReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_mode_history" (
    "id" TEXT NOT NULL,
    "networkConfigId" TEXT NOT NULL,
    "previousMode" "NetworkMode" NOT NULL,
    "newMode" "NetworkMode" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedByName" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "network_mode_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_config" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'UbinPay',
    "appTagline" TEXT NOT NULL DEFAULT 'The Global P2P USDT Platform',
    "appTaglineAr" TEXT NOT NULL DEFAULT 'المنصة العالمية الرائدة لتداول USDT P2P',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#F0B90B',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0ECB81',
    "heroTitle" TEXT NOT NULL DEFAULT 'USDT',
    "heroTitleAr" TEXT NOT NULL DEFAULT 'USDT',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Buy & Sell USDT with local payment methods',
    "heroSubtitleAr" TEXT NOT NULL DEFAULT 'شراء وبيع USDT بوسائل الدفع المحلية',
    "heroImageUrl" TEXT,
    "features" JSONB NOT NULL DEFAULT '[]',
    "currencies" JSONB NOT NULL DEFAULT '["USDT", "USDC", "BUSD", "DAI"]',
    "socialLinks" JSONB NOT NULL DEFAULT '{}',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@ubinpay.com',
    "supportPhone" TEXT,
    "telegramUrl" TEXT,
    "whatsappUrl" TEXT,
    "androidAppUrl" TEXT,
    "iosAppUrl" TEXT,
    "footerText" TEXT NOT NULL DEFAULT '© 2024 UbinPay. All rights reserved.',
    "footerTextAr" TEXT NOT NULL DEFAULT '© 2024 UbinPay. جميع الحقوق محفوظة.',
    "metaTitle" TEXT NOT NULL DEFAULT 'UbinPay - P2P USDT Trading',
    "metaDescription" TEXT NOT NULL DEFAULT 'Buy and sell USDT securely with local payment methods',
    "metaKeywords" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelAr" TEXT,
    "iconUrl" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'local',
    "countryCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_configs" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "iconUrl" TEXT,
    "networks" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "minAmount" DECIMAL(20,8) NOT NULL DEFAULT 1,
    "maxAmount" DECIMAL(20,8) NOT NULL DEFAULT 100000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_configs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "subtitle" TEXT,
    "subtitleAr" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "linkType" TEXT NOT NULL DEFAULT 'internal',
    "position" TEXT NOT NULL DEFAULT 'home_top',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banner_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "content" TEXT NOT NULL,
    "contentAr" TEXT,
    "type" "AnnouncementType" NOT NULL DEFAULT 'INFO',
    "target" TEXT NOT NULL DEFAULT 'all',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'percentage',
    "category" TEXT NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "minAmount" DECIMAL(20,8),
    "maxAmount" DECIMAL(20,8),
    "appliesTo" TEXT NOT NULL DEFAULT 'all',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limit_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'all',
    "minAmount" DECIMAL(20,8) NOT NULL,
    "maxAmount" DECIMAL(20,8) NOT NULL,
    "dailyLimit" DECIMAL(20,8) NOT NULL,
    "monthlyLimit" DECIMAL(20,8) NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalThreshold" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "limit_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restrictions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'block',
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT[],
    "ipWhitelist" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_entities" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "duration" TEXT,
    "blockedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "userId" TEXT,
    "userName" TEXT,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderName" TEXT,
    "message" TEXT NOT NULL,
    "attachments" TEXT[],
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p2p_payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "type" TEXT NOT NULL,
    "icon" TEXT,
    "requiresDetails" TEXT[],
    "countries" TEXT[],
    "processingTime" TEXT NOT NULL DEFAULT 'Instant',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "p2p_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "network_mode_history_networkConfigId_idx" ON "network_mode_history"("networkConfigId");

-- CreateIndex
CREATE INDEX "network_mode_history_createdAt_idx" ON "network_mode_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_configs_key_key" ON "payment_method_configs"("key");

-- CreateIndex
CREATE INDEX "payment_method_configs_countryCode_idx" ON "payment_method_configs"("countryCode");

-- CreateIndex
CREATE INDEX "payment_method_configs_scope_idx" ON "payment_method_configs"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "currency_configs_symbol_key" ON "currency_configs"("symbol");

-- CreateIndex
CREATE INDEX "banner_configs_position_idx" ON "banner_configs"("position");

-- CreateIndex
CREATE INDEX "banner_configs_isActive_idx" ON "banner_configs"("isActive");

-- CreateIndex
CREATE INDEX "announcements_isActive_idx" ON "announcements"("isActive");

-- CreateIndex
CREATE INDEX "announcements_type_idx" ON "announcements"("type");

-- CreateIndex
CREATE INDEX "fee_rules_category_idx" ON "fee_rules"("category");

-- CreateIndex
CREATE INDEX "fee_rules_isActive_idx" ON "fee_rules"("isActive");

-- CreateIndex
CREATE INDEX "limit_rules_category_idx" ON "limit_rules"("category");

-- CreateIndex
CREATE INDEX "limit_rules_userType_idx" ON "limit_rules"("userType");

-- CreateIndex
CREATE INDEX "restrictions_type_idx" ON "restrictions"("type");

-- CreateIndex
CREATE INDEX "restrictions_value_idx" ON "restrictions"("value");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");

-- CreateIndex
CREATE INDEX "blocked_entities_type_idx" ON "blocked_entities"("type");

-- CreateIndex
CREATE INDEX "blocked_entities_expiresAt_idx" ON "blocked_entities"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_entities_type_value_key" ON "blocked_entities"("type", "value");

-- CreateIndex
CREATE INDEX "security_alerts_type_idx" ON "security_alerts"("type");

-- CreateIndex
CREATE INDEX "security_alerts_severity_idx" ON "security_alerts"("severity");

-- CreateIndex
CREATE INDEX "security_alerts_status_idx" ON "security_alerts"("status");

-- CreateIndex
CREATE INDEX "security_alerts_userId_idx" ON "security_alerts"("userId");

-- CreateIndex
CREATE INDEX "support_tickets_userId_idx" ON "support_tickets"("userId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_messages_ticketId_idx" ON "support_messages"("ticketId");

-- CreateIndex
CREATE INDEX "p2p_payment_methods_type_idx" ON "p2p_payment_methods"("type");

-- CreateIndex
CREATE INDEX "p2p_payment_methods_isActive_idx" ON "p2p_payment_methods"("isActive");

-- CreateIndex
CREATE INDEX "transactions_p2pTradeId_idx" ON "transactions"("p2pTradeId");

-- CreateIndex
CREATE INDEX "transactions_asset_idx" ON "transactions"("asset");

-- CreateIndex
CREATE INDEX "transactions_userId_type_idx" ON "transactions"("userId", "type");

-- CreateIndex
CREATE INDEX "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "wallets_userId_asset_idx" ON "wallets"("userId", "asset");

-- CreateIndex
CREATE INDEX "wallets_userId_accountType_idx" ON "wallets"("userId", "accountType");

-- CreateIndex
CREATE INDEX "wallets_network_idx" ON "wallets"("network");

-- AddForeignKey
ALTER TABLE "network_mode_history" ADD CONSTRAINT "network_mode_history_networkConfigId_fkey" FOREIGN KEY ("networkConfigId") REFERENCES "network_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
