import { EMPTY } from "../lib/config.js";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function dateFromISO(iso) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(iso, options = { day: "numeric", month: "short" }) {
  const date = dateFromISO(iso);
  return date ? date.toLocaleDateString("es-MX", options) : EMPTY;
}

export function formatHours(minutes) {
  const value = Number(minutes || 0);
  return `${(value / 60).toFixed(value % 60 ? 1 : 0)} h`;
}

export function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const diff = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return Math.max(0, diff);
}

export function daysUntil(iso) {
  const date = dateFromISO(iso);
  if (!date) return Infinity;
  const start = dateFromISO(todayISO());
  return Math.ceil((date - start) / 86400000);
}
