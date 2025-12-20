/**
 * Fapshi Payment API SDK
 * Official SDK for integrating Fapshi Payment API into your Node.js applications
 */

export { FapshiClient, FapshiError } from './client';
import { FapshiClient } from './client';

export * from './types';

/**
 * Create a new Fapshi client instance
 *
 * @param config - Configuration object with API credentials
 * @returns Fapshi client instance
 *
 * @example
 * ```typescript
 * import { createFapshiClient } from '@fapshi/payments';
 *
 * const client = createFapshiClient({
 *   apiUser: 'your-api-user',
 *   apiKey: 'your-api-key',
 * });
 * ```
 */
export function createFapshiClient(config: {
  apiUser: string;
  apiKey: string;
  environment?: 'sandbox' | 'live';
  baseUrl?: string;
}): FapshiClient {
  return new FapshiClient(config);
}

// Default export
export { FapshiClient as default } from './client';

