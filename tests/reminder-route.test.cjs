const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTs } = require("./load-ts.cjs");

test("cron auth, disabled mode, and dry-run dispatch", async t => {
    const names = ["CRON_SECRET", "PICK_REMINDERS_ENABLED", "APP_URL", "RESEND_API_KEY", "EMAIL_FROM"];
    const old = Object.fromEntries(names.map(name => [name, process.env[name]]));
    t.after(() => { for (const name of names) { if (old[name] === undefined) delete process.env[name]; else process.env[name] = old[name]; } });
    let calls = 0;
    const route = loadTs("app/api/cron/pick-reminders/route.ts", {
        "@/lib/pick-reminder-store": { createReminderStore: () => ({}) },
        "@/lib/pick-reminders": { runPickReminders: async options => { calls++; return { dryRun: options.dryRun, failed: 0 }; } }
    });
    const request = (key = "test-secret", query = "") => new Request("https://example.com/api/cron/pick-reminders" + query, {
        headers: { authorization: "Bearer " + key }
    });
    delete process.env.CRON_SECRET;
    assert.equal((await route.GET(request())).status, 503);
    process.env.CRON_SECRET = "test-secret";
    assert.equal((await route.GET(request("wrong"))).status, 401);
    delete process.env.PICK_REMINDERS_ENABLED;
    assert.deepEqual(await (await route.GET(request())).json(), { enabled: false });
    assert.equal(calls, 0);
    process.env.APP_URL = "https://example.com";
    const dry = await route.GET(request("test-secret", "?dryRun=true"));
    assert.deepEqual(await dry.json(), { dryRun: true, failed: 0 });
    process.env.PICK_REMINDERS_ENABLED = "true";
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    assert.equal((await route.POST(request())).status, 503);
});
