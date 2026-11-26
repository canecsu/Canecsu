
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!accessToken || !supabaseUrl || !anonKey || !serviceRoleKey || !keyId || !keySecret) return json({ error: "Reconciliation service is not configured." }, 503);

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return json({ error: "Authentication required." }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: role } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Admin access required." }, 403);

    const { paymentId } = await req.json();
    if (!paymentId || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) return json({ error: "A valid Razorpay payment ID is required." }, 400);

    const response = await fetch("https://api.razorpay.com/v1/payments/" + paymentId, {
      headers: { "Authorization": "Basic " + btoa(keyId + ":" + keySecret) },
    });
    const gatewayPayment = await response.json();
    if (!response.ok) return json({ error: gatewayPayment?.error?.description || "Razorpay lookup failed." }, 400);

    const now = new Date().toISOString();
    const gatewayStatus = String(gatewayPayment.status || "unknown");
    const update = {
      gateway_status: gatewayStatus,
      settlement_id: gatewayPayment.settlement_id || null,
      gateway_fee_paise: gatewayPayment.fee ?? null,
      gateway_tax_paise: gatewayPayment.tax ?? null,
      gateway_data: gatewayPayment,
      last_reconciled_at: now,
    };

    await Promise.all([
      adminClient.from("payments").update({ ...update, status: gatewayStatus }).eq("razorpay_payment_id", paymentId),
      adminClient.from("subscriptions").update(update).eq("payment_id", paymentId),
      adminClient.from("creator_verification_subscriptions").update(update).eq("razorpay_payment_id", paymentId),
    ]);

    await adminClient.from("admin_payment_audit_logs").insert({
      actor_id: user.id,
      action: "payment_reconciled",
      entity_type: "razorpay_payment",
      entity_id: paymentId,
      razorpay_payment_id: paymentId,
      amount: Math.round(Number(gatewayPayment.amount || 0) / 100),
      metadata: { gateway_status: gatewayStatus, settlement_id: gatewayPayment.settlement_id || null },
    });

    return json({ success: true, payment: gatewayPayment });
  } catch (error) {
    console.error("Payment reconciliation error:", error);
    return json({ error: error instanceof Error ? error.message : "Reconciliation failed." }, 500);
  }
});
