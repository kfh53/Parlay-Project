import DashboardTabs from "@/components/DashboardTabs";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">

            <header className="border-b border-slate-800 bg-slate-900">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 p-4">
                    <h1 className="text-xl font-bold text-slate-100">
                        Parlay Tracker
                    </h1>
                    <DashboardTabs isGuest={!user} />
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6">
                {children}
            </main>

        </div>
    );
}
