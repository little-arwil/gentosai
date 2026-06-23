export type DashboardSection =
  | "overview"
  | "input"
  | "operations"
  | "academics"
  | "finance"
  | "data"
  | "bk";

export const SECTIONS: { id: DashboardSection; label: string }[] = [
  { id: "overview", label: "Ringkasan" },
  { id: "input", label: "Input Data" },
  { id: "operations", label: "Operasional" },
  { id: "academics", label: "Akademik" },
  { id: "finance", label: "Keuangan" },
  { id: "data", label: "Data Master" },
  { id: "bk", label: "BK & Karakter" },
];
