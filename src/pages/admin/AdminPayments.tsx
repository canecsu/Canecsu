
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, RefreshCw, RotateCcw, Search, ShieldCheck, Webhook } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PaymentRecord = {
  key: string;
  source: "Booking" | "Subscription" | "Verification badge";
  sourceTable: string;
  sourceId: string;
  userId?: string;
  userName: string;
  amount: number;
  refundedAmount: number;
  status: string;
  gatewayStatus: string;
  paymentId: string;
  orderId: string;
  settlementId: string;
  createdAt: string;
  expiresAt: string;
};

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (["captured", "paid", "active", "processed", "completed"].includes(normalized)) {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (["failed", "refunded", "cancelled"].includes(normalized)) {
    return "bg-red-100 text-red-700 border-red-200";
  }
  return "bg-amber-100 text-amber-700 border-amber-200";
};

const AdminPayments = () => {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");

  const loadPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        paymentRes,
        subscriptionRes,
        badgeRes,
        refundRes,
        webhookRes,
        auditRes,
        profileRes,
      ] = await Promise.all([
        (supabase.from("payments" as any).select("*").order("created_at", { ascending: false }).limit(200) as any),
        (supabase.from("subscriptions" as any).select("*").order("created_at", { ascending: false }).limit(200) as any),
        (supabase.from("creator_verification_subscriptions" as any).select("*").order("created_at", { ascending: false }).limit(200) as any),
        (supabase.from("payment_refunds" as any).select("*").order("created_at", { ascending: false }).limit(50) as any),
        (supabase.from("payment_webhook_events" as any).select("*").order("received_at", { ascending: false }).limit(30) as any),
        (supabase.from("admin_payment_audit_logs" as any).select("*").order("created_at", { ascending: false }).limit(50) as any),
        supabase.from("profiles").select("id, name"),
      ]);

      const firstError = [
        paymentRes.error,
        subscriptionRes.error,
        badgeRes.error,
        refundRes.error,
        webhookRes.error,
        auditRes.error,
        profileRes.error,
      ].find(Boolean);
      if (firstError) throw firstError;

      const profileNames: Record<string, string> = {};
      (profileRes.data || []).forEach((profile: any) => {
        profileNames[profile.id] = profile.name || "Unknown user";
      });

      const normalized: PaymentRecord[] = [
        ...(paymentRes.data || []).map((row: any) => ({
          key: "payment-" + row.id,
          source: "Booking" as const,
          sourceTable: "payments",
          sourceId: row.id,
          userId: row.client_id,
          userName: profileNames[row.client_id] || "Unknown user",
          amount: Number(row.amount || 0),
          refundedAmount: Number(row.refunded_amount || 0),
          status: String(row.status || "unknown"),
          gatewayStatus: String(row.gateway_status || ""),
          paymentId: String(row.razorpay_payment_id || ""),
          orderId: String(row.razorpay_order_id || ""),
          settlementId: String(row.settlement_id || ""),
          createdAt: row.created_at,
          expiresAt: "",
        })),
        ...(subscriptionRes.data || []).map((row: any) => ({
          key: "subscription-" + row.id,
          source: "Subscription" as const,
          sourceTable: "subscriptions",
          sourceId: row.id,
          userId: row.user_id,
          userName: profileNames[row.user_id] || "Unknown user",
          amount: Number(row.amount || 0),
          refundedAmount: Number(row.refunded_amount || 0),
          status: String(row.status || "unknown"),
          gatewayStatus: String(row.gateway_status || ""),
          paymentId: String(row.payment_id || ""),
          orderId: String(row.razorpay_order_id || ""),
          settlementId: String(row.settlement_id || ""),
          createdAt: row.created_at,
          expiresAt: row.expires_at || "",
        })),
        ...(badgeRes.data || []).map((row: any) => ({
          key: "badge-" + row.id,
          source: "Verification badge" as const,
          sourceTable: "creator_verification_subscriptions",
          sourceId: row.id,
          userId: row.user_id,
          userName: profileNames[row.user_id] || "Unknown user",
          amount: Number(row.amount || 0),
          refundedAmount: Number(row.refunded_amount || 0),
          status: String(row.status || "unknown"),
          gatewayStatus: String(row.gateway_status || ""),
          paymentId: String(row.razorpay_payment_id || ""),
          orderId: String(row.razorpay_order_id || ""),
          settlementId: String(row.settlement_id || ""),
          createdAt: row.created_at,
          expiresAt: row.expires_at || "",
        })),
      ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setRecords(normalized);
      setRefunds(refundRes.data || []);
      setWebhooks(webhookRes.data || []);
      setAuditLogs(auditRes.data || []);
    } catch (error: any) {
      toast.error("Payment data could not be loaded", { description: error?.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPaymentData();
  }, [loadPaymentData]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((row) => {
      const matchesSearch = !query || [
        row.userName,
        row.paymentId,
        row.orderId,
        row.source,
        row.status,
      ].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter;
      const matchesSource = sourceFilter === "all" || row.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [records, search, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const successful = records.filter((row) => ["captured", "paid", "active", "completed"].includes(row.status.toLowerCase()));
    return {
      collected: successful.reduce((sum, row) => sum + Math.max(0, row.amount - row.refundedAmount), 0),
      transactions: records.length,
      failed: records.filter((row) => row.status.toLowerCase() === "failed").length,
      refunds: records.reduce((sum, row) => sum + row.refundedAmount, 0),
      activeSubscriptions: records.filter((row) => row.expiresAt && new Date(row.expiresAt).getTime() > Date.now()).length,
    };
  }, [records]);

  const exportCsv = () => {
    const headers = ["Date", "User", "Type", "Amount", "Refunded", "Status", "Gateway Status", "Payment ID", "Order ID", "Settlement ID", "Expiry"];
    const rows = filteredRecords.map((row) => [
      formatDate(row.createdAt),
      row.userName,
      row.source,
      row.amount,
      row.refundedAmount,
      row.status,
      row.gatewayStatus,
      row.paymentId,
      row.orderId,
      row.settlementId,
      row.expiresAt ? formatDate(row.expiresAt) : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => '"' + String(cell ?? "").replaceAll('"', '""') + '"').join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = "canecsu-payment-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const reconcile = async (row: PaymentRecord) => {
    if (!row.paymentId) {
      toast.info("This record has no Razorpay payment ID yet.");
      return;
    }
    setActionKey("reconcile-" + row.key);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reconcile-razorpay-payment", {
        body: { paymentId: row.paymentId },
      });
      if (error || !data?.success) throw new Error(error?.message || data?.error || "Reconciliation failed.");
      toast.success("Payment reconciled with Razorpay");
      await loadPaymentData();
    } catch (error: any) {
      toast.error("Reconciliation failed", { description: error?.message || "Please try again." });
    } finally {
      setActionKey("");
    }
  };

  const refund = async (row: PaymentRecord) => {
    if (!row.paymentId) {
      toast.info("This record has no Razorpay payment ID.");
      return;
    }
    const remaining = Math.max(0, row.amount - row.refundedAmount);
    if (!remaining) {
      toast.info("This payment is already fully refunded.");
      return;
    }
    const entered = window.prompt("Refund amount in ₹. Leave blank for full remaining refund.", String(remaining));
    if (entered === null) return;
    const amount = entered.trim() === "" ? remaining : Number(entered);
    if (!Number.isInteger(amount) || amount <= 0 || amount > remaining) {
      toast.error("Enter a valid whole-number refund amount.");
      return;
    }
    if (!window.confirm(formatINR(amount) + " refund issue करना है?")) return;

    setActionKey("refund-" + row.key);
    try {
      const { data, error } = await supabase.functions.invoke("admin-refund-razorpay", {
        body: { paymentId: row.paymentId, amount, notes: "Admin refund from Canecsu panel" },
      });
      if (error || !data?.success) throw new Error(error?.message || data?.error || "Refund failed.");
      toast.success("Refund initiated successfully", { description: "Refund ID: " + data.refundId });
      await loadPaymentData();
    } catch (error: any) {
      toast.error("Refund failed", { description: error?.message || "Please try again." });
    } finally {
      setActionKey("");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Payments & Revenue</h1>
            <p className="text-muted-foreground text-sm">Razorpay activity, subscriptions, refunds and reconciliation</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadPaymentData()} disabled={loading}>
              <RefreshCw className={"h-4 w-4 mr-2 " + (loading ? "animate-spin" : "")} />Refresh
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={!filteredRecords.length}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
            <Button variant="outline" asChild>
              <a href="https://dashboard.razorpay.com/app/payments" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />Razorpay
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          {[
            { label: "Net collected", value: formatINR(stats.collected) },
            { label: "Transactions", value: stats.transactions },
            { label: "Failed", value: stats.failed },
            { label: "Refunded", value: formatINR(stats.refunds) },
            { label: "Active subscriptions", value: stats.activeSubscriptions },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Payment ledger</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user, payment ID..." className="pl-9 w-64" />
                </div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">All statuses</option>
                  <option value="captured">Captured</option>
                  <option value="paid">Paid</option>
                  <option value="active">Active</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="all">All types</option>
                  <option value="Booking">Bookings</option>
                  <option value="Subscription">Subscriptions</option>
                  <option value="Verification badge">Verification badges</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="p-4 font-medium">Payment</th>
                    <th className="p-4 font-medium">User / Type</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Expiry / Settlement</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Loading payment activity...</td></tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No payment activity found.</td></tr>
                  ) : filteredRecords.map((row) => {
                    const busy = actionKey.endsWith(row.key);
                    const remaining = Math.max(0, row.amount - row.refundedAmount);
                    return (
                      <tr key={row.key} className="border-t border-border align-top">
                        <td className="p-4">
                          <p className="font-medium">{row.paymentId || "Not linked yet"}</p>
                          <p className="text-xs text-muted-foreground">{row.orderId ? "Order: " + row.orderId : formatDate(row.createdAt)}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{row.userName}</p>
                          <p className="text-xs text-muted-foreground">{row.source}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{formatINR(row.amount)}</p>
                          {row.refundedAmount > 0 && <p className="text-xs text-red-600">Refunded {formatINR(row.refundedAmount)}</p>}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={statusClass(row.status)}>{row.status}</Badge>
                          {row.gatewayStatus && <p className="mt-1 text-xs text-muted-foreground">Gateway: {row.gatewayStatus}</p>}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          <p>{row.expiresAt ? "Expires: " + formatDate(row.expiresAt) : "Created: " + formatDate(row.createdAt)}</p>
                          {row.settlementId && <p className="mt-1">Settlement: {row.settlementId}</p>}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {row.paymentId && (
                              <Button variant="outline" size="sm" onClick={() => void reconcile(row)} disabled={busy}>
                                <RefreshCw className={"h-3.5 w-3.5 mr-1 " + (actionKey === "reconcile-" + row.key ? "animate-spin" : "")} />Reconcile
                              </Button>
                            )}
                            {row.paymentId && remaining > 0 && ["captured", "paid", "active", "completed"].includes(row.status.toLowerCase()) && (
                              <Button variant="outline" size="sm" className="text-destructive" onClick={() => void refund(row)} disabled={busy}>
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />Refund
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><RotateCcw className="h-4 w-4" />Refund history</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {refunds.length === 0 ? <p className="text-sm text-muted-foreground">No refunds yet.</p> : refunds.slice(0, 8).map((refund) => (
                <div key={refund.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{formatINR(refund.amount)} · {refund.razorpay_refund_id}</p>
                    <p className="text-xs text-muted-foreground">{refund.razorpay_payment_id} · {formatDate(refund.created_at)}</p>
                  </div>
                  <Badge variant="outline" className={statusClass(String(refund.status || "unknown"))}>{refund.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="h-4 w-4" />Webhook activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {webhooks.length === 0 ? <p className="text-sm text-muted-foreground">No Razorpay webhook received yet.</p> : webhooks.slice(0, 8).map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{event.event_type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(event.received_at)}</p>
                  </div>
                  <Badge variant="outline" className={statusClass(String(event.status || "received"))}>{event.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Admin audit log</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {auditLogs.length === 0 ? <p className="text-sm text-muted-foreground">No admin payment actions yet.</p> : auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm">{String(log.action).replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{log.razorpay_payment_id || log.entity_id || "—"} · {formatDate(log.created_at)}</p>
                </div>
                {log.amount ? <span className="text-sm font-medium">{formatINR(log.amount)}</span> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Razorpay settlement, bank payout and gateway-level refund details remain available from the linked Razorpay Dashboard. This panel stores the reconciled status and audit trail without exposing secret keys.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
