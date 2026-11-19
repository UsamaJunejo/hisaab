import "server-only";

/**
 * Sends an email through Resend when RESEND_API_KEY is set (MAIL_FROM optional).
 * Returns false when no email service is configured, so the screen can say so.
 */
export async function sendMail(to: string, subject: string, html: string, attachment?: { filename: string; content: Buffer }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Hisaab <noreply@hisaab.app>",
      to,
      subject,
      html,
      attachments: attachment ? [{ filename: attachment.filename, content: attachment.content.toString("base64") }] : undefined,
    }),
  });
  return res.ok;
}
