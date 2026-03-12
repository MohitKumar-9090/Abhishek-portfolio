import { motion } from "framer-motion";
import { ExternalLink, Github, Plus } from "lucide-react";
import Section from "../ui/Section";
import { PROJECTS_SECTION } from "./projectsData";
import "./projects.css";

export default function ProjectsSection({
  projectCategories,
  selectedCategory,
  setSelectedCategory,
  filteredProjects,
  openProjectForm
}) {
  return (
    <Section
      id={PROJECTS_SECTION.id}
      title={PROJECTS_SECTION.title}
      subtitle={PROJECTS_SECTION.subtitle}
      action={(
        <button
          type="button"
          onClick={openProjectForm}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-500 hover:text-sky-600"
        >
          <Plus size={16} />
          Add Project
        </button>
      )}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {projectCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === category
                ? "bg-gradient-to-r from-accent to-glow text-slate-900"
                : "border border-white/20 text-slate-300 hover:border-accent"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <motion.article
            key={project.title}
            whileHover={{ y: -6 }}
            className="overflow-hidden rounded-xl border border-white/10 bg-slate-800/70"
          >
            <img src={project.image} alt={project.title} loading="lazy" className="h-40 w-full object-cover" />
            <div className="p-4">
              <h3 className="font-heading text-lg text-white">{project.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{project.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <span key={tech} className="rounded border border-sky-300 bg-white px-2 py-1 text-xs text-sky-800">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm hover:border-accent">
                  <Github size={14} />
                  GitHub
                </a>
                <a href={project.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-glow px-3 py-2 text-sm font-semibold text-slate-900">
                  <ExternalLink size={14} />
                  Live Demo
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
