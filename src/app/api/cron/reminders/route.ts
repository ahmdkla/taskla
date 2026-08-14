import { NextResponse } from "next/server";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { sendEmail, layoutEmail, appUrl, emailEnabled } from "@/lib/email";

// Vercel functions run in UTC, but the digest should describe "today" in the
// user's day (WIB, UTC+7) — otherwise early-morning tasks land in the wrong bucket.
const TZ_OFFSET_HOURS = 7;

function wibDayWindow(now: Date) {
  const shifted = new Date(now.getTime() + TZ_OFFSET_HOURS * 3600_000);
  const startShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );
  const startUtc = new Date(startShifted - TZ_OFFSET_HOURS * 3600_000);
  const endUtc = new Date(startUtc.getTime() + 24 * 3600_000);
  return { startUtc, endUtc };
}

function listHtml(
  heading: string,
  color: string,
  tasks: { title: string; dueDate: Date | null }[]
) {
  if (tasks.length === 0) return "";
  const items = tasks
    .map(
      (t) =>
        `<li style="margin:0 0 6px;font-size:14px;">${t.title}${
          t.dueDate
            ? ` <span style="color:#52525b;font-size:12px;">— ${format(t.dueDate, "MMM d")}</span>`
            : ""
        }</li>`
    )
    .join("");
  return `<p style="margin:16px 0 6px;font-size:13px;font-weight:600;color:${color};">${heading} (${tasks.length})</p>
          <ul style="margin:0;padding-left:18px;">${items}</ul>`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!emailEnabled()) {
    return NextResponse.json({ skipped: "RESEND_API_KEY not configured" });
  }

  const now = new Date();
  const { startUtc, endUtc } = wibDayWindow(now);

  const users = await db.user.findMany({
    select: { id: true, email: true, name: true },
  });

  let sent = 0;

  for (const user of users) {
    const [overdue, dueToday] = await Promise.all([
      db.task.findMany({
        where: {
          userId: user.id,
          status: { not: "done" },
          dueDate: { lt: startUtc },
        },
        select: { title: true, dueDate: true },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      db.task.findMany({
        where: {
          userId: user.id,
          status: { not: "done" },
          dueDate: { gte: startUtc, lt: endUtc },
        },
        select: { title: true, dueDate: true },
        orderBy: { priority: "desc" },
        take: 20,
      }),
    ]);

    if (overdue.length === 0 && dueToday.length === 0) continue;

    const ok = await sendEmail({
      to: user.email,
      subject:
        overdue.length > 0
          ? `${overdue.length} overdue · ${dueToday.length} due today`
          : `${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due today`,
      html: layoutEmail(
        `Good morning, ${user.name.split(" ")[0]}`,
        `<p style="margin:0;font-size:14px;line-height:1.6;">Here's what needs your attention today.</p>
         ${listHtml("Overdue", "#dc2626", overdue)}
         ${listHtml("Due today", "#2563eb", dueToday)}
         <p style="margin:20px 0 0;"><a href="${appUrl()}/overview" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">Open Taskla</a></p>`
      ),
    });

    if (ok) sent += 1;
  }

  return NextResponse.json({ users: users.length, sent });
}
