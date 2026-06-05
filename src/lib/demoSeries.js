import { format } from "date-fns";

function hashString(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let state = hashString(seed) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dayKey = (date) => format(date, "yyyy-MM-dd");

export function buildDemoSalesSeries({ days = 30, endDate = new Date() } = {}) {
  const series = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - i,
    );
    const random = createSeededRandom(`dashboard-sales:${dayKey(date)}`);
    const weekday = date.getDay();
    const weekendFactor = weekday === 0 ? 0.32 : weekday === 6 ? 0.78 : 1;
    const trend = 1 + ((days - i) / days) * 0.18;
    const noise = 0.78 + random() * 0.44;
    const amount = Math.round((2800 * weekendFactor * trend * noise) / 10) * 10;

    series.push({
      date: format(date, "dd/MM"),
      amount,
      fullDate: dayKey(date),
      isDemo: true,
    });
  }

  return series;
}

export function buildDemoDailySales({
  productId = "demo",
  days = 90,
  endDate = new Date(),
} = {}) {
  const productSeed = hashString(productId);
  const base = 3 + (productSeed % 9);
  const series = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate() - i,
      ),
    );
    const key = date.toISOString().slice(0, 10);
    const random = createSeededRandom(`product-sales:${productId}:${key}`);
    const weekday = date.getUTCDay();
    const weekendFactor = weekday === 0 ? 0.25 : weekday === 6 ? 0.7 : 1;
    const trend = 1 + ((days - i) / days) * 0.12;
    const noise = 0.7 + random() * 0.7;
    const quantity = Math.max(
      0,
      Math.round(base * weekendFactor * trend * noise),
    );

    series.push({ date, quantity });
  }

  return series;
}

export function buildDemoForecast({
  historical = [],
  productId = "demo",
  weeks = 4,
} = {}) {
  const values = historical.map((item) => Number(item.sales) || 0);
  const average = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 8;
  const middle = Math.max(1, Math.floor(values.length / 2));
  const firstHalf = values.slice(0, middle);
  const secondHalf = values.slice(middle);
  const firstAverage = firstHalf.length
    ? firstHalf.reduce((sum, value) => sum + value, 0) / firstHalf.length
    : average;
  const secondAverage = secondHalf.length
    ? secondHalf.reduce((sum, value) => sum + value, 0) / secondHalf.length
    : average;
  const trend = (secondAverage - firstAverage) / Math.max(1, values.length - 1);
  const random = createSeededRandom(`forecast:${productId}:${values.join(",")}`);
  const forecast = [];

  for (let i = 0; i < weeks; i++) {
    const season = 0.92 + random() * 0.16;
    const value = Math.max(
      0,
      Math.round((average + trend * (i + 1)) * season),
    );
    forecast.push(value);
  }

  return forecast;
}
