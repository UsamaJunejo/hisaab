import { redirect } from "next/navigation";

/** Old address: the Business Module now lives at /business. */
export default function Business() {
  redirect("/business");
}
