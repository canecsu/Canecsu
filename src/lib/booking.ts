import {
  Clock, CheckCircle2, XCircle, CreditCard, Wallet, Hammer, Hourglass, Trophy, Ban,
} from "lucide-react";

export type BookingStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "advance_pending"
  | "advance_paid"
  | "work_in_progress"
  | "work_completed"
  | "final_pending"
  | "completed"
  | "cancelled"
  // legacy
  | "pending" | "confirmed";

export const STATUS_META: Record<string, { label: string; icon: any; tone: string }> = {
  requested:        { label: "Requested",         icon: Clock,        tone: "bg-amber-100 text-amber-700 border-amber-200" },
  pending:          { label: "Requested",         icon: Clock,        tone: "bg-amber-100 text-amber-700 border-amber-200" },
  approved:         { label: "Approved",          icon: CheckCircle2, tone: "bg-blue-100 text-blue-700 border-blue-200" },
  rejected:         { label: "Rejected",          icon: XCircle,      tone: "bg-red-100 text-red-700 border-red-200" },
  advance_pending:  { label: "Advance Pending",   icon: CreditCard,   tone: "bg-orange-100 text-orange-700 border-orange-200" },
  advance_paid:     { label: "Advance Paid",      icon: Wallet,       tone: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  work_in_progress: { label: "Work In Progress",  icon: Hammer,       tone: "bg-violet-100 text-violet-700 border-violet-200" },
  confirmed:        { label: "Work In Progress",  icon: Hammer,       tone: "bg-violet-100 text-violet-700 border-violet-200" },
  work_completed:   { label: "Work Completed",    icon: CheckCircle2, tone: "bg-teal-100 text-teal-700 border-teal-200" },
  final_pending:    { label: "Final Payment Due", icon: Hourglass,    tone: "bg-orange-100 text-orange-700 border-orange-200" },
  completed:        { label: "Completed",         icon: Trophy,       tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled:        { label: "Cancelled",         icon: Ban,          tone: "bg-gray-100 text-gray-600 border-gray-200" },
};

export const STAGES: BookingStatus[] = [
  "requested", "approved", "advance_paid", "work_in_progress", "work_completed", "completed",
];

export function stageIndex(status: string): number {
  const map: Record<string, number> = {
    requested: 0, pending: 0,
    approved: 1, advance_pending: 1,
    advance_paid: 2,
    work_in_progress: 3, confirmed: 3,
    work_completed: 4, final_pending: 4,
    completed: 5,
    rejected: -1, cancelled: -1,
  };
  return map[status] ?? 0;
}

export function computeAmounts(totalPrice: number) {
  const platform_fee = Math.round(totalPrice * 0.1);
  const grand_total = totalPrice + platform_fee;
  const advance_amount = Math.ceil(grand_total / 2);
  const final_amount = grand_total - advance_amount;
  return { platform_fee, grand_total, advance_amount, final_amount };
}