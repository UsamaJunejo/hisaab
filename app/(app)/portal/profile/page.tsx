import { requireUser } from "@/lib/auth";
import { Page } from "@/components/page";
import { PortalNav } from "@/components/portal-nav";
import { COUNTRIES } from "@/lib/countries";
import { changePasswordAction, savePhotoAction, saveProfileAction, setMpinAction } from "@/app/actions/settings";

export const metadata = { title: "Profile" };

export default async function Profile() {
  const u = await requireUser();
  const initials = u.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
  return (
    <Page title="Profile" level={u.level} rail={{}}>
      <PortalNav />
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <form action={savePhotoAction} className="card flex flex-col items-center gap-3 p-5 text-center">
          <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-navy text-3xl font-bold text-white">{u.photo_v ? <img src={`/api/photo?v=${u.photo_v}`} alt="" className="h-full w-full object-cover" /> : initials}</div>
          <p className="font-semibold">{u.name}</p><p className="text-sm text-muted">{u.email}</p>
          <p className="num text-xs tracking-[0.3em] text-muted">{u.customer_no.split("").join(" ")}</p>
          <input type="file" name="photo" accept="image/*" className="text-xs" aria-label="Profile picture" />
          <div className="flex gap-2"><button className="btn btn-blue h-9 min-h-0">Upload</button>{u.photo_v && <button name="remove" value="1" className="btn btn-red h-9 min-h-0">Remove</button>}</div>
        </form>
        <div className="space-y-4">
          <form action={saveProfileAction} className="card grid gap-3 p-5 sm:grid-cols-2">
            <h2 className="text-sm font-bold tracking-wide sm:col-span-2">EDIT PROFILE</h2>
            <label className="text-sm font-semibold">Full Name<input name="name" required defaultValue={u.name} className="input mt-1" /></label>
            <label className="text-sm font-semibold">Email<input name="email" type="email" required defaultValue={u.email} className="input mt-1" /></label>
            <label className="text-sm font-semibold">Country<select name="country" defaultValue={u.country} className="input mt-1">{COUNTRIES.map((c) => <option key={c[0]} value={c[0]}>{c[1]} ({c[2]})</option>)}</select></label>
            <label className="text-sm font-semibold">Cell #<input name="phone" defaultValue={u.phone ?? ""} className="input mt-1" /></label>
            <label className="text-sm font-semibold">Date Of Birth<input name="dob" type="date" defaultValue={u.dob ?? ""} className="input mt-1" /></label>
            <fieldset className="text-sm sm:col-span-2"><legend className="mb-1 font-semibold">Others can find me in SHARE ACCOUNT by:</legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" name="show_name" defaultChecked={u.show_name} /> Name</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="show_email" defaultChecked={u.show_email} /> Email</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="show_phone" defaultChecked={u.show_phone} /> Cell number</label>
              </div></fieldset>
            <div className="text-right sm:col-span-2"><button className="btn btn-green">Update</button></div>
          </form>
          <div className="grid gap-4 md:grid-cols-2">
            <form action={changePasswordAction} className="card space-y-3 p-5">
              <h2 className="text-sm font-bold tracking-wide">CHANGE PASSWORD</h2>
              <input name="current" type="password" required placeholder="Current Password" autoComplete="current-password" className="input" />
              <input name="password" type="password" required minLength={6} placeholder="Enter Password" autoComplete="new-password" className="input" />
              <input name="password2" type="password" required placeholder="Confirm Password" autoComplete="new-password" className="input" />
              <div className="text-right"><button className="btn btn-green">Update</button></div>
            </form>
            <form action={setMpinAction} className="card space-y-3 p-5">
              <h2 className="text-sm font-bold tracking-wide">M-PIN {u.has_mpin && <span className="text-green">(set)</span>}</h2>
              <p className="text-xs text-muted">A 4 digit PIN asked when you add or transfer Funds.</p>
              <input name="mpin" type="password" inputMode="numeric" maxLength={4} required placeholder="Enter 4 Digit MPIN" className="input" />
              <input name="mpin2" type="password" inputMode="numeric" maxLength={4} required placeholder="Confirm MPIN" className="input" />
              <div className="text-right"><button className="btn btn-green">Save</button></div>
            </form>
          </div>
        </div>
      </div>
    </Page>
  );
}
