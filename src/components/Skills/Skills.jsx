import { motion } from "framer-motion";
import Section from "../ui/Section";
import { SKILLS_SECTION } from "./skillsData";
import "./skills.css";

export default function SkillsSection({ stackedSkills, skillOrbitItems }) {
  return (
    <Section id={SKILLS_SECTION.id} title={SKILLS_SECTION.title} subtitle={SKILLS_SECTION.subtitle}>
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white"
        >
          <div className="pointer-events-none absolute -right-16 -top-12 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Primary Focus</p>
          <h3 className="mt-2 font-heading text-4xl font-bold">MERN Stack Developer</h3>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            React frontends, Node and Express APIs, MongoDB data modeling, and deployment-ready full-stack workflows.
          </p>

          <div className="relative mt-6 grid place-items-center">
            <div className="h-56 w-56 rounded-full border border-cyan-400/30 bg-slate-950/80 shadow-[0_0_45px_rgba(56,189,248,0.3)]" />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-xl font-bold text-cyan-200">MERN</div>
            </div>
            {skillOrbitItems.map((item, index) => {
              const angle = (360 / skillOrbitItems.length) * index;
              return (
                <span
                  key={item}
                  className="absolute inline-flex -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/30 bg-slate-900 px-3 py-1 text-xs font-semibold text-cyan-100"
                  style={{
                    left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 120}px)`,
                    top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 120}px)`
                  }}
                >
                  {item}
                </span>
              );
            })}
          </div>
        </motion.article>

        <div className="space-y-4">
          {stackedSkills.map((group, index) => (
            <motion.article
              key={group.category}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 text-white"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">{group.category}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span key={`${group.category}-${item}`} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                    {item}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </Section>
  );
}
