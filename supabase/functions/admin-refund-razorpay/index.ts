
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

    if (!accessToken || !supabaseUrl || !anonKey || !serviceRoleKey || !keyId || !keySecret) {
      return json({ error: "Refund service is not configured." }, 503);
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return json({ error: "Authentication required." }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: role, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !role) return json({ error: "Admin access required." }, 403);

    const { paymentId, amount, notes } = await req.json();
    if (!paymentId || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
      return json({ error: "A valid Razorpay payment ID is required." }, 400);
    }

    const [paymentRes, subscriptionRes, badgeRes] = await Promise.all([
      adminClient.from("payments").select("id, client_id, amount, status, refunded_amount, refund_status").eq("razorpay_payment_id", paymentId).maybeSingle(),
      adminClient.from("subscriptions").select("id, user_id, amount, status, refunded_amount, refund_status").eq("payment_id", paymentId).maybeSingle(),
      adminClient.from("creator_verification_subscriptions").select("id, user_id, amount, status, refunded_amount, refund_status").eq("razorpay_payment_id", paymentId).maybeSingle(),
    ]);

    const source = paymentRes.data
      ? { sourceTable: "payments", sourceId: paymentRes.data.id, userId: paymentRes.data.client_id, amount: Number(paymentRes.data.amount), status: paymentRes.data.status, refundedAmount: Number(paymentRes.data.refunded_amount || 0), refundStatus: paymentRes.data.refund_status }
      : subscriptionRes.data
        ? { sourceTable: "subscriptions", sourceId: subscriptionRes.data.id, userId: subscriptionRes.data.user_id, amount: Number(subscriptionRes.data.amount), status: subscriptionRes.data.status, refundedAmount: Number(subscriptionRes.data.refunded_amount || 0), refundStatus: subscriptionRes.data.refund_status }
        : badgeRes.data
          ? { sourceTable: "creator_verification_subscriptions", sourceId: badgeRes.data.id, userId: badgeRes.data.user_id, amount: Number(badgeRes.data.amount), status: badgeRes.data.status, refundedAmount: Number(badgeRes.data.refunded_amount || 0), refundStatus: badgeRes.data.refund_status }
          : null;

    if (!source) return json({ error: "Payment is not present in Canecsu records." }, 404);

    const remaining = Math.max(0, source.amount - source.refundedAmount);
    const requestedAmount = amount === undefined || amount === null || amount === ""
      ? remaining
      : Number(amount);
    if (!Number.isInteger(requestedAmount) || requestedAmount <= 0 || requestedAmount > remaining) {
      return json({ error: "Refund amount must be a whole number within the remaining paid amount." }, 400);
    }

    const auth = btoa(keyId + ":" + keySecret);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/payments/" + paymentId + "/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Basic " + auth },
      body: JSON.stringify({
        amount: requestedAmount * 100,
        notes: { initiated_by: user.id, reason: String(notes || "Admin refund") },
      }),
    });
    const refund = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      return json({ error: refund?.error?.description || "Razorpay refund failed." }, 400);
    }

    const newRefundedAmount = source.refundedAmount + requestedAmount;
    const refundStatus = refund.status || "processed";
    const commonUpdate = {
      refund_id: refund.id,
      refunded_amount: newRefundedAmount,
      refund_status: refundStatus,
      gateway_status: refundStatus === "processed" ? "refunded" : source.status,
      last_reconciled_at: new Date().toISOString(),
    };

    if (source.sourceTable === "payments") {
      await adminClient.from("payments").update({ ...commonUpdate, status: refundStatus === "processed" && newRefundedAmount >= source.amount ? "refunded" : source.status }).eq("id", source.sourceId);
    } else if (source.sourceTable === "subscriptions") {
      await adminClient.from("subscriptions").update({ ...commonUpdate, status: refundStatus === "processed" && newRefundedAmount >= source.amount ? "refunded" : source.status }).eq("id", source.sourceId);
    } else {
      await adminClient.from("creator_verification_subscriptions").update({ ...commonUpdate, status: refundStatus === "processed" && newRefundedAmount >= source.amount ? "refunded" : source.status }).eq("id", source.sourceId);
    }

    await adminClient.from("payment_refunds").insert({
      source_table: source.sourceTable,
      source_id: source.sourceId,
      user_id: source.userId,
      razorpay_payment_id: paymentId,
      razorpay_refund_id: refund.id,
      amount: requestedAmount,
      status: refundStatus,
      notes: String(notes || "Admin refund"),
      requested_by: user.id,
    });

    await adminClient.from("admin_payment_audit_logs").insert({
      actor_id: user.id,
      action: "refund_issued",
      entity_type: source.sourceTable,
      entity_id: source.sourceId,
      razorpay_payment_id: paymentId,
      amount: requestedAmount,
      metadata: { refund_id: refund.id, status: refundStatus, notes: String(notes || "") },
    });

    return json({
      success: true,
      refundId: refund.id,
      status: refundStatus,
      amount: requestedAmount,
      remainingAmount: Math.max(0, source.amount - newRefundedAmount),
    });
  } catch (error) {
    console.error("Admin refund error:", error);
    return json({ error: error instanceof Error ? error.message : "Refund failed." }, 500);
  }
});
