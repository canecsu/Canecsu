import { BadgeCheck, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VerificationDetailsDialogProps {
  className?: string;
}

export function VerificationDetailsDialog({ className }: VerificationDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full text-muted-foreground hover:text-foreground", className)}
          aria-label="See verification details"
          title="See verification details"
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BadgeCheck className="h-5 w-5 text-amber-500" />
            ₹99 CANECSU Verified Creator review
          </DialogTitle>
          <DialogDescription>
            Read what the platform badge includes before you submit your application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <p className="font-bold">₹99 application/review fee</p>
            <p className="mt-1 text-amber-900/80">
              If activated, the CANECSU platform badge stays active for 12 months from activation. The fee is per application or renewal.
            </p>
          </div>

          <section>
            <h3 className="mb-2 font-bold text-foreground">What you receive</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />A visible CANECSU Verified Creator badge on eligible creator surfaces.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />Up to 5 points in the transparent 100-point ranking model.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />A clearer trust signal for clients while they compare creators.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-muted/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-foreground">
              <ShieldAlert className="h-4 w-4 text-amber-600" /> What this badge does not mean
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              It is a CANECSU platform badge—not a government certificate, legal identity proof, or professional licence. It does not guarantee a creator&apos;s work, bookings, income, top ranking, or a specific client outcome.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-foreground">Before you apply</h3>
            <p className="leading-relaxed text-muted-foreground">
              Keep your name, category, city, bio, pricing, availability, and portfolio up to date. Pay only through the Razorpay checkout opened by CANECSU. If payment succeeds but the badge does not activate, keep your payment ID and contact support.
            </p>
          </section>

          <Button variant="outline" className="w-full rounded-xl" asChild>
            <Link to="/verification-terms">View full Verification Terms</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

