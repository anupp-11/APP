import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to Quick Transaction as the primary workflow
  redirect("/quick-transaction");
}
