import { Github, Linkedin, Mail, Phone } from "lucide-react";
import Section from "../ui/Section";

export default function ContactSection() {
  return (
    <Section id="contact" title="Contact" subtitle="Professional links">
      <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 md:p-6">
        <div className="flex flex-wrap gap-3">
          <a href="mailto:abhishek8579013@gmail.com" className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sky-800 transition hover:-translate-y-0.5 hover:shadow-md">
            <Mail size={18} />
            abhishek8579013@gmail.com
          </a>
          <a href="tel:6202000340" className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sky-800 transition hover:-translate-y-0.5 hover:shadow-md">
            <Phone size={18} />
            +91 6202000340
          </a>
          <a href="https://github.com/abhishekgfg?tab=repositories" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sky-800 transition hover:-translate-y-0.5 hover:shadow-md">
            <Github size={18} />
            github.com/abhishekgfg
          </a>
          <a href="https://www.linkedin.com/in/abhishek-kumar-847b74241/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sky-800 transition hover:-translate-y-0.5 hover:shadow-md">
            <Linkedin size={18} />
            linkedin.com/in/abhishek-kumar-847b74241
          </a>
        </div>
      </div>
    </Section>
  );
}
