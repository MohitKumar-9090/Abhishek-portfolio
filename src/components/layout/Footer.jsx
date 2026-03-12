import { Github, Linkedin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mx-auto mb-6 w-[min(1120px,95vw)] rounded-3xl border border-sky-200 bg-gradient-to-br from-white to-sky-50 px-6 py-8 md:px-10">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-sky-300 bg-sky-100 font-heading text-xl font-semibold text-sky-700">
              AK
            </div>
            <h3 className="font-heading text-3xl text-sky-900">Abhishek Kumar</h3>
          </div>
          <p className="mt-4 max-w-sm text-sky-700">
            MERN stack developer building practical, scalable products with clean architecture.
          </p>
          <div className="mt-4 flex gap-2">
            <a href="https://github.com/abhishekgfg?tab=repositories" target="_blank" rel="noreferrer" className="rounded-full border border-sky-300 bg-white p-2 text-sky-700 hover:text-sky-500">
              <Github size={18} />
            </a>
            <a href="mailto:abhishek8579013@gmail.com" className="rounded-full border border-sky-300 bg-white p-2 text-sky-700 hover:text-sky-500">
              <Mail size={18} />
            </a>
            <a href="tel:6202000340" className="rounded-full border border-sky-300 bg-white p-2 text-sky-700 hover:text-sky-500">
              <Phone size={18} />
            </a>
            <a href="https://www.linkedin.com/in/abhishek-kumar-847b74241/" target="_blank" rel="noreferrer" className="rounded-full border border-sky-300 bg-white p-2 text-sky-700 hover:text-sky-500">
              <Linkedin size={18} />
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-heading text-xl text-sky-900">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sky-700">
            {["Home", "About", "Reviews", "Projects", "Contact"].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-heading text-xl text-sky-900">Technologies</h4>
          <ul className="mt-3 space-y-2 text-sky-700">
            {["MongoDB", "Express.js", "React", "Node.js", "JavaScript"].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 border-t border-sky-200 pt-5 text-center text-sky-600">
        (c) {new Date().getFullYear()} Abhishek Kumar. All rights reserved.
      </div>
    </footer>
  );
}
