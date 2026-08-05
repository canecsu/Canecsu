import { Check, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  price_type: string;
  duration?: string | null;
  deliverables?: string[] | null;
  add_ons?: any;
  [key: string]: any;
}

interface ServicePackagesProps {
  services: Service[];
  onSelect: (service: Service) => void;
  onRequestQuote: () => void;
  className?: string;
}

const tierConfig: Record<number, { label: string; accent: string; popular: boolean }> = {
  0: { label: "Basic", accent: "border-border/50", popular: false },
  1: { label: "Standard", accent: "border-primary ring-1 ring-primary/20", popular: true },
  2: { label: "Premium", accent: "border-secondary ring-1 ring-secondary/20", popular: false },
};

export function ServicePackages({ services, onSelect, onRequestQuote, className }: ServicePackagesProps) {
  if (services.length === 0) {
    return (
      <div className="bg-muted/30 rounded-2xl p-12 text-center border border-dashed border-border">
        <p className="text-muted-foreground text-sm mb-4">No packages listed yet.</p>
        <Button variant="outline" onClick={onRequestQuote} className="rounded-full">
          Request Custom Quote
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className={cn(
        "grid gap-5",
        services.length === 1 ? "grid-cols-1 max-w-md" :
        services.length === 2 ? "grid-cols-1 md:grid-cols-2" :
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {services.map((service, i) => {
          const tier = tierConfig[Math.min(i, 2)] || tierConfig[0];
          const deliverables = (service.deliverables as string[]) || [];
          const addOns = Array.isArray(service.add_ons) ? service.add_ons : [];

          return (
            <div
              key={service.id}
              className={cn(
                "relative bg-card rounded-2xl border-2 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-card-hover",
                tier.accent
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground border-none text-[10px] font-bold uppercase tracking-widest px-3">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{tier.label}</p>
                <h3 className="font-bold text-base mb-2">{service.title}</h3>
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>
                )}

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-extrabold">₹{service.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">/{service.price_type}</span>
                </div>

                {service.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.duration}</span>
                  </div>
                )}

                {deliverables.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {deliverables.map((d, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                )}

                {addOns.length > 0 && (
                  <div className="border-t border-border/50 pt-3 mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Add-ons</p>
                    {addOns.map((addon: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>+ {addon.name}</span>
                        <span className="font-medium">₹{addon.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className={cn(
                  "w-full mt-5 rounded-full font-bold uppercase tracking-wider text-xs h-11",
                  tier.popular ? "bg-primary hover:bg-primary/90" : ""
                )}
                variant={tier.popular ? "default" : "outline"}
                onClick={() => onSelect(service)}
              >
                Select Package
              </Button>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <Button variant="ghost" onClick={onRequestQuote} className="text-sm text-muted-foreground hover:text-foreground">
          Need something custom? <span className="underline ml-1">Request a quote</span>
        </Button>
      </div>
    </div>
  );
}
