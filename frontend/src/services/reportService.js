import request from "./api.js";

export const getSummary = () => request("/reports/summary");
export const getDaily = (date) => request("/reports/sales/daily", { params: { date } });
export const getMonthly = (month, year) => request("/reports/sales/monthly", { params: { month, year } });
export const getSales = (start_date, end_date) => request("/reports/sales", { params: { start_date, end_date } });
export const getBestSellers = (limit, start_date, end_date) =>
  request("/reports/best-sellers", { params: { limit, start_date, end_date } });
export const getSalesByCategory = (start_date, end_date) =>
  request("/reports/sales-by-category", { params: { start_date, end_date } });

// Mengunduh file PDF/Excel dari backend, lalu memicu download di browser.
export async function exportReport(format, start_date, end_date) {
  const blob = await request("/reports/export", { params: { format, start_date, end_date }, blob: true });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `laporan-${start_date}-${end_date}.${format}`;
  link.click();
  URL.revokeObjectURL(link.href);
}
