import ResetForm from "./ResetForm";
export const metadata = { title: "Restablecer contraseña", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) { return <ResetForm token={(await searchParams).token ?? ""} />; }
