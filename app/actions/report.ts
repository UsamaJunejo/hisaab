"use server";

import { act, str } from "@/lib/act";
import { sendMail } from "@/lib/mail";

/** Share (email) a statement. Sends a link-free summary email; needs an email service (RESEND_API_KEY). */
export async function shareStatement(f: FormData) {
  const name = str(f, "name"), email = str(f, "email");
  await act(str(f, "back"), async (u) => {
    if (!name || !email) throw new Error("Please Enter Full Name and Email Address");
    const ok = await sendMail(email, `${u.name} shared a statement with you`,
      `<p>Dear ${name.replace(/</g, "")},</p><p>${u.name.replace(/</g, "")} has shared a statement with you from Hisaab.</p><p>Please ask them for the PDF copy if it is not attached.</p>`);
    if (!ok) throw new Error("Email is not set up on this server yet. Use PDF to save the statement and send it yourself.");
  }, "Email Has Been Sent Successfully.");
}
