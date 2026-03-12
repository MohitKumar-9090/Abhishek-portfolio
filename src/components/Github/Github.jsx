import Section from "../ui/Section";
import ResilientImage from "../ui/ResilientImage";
import { GITHUB_SECTION } from "./githubData";
import "./github.css";

export default function GithubSection() {
  return (
    <Section id={GITHUB_SECTION.id} title={GITHUB_SECTION.title} subtitle={GITHUB_SECTION.subtitle}>
      <div className="grid gap-4 lg:grid-cols-2">
        <ResilientImage
          className="w-full rounded-xl border border-white/10 bg-slate-950 p-2"
          alt="GitHub contribution graph"
          sources={[
            "https://ghchart.rshah.org/00ffff/abhishekgfg",
            "https://ghchart.rshah.org/abhishekgfg",
            "https://github-readme-activity-graph.vercel.app/graph?username=abhishekgfg&theme=react-dark&hide_border=true"
          ]}
        />
        <ResilientImage
          className="w-full rounded-xl border border-white/10 bg-slate-950 p-2"
          alt="GitHub stats card"
          sources={[
            "https://github-readme-stats.vercel.app/api?username=abhishekgfg&show_icons=true&theme=tokyonight",
            "https://github-readme-stats-git-masterrstaa-rickstaa.vercel.app/api?username=abhishekgfg&show_icons=true&theme=tokyonight",
            "https://github-profile-summary-cards.vercel.app/api/cards/stats?username=abhishekgfg&theme=github_dark"
          ]}
        />
      </div>
    </Section>
  );
}
