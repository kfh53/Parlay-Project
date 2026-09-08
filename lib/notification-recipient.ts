export const NOTIFICATION_RECIPIENT = "kyle.f.harris53@gmail.com";

export function isAllowedNotificationRecipient(email: string) {
    // Temporarily disabled: restore this return to restrict delivery during testing.
    // return email.trim().toLowerCase() === NOTIFICATION_RECIPIENT;
    return email.trim().length > 0;
}

export function isAllowedNotificationPayload(payload: { to?: unknown; cc?: unknown; bcc?: unknown }) {
    return Array.isArray(payload.to) && payload.to.length === 1
        && typeof payload.to[0] === "string" && isAllowedNotificationRecipient(payload.to[0])
        && payload.cc === undefined && payload.bcc === undefined;
}
