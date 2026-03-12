import Section from "../ui/Section";
import { EDUCATION_SECTION } from "./educationData";
import "./education.css";

export default function EducationSection({ education }) {
  return (
    <Section
      id={EDUCATION_SECTION.id}
      title={EDUCATION_SECTION.title}
      subtitle={EDUCATION_SECTION.subtitle}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {education.map((item) => (
          <article key={`${item.degree}-${item.institute}`} className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
            <h3 className="font-heading text-base text-white">{item.degree}</h3>
            <p className="mt-1 text-sm text-slate-300">{item.institute}</p>
            <p className="text-sm text-slate-400">{item.location}</p>
            {item.year ? <p className="mt-1 text-xs text-cyan-200">{item.year}</p> : null}
          </article>
        ))}
      </div>
    </Section>
  );
}
