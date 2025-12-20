import fetch, { RequestInit } from 'node-fetch';
import {
  Environment,
  FapshiConfig,
  InitiatePayRequest,
  InitiatePayResponse,
  DirectPayRequest,
  DirectPayResponse,
  ExpirePayRequest,
  ExpirePayResponse,
  PayoutRequest,
  PayoutResponse,
  Transaction,
  SearchTransactionsParams,
  BalanceResponse,
  ApiError,
} from './types';

/**
 * Custom error class for Fapshi API errors
 */
export class FapshiError extends Error {
  constructor(public message: string, public statusCode?: number) {
    super(message);
    this.name = 'FapshiError';
    Object.setPrototypeOf(this, FapshiError.prototype);
  }
}

/**
 * Detects the environment from the API key format
 * - Sandbox keys: FAK_TEST_XXX
 * - Live keys: FAK_XXX
 *
 * @param apiKey - The API key to analyze
 * @returns The detected environment
 */
function detectEnvironmentFromApiKey(apiKey: string): Environment {
  if (apiKey.startsWith('FAK_TEST_')) {
    return 'sandbox';
  }
  if (apiKey.startsWith('FAK_')) {
    return 'live';
  }
  // Default to sandbox for unrecognized format
  return 'sandbox';
}

/**
 * Fapshi Payment API Client
 */
export class FapshiClient {
  private baseUrl: string;
  private apiUser: string;
  private apiKey: string;

  constructor(config: FapshiConfig) {
    this.apiUser = config.apiUser;
    this.apiKey = config.apiKey;

    if (config.baseUrl) {
      this.baseUrl = config.baseUrl.replace(/\/$/, '');
    } else {
      // Auto-detect environment from API key if not explicitly provided
      const environment =
        config.environment || detectEnvironmentFromApiKey(config.apiKey);

      this.baseUrl =
        environment === 'live'
          ? 'https://live.fapshi.com'
          : 'https://sandbox.fapshi.com';
    }
  }

  /**
   * Internal method to make API requests
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    queryParams?: Record<string, string | number | undefined | null>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    // Add query parameters if provided
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apiuser: this.apiUser,
      apikey: this.apiKey,
    };

    const options: RequestInit = {
      method,
      headers: headers as Record<string, string>,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), options);
      const data = await response.json();

      if (!response.ok) {
        const error = data as ApiError;
        throw new FapshiError(
          error.message || `API request failed with status ${response.status}`,
          response.status
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof FapshiError) {
        throw error;
      }
      
      // Handle network errors with more context
      if (error instanceof Error) {
        // Check if it's a network/fetch error
        const errorMessage = error.message || '';
        if (
          errorMessage.includes('failed') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ETIMEDOUT')
        ) {
          throw new FapshiError(
            `Network error: Unable to connect to Fapshi API. ${errorMessage}`,
            undefined
          );
        }
        throw new FapshiError(error.message);
      }
      
      throw new FapshiError('An unexpected error occurred');
    }
  }

  /**
   * Generate a Payment Link
   * Creates a payment link where users complete payment on a Fapshi-hosted page.
   *
   * @param request - Payment initiation request
   * @returns Payment link and transaction details
   */
  async initiatePay(
    request: InitiatePayRequest
  ): Promise<InitiatePayResponse> {
    if (!request.amount || request.amount < 100) {
      throw new FapshiError('Amount must be at least 100');
    }

    return this.request<InitiatePayResponse>('POST', '/initiate-pay', request);
  }

  /**
   * Initiate a Direct Payment Request
   * Send a payment request directly to a user's mobile device.
   *
   * @param request - Direct payment request
   * @returns Transaction details
   */
  async directPay(request: DirectPayRequest): Promise<DirectPayResponse> {
    if (!request.amount || request.amount < 100) {
      throw new FapshiError('Amount must be at least 100');
    }

    if (!request.phone) {
      throw new FapshiError('Phone number is required');
    }

    return this.request<DirectPayResponse>('POST', '/direct-pay', request);
  }

  /**
   * Get Transaction Status
   * Retrieve the status of a payment by transaction ID.
   *
   * @param transId - Transaction ID
   * @returns Transaction details
   */
  async getPaymentStatus(transId: string): Promise<Transaction> {
    if (!transId) {
      throw new FapshiError('Transaction ID is required');
    }

    // API returns a single Transaction object, not an array
    const transaction = await this.request<Transaction>(
      'GET',
      `/payment-status/${transId}`
    );

    if (!transaction || !transaction.transId) {
      throw new FapshiError(
        `No transaction found with ID: ${transId}`,
        404
      );
    }

    return transaction;
  }

  /**
   * Expire a Payment Transaction
   * Invalidate a payment link to prevent further payments.
   *
   * @param request - Expire payment request
   * @returns Updated transaction details
   */
  async expirePay(request: ExpirePayRequest): Promise<ExpirePayResponse> {
    if (!request.transId) {
      throw new FapshiError('Transaction ID is required');
    }

    return this.request<ExpirePayResponse>('POST', '/expire-pay', request);
  }

  /**
   * Get Transactions by User ID
   * Retrieve all transactions associated with a user ID.
   *
   * @param userId - User ID (pattern: ^[a-zA-Z0-9\-_]{1,100}$)
   * @returns Array of transactions
   */
  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    if (!userId) {
      throw new FapshiError('User ID is required');
    }

    if (!/^[a-zA-Z0-9\-_]{1,100}$/.test(userId)) {
      throw new FapshiError(
        'User ID must match pattern: ^[a-zA-Z0-9\\-_]{1,100}$'
      );
    }

    return this.request<Transaction[]>('GET', `/transaction/${userId}`);
  }

  /**
   * Search Transactions
   * Search transactions by filters.
   *
   * @param params - Search parameters
   * @returns Array of matching transactions
   */
  async searchTransactions(
    params?: SearchTransactionsParams
  ): Promise<Transaction[]> {
    if (params?.limit !== undefined) {
      if (params.limit < 1 || params.limit > 100) {
        throw new FapshiError('Limit must be between 1 and 100');
      }
    }

    return this.request<Transaction[]>(
      'GET',
      '/search',
      undefined,
      params as Record<string, string | number | undefined | null>
    );
  }

  /**
   * Get Service Balance
   * Return the current service balance.
   *
   * @returns Balance information
   */
  async getBalance(): Promise<BalanceResponse> {
    return this.request<BalanceResponse>('GET', '/balance');
  }

  /**
   * Make a Payout
   * Send money to a user's mobile money, orange money or fapshi account.
   *
   * Conditional requirements:
   * - If medium is not specified: amount and phone are required.
   * - If medium = "fapshi": amount and email are required.
   *
   * @param request - Payout request
   * @returns Transaction details
   */
  async payout(request: PayoutRequest): Promise<PayoutResponse> {
    if (!request.amount || request.amount < 100) {
      throw new FapshiError('Amount must be at least 100');
    }

    // Conditional validation based on medium
    if (request.medium === 'fapshi') {
      if (!request.email) {
        throw new FapshiError('Email is required when medium is "fapshi"');
      }
    } else {
      if (!request.phone) {
        throw new FapshiError(
          'Phone is required when medium is not "fapshi" or not specified'
        );
      }
    }

    return this.request<PayoutResponse>('POST', '/payout', request);
  }
}

