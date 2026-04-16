export const StockBadge = ({ current, reorder }) => {
  const percentage = reorder > 0 ? Math.round((current / reorder) * 100) : 100;

  if (current <= 0)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
        Out of Stock
      </span>
    );

  if (current <= reorder)
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-orange-400"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
          Low Stock
        </span>
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-gray-200">
        <div className="h-1.5 rounded-full bg-green-500 w-full" />
      </div>
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
        In Stock
      </span>
    </div>
  );
};
