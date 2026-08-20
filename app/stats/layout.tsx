import DashboardTabs from "@/components/DashboardTabs";

export default function StatsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <header className="border-b border-slate-800 bg-slate-900">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
                    <h1 className="text-xl font-bold text-slate-100">
                        Parlay Tracker
                    </h1>
                    <DashboardTabs />
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6">
                {children}
            </main>
        </div>
    );
}
