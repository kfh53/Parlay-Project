export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-100 text-gray-900">

            <header className="bg-white border-b p-4">
                <h1 className="text-xl font-bold">
                    Parlay Tracker
                </h1>
            </header>

            <main className="max-w-5xl mx-auto p-6">
                {children}
            </main>

        </div>
    );
}