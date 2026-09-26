import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { get, queryClient, error_message } from "../lib/query";

// Suppliers and restock (purchase) orders, cached like the rest.
export const useSuppliers = ({ enabled = true } = {}) =>
  useQuery({ queryKey: ["suppliers"], queryFn: () => get("/api/suppliers"), enabled });

export const usePurchaseOrders = (statuses) =>
  useQuery({
    queryKey: ["purchase-orders", statuses ?? "all"],
    queryFn: () => get("/api/purchase-orders", statuses ? { status: statuses } : undefined),
    refetchInterval: 20_000, // pick up n8n's "sent" confirmation
  });

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
  queryClient.invalidateQueries({ queryKey: ["suppliers"] });
};

// Every action returns { ok, data?, message? } so screens can show errors.
const call = async (fn) => {
  try {
    const { data } = await fn();
    refresh();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, message: error_message(err), code: err.response?.data?.code };
  }
};

export const purchasing = {
  save_supplier: (id, body) =>
    call(() => (id ? axios.patch(`/api/suppliers/${id}`, body) : axios.post("/api/suppliers", body))),
  remove_supplier: (id) => call(() => axios.delete(`/api/suppliers/${id}`)),
  create_order: (body) => call(() => axios.post("/api/purchase-orders", body)),
  add_item: (inventory_id, quantity) =>
    call(() => axios.post("/api/purchase-orders/add-item", { inventory_id, quantity })),
  update_order: (id, body) => call(() => axios.patch(`/api/purchase-orders/${id}`, body)),
  approve: (id) => call(() => axios.post(`/api/purchase-orders/${id}/approve`)),
  resend: (id) => call(() => axios.post(`/api/purchase-orders/${id}/resend`)),
  cancel: (id) => call(() => axios.post(`/api/purchase-orders/${id}/cancel`)),
  // body: { status: "confirmed" | "declined", expected_delivery_date?, note? }
  reply: (id, body) => call(() => axios.post(`/api/purchase-orders/${id}/reply`, body)),
  add_low_stock: () => call(() => axios.post("/api/purchase-orders/add-low-stock")),
};
