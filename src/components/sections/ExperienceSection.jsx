import Section from "../ui/Section";

export default function ExperienceSection({ experience, achievements, extracurricular }) {
  return (
    <Section id="experience" title="Experience, Achievements & Leadership" subtitle={experience.role}>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
          <h3 className="font-heading text-lg text-white">{experience.company}</h3>
          <p className="mt-1 text-sm text-cyan-200">{experience.role}</p>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-300">
            {experience.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {experience.techStack.map((tech) => (
              <span key={tech} className="rounded border border-sky-300 bg-white px-2 py-1 text-xs text-sky-800">
                {tech}
              </span>
            ))}
          </div>
        </article>
        <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
          <h3 className="font-heading text-lg text-white">Achievements</h3>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-300">
            {achievements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="mt-4 font-heading text-lg text-white">Extracurricular</h3>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-300">
            {extracurricular.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </Section>
  );
}
