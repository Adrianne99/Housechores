// Thermal receipt (58 mm / 80 mm) built as plain HTML and printed from a
// hidden frame, so only the receipt prints — sized to the paper roll.

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const money = (n) => Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const METHOD = { cash: "Cash", gcash: "GCash", card: "Card" };

// Lines for both the on-screen and printed receipt.
export const receipt_lines = (order, settings) => {
  const s = settings ?? {};
  const vat_registered = s.vat_registered !== false;
  const total = order.total ?? 0;
  const vat = order.vat_amount ?? 0;
  return {
    store: s.store_name || order.branch?.name || "Store",
    branch: s.store_name ? order.branch?.name : "",
    address: order.branch?.address || s.address || "",
    phone: s.phone || "",
    tin: s.tin ? `${vat_registered ? "VAT Reg" : "NON-VAT Reg"} TIN: ${s.tin}` : "",
    logo: /^https:\/\//.test(s.logo_url ?? "") ? s.logo_url : "",
    footer: s.receipt_footer || "Thank you for your purchase!",
    vat_rows: vat_registered
      ? order.vat_exempt
        ? [["VAT-exempt sales", total], ["VAT 12%", 0]]
        : [["VATable sales", Math.round((total - vat) * 100) / 100], ["VAT 12%", vat]]
      : [],
    method: METHOD[order.payment?.method] ?? order.payment?.method,
  };
};

export const receipt_html = (order, settings) => {
  const r = receipt_lines(order, settings);
  const width = settings?.paper_width === "80" ? 80 : 58;
  const date = new Date(order.offline_sold_at ?? order.createdAt ?? Date.now()).toLocaleString("en-PH");
  const row = (l, v, cls = "") => `<div class="row ${cls}"><span>${l}</span><span>${v}</span></div>`;
  const items = (order.items ?? [])
    .map(
      (i) =>
        `<div class="item">${esc(i.product_snapshot?.name)}</div>${row(`&nbsp;&nbsp;${i.quantity} × ${money(i.unit_price)}`, money(i.subtotal))}`,
    )
    .join("");
  const p = order.payment ?? {};
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(order.order_number)}</title>
<style>
  @page { size: ${width}mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 3mm ${width === 80 ? 4 : 2}mm; width: ${width}mm; font: ${width === 80 ? 12 : 10.5}px/1.35 "Courier New", monospace; color: #000; }
  .c { text-align: center; } .b { font-weight: 700; } .big { font-size: 1.35em; }
  .row { display: flex; justify-content: space-between; gap: 6px; } .row span:last-child { white-space: nowrap; }
  .hr { border-top: 1px dashed #000; margin: 4px 0; } .item { margin-top: 2px; }
  img { max-width: 60%; max-height: 18mm; display: block; margin: 0 auto 2px; }
</style></head><body>
${r.logo ? `<img src="${esc(r.logo)}" alt="">` : ""}
<div class="c b big">${esc(r.store)}</div>
${r.branch ? `<div class="c">${esc(r.branch)}</div>` : ""}
${r.address ? `<div class="c">${esc(r.address)}</div>` : ""}
${r.phone ? `<div class="c">${esc(r.phone)}</div>` : ""}
${r.tin ? `<div class="c">${esc(r.tin)}</div>` : ""}
<div class="hr"></div>
${row("No.", esc(order.order_number))}
${row("Date", esc(date))}
${row("Cashier", esc(order.cashier?.name ?? ""))}
<div class="hr"></div>
${items}
<div class="hr"></div>
${row("Subtotal", money(order.subtotal))}
${order.discount_amount > 0 ? row(order.discount?.type === "senior" ? "Senior disc." : order.discount?.type === "pwd" ? "PWD disc." : "Discount", `-${money(order.discount_amount)}`) : ""}
${row("TOTAL", money(order.total), "b big")}
${r.vat_rows.map(([l, v]) => row(l, money(v))).join("")}
${order.discount?.id_number ? row(order.discount.type === "pwd" ? "PWD ID" : "SC ID", esc(order.discount.id_number)) : ""}
<div class="hr"></div>
${row("Paid by", esc(r.method))}
${p.method === "cash" ? row("Cash", money(p.amount_tendered)) + row("Change", money(p.change), "b") : ""}
${p.reference ? row("Ref", esc(p.reference)) : ""}
<div class="hr"></div>
<div class="c">${esc(r.footer)}</div>
${order.offline ? `<div class="c b">SAVED OFFLINE — PENDING SYNC</div>` : ""}
<div class="c" style="margin-top:3px">THIS IS NOT AN OFFICIAL RECEIPT</div>
</body></html>`;
};

export const print_receipt = (order, settings) => {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(receipt_html(order, settings));
  doc.close();
  const go = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 1000);
  };
  // Wait for a logo to load before printing.
  const img = doc.querySelector("img");
  if (img && !img.complete) img.onload = img.onerror = go;
  else setTimeout(go, 50);
};
