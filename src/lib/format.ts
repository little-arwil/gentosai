export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function toDateInputValue(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const attendanceLabels = {
  PRESENT: "Hadir",
  SICK: "Sakit",
  PERMIT: "Izin",
  ABSENT: "Alpha",
  LATE: "Terlambat",
} as const;

export const paymentLabels = {
  UNPAID: "Belum Bayar",
  PARTIAL: "Cicilan",
  PAID: "Lunas",
  OVERDUE: "Tunggakan",
} as const;
