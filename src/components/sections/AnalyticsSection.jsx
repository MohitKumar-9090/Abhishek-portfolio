import Section from "../ui/Section";

export default function AnalyticsSection({ analytics, sectionRanking }) {
  return (
    <Section id="analytics" title="Visitor Analytics" subtitle="Live visitor stats connected with Firebase Realtime Database + Firestore.">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
          <p className="text-sm text-slate-300">Total Visitors</p>
          <p className="mt-2 text-3xl font-bold text-accent">{analytics.totalVisitors}</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
          <p className="text-sm text-slate-300">Page Views</p>
          <p className="mt-2 text-3xl font-bold text-accent">{analytics.pageViews}</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
          <p className="text-sm text-slate-300">Most Visited Sections</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-200">
            {sectionRanking.length ? (
              sectionRanking.map(([name, count]) => <li key={name}>{`${name}: ${count}`}</li>)
            ) : (
              <li>No data yet.</li>
            )}
          </ul>
        </article>
      </div>
    </Section>
  );
}
