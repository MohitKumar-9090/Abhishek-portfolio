import Section from "../ui/Section";

export default function AboutSection({ developer }) {
  return (
    <Section id="about" title="About" subtitle={developer.role}>
      <p className="leading-7 text-slate-300">{developer.summary}</p>
    </Section>
  );
}
