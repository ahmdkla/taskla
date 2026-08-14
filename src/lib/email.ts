import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "Taskla <onboarding@resend.dev>";

export function emailEnabled() {
  return Boolean(apiKey);
}

export function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

type SendArgs = { to: string; subject: string; html: string };

/**
 * Sends an email if Resend is configured. Returns false (without throwing)
 * when it isn't, so features degrade instead of breaking — a password reset
 * request still reports generic success, it just won't deliver.
 */
export async function sendEmail({ to, subject, html }: SendArgs) {
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[email] send failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send threw:", error);
    return false;
  }
}

export function layoutEmail(heading: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fafafa;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#09090b;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;">
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#2563eb;">Taskla</p>
      <h1 style="margin:0 0 12px;font-size:18px;font-weight:600;">${heading}</h1>
      ${bodyHtml}
    </div>
    <p style="max-width:520px;margin:12px auto 0;font-size:12px;color:#52525b;">Sent by Taskla</p>
  </body>
</html>`;
}
