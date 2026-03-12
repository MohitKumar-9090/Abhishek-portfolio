import Section from "../ui/Section";
import { ABOUT_SECTION } from "./aboutData";
import "./about.css";

export default function AboutSection({ developer }) {
  return (
    <Section id={ABOUT_SECTION.id} title={ABOUT_SECTION.title} subtitle={developer.role}>
      <p className="leading-7 text-slate-300">{developer.summary}</p>
    </Section>
  );
}
