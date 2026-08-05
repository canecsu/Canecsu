import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ShoppingBag } from "lucide-react";

interface Props {
  open: boolean;
  onSelect: (role: "client" | "creator") => void;
  onOpenChange?: (o: boolean) => void;
}

export function RoleSelectionModal({ open, onSelect, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-center">How will you use Canecsu?</DialogTitle>
          <DialogDescription className="text-center">
            Pick the option that fits you best — you can change this later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <button
            onClick={() => onSelect("client")}
            className="p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="font-bold text-lg">I'm a Client</div>
            <p className="text-sm text-muted-foreground mt-1">
              I want to discover and book talented creators.
            </p>
          </button>
          <button
            onClick={() => onSelect("creator")}
            className="p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
              <Camera className="h-6 w-6 text-purple-600" />
            </div>
            <div className="font-bold text-lg">I'm a Creator</div>
            <p className="text-sm text-muted-foreground mt-1">
              I want to showcase my work and get bookings.
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}