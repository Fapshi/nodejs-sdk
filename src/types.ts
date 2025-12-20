/**
 * Fapshi Payment API Type Definitions
 */

export type Environment = 'sandbox' | 'live';

export type PaymentMedium = 'mobile money' | 'orange money' | 'fapshi';

export type TransactionStatus = 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED';

export type SearchStatus = 'created' | 'successful' | 'failed' | 'expired';

export type SortOrder = 'asc' | 'desc';

/**
 * Transaction object returned by the API
 */
export interface Transaction {
  transId: string;
  status: TransactionStatus;
  medium?: PaymentMedium;
  serviceName?: string;
  amount: number;
  revenue?: number;
  payerName?: string;
  email?: string;
  redirectUrl?: string;
  externalId?: string;
  userId?: string;
  webhook?: string;
  financialTransId?: string;
  dateInitiated: string;
  dateConfirmed?: string;
}

/**
 * Request to initiate a payment link
 */
export interface InitiatePayRequest {
  amount: number;
  email?: string;
  redirectUrl?: string;
  userId?: string;
  externalId?: string;
  message?: string;
}

/**
 * Response from initiate-pay endpoint
 */
export interface InitiatePayResponse {
  message: string;
  link: string;
  transId: string;
  dateInitiated: string;
}

/**
 * Request for direct payment
 */
export interface DirectPayRequest {
  amount: number;
  phone: string;
  medium?: 'mobile money' | 'orange money';
  name?: string;
  email?: string;
  userId?: string;
  externalId?: string;
  message?: string;
}

/**
 * Response from direct-pay endpoint
 */
export interface DirectPayResponse {
  message: string;
  transId: string;
  dateInitiated: string;
}

/**
 * Request to expire a payment
 */
export interface ExpirePayRequest {
  transId: string;
}

/**
 * Response from expire-pay endpoint
 */
export interface ExpirePayResponse {
  transId: string;
  status: 'EXPIRED';
  [key: string]: any;
}

/**
 * Request for payout
 */
export interface PayoutRequest {
  amount: number;
  phone?: string;
  medium?: PaymentMedium;
  name?: string;
  email?: string;
  userId?: string;
  externalId?: string;
  message?: string;
}

/**
 * Response from payout endpoint
 */
export interface PayoutResponse {
  message: string;
  transId: string;
  dateInitiated: string;
}

/**
 * Search transactions query parameters
 */
export interface SearchTransactionsParams {
  status?: SearchStatus;
  medium?: PaymentMedium;
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
  amt?: number;
  limit?: number; // 1-100, default 10
  sort?: SortOrder; // default desc
}

/**
 * Balance response
 */
export interface BalanceResponse {
  service: string;
  balance: number;
  currency: string;
}

/**
 * Error response from API
 */
export interface ApiError {
  message: string;
}

/**
 * Configuration options for Fapshi client
 */
export interface FapshiConfig {
  apiUser: string;
  apiKey: string;
  environment?: Environment;
  baseUrl?: string;
}

