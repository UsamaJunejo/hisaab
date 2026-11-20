import { requireUser } from "@/lib/auth";
import { SLIDES, shotUrl } from "@/lib/help";
import { Page } from "@/components/page";
import { HelpSlides } from "@/components/help-slides";
import marks from "@/public/help/marks.json";

export const metadata = { title: "Help" };

const SYSTEM = { 1: "ONE LEVEL SYSTEM", 2: "TWO LEVEL SYSTEM", 3: "THREE LEVEL SYSTEM" } as const;

/** HELP: a picture slide-show for your level system (MunshiBaba has one for each level). */
export default async function Help() {
  const u = await requireUser();
  const spots = marks as unknown as Record<string, [number, number][]>;
  const slides = SLIDES.filter((s) => !(u.level === 1 && s.key === "levels")).map((s) => ({
    key: s.key, section: s.section, title: s.title, text: s.text, marks: s.marks,
    img: shotUrl(s, u.level), spots: s.marks ? spots[`l${u.level}/${s.shot.slice(2)}`] : undefined,
  }));
  return (
    <Page title="How to use Hisaab" level={u.level} rail={{}}>
      <HelpSlides slides={slides} system={SYSTEM[u.level]} />
      <p className="mt-4 text-sm">More answers in <a href="/support/faq" className="font-semibold text-blue underline">FAQs</a>.</p>
    </Page>
  );
}
