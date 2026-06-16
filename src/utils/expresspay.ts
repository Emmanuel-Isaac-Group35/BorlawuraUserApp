// ─────────────────────────────────────────────────────────────────────────────
// ExpressPay — Merchant Direct API integration
// Docs: https://expresspaygh.com/developers/docs/accept-payments/merchant-direct-api
// ─────────────────────────────────────────────────────────────────────────────

// ── Environment ─────────────────────────────────────────────────────────────
const MERCHANT_ID = process.env.EXPO_PUBLIC_EXPRESSPAY_MERCHANT_ID || '';
const API_KEY     = process.env.EXPO_PUBLIC_EXPRESSPAY_API_KEY || '';
const POST_URL    = process.env.EXPO_PUBLIC_EXPRESSPAY_POST_URL || 'https://expresspaygh.com';

// Toggle between sandbox & live via env
const USE_SANDBOX = process.env.EXPO_PUBLIC_EXPRESSPAY_SANDBOX === 'true';
const BASE        = USE_SANDBOX
  ? 'https://sandbox.expresspaygh.com/api/direct'
  : 'https://expresspaygh.com/api/direct';

// ── Types ───────────────────────────────────────────────────────────────────

export type MoMoNetwork = 'MTN_MM' | 'AIRTEL_MM' | 'TIGO_CASH' | 'VODAFONE_CASH';

export interface SubmitResponse {
  status: number;          // 1=Success, 2=Invalid Credentials, 3=Invalid Request, 4=Invalid IP
  'order-id': string;
  token: string;
}

export interface CheckoutResponse {
  result: number;          // 1=Approved, 2=Declined, 3=Error, 4=Pending
  'result-text': string;
  'order-id': string;
  token: string;
  'transaction-id': string;
  currency: string;
  amount: string;
  'date-processed': string;
}

export interface QueryResponse {
  result: number;          // 1=Approved, 2=Declined, 3=Error, 4=Pending
  'result-text': string;
  'order-id': string;
  token: string;
  currency: string;
  amount: string;
  'auth-code': string;
  'transaction-id': string;
  'date-processed': string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build `application/x-www-form-urlencoded` body from a plain object.
 */
const toFormData = (data: Record<string, string>): string =>
  Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

const post = async <T>(url: string, body: Record<string, string>): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toFormData(body),
  });

  if (!res.ok) {
    throw new Error(`ExpressPay HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
};

// ── API Methods ─────────────────────────────────────────────────────────────

/**
 * **STEP 1** — Submit a payment request and obtain a token.
 * @returns token string on success, throws on failure.
 */
export const submitPayment = async (
  amount: number,
  orderId: string,
): Promise<string> => {
  const data = await post<SubmitResponse>(`${BASE}/submit.php`, {
    'merchant-id': MERCHANT_ID,
    'api-key':     API_KEY,
    currency:      'GHS',
    amount:        amount.toFixed(2),
    'order-id':    orderId,
    'post-url':    POST_URL,
  });

  if (data.status !== 1) {
    const reasons: Record<number, string> = {
      2: 'Invalid merchant credentials',
      3: 'Invalid request parameters',
      4: 'IP address not whitelisted',
    };
    throw new Error(reasons[data.status] || `Submit failed (status ${data.status})`);
  }

  return data.token;
};

/**
 * **STEP 2 (MoMo)** — Charge a mobile money number.
 * Result `1` = Approved, `4` = Pending (await webhook / poll).
 */
export const checkoutMoMo = async (
  token: string,
  mobileNumber: string,
  network: MoMoNetwork,
): Promise<CheckoutResponse> => {
  return post<CheckoutResponse>(`${BASE}/checkout.php`, {
    token,
    'mobile-number':  mobileNumber,
    'mobile-network': network,
  });
};

/**
 * **STEP 2 (Card)** — Charge a card.
 */
export const checkoutCard = async (
  token: string,
  card: {
    number: string;
    holderName: string;
    expiry: string;     // "MMYY"
    cvv: string;
  },
): Promise<CheckoutResponse> => {
  return post<CheckoutResponse>(`${BASE}/checkout.php`, {
    token,
    'card-number':      card.number,
    'card-holder-name': card.holderName,
    'card-expiry':      card.expiry,
    'card-cvv':         card.cvv,
  });
};

/**
 * **STEP 4** — Query the final transaction status.
 */
export const queryPayment = async (token: string): Promise<QueryResponse> => {
  return post<QueryResponse>(`${BASE}/query.php`, {
    'merchant-id': MERCHANT_ID,
    'api-key':     API_KEY,
    token,
  });
};

/**
 * High-level helper: poll `queryPayment` every `intervalMs` until the result
 * is no longer Pending (4), up to `maxAttempts`. Useful for MoMo flows.
 */
export const pollPaymentStatus = async (
  token: string,
  maxAttempts = 24,
  intervalMs = 5000,
): Promise<QueryResponse> => {
  for (let i = 0; i < maxAttempts; i++) {
    const resp = await queryPayment(token);
    if (resp.result !== 4) return resp;           // Not pending → done
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Payment polling timed out. Please check your order history.');
};
