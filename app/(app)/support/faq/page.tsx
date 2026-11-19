import { requireUser } from "@/lib/auth";
import { Page } from "@/components/page";
import { FAQ } from "@/lib/faq";

export const metadata = { title: "FAQs" };

export default async function Faq() {
  const u = await requireUser();
  return (
    <Page title="Frequently Asked Questions" level={u.level} rail={{ search: true }}>
      <div className="space-y-2">
        {FAQ.map(([q, a]) => (
          <details key={q} data-search={`${q} ${a.join(" ")}`} className="card group p-4">
            <summary className="cursor-pointer list-none font-semibold uppercase">{q}</summary>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">{a.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </details>
        ))}
      </div>
    </Page>
  );
}
