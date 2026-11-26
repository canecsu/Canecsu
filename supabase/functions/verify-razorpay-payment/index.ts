import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      amount,
      userId,
    } = await req.json();

    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) throw new Error("Razorpay secret missing");

    // 🔐 VERIFY SIGNATURE
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        { status: 400, headers: corsHeaders }
      );
    }


    // Creator Verification is a separate ₹99 / 30-day badge. It never changes
    // the official identity-verification flag on profiles.
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

      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: existingBadge, error: existingError } = await adminClient
        .from("creator_verification_subscriptions")
        .select("id")
        .eq("razorpay_payment_id", razorpay_payment_id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existingBadge) {
        return new Response(
          JSON.stringify({ success: true, alreadyProcessed: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const now = new Date();
      const { data: currentBadge } = await adminClient
        .from("creator_verification_subscriptions")
        .select("expires_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("expires_at", now.toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const startsAt = currentBadge?.expires_at && new Date(currentBadge.expires_at) > now
        ? new Date(currentBadge.expires_at)
        : now;
      const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error: badgeError } = await adminClient
        .from("creator_verification_subscriptions")
        .insert({
          user_id: userId,
          plan_name: "creator_verification",
          amount: 99,
          razorpay_order_id,
          razorpay_payment_id,
          status: "active",
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt,
        });

      if (badgeError) throw badgeError;

      return new Response(
        JSON.stringify({ success: true, badgeExpiresAt: expiresAt }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ⏳ PLAN LOGIC
    const now = new Date();
    let expiresAt: string | null = null;
    let userType: "creator" | "client" = "creator";

    if (planName === "Premium Pass") {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      userType = "client";
    } else if (planName === "Business Access") {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      userType = "client";
    } else if (
      planName === "Pro" ||
      planName === "Premium" ||
      planName === "Business"
    ) {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      userType = "creator";
    }

    // 🔗 SUPABASE INIT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedPlan = planName.toLowerCase().replace(/\s+/g, "_");

    // 💾 1. SAVE SUBSCRIPTION RECORD
    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_name: normalizedPlan,
      amount: amount,
      payment_id: razorpay_payment_id,
      status: "active",
      expires_at: expiresAt,
    });

    if (subError) throw subError;

    // 👤 2. UPDATE USER DATA
    if (userType === "creator") {
      // Update creator profile
      const { error: creatorError } = await supabase
        .from("creator_profiles")
        .update({
          subscription_tier: normalizedPlan,
          plan_expiry: expiresAt,
        })
        .eq("profile_id", userId);

      if (creatorError) throw creatorError;

      // 🔥 MAIN FIX (IMPORTANT)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          plan: normalizedPlan, // THIS FIXES DASHBOARD
        })
        .eq("id", userId);

      if (profileError) throw profileError;

    } else {
      // Client update
      const { error: clientError } = await supabase
        .from("profiles")
        .update({
          client_subscription_tier: normalizedPlan,
          client_plan_expiry: expiresAt,
        })
        .eq("id", userId);

      if (clientError) throw clientError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("ERROR:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: corsHeaders }
    );
  }
});
