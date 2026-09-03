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
    <section className="py-8 my-8 bg-gray-50 border border-gray-100 rounded-3xl p-6 sm:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {perks.map((perk, idx) => {
          const Icon = perk.icon;
          return (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-center text-primary shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">{perk.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{perk.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
