import type { LegalSection } from "@/lib/legal";

export function LegalDocument({
  title,
  version,
  sections,
}: {
  title: string;
  version: string;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 text-white">
      <p className="mb-6 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Draft {version} for review. Bracketed placeholders must be confirmed before this document is treated as final. This page is not published as final legal text until you approve it.
      </p>
      <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-white">Version {version}</p>
      <p className="mt-1 text-sm text-white">Effective Date: [CONFIRM PUBLICATION DATE]</p>
      <p className="mt-1 text-sm text-white">Website: https://equipmentai.ca</p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-6">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
