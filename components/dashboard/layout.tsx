export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">

            <header className="
                bg-slate-900
                border-slate-800
                border-b
                p-4
            ">
                <h1 className="text-xl font-bold">
                    Parlay Tracker
                </h1>
            </header>


            <main className="
                max-w-5xl
                mx-auto
                p-6
            ">
                {children}
            </main>

        </div>
    )
}
