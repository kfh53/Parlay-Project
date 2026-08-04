"use server";

import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://parlay-project.vercel.app";

export async function requestPasswordReset(email: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !publishableKey || !adminKey) {
        throw new Error("Password reset is not configured");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminClient = createClient(supabaseUrl, adminKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    let page = 1;
    let accountExists = false;

    while (!accountExists) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });

        if (error) throw error;

        accountExists = data.users.some(user => user.email?.toLowerCase() === normalizedEmail);

        if (accountExists || data.users.length < 1000) break;
        page += 1;
    }

    if (!accountExists) return "not-found";

    const publicClient = createClient(supabaseUrl, publishableKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const { error } = await publicClient.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${siteUrl}/reset-password`
    });

    if (error) throw error;

    return "sent";
}
