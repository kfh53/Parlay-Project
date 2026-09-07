import { timingSafeEqual } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { createReminderStore } from "@/lib/pick-reminder-store";
import { runPickReminders } from "@/lib/pick-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return Response.json({ error: "Reminder cron is not configured." }, { status: 503 });
    const expected = Buffer.from(`Bearer ${secret}`);
    const supplied = Buffer.from(request.headers.get("authorization") ?? "");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
    if (!dryRun && process.env.PICK_REMINDERS_ENABLED !== "true") {
        return Response.json({ enabled: false });
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const appUrl = process.env.APP_URL;
    if (!appUrl || (!dryRun && (!apiKey || !from))) {
        return Response.json({ error: "Reminder email configuration is missing." }, { status: 503 });
    }
    try {
        const url = new URL(appUrl);
        if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid APP_URL");
        let lastSendAt = 0;
        const summary = await runPickReminders({
            store: createReminderStore(), from: from ?? "", appUrl, dryRun,
            async send(payload, key) {
                // Pace the small group instead of bursting against provider rate limits.
                await delay(Math.max(0, 600 - (Date.now() - lastSendAt)));
                lastSendAt = Date.now();
                const response = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": key },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10_000)
                });
                const result = await response.json().catch(() => ({})) as { id?: string };
                if (!response.ok || !result.id) throw new Error(`Email provider returned ${response.status}`);
                return result.id;
            }
        });
        return Response.json(summary, { status: summary.failed ? 503 : 200 });
    } catch (error) {
        console.error("Pick reminder job failed:", error instanceof Error ? error.message : "Database request failed");
        return Response.json({ error: "Reminder job failed." }, { status: 503 });
    }
}

export const POST = GET;
