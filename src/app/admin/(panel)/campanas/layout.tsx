import { requirePage } from "@/lib/auth";
export default async function L({ children }: { children: React.ReactNode }) { await requirePage("email"); return <>{children}</>; }
