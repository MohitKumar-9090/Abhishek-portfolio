import { motion } from "framer-motion";
import { ArrowDownToLine, Code2, ExternalLink, Mail, MapPin, Phone, Sparkles } from "lucide-react";

export default function HeroSection({
  developer,
  experience,
  primaryEducation,
  typedRole,
  handleResumeDownload,
  heroHighlights,
  heroTechStack,
  mernGraphData
}) {
  return (
    <section
      id="hero"
      data-track="hero"
      className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 shadow-neon md:p-10"
    >
      <div className="pointer-events-none absolute -left-12 top-16 -z-10 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-56 w-56 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="grid items-start gap-8 lg:grid-cols-[1.32fr_0.9fr]">
        <div>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative rounded-full border-[3px] border-sky-300 bg-white p-1">
              <img
                src="/profile-photo.jpeg"
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover object-top md:h-24 md:w-24"
              />
              <span className="absolute -right-1 top-2 h-3 w-3 rounded-full bg-blue-500" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700">
              <Sparkles size={14} />
              Portfolio Profile
            </div>
          </div>

          <h1 className="hero-name-title font-heading text-5xl font-extrabold leading-tight md:text-7xl">
            {developer.name}
          </h1>
          <p className="mt-2 text-xl font-semibold text-slate-700 md:text-4xl">{developer.role}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-lg text-slate-600">
            <MapPin size={18} />
            {developer.location}
          </p>

          <p className="mt-4 max-w-3xl rounded-lg border border-dashed border-sky-200 bg-white px-4 py-2 text-lg font-medium text-slate-700">
            Building Intelligent <span className="font-bold text-sky-700">AI Solutions</span> and modern web applications
          </p>

          <p className="mt-3 text-base font-semibold text-indigo-600">
            {typedRole}
            <span className="animate-pulse">|</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-3 text-slate-700">
            <a href="mailto:abhishek8579013@gmail.com" className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm">
              <Mail size={16} />
              abhishek8579013@gmail.com
            </a>
            <a href="tel:6202000340" className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm">
              <Phone size={16} />
              +91 6202000340
            </a>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-sky-200 bg-white p-4">
              <p className="text-sm font-semibold text-blue-700">{experience.company}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{experience.role}</p>
            </article>
            <article className="rounded-2xl border border-sky-200 bg-white p-4">
              <p className="text-sm font-semibold text-amber-600">{primaryEducation?.institute}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{primaryEducation?.degree}</p>
            </article>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#projects" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-3 text-base font-semibold text-white">
              View Projects
              <ExternalLink size={16} />
            </a>
            <button
              type="button"
              onClick={handleResumeDownload}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-base font-semibold text-white"
            >
              <ArrowDownToLine size={16} />
              Download Resume
            </button>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-sky-200 bg-white p-3 sm:grid-cols-4">
            {heroHighlights.map((item) => (
              <article key={item.label} className="rounded-lg border border-sky-100 bg-slate-50 px-3 py-2 text-center">
                <p className="text-2xl font-extrabold text-sky-700">{item.value}</p>
                <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative space-y-5">
          <article className="rounded-3xl border border-sky-200 bg-white p-5 shadow-lg">
            <h3 className="mb-4 inline-flex items-center gap-2 font-heading text-3xl font-bold text-slate-800">
              <Code2 size={22} className="text-sky-700" />
              Tech Stack
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {heroTechStack.map((tech) => (
                <p key={tech} className="rounded-xl border border-sky-100 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-700">
                  {tech}
                </p>
              ))}
            </div>
          </article>

          <article className="ml-auto w-full max-w-[280px] rotate-3 rounded-[2rem] border border-indigo-200 bg-gradient-to-br from-white to-indigo-50 p-5 shadow-lg">
            <p className="text-2xl font-extrabold text-indigo-700">Resume</p>
            <button
              type="button"
              onClick={handleResumeDownload}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 font-semibold text-indigo-700"
            >
              <ArrowDownToLine size={16} />
              Download PDF
            </button>
            <ul className="mt-4 space-y-2 text-sm font-medium text-slate-600">
              <li>Education</li>
              <li>Projects</li>
              <li>Skills</li>
            </ul>
          </article>

          <article className="relative hidden overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-100 via-white to-indigo-100 p-4 lg:block">
            <motion.div
              className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/30 blur-2xl"
              animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.8, 0.45] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="pointer-events-none absolute -bottom-10 right-2 h-32 w-32 rounded-full bg-indigo-400/25 blur-2xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.55, 0.25, 0.55] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="h-full rounded-2xl border border-dashed border-sky-300/80 bg-white/70 p-4">
              <p className="text-sm font-semibold text-sky-700">MERN Focus</p>
              <div className="mt-3 space-y-2">
                {mernGraphData.map((item, index) => (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>{item.name}</span>
                      <span>{item.score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-sky-100">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.score}%` }}
                        viewport={{ once: true, amount: 0.7 }}
                        transition={{ duration: 0.9, delay: index * 0.08 }}
                        className={`h-2 rounded-full bg-gradient-to-r ${item.tone}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-sky-200 bg-white/80 p-2">
                <svg viewBox="0 0 220 50" className="h-12 w-full">
                  <polyline fill="none" stroke="#0ea5e9" strokeWidth="3" points="0,38 45,30 95,34 145,22 220,16" />
                  <polyline fill="none" stroke="#4f46e5" strokeWidth="2.4" points="0,42 45,36 95,28 145,26 220,20" />
                  {[0, 45, 95, 145, 220].map((x) => (
                    <circle key={x} cx={x} cy={x === 145 ? 22 : x === 220 ? 16 : x === 45 ? 30 : x === 95 ? 34 : 38} r="2.6" fill="#06b6d4" />
                  ))}
                </svg>
              </div>
            </div>
            {[...Array(10)].map((_, i) => (
              <motion.span
                key={`particle-${i}`}
                className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-cyan-400/70"
                style={{ left: `${8 + i * 9}%`, bottom: `${6 + (i % 4) * 8}%` }}
                animate={{ y: [0, -10, 0], opacity: [0.25, 0.9, 0.25] }}
                transition={{ duration: 1.8 + (i % 3) * 0.5, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </article>
        </div>
      </div>
    </section>
  );
}
