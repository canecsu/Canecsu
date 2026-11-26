
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !supabaseUrl || !serviceRoleKey) return json({ error: "Webhook is not configured." }, 503);

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!signature || signature !== await hmacHex(secret, rawBody)) return json({ error: "Invalid webhook signature." }, 401);

  const eventId = req.headers.get("x-razorpay-event-id");
  const payload = JSON.parse(rawBody);
  const eventType = String(payload.event || "unknown");
  const client = createClient(supabaseUrl, serviceRoleKey);

  if (eventId) {
    const { data: existing } = await client.from("payment_webhook_events").select("id, status").eq("razorpay_event_id", eventId).maybeSingle();
    if (existing?.status === "processed") return json({ received: true, duplicate: true });
  }

  const { data: eventRow, error: eventError } = await client
    .from("payment_webhook_events")
    .upsert({
      razorpay_event_id: eventId || null,
      event_type: eventType,
      payload,
      status: "received",
      received_at: new Date().toISOString(),
    }, { onConflict: "razorpay_event_id" })
    .select("id")
    .single();
  if (eventError) return json({ error: eventError.message }, 500);

  try {
    const payment = payload?.payload?.payment?.entity;
    const order = payload?.payload?.order?.entity;
    const refund = payload?.payload?.refund?.entity;
    const now = new Date().toISOString();

    if (payment?.id) {
      const gatewayStatus = String(payment.status || "unknown");
      await Promise.all([
        client.from("payments").update({ status: gatewayStatus, gateway_status: gatewayStatus, gateway_data: payment, last_reconciled_at: now }).eq("razorpay_payment_id", payment.id),
        client.from("subscriptions").update({ gateway_status: gatewayStatus, gateway_data: payment, last_reconciled_at: now }).eq("payment_id", payment.id),
        client.from("creator_verification_subscriptions").update({ gateway_status: gatewayStatus, gateway_data: payment, last_reconciled_at: now }).eq("razorpay_payment_id", payment.id),
      ]);
    }

    if (order?.id) {
      await Promise.all([
        client.from("subscriptions").update({ razorpay_order_id: order.id, gateway_status: eventType === "order.paid" ? "paid" : undefined, gateway_data: order, last_reconciled_at: now }).eq("razorpay_order_id", order.id),
        client.from("creator_verification_subscriptions").update({ gateway_status: eventType === "order.paid" ? "paid" : undefined, gateway_data: order, last_reconciled_at: now }).eq("razorpay_order_id", order.id),
      ]);
    }

    if (refund?.id && refund?.payment_id) {
      const paymentId = String(refund.payment_id);
      const [paymentRes, subscriptionRes, badgeRes] = await Promise.all([
        client.from("payments").select("id, client_id, amount, refunded_amount").eq("razorpay_payment_id", paymentId).maybeSingle(),
        client.from("subscriptions").select("id, user_id, amount, refunded_amount").eq("payment_id", paymentId).maybeSingle(),
        client.from("creator_verification_subscriptions").select("id, user_id, amount, refunded_amount").eq("razorpay_payment_id", paymentId).maybeSingle(),
      ]);
      const source = paymentRes.data
        ? { sourceTable: "payments", sourceId: paymentRes.data.id, userId: paymentRes.data.client_id, amount: Number(paymentRes.data.amount), refundedAmount: Number(paymentRes.data.refunded_amount || 0) }
        : subscriptionRes.data
          ? { sourceTable: "subscriptions", sourceId: subscriptionRes.data.id, userId: subscriptionRes.data.user_id, amount: Number(subscriptionRes.data.amount), refundedAmount: Number(subscriptionRes.data.refunded_amount || 0) }
          : badgeRes.data
            ? { sourceTable: "creator_verification_subscriptions", sourceId: badgeRes.data.id, userId: badgeRes.data.user_id, amount: Number(badgeRes.data.amount), refundedAmount: Number(badgeRes.data.refunded_amount || 0) }
            : null;

      if (source) {
        const refundAmount = Math.round(Number(refund.amount || 0) / 100);
        const refundStatus = String(refund.status || (eventType === "refund.processed" ? "processed" : "failed"));
        const update = {
          refund_id: refund.id,
          refunded_amount: source.refundedAmount + refundAmount,
          refund_status: refundStatus,
          gateway_status: refundStatus === "processed" ? "refunded" : refundStatus,
          last_reconciled_at: now,
        };
        if (source.sourceTable === "payments") await client.from("payments").update({ ...update, status: refundStatus === "processed" && update.refunded_amount >= source.amount ? "refunded" : undefined }).eq("id", source.sourceId);
        if (source.sourceTable === "subscriptions") await client.from("subscriptions").update({ ...update, status: refundStatus === "processed" && update.refunded_amount >= source.amount ? "refunded" : undefined }).eq("id", source.sourceId);
        if (source.sourceTable === "creator_verification_subscriptions") await client.from("creator_verification_subscriptions").update({ ...update, status: refundStatus === "processed" && update.refunded_amount >= source.amount ? "refunded" : undefined }).eq("id", source.sourceId);

        await client.from("payment_refunds").upsert({
          source_table: source.sourceTable,
          source_id: source.sourceId,
          user_id: source.userId,
          razorpay_payment_id: paymentId,
          razorpay_refund_id: refund.id,
          amount: refundAmount,
          status: refundStatus,
          notes: "Razorpay webhook",
        }, { onConflict: "razorpay_refund_id" });
      }
    }

    await client.from("payment_webhook_events").update({ status: "processed", processed_at: new Date().toISOString(), error_message: null }).eq("id", eventRow.id);
    return json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    await client.from("payment_webhook_events").update({ status: "failed", error_message: message }).eq("id", eventRow.id);
    console.error("Razorpay webhook error:", error);
    return json({ error: message }, 500);
  }
});
