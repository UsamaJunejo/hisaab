import { requireUser } from "@/lib/auth";
import { Page } from "@/components/page";
import { reportIssueAction } from "@/app/actions/settings";

export const metadata = { title: "Report an Issue" };

export default async function Issue() {
  const u = await requireUser();
  return (
    <Page title="Report an Issue" level={u.level} rail={{}}>
      <form action={reportIssueAction} className="card max-w-2xl space-y-3 p-5">
        <h2 className="text-sm font-bold tracking-wide">REPORT AN ISSUE</h2>
        <textarea name="message" required rows={6} placeholder="Please enter your issue here." className="input" />
        <div className="text-right"><button className="btn btn-green">Send</button></div>
      </form>
    </Page>
  );
}
