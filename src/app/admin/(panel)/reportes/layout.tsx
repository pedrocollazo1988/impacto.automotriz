import { requirePage } from "@/lib/auth";
export default async function L({ children }: { children: React.ReactNode }) { await requirePage("reports"); return <>{children}</>; }
