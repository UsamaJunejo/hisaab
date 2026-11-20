import { PartiesPage } from "@/components/biz/parties-page";

export const metadata = { title: "Customers" };

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  return <PartiesPage kind="customer" edit={(await searchParams).edit} />;
}
