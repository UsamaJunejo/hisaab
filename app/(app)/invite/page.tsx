import { requireUser } from "@/lib/auth";
import { Page } from "@/components/page";
import { COUNTRIES } from "@/lib/countries";
import { inviteAction } from "@/app/actions/settings";
import { CopyLink } from "@/components/copy-link";

export const metadata = { title: "Invite a Friend" };

export default async function Invite() {
  const u = await requireUser();
  return (
    <Page title="Invite a Friend" level={u.level} rail={{}}>
      <form action={inviteAction} className="card mb-4 max-w-2xl space-y-3 p-4 sm:p-5">
        <h2 className="text-sm font-bold tracking-wide">INVITE A FRIEND</h2>
        <input name="name" required placeholder="Enter User Name" className="input" />
        <input name="email" type="email" required placeholder="Enter Email" className="input" />
        <div className="grid grid-cols-2 gap-2">
          <select name="country" defaultValue={u.country} className="input" aria-label="Country">{COUNTRIES.map((c) => <option key={c[0]} value={c[0]}>{c[1]} ({c[2]})</option>)}</select>
          <input name="phone" placeholder="Enter Cell #" className="input" />
        </div>
        <div className="text-right"><button className="btn btn-green">Send</button></div>
      </form>
      <div className="card max-w-2xl space-y-2 p-4 text-sm">
        <p className="font-semibold">Earn 20% of every payment your friends make.</p>
        <p className="text-muted">When someone you invite signs up with your link and pays, 20% of what they pay goes into your Funds, for as long as they stay subscribed. Send them this link:</p>
        <CopyLink path={`/signup?ref=${u.customer_no}`} />
      </div>
    </Page>
  );
}
