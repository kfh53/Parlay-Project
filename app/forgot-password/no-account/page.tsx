import Link from "next/link";

export default function NoAccountPage() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#1d4ed8_0,_transparent_32%),radial-gradient(circle_at_bottom_right,_#0f766e_0,_transparent_28%)] opacity-60" />
            <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />

            <section className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white p-7 text-center shadow-2xl shadow-black/30 sm:p-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl font-bold text-amber-700">!</div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Parlay Tracker</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Account not found</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                    We couldn&apos;t find an account with that email address. Check the spelling or contact the league administrator for access.
                </p>
                <Link className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200" href="/forgot-password">
                    Try another email
                </Link>
                <Link className="mt-4 inline-block text-sm font-semibold text-blue-700 transition hover:text-blue-900 hover:underline" href="/login">
                    Back to sign in
                </Link>
            </section>
        </main>
    );
}
