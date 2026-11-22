import { LegalDocument } from "@/components/legal-document";
import { TERMS_VERSION, termsSections } from "@/lib/legal";

export const metadata = {
  title: "Terms of Service · EquipmentAI",
};

export default function TermsPage() {
  return <LegalDocument title="Terms of Service" version={TERMS_VERSION} sections={termsSections} />;
}
