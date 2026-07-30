"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function sendResetEmail() {
        setMessage("");
        setError("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "http://localhost:3000/reset-password",
        });

        if (error) {
            setError(error.message);
            return;
        }

        setMessage(
            "Password reset email sent. Check your inbox."
        );
    }

    return (
        <main>
            <h1>Reset Password</h1>

            <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <button onClick={sendResetEmail}>
                Send Reset Email
            </button>

            {message && <p>{message}</p>}
            {error && <p>{error}</p>}
        </main>
    );
}