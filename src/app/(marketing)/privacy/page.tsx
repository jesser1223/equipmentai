import { LegalDocument } from "@/components/legal-document";
import { PRIVACY_VERSION, privacySections } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy · EquipmentAI",
};

export default function PrivacyPage() {
  return <LegalDocument title="Privacy Policy" version={PRIVACY_VERSION} sections={privacySections} />;
}
