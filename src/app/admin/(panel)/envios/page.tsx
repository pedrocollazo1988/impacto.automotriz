import ZoneRulesEditor from "@/components/ZoneRulesEditor";
// Proteger con el middleware/proxy de autenticación del núcleo (solo ADMIN).
export default function Page() { return <main className="mx-auto max-w-5xl p-6"><h1 className="mb-4 text-2xl font-bold">Entregas y zonas</h1><ZoneRulesEditor /></main>; }
