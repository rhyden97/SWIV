const BOB_CURRENCY = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
});

export function formatCurrencyBOB(value) {
  return BOB_CURRENCY.format(value || 0);
}

export function formatNumberBO(value) {
  return Number(value || 0).toLocaleString("es-BO");
}

export function formatDate(value, locale = "es-BO", options) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale, options);
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}
