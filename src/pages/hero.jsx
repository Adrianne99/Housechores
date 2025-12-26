import React from "react";
import { StickyNote, Wallet, Beef, Dumbbell, Bot } from "lucide-react";

const feature_items = [StickyNote, Wallet, Beef, Dumbbell, Bot];

const MarqueeRow = ({ reverse }) => {
  const displayItems = [...feature_items, ...feature_items, ...feature_items];

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className={`flex w-max ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {displayItems.map((Icon) => (
          <div key={Icon} className="pr-12 shrink-0">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm text-primary">
              <Icon size={48} strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Hero = () => {
  return (
    <section className="relative w-full h-full bg-white py-24 overflow-x-hidden">
      <div className="max-w-[1440px] w-full h-full mx-auto flex justify-center items-center">
        <div className="relative inset-0 z-0 flex flex-col justify-center gap-4 opacity-20  scale-125 pointer-events-none">
          <MarqueeRow />
          <MarqueeRow reverse />
        </div>
      </div>
    </section>
  );
};

export default Hero;
