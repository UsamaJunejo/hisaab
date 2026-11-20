import { PartiesPage } from "@/components/biz/parties-page";

export const metadata = { title: "Vendors" };

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  return <PartiesPage kind="vendor" edit={(await searchParams).edit} />;
}
