import { Truck, Banknote, ShieldCheck, Headphones, RotateCcw } from "lucide-react";

export function TrustSignals() {
  const perks = [
    {
      icon: Truck,
      title: "Flat Delivery Rates",
      description: "Inside Dhaka ৳60 (24–48h) • Outside Dhaka ৳120 (64 districts)",
    },
    {
      icon: Banknote,
      title: "Cash on Delivery",
      description: "Pay cash at your doorstep nationwide or use instant Stripe payment",
    },
    {
      icon: ShieldCheck,
      title: "100% Authentic Brands",
      description: "Direct sourcing from Aarong, Yellow, Sailor, Apex, Bata & Anker",
    },
    {
      icon: RotateCcw,
      title: "7-Day Easy Returns",
      description: "Hassle-free replacement for defective or incorrectly sized products",
    },
  ];

  return (
    <section className="py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {perks.map((perk, idx) => {
          const Icon = perk.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-gray-200/80 hover:border-emerald-500/40 rounded-2xl sm:rounded-3xl p-5 shadow-xs hover:shadow-card-hover transition-all duration-300 flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-primary group-hover:text-white text-primary flex items-center justify-center shrink-0 transition-colors shadow-xs">
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {perk.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                  {perk.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
