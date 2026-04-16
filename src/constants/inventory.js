import {
  ArrowDownAZ,
  Funnel,
  ArrowDown10,
  ArrowDown01,
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  Plus,
  ArrowUp,
} from "lucide-react";

export const FILTER_OPTIONS = [
  { label: "Latest", value: "default", Icon: ArrowUp },
  { label: "Alphabetical", value: "alphabetical", Icon: ArrowDownAZ },
  { label: "Lowest Quantity", value: "qty_asc", Icon: ArrowDownNarrowWide },
  { label: "Highest Quantity", value: "qty_desc", Icon: ArrowDownWideNarrow },
  { label: "Lowest Price", value: "price_asc", Icon: ArrowDown01 },
  { label: "Highest Price", value: "price_desc", Icon: ArrowDown10 },
];
