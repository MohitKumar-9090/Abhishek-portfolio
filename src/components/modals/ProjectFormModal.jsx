import { Plus, X } from "lucide-react";

export default function ProjectFormModal({
  projectFormOpen,
  closeProjectForm,
  handleProjectSubmit,
  projectForm,
  setProjectForm,
  setProjectBannerFile,
  projectFormStatus
}) {
  if (!projectFormOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="font-heading text-2xl font-bold text-sky-900">Add New Project</h3>
          <button
            type="button"
            onClick={closeProjectForm}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 text-sky-700 transition hover:border-sky-400"
            aria-label="Close add project form"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleProjectSubmit} className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-sky-800">Project Title *</label>
            <input
              value={projectForm.title}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
              placeholder="e.g. Portfolio Builder"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-sky-800">Description *</label>
            <textarea
              value={projectForm.description}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-28 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
              placeholder="Brief project summary"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-sky-800">GitHub Link</label>
              <input
                type="url"
                value={projectForm.github}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, github: e.target.value }))}
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                placeholder="https://github.com/username/repo"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-sky-800">Website Link</label>
              <input
                type="url"
                value={projectForm.website}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, website: e.target.value }))}
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                placeholder="https://your-project-site.com"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-sky-800">Programming Language(s) *</label>
              <input
                value={projectForm.languages}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, languages: e.target.value }))}
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                placeholder="JavaScript, React, Node.js"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-sky-800">Category</label>
              <input
                value={projectForm.category}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                placeholder="Web Apps / Desktop Apps / Custom"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-sky-800">Banner URL</label>
              <input
                type="url"
                value={projectForm.bannerUrl}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, bannerUrl: e.target.value }))}
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                placeholder="https://image-link.com/banner.jpg"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-sky-800">Or Upload Banner</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProjectBannerFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          {projectFormStatus ? <p className="text-sm text-sky-700">{projectFormStatus}</p> : null}

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={closeProjectForm}
              className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-glow px-4 py-2 text-sm font-semibold text-slate-900"
            >
              <Plus size={15} />
              Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
