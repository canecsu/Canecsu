import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Paid creator verification orders are fixed-price and tied to the signed-in user.
    if (planName === "Creator Verification") {
      if (Number(amount) !== 99 || !userId) {
        throw new Error("Creator Verification must be exactly ₹99.");
      }
      const accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!accessToken || !supabaseUrl || !supabaseAnonKey) {
        throw new Error("Authentication is required for creator verification.");
      }
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
      if (authError || !user || user.id !== userId) {
        throw new Error("You can only purchase verification for your own account.");
      }

      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!serviceRoleKey) {
        throw new Error("Creator verification is temporarily unavailable.");
      }
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: creatorAccount, error: creatorError } = await adminClient
        .from("creator_profiles")
        .select("profile_id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (creatorError || !creatorAccount) {
        throw new Error("Only creator accounts can purchase this badge.");
      }
    }

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
        amount: Number(amount) * 100, // paise
        currency: "INR",
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: { plan_name: planName || "booking_payment", user_id: userId },
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
