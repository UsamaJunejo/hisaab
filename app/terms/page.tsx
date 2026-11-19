import Link from "next/link";

export const metadata = { title: "Terms of Use" };

export default function Terms() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[0.95rem] leading-relaxed">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xl font-bold"><img src="/logo.svg" alt="" className="h-8 w-8" />hisaab<span className="text-orange">.app</span></Link>
      <h1 className="page-title mb-4">Terms of Use</h1>
      <ol className="list-decimal space-y-3 pl-5">
        <li>Hisaab is a tool for keeping your own accounts. You are responsible for what you enter and for checking your figures.</li>
        <li>Your data belongs to you. You can download it any time (Settings &gt; Download Data) and reset or close your account.</li>
        <li>When you share an account, the people you share with can see it (and, with Read &amp; Write, add entries you then approve). Remove sharing any time.</li>
        <li>The free plan lasts 14 days with 25 MB. Paid plans are USD 1 a month or USD 10 a year with 100 MB. When a plan ends or the space is used up, you can still see your books, but you can&apos;t add entries, open reports or share until you renew.</li>
        <li>Invite rewards (20% of what your invitee pays) are added to your Funds while they stay subscribed.</li>
        <li>If you set a next of kin, they may be emailed after the period of inactivity you choose.</li>
        <li>We keep your data private and never sell it. Passwords are stored hashed.</li>
      </ol>
    </main>
  );
}
