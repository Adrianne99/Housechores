import React from "react";
import { H2, H3, H4, H5, H6, Paragraph } from "./texts";
import { TrendingUp } from "lucide-react"; // Added for visual flair

export const DashboardCard = ({ title, card_icon, sign }) => {
  return (
    <div className="bg-white w-full h-[180px] p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <H6 className="text-gray-500 font-medium uppercase tracking-wider">
            {title}
          </H6>
        </div>
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <TrendingUp size={20} />
          {card_icon}
        </div>
      </div>

      {/* Bottom Row: The Big Number */}
      <div className="flex items-center gap-2">
        <H3 className="text-slate-800 font-bold">{sign}</H3>
        <H2 className="font-bold text-slate-800">125,430.00</H2>
        {/* {gross_sales} */}
      </div>

      <div className="flex justify-start items-center">
        <Paragraph
          variant="muted"
          className={`text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full w-fit`}
        >
          +12.5%
        </Paragraph>
        <Paragraph variant="muted" className="px-2 py-0.5 rounded-full w-fit">
          Increased from last month
        </Paragraph>
      </div>
    </div>
  );
};

export const ChartCard = ({}) => {
  return (
    <div className="bg-white w-full h-[420px] p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex justify-between items-start">
          <H6 className="text-gray-500 font-medium uppercase tracking-wider">
            Sales Analytics
            {/* {dashboard_card_title} */}
          </H6>
        </div>
      </div>
    </div>
  );
};
