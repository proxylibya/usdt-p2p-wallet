export interface SmsGateway {
  send(recipient: string, message: string, config: any): Promise<{ success: boolean; response: any; externalId?: string }>;
}
