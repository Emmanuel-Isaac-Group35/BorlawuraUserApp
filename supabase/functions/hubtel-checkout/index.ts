import { createClient } from '@supabase/supabase-js'

// Standard CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to get environment variables securely
const getEnv = (key: string) => Deno.env.get(key) || '';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)

    // ─── WEBHOOK HANDLER (Called by Hubtel) ─────────────────────────────────
    if (url.pathname.endsWith('/webhook')) {
      return await handleWebhook(req);
    }

    // ─── CHECKOUT HANDLER (Called by User App) ──────────────────────────────
    return await handleCheckout(req);

  } catch (error) {
    console.error('Unhandled Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Handles the checkout request from the mobile app
 */
async function handleCheckout(req: Request) {
  // Parse the request body from the mobile app
  const { orderId, method, amount } = await req.json()

  if (!orderId || !amount) {
    throw new Error('orderId and amount are required')
  }

  // Get Hubtel credentials from Supabase secrets
  const clientId = getEnv('HUBTEL_CLIENT_ID')
  const clientSecret = getEnv('HUBTEL_CLIENT_SECRET')
  const merchantAccount = getEnv('HUBTEL_MERCHANT_ACCOUNT_NUMBER')

  if (!clientId || !clientSecret || !merchantAccount) {
    console.warn('Hubtel credentials missing. Simulating checkout for development.')
    // Fallback for development if keys aren't set
    return new Response(JSON.stringify({ 
      checkoutUrl: `https://checkout.hubtel.com/mock-session-${orderId}?amount=${amount}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  // Generate the Basic Auth token
  const basicAuth = btoa(`${clientId}:${clientSecret}`)

  // Construct the webhook callback URL dynamically based on this function's URL
  // e.g., https://<project_ref>.supabase.co/functions/v1/hubtel-checkout/webhook
  const requestUrl = new URL(req.url)
  const callbackUrl = `${requestUrl.origin}${requestUrl.pathname}/webhook`

  // Hubtel Initiate Payment Payload
  const hubtelPayload = {
    totalAmount: amount,
    description: `BorlaWura Payment for Order #${orderId.slice(0, 8)}`,
    callbackUrl: callbackUrl,
    returnUrl: "borlawura://payment-complete", // Deep link back to the app
    cancellationUrl: "borlawura://payment-cancelled", // Deep link back to the app
    merchantAccountNumber: merchantAccount,
    clientReference: orderId, // We use the Order ID as the reference so we know which order it is in the webhook
  }

  // Call Hubtel API
  const hubtelRes = await fetch('https://payproxyapi.hubtel.com/items/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(hubtelPayload)
  })

  const hubtelData = await hubtelRes.json()

  if (!hubtelRes.ok || !hubtelData.data?.checkoutUrl) {
    console.error('Hubtel API Error:', hubtelData)
    throw new Error('Failed to generate Hubtel checkout URL')
  }

  // Return the generated checkout URL back to the mobile app
  return new Response(JSON.stringify({ checkoutUrl: hubtelData.data.checkoutUrl }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

/**
 * Handles the webhook callback from Hubtel
 */
async function handleWebhook(req: Request) {
  // Hubtel sends a POST request with the transaction status
  const payload = await req.json()
  console.log('Received Hubtel Webhook:', payload)

  // Hubtel's typical webhook payload structure
  const clientReference = payload.Data?.ClientReference || payload.clientReference;
  const status = payload.Data?.Status || payload.status; // Usually "Success" or "Failed"

  if (!clientReference) {
    return new Response('No clientReference found', { status: 400 })
  }

  // Initialize Supabase Admin Client to bypass Row Level Security (RLS)
  // We use the SERVICE_ROLE key here because webhooks come from an external server, not an authenticated user.
  const supabaseAdmin = createClient(
    getEnv('SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY')
  )

  let paymentStatus = 'failed'
  let orderStatus = undefined

  // Map Hubtel status to our database status
  if (status && status.toLowerCase() === 'success') {
    paymentStatus = 'paid'
    orderStatus = 'completed'
  }

  // Update the orders table
  const updatePayload: any = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString()
  }
  
  if (orderStatus) {
    updatePayload.status = orderStatus
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update(updatePayload)
    .eq('id', clientReference)

  if (error) {
    console.error(`Failed to update order ${clientReference}:`, error)
    return new Response('Database update failed', { status: 500 })
  }

  // Respond to Hubtel with a 200 OK so they know we received the webhook
  return new Response(JSON.stringify({ message: 'Webhook processed successfully' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
}
