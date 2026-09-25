import { useContext, useState } from "react";
import { useBranches } from "../hooks/use_branches";
import { refresh_after_order_change } from "../lib/query";
import { Eye, ChevronLeft, ChevronRight, Filter, X, Store } from "lucide-react";

import Header from "../components/header";
import { AppContext } from "../context/app_context";
import { useOrders } from "../hooks/use_orders";
import { StatusBadge } from "./badge";
import { OrderDetailModal } from "../components/_modal/order_detail_modal";
import { VoidModal } from "../components/_modal/void_modal";
import { RefundModal } from "../components/_modal/refund_modal";

export const OrderHistoryTable = ({ title = "Order History" }) => {
  const { userData } = useContext(AppContext);
  const canVoid = ["owner", "admin", "branch_manager"].includes(userData?.role);
  // Only org-wide roles can browse every branch's history and filter by branch.
  const canViewAllBranches = ["owner", "admin"].includes(userData?.role);

  const {
    orders,
    total,
    loading,
    error,
    filters,
    updateFilter,
    triggerRefresh,
  } = useOrders();

  const [detailOrder, setDetailOrder] = useState(null);
  const [voidOrder, setVoidOrder] = useState(null);
  const branches = useBranches({ enabled: canViewAllBranches });

  const currentPage = Math.floor(filters.skip / filters.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const colCount = canViewAllBranches ? 9 : 8;

  const [refundOrder, setRefundOrder] = useState(null);

  // The void response isn't populated, so keep the names we already have.
  const handleVoidSuccess = (updatedOrder) => {
    setDetailOrder({
      ...voidOrder,
      ...updatedOrder,
      branch: voidOrder?.branch,
      cashier: voidOrder?.cashier,
    });
    setVoidOrder(null);
    triggerRefresh();
    refresh_after_order_change();
  };

  const handleRefundSuccess = (updatedOrder) => {
    setRefundOrder(null);
    setDetailOrder(updatedOrder);
    triggerRefresh();
    refresh_after_order_change(); // dashboard, sales, stock and drawer update
  };

  return (
    <div className="relative w-full space-y-6 pt-3">
      <Header title={title} />

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} className="text-gray-400" />

          {canViewAllBranches && (
            <div className="flex items-center gap-2">
              <Store size={15} className="text-gray-400" />
              <select
                value={filters.branch}
                onChange={(e) => updateFilter("branch", e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="voided">Voided</option>
            <option value="partially_refunded">Partly refunded</option>
            <option value="refunded">Refunded</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter("from", e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter("to", e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {(filters.status || filters.from || filters.to || filters.branch) && (
            <button
              onClick={() => {
                updateFilter("status", "");
                updateFilter("from", "");
                updateFilter("to", "");
                updateFilter("branch", "");
              }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <X size={12} />
              Clear
            </button>
          )}

          <div className="ml-auto text-xs text-gray-400">
            {total} order{total !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Date</th>
              {canViewAllBranches && <th className="px-4 py-3">Branch</th>}
              <th className="px-4 py-3">Cashier</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Loading orders...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-8 text-center text-red-500"
                >
                  ⚠ {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const itemCount = o.items.reduce(
                  (sum, i) => sum + i.quantity,
                  0,
                );
                return (
                  <tr
                    key={o._id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {o.order_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(o.createdAt).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    {canViewAllBranches && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Store size={11} />
                          {o.branch?.name ?? "—"}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600">
                      {o.cashier?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{itemCount}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 tabular-nums">
                      ₱{o.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {o.payment.method}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setDetailOrder(o)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  updateFilter(
                    "skip",
                    Math.max(0, filters.skip - filters.limit),
                  )
                }
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() =>
                  updateFilter("skip", filters.skip + filters.limit)
                }
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderDetailModal
        open={!!detailOrder}
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        canVoid={canVoid}
        onVoid={(o) => {
          setVoidOrder(o);
          setDetailOrder(null);
        }}
        onRefund={(o) => setRefundOrder(o)}
      />

      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onSuccess={handleRefundSuccess}
        />
      )}

      <VoidModal
        open={!!voidOrder}
        order={voidOrder}
        onClose={() => setVoidOrder(null)}
        onSuccess={handleVoidSuccess}
      />
    </div>
  );
};
