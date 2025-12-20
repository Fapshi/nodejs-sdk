# @fapshi/payments

Official Fapshi Payment API SDK for Node.js and TypeScript. This package provides a simple and type-safe interface to integrate Fapshi payment services into your applications.

## Features

- 💳 **Payment Links** - Generate hosted payment pages
- 📱 **Direct Payments** - Send payment requests directly to mobile devices
- 💸 **Payouts** - Send money to mobile money, orange money, or Fapshi accounts
- 📊 **Transaction Management** - Query, search, and manage transactions
- ⚖️ **Balance Checking** - Check your service balance
- 🔒 **TypeScript Support** - Full type definitions included
- 🌍 **Auto Environment Detection** - Automatically detects sandbox/live from API key format
- 🎯 **Environment Support** - Switch between sandbox and live environments

## Installation

```bash
npm install @fapshi/payments
```

## Quick Start

```typescript
import { createFapshiClient } from '@fapshi/payments';

// Initialize the client - environment is auto-detected from API key format
const fapshi = createFapshiClient({
  apiUser: 'your-api-user',
  apiKey: 'your-api-key' // Environment auto-detected from format
});

// Or explicitly specify environment
const fapshi = createFapshiClient({
  apiUser: 'your-api-user',
  apiKey: 'your-api-key',
  environment: 'sandbox' // or 'live'
});

// Create a payment link
const payment = await fapshi.initiatePay({
  amount: 1000, // Minimum 100
  email: 'customer@example.com',
  redirectUrl: 'https://yourapp.com/payment-success',
  userId: 'user123',
  message: 'Payment for order #12345'
});

console.log('Payment link:', payment.link);
console.log('Transaction ID:', payment.transId);
```

## API Reference

### Initialization

```typescript
import { FapshiClient } from '@fapshi/payments';

// Environment is automatically detected from API key format:
const fapshi = new FapshiClient({
  apiUser: 'your-api-user',
  apiKey: 'your-api-key' // Environment auto-detected
});

// Or explicitly specify environment (takes precedence over auto-detection)
const fapshi = new FapshiClient({
  apiUser: 'your-api-user',
  apiKey: 'your-api-key',
  environment: 'sandbox', // 'sandbox' or 'live'
  // baseUrl: 'https://custom-url.com' // Optional: override base URL
});
```

### Payment Methods

#### 1. Initiate Payment (Payment Link)

Generate a payment link for users to complete payment on a Fapshi-hosted page.

```typescript
const payment = await fapshi.initiatePay({
  amount: 1000, // Required: minimum 100
  email: 'customer@example.com', // Optional
  redirectUrl: 'https://yourapp.com/callback', // Optional
  userId: 'user123', // Optional: ^[a-zA-Z0-9\-_]{1,100}$
  externalId: 'order-12345', // Optional: ^[a-zA-Z0-9\-_]{1,100}$
  message: 'Payment for order #12345' // Optional
});

// Returns: { message, link, transId, dateInitiated }
```

#### 2. Direct Payment

Send a payment request directly to a user's mobile device.

```typescript
const payment = await fapshi.directPay({
  amount: 1000, // Required: minimum 100
  phone: '670000000', // Required
  medium: 'mobile money', // Optional: 'mobile money' | 'orange money'
  name: 'John Doe', // Optional
  email: 'customer@example.com', // Optional
  userId: 'user123', // Optional
  externalId: 'order-12345', // Optional
  message: 'Payment request' // Optional
});

// Returns: { message, transId, dateInitiated }
```

#### 3. Payout

Send money to a user's mobile money, orange money, or Fapshi account.

```typescript
// Payout to mobile money or orange money
const payout = await fapshi.payout({
  amount: 5000, // Required: minimum 100
  phone: '670000000', // Required when medium is not 'fapshi'
  medium: 'mobile money', // Optional: 'mobile money' | 'orange money' | 'fapshi'
  name: 'John Doe', // Optional
  email: 'recipient@example.com', // Optional (required if medium is 'fapshi')
  userId: 'user123', // Optional
  externalId: 'payout-12345', // Optional
  message: 'Payment for services' // Optional
});

// Payout to Fapshi account
const fapshiPayout = await fapshi.payout({
  amount: 5000,
  medium: 'fapshi',
  email: 'recipient@example.com' // Required when medium is 'fapshi'
});
```

### Transaction Management

#### Get Payment Status

```typescript
const transaction = await fapshi.getPaymentStatus('trans-id-123');
// Returns: Transaction
```

#### Expire Payment

```typescript
const expired = await fapshi.expirePay({
  transId: 'trans-id-123'
});
// Returns: { transId, status: 'EXPIRED', ... }
```

#### Get Transactions by User ID

```typescript
const transactions = await fapshi.getTransactionsByUserId('user123');
// Returns: Transaction[]
```

#### Search Transactions

```typescript
const transactions = await fapshi.searchTransactions({
  status: 'successful', // Optional: 'created' | 'successful' | 'failed' | 'expired'
  medium: 'mobile money', // Optional: 'mobile money' | 'orange money'
  start: '2024-01-01', // Optional: YYYY-MM-DD
  end: '2024-01-31', // Optional: YYYY-MM-DD
  amt: 1000, // Optional: filter by amount
  limit: 20, // Optional: 1-100, default 10
  sort: 'desc' // Optional: 'asc' | 'desc', default 'desc'
});
// Returns: Transaction[]
```

#### Get Balance

```typescript
const balance = await fapshi.getBalance();
// Returns: { service, balance, currency }
```

## Error Handling

The SDK throws `FapshiError` for API errors:

```typescript
import { FapshiError } from '@fapshi/payments';

try {
  const payment = await fapshi.initiatePay({ amount: 50 }); // Too low
} catch (error) {
  if (error instanceof FapshiError) {
    console.error('Fapshi Error:', error.message);
    console.error('Status Code:', error.statusCode);
  }
}
```

## Type Definitions

All types are exported for use in TypeScript:

```typescript
import type {
  Transaction,
  TransactionStatus,
  PaymentMedium,
  InitiatePayRequest,
  InitiatePayResponse,
  DirectPayRequest,
  DirectPayResponse,
  PayoutRequest,
  PayoutResponse,
  SearchTransactionsParams,
  BalanceResponse,
} from '@fapshi/payments';
```

## Environment Configuration

The SDK automatically detects the environment from your API key format:
- **Sandbox keys**: `FAK_TEST_XXX` → Uses `https://sandbox.fapshi.com`
- **Live keys**: `FAK_XXX` → Uses `https://live.fapshi.com`

You can omit the `environment` parameter and let the SDK auto-detect, or explicitly specify it to override the detection.

### Sandbox Environment

Use sandbox for testing. Base URL: `https://sandbox.fapshi.com`

```typescript
// Auto-detected from API key format (FAK_TEST_XXX)
const fapshi = createFapshiClient({
  apiUser: 'sandbox-api-user',
  apiKey: 'FAK_TEST_your_sandbox_key'
  // environment is auto-detected as 'sandbox'
});

// Or explicitly specify
const fapshi = createFapshiClient({
  apiUser: 'sandbox-api-user',
  apiKey: 'sandbox-api-key',
  environment: 'sandbox'
});
```

**Sandbox Behavior for Fapshi Payouts:**
- Success emails: `test.success@fapshi.com`, `messi.champion@fapshi.com`
- Failure emails: `test.failed@fapshi.com`, `penaldo.test@fapshi.com`
- Other emails: status is stochastic (random)

### Live Environment

Use live for production. Base URL: `https://live.fapshi.com`

```typescript
// Auto-detected from API key format (FAK_XXX)
const fapshi = createFapshiClient({
  apiUser: 'live-api-user',
  apiKey: 'FAK_your_live_key'
  // environment is auto-detected as 'live'
});

// Or explicitly specify
const fapshi = createFapshiClient({
  apiUser: 'live-api-user',
  apiKey: 'live-api-key',
  environment: 'live'
});
```

## Webhooks

The SDK doesn't handle webhooks directly. You should set up your own webhook endpoint to receive payment status updates.


## Examples

### E-commerce Payment Flow

```typescript
// Step 1: Create payment link
const payment = await fapshi.initiatePay({
  amount: 5000,
  email: 'customer@example.com',
  redirectUrl: 'https://yourapp.com/order/success',
  externalId: 'order-12345',
  message: 'Payment for Order #12345'
});

// Step 2: Redirect user to payment.link

// Step 3: After redirect, check payment status
const transaction = await fapshi.getPaymentStatus(payment.transId);

if (transaction.status === 'SUCCESSFUL') {
  // Payment successful, fulfill order
  console.log('Payment confirmed:', transaction.financialTransId);
}
```

### Mobile Money Payout

```typescript
// Send payment to mobile money
const payout = await fapshi.payout({
  amount: 10000,
  phone: '670000000',
  medium: 'mobile money',
  name: 'John Doe',
  externalId: 'payout-12345',
  message: 'Payment for services rendered'
});

console.log('Payout initiated:', payout.transId);
```

### Transaction Monitoring

```typescript
// Search for successful transactions today
const today = new Date().toISOString().split('T')[0];
const transactions = await fapshi.searchTransactions({
  status: 'successful',
  start: today,
  end: today,
  sort: 'desc'
});

console.log(`Found ${transactions.length} successful transactions today`);
```

## Requirements

- Node.js >= 14.0.0
- API credentials (apiuser and apikey) from Fapshi

## License

MIT

## Support

For API documentation and support, visit the [Fapshi documentation](https://docs.fapshi.com).

