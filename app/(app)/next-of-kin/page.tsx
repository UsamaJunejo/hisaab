import { requireUser } from "@/lib/auth";
import { Page } from "@/components/page";
import { saveNokAction } from "@/app/actions/settings";

export const metadata = { title: "Next to Kin" };

export default async function Nok() {
  const u = await requireUser();
  return (
    <Page title="Next to Kin Data" level={u.level} rail={{}}>
      <form action={saveNokAction} className="card max-w-3xl space-y-3 p-4 sm:p-5">
        <label className="field"><span className="field-label">Name</span><input name="name" defaultValue={u.nok_name ?? ""} placeholder="Name" className="field-input" /></label>
        <label className="field"><span className="field-label">Email</span><input name="email" type="email" defaultValue={u.nok_email ?? ""} placeholder="Email" className="field-input" /></label>
        <label className="field"><span className="field-label">Contact No.</span><input name="phone" defaultValue={u.nok_phone ?? ""} placeholder="Contact No." className="field-input" /></label>
        <fieldset className="rounded-xl border border-line p-4">
          <legend className="px-1 text-sm font-bold tracking-wide">AUTO REPLY</legend>
          <p className="mb-3 text-sm">If you do not use Hisaab, then Hisaab should send a notification to the nominee according to the schedule below.</p>
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            {[[90, "3 Months (90 Days)"], [180, "6 Months (180 Days)"], [365, "12 Months (365 Days)"]].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2"><input type="radio" name="after" value={v} defaultChecked={(u.nok_after_days ?? 180) === v} /> {l}</label>
            ))}
          </div>
          <p className="flex flex-wrap items-center gap-2 text-sm">Send email to the nominee in an interval of
            <input name="interval" type="number" min={1} max={60} defaultValue={u.nok_interval_days ?? 7} className="input w-20" aria-label="Days" /> days, and
            <input name="times" type="number" min={1} max={10} defaultValue={u.nok_times ?? 3} className="input w-20" aria-label="Times" /> times.</p>
        </fieldset>
        <p className="rounded-lg bg-red-soft p-3 text-sm text-red">If no reply is received, the account will be closed. (In case of closure of account, data will be deleted and no backup will be provided.)</p>
        <div className="text-right"><button className="btn btn-green">Edit</button></div>
      </form>
    </Page>
  );
}
