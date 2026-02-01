export interface SmsProvider {
  id: string;
  name: string;
  type: string;
  config: any;
  priority: number;
  isActive: boolean;
  costPerMsg: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmsLog {
  id: string;
  providerId?: string;
  provider?: { name: string };
  recipient: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  response?: any;
  cost?: number;
  sentAt: string;
}

export interface CreateSmsProviderDto {
  name: string;
  type: string;
  config: any;
  priority: number;
  isActive: boolean;
  costPerMsg: number;
  currency: string;
}
