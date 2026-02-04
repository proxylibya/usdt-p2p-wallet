import { Controller, Get, Put, Post, Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Request, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { 
  GetUsersQueryDto, 
  UpdateUserStatusDto, 
  UpdateKycStatusDto, 
  ResolveDisputeDto,
  DashboardStatsResponse 
} from './dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ========== AUTH (No Guards) ==========

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  adminLogin(@Body() body: { email: string; password: string }) {
    return this.adminService.adminLogin(body.email, body.password);
  }

  @Post('setup')
  @ApiOperation({ summary: 'Initial admin setup - works only once when no admins exist' })
  initialSetup(@Body() body: { email: string; password: string; name: string; setupKey?: string }) {
    return this.adminService.initialSetup(body);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get admin profile' })
  getAdminProfile(@Request() req: any) {
    return this.adminService.getAdminProfile(req.user.sub);
  }

  // ========== DASHBOARD (Protected) ==========

  @Get('dashboard/stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ========== USERS (Protected) ==========

  @Get('users')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
  ) {
    return this.adminService.getUsers(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      { search, status, kycStatus },
    );
  }

  @Post('users')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new user' })
  createUser(@Body() body: { name: string; phone: string; email?: string; password: string; role?: string }) {
    return this.adminService.createUser(body);
  }

  @Get('users/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user details' })
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Put('users/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user profile details' })
  updateUserProfile(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; avatarUrl?: string; isActive?: boolean; isBanned?: boolean },
  ) {
    return this.adminService.updateUserProfile(id, body);
  }

  @Put('users/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user status (active/banned)' })
  updateUserStatus(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; isBanned?: boolean; banReason?: string },
  ) {
    return this.adminService.updateUserStatus(id, body);
  }

  // ========== KYC (Protected) ==========

  @Get('kyc/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get pending KYC applications' })
  getPendingKyc(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getPendingKyc(parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Put('kyc/:userId/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify or reject KYC application' })
  verifyKyc(
    @Param('userId') userId: string,
    @Body() body: { status: 'VERIFIED' | 'REJECTED'; reason?: string },
  ) {
    return this.adminService.verifyKyc(userId, body.status, body.reason);
  }

  // ========== TRANSACTIONS (Protected) ==========

  @Get('transactions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all transactions' })
  getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getTransactions(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      { type, status, userId },
    );
  }

  @Get('transactions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get transaction details' })
  getTransactionDetails(@Param('id') id: string) {
    return this.adminService.getTransactionDetails(id);
  }

  @Put('transactions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update transaction status' })
  updateTransaction(
    @Param('id') id: string,
    @Body() body: { status: string; adminNote?: string },
  ) {
    return this.adminService.updateTransaction(id, body);
  }

  @Get('wallets/stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get wallet statistics' })
  getWalletStats() {
    return this.adminService.getWalletStats();
  }

  // ========== EARN (STAKING) ==========

  @Get('earn/products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all staking products' })
  getStakingProducts() {
    return this.adminService.getStakingProducts(false); // Get all including inactive
  }

  @Post('earn/products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new staking product' })
  createStakingProduct(@Body() body: { asset: string; apy: number; durationDays: number; minAmount: number; maxAmount?: number }) {
    return this.adminService.createStakingProduct(body);
  }

  @Patch('earn/products/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update staking product status' })
  updateStakingProductStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.updateStakingProductStatus(id, body.isActive);
  }

  // ========== DISPUTES (Protected) ==========

  @Get('p2p/offers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get P2P offers' })
  getP2POffers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getP2POffers(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      { type, status },
    );
  }

  @Patch('p2p/offers/:id/suspend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Suspend P2P offer' })
  suspendOffer(@Param('id') id: string) {
    return this.adminService.toggleOfferStatus(id, false);
  }

  @Patch('p2p/offers/:id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Activate P2P offer' })
  activateOffer(@Param('id') id: string) {
    return this.adminService.toggleOfferStatus(id, true);
  }

  @Get('p2p/offers/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get P2P offer details' })
  getOfferDetails(@Param('id') id: string) {
    return this.adminService.getOfferDetails(id);
  }

  @Get('p2p/trades')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get P2P trades' })
  getP2PTrades(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getP2PTrades(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      { status },
    );
  }

  @Get('p2p/trades/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get P2P trade details' })
  getTradeDetails(@Param('id') id: string) {
    return this.adminService.getTradeDetails(id);
  }

  @Patch('p2p/trades/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel P2P trade' })
  cancelTrade(@Param('id') id: string) {
    return this.adminService.cancelTrade(id);
  }

  @Patch('p2p/trades/:id/release')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Release funds for P2P trade' })
  releaseTrade(@Param('id') id: string) {
    return this.adminService.releaseTrade(id);
  }

  @Get('disputes')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all P2P disputes' })
  getDisputes(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getDisputes(parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Post('disputes/:tradeId/resolve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resolve a P2P dispute' })
  resolveDispute(
    @Param('tradeId') tradeId: string,
    @Body() body: { winner: 'buyer' | 'seller'; reason: string },
  ) {
    return this.adminService.resolveDispute(tradeId, body);
  }

  // ========== AUDIT LOGS (Protected) ==========

  @Get('logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get system logs' })
  getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.getAuditLogs(
      parseInt(page || '1'),
      parseInt(limit || '50'),
      { level, category }
    );
  }

  @Get('audit-logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get audit logs' })
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.getAuditLogs(
      parseInt(page || '1'),
      parseInt(limit || '50'),
      { level, category }
    );
  }

  // ========== SETTINGS ==========

  @Get('settings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get system settings' })
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('settings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update system settings' })
  updateSystemSettings(@Request() req: any, @Body() body: any) {
    return this.adminService.updateSystemSettings(body, req.user.sub);
  }

  // ========== NOTIFICATIONS ==========

  @Get('notifications')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get admin notifications list' })
  getNotificationsList(@Query('page') page?: string) {
    return this.adminService.getNotificationsList(parseInt(page || '1'));
  }

  @Post('notifications')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send broadcast notification' })
  createBroadcastNotification(@Body() body: { title: string; message: string; type: string; target: string }) {
    return this.adminService.createBroadcastNotification(body);
  }

  @Delete('notifications/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete notification' })
  deleteNotification(@Param('id') id: string) {
    return this.adminService.deleteNotification(id);
  }

  // ========== REPORTS ==========

  @Get('reports/stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get reports statistics' })
  getReportsStats(@Query('range') range?: string) {
    return this.adminService.getReportsData((range as any) || 'month');
  }

  // ========== ADMIN USERS ==========

  @Get('admins')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all admin users' })
  getAdminUsers() {
    return this.adminService.getAdminUsers();
  }

  @Post('admins')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new admin user' })
  createAdminUser(@Body() body: { name: string; email: string; password: string; role: string }) {
    return this.adminService.createAdminUser(body);
  }

  @Patch('admins/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle admin user status' })
  toggleAdminStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleAdminStatus(id, body.isActive);
  }

  // ========== SYSTEM HEALTH ==========

  @Get('system/health')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get system health status' })
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  // ========== SUPPORT TICKETS ==========

  @Get('support/tickets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get support tickets' })
  getSupportTickets(@Query('status') status?: string, @Query('priority') priority?: string) {
    return this.adminService.getSupportTickets({ status, priority });
  }

  @Patch('support/tickets/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update ticket status' })
  updateTicketStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adminService.updateTicketStatus(id, body.status);
  }

  @Post('support/tickets/:id/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reply to support ticket' })
  replyToTicket(@Param('id') id: string, @Body() body: { message: string }, @Request() req: any) {
    return this.adminService.replyToTicket(id, body.message, req.user.sub);
  }

  // ========== PAYMENT METHODS ==========

  @Get('payment-methods')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment methods' })
  getPaymentMethods() {
    return this.adminService.getPaymentMethods();
  }

  @Post('payment-methods')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create payment method' })
  createPaymentMethod(@Body() body: { name: string; nameAr: string; type: string; requiresDetails: string[]; countries: string[]; processingTime: string }) {
    return this.adminService.createPaymentMethod(body);
  }

  @Put('payment-methods/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update payment method' })
  updatePaymentMethod(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updatePaymentMethod(id, body);
  }

  @Patch('payment-methods/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle payment method status' })
  togglePaymentMethodStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.togglePaymentMethodStatus(id, body.isActive);
  }

  @Delete('payment-methods/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete payment method' })
  deletePaymentMethod(@Param('id') id: string) {
    return this.adminService.deletePaymentMethod(id);
  }

  // ========== ANNOUNCEMENTS ==========

  @Get('announcements')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get announcements' })
  getAnnouncements() {
    return this.adminService.getAnnouncements();
  }

  @Post('announcements')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create announcement' })
  createAnnouncement(@Body() body: any) {
    return this.adminService.createAnnouncement(body);
  }

  @Put('announcements/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update announcement' })
  updateAnnouncement(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateAnnouncement(id, body);
  }

  @Patch('announcements/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle announcement status' })
  toggleAnnouncementStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleAnnouncementStatus(id, body.isActive);
  }

  @Delete('announcements/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete announcement' })
  deleteAnnouncement(@Param('id') id: string) {
    return this.adminService.deleteAnnouncement(id);
  }

  // ========== ADVANCED DASHBOARD ==========

  @Get('dashboard/live-stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get live dashboard statistics' })
  getLiveStats() {
    return this.adminService.getLiveStats();
  }

  @Get('dashboard/charts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard charts data' })
  getChartsData(@Query('period') period?: string) {
    return this.adminService.getChartsData(period || '7d');
  }

  // ========== FEES MANAGEMENT ==========

  @Get('fees/rules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get fee rules' })
  getFeeRules() {
    return this.adminService.getFeeRules();
  }

  @Post('fees/rules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create fee rule' })
  createFeeRule(@Body() body: any) {
    return this.adminService.createFeeRule(body);
  }

  @Put('fees/rules/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update fee rule' })
  updateFeeRule(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateFeeRule(id, body);
  }

  @Patch('fees/rules/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle fee rule status' })
  toggleFeeRuleStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleFeeRuleStatus(id, body.isActive);
  }

  @Delete('fees/rules/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete fee rule' })
  deleteFeeRule(@Param('id') id: string) {
    return this.adminService.deleteFeeRule(id);
  }

  @Get('fees/revenue')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get revenue statistics' })
  getRevenueStats() {
    return this.adminService.getRevenueStats();
  }

  // ========== SECURITY CENTER ==========

  @Get('security/alerts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get security alerts' })
  getSecurityAlerts() {
    return this.adminService.getSecurityAlerts();
  }

  @Patch('security/alerts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update alert status' })
  updateAlertStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adminService.updateAlertStatus(id, body.status);
  }

  @Get('security/blocked')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get blocked entities' })
  getBlockedEntities() {
    return this.adminService.getBlockedEntities();
  }

  @Post('security/block')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Block an entity' })
  blockEntity(@Body() body: { type: string; value: string; reason: string; duration: string }) {
    return this.adminService.blockEntity(body);
  }

  @Delete('security/blocked/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unblock an entity' })
  unblockEntity(@Param('id') id: string) {
    return this.adminService.unblockEntity(id);
  }

  @Get('security/stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get security statistics' })
  getSecurityStats() {
    return this.adminService.getSecurityStats();
  }

  // ========== LIMITS & RESTRICTIONS ==========

  @Get('limits/rules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get limit rules' })
  getLimitRules() {
    return this.adminService.getLimitRules();
  }

  @Post('limits/rules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create limit rule' })
  createLimitRule(@Body() body: any) {
    return this.adminService.createLimitRule(body);
  }

  @Put('limits/rules/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update limit rule' })
  updateLimitRule(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateLimitRule(id, body);
  }

  @Patch('limits/rules/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle limit rule status' })
  toggleLimitRuleStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleLimitRuleStatus(id, body.isActive);
  }

  @Get('limits/restrictions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get restrictions' })
  getRestrictions() {
    return this.adminService.getRestrictions();
  }

  @Post('limits/restrictions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add restriction' })
  addRestriction(@Body() body: any) {
    return this.adminService.addRestriction(body);
  }

  @Delete('limits/restrictions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove restriction' })
  removeRestriction(@Param('id') id: string) {
    return this.adminService.removeRestriction(id);
  }

  // ========== API KEYS ==========

  @Get('api-keys')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get API keys' })
  getApiKeys() {
    return this.adminService.getApiKeys();
  }

  @Post('api-keys')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create API key' })
  createApiKey(@Body() body: any) {
    return this.adminService.createApiKey(body);
  }

  @Patch('api-keys/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle API key status' })
  toggleApiKeyStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleApiKeyStatus(id, body.isActive);
  }

  @Delete('api-keys/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke API key' })
  revokeApiKey(@Param('id') id: string) {
    return this.adminService.revokeApiKey(id);
  }

  // ========== SITE CONFIGURATION ==========

  @Get('site-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get site configuration' })
  getSiteConfig() {
    return this.adminService.getSiteConfig();
  }

  @Put('site-config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update site configuration' })
  updateSiteConfig(@Request() req: any, @Body() body: any) {
    return this.adminService.updateSiteConfig(body, req.user?.sub);
  }

  // ========== PAYMENT METHODS CONFIG (Site Config) ==========

  @Get('config/payment-methods')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment method configurations for site' })
  getPaymentMethodConfigs(
    @Query('countryCode') countryCode?: string,
    @Query('scope') scope?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.getPaymentMethodConfigs({
      countryCode,
      scope,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Post('config/payment-methods')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create payment method configuration' })
  createPaymentMethodConfig(@Body() body: any) {
    return this.adminService.createPaymentMethodConfig(body);
  }

  @Put('config/payment-methods/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update payment method configuration' })
  updatePaymentMethodConfig(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updatePaymentMethodConfig(id, body);
  }

  @Delete('config/payment-methods/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete payment method configuration' })
  deletePaymentMethodConfig(@Param('id') id: string) {
    return this.adminService.deletePaymentMethodConfig(id);
  }

  @Patch('config/payment-methods/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle payment method config status' })
  togglePaymentMethodConfigStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.togglePaymentMethodConfigStatus(id, body.isActive);
  }

  // ========== CURRENCY CONFIG ==========

  @Get('currencies')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get currency configurations' })
  getCurrencyConfigs(@Query('isActive') isActive?: string) {
    return this.adminService.getCurrencyConfigs({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Post('currencies')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create currency configuration' })
  createCurrencyConfig(@Body() body: any) {
    return this.adminService.createCurrencyConfig(body);
  }

  @Put('currencies/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update currency configuration' })
  updateCurrencyConfig(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCurrencyConfig(id, body);
  }

  @Delete('currencies/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete currency configuration' })
  deleteCurrencyConfig(@Param('id') id: string) {
    return this.adminService.deleteCurrencyConfig(id);
  }

  // ========== BANNER CONFIG ==========

  @Get('banners')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get banner configurations' })
  getBannerConfigs(
    @Query('position') position?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.getBannerConfigs({
      position,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Post('banners')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create banner configuration' })
  createBannerConfig(@Body() body: any) {
    return this.adminService.createBannerConfig(body);
  }

  @Put('banners/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update banner configuration' })
  updateBannerConfig(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateBannerConfig(id, body);
  }

  @Delete('banners/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete banner configuration' })
  deleteBannerConfig(@Param('id') id: string) {
    return this.adminService.deleteBannerConfig(id);
  }

  @Patch('banners/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle banner status' })
  toggleBannerStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleBannerStatus(id, body.isActive);
  }

  // ========== PUBLIC CONFIG (No Auth Required) ==========

  @Get('public/config')
  @ApiOperation({ summary: 'Get public site configuration for mobile app' })
  getPublicSiteConfig() {
    return this.adminService.getPublicSiteConfig();
  }
}
