import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, planName, userId } = await req.json();

    const key_id = Deno.env.get("RAZORPAY_KEY_ID");
    const key_secret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!key_id || !key_secret) {
      throw new Error("Razorpay credentials missing.");
    }

    // Use Razorpay REST API directly instead of npm package
    const auth = btoa(`${key_id}:${key_secret}`);
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // paise
        currency: "INR",
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: { plan_name: planName, user_id: userId },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Razorpay API error: ${errBody}`);
    }

    const order = await response.json();

    return new Response(
      JSON.stringify({ orderId: order.id, keyId: key_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Order Creation Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
