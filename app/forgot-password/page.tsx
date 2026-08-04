"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function sendResetEmail(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        setError("");
        setIsSubmitting(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "https://parlay-project.vercel.app/update-password"
        });
        setIsSubmitting(false);

        if (error) {
            setError(error.message);
            return;
        }

        setMessage("If an account exists for that email, a password reset link has been sent.");
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#1d4ed8_0,_transparent_32%),radial-gradient(circle_at_bottom_right,_#0f766e_0,_transparent_28%)] opacity-60" />
            <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />

            <section className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white p-7 shadow-2xl shadow-black/30 sm:p-10">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-xl font-black text-white shadow-lg shadow-blue-500/30">
                        PT
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Parlay Tracker</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Reset your password</h1>
                    <p className="mt-2 text-sm text-slate-600">Enter your email and we&apos;ll send you a secure reset link.</p>
                </div>

                <form className="space-y-5" onSubmit={sendResetEmail}>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-800" htmlFor="email">Email address</label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    {message && (
                        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
                            {message}
                        </p>
                    )}

                    {error && (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? "Sending reset link…" : "Send reset link"}
                    </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-600">
                    Remembered your password?{" "}
                    <Link className="font-semibold text-blue-700 transition hover:text-blue-900 hover:underline" href="/login">
                        Back to sign in
                    </Link>
                </p>
            </section>
        </main>
    );
}
