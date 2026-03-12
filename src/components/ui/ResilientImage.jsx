import { useState } from "react";

export default function ResilientImage({ sources, alt, className }) {
  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) {
    return (
      <div className="grid min-h-40 place-items-center rounded-xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
        {alt}
      </div>
    );
  }

  return (
    <img
      loading="lazy"
      src={src}
      alt={alt}
      className={className}
      onError={() => setIndex((prev) => prev + 1)}
    />
  );
}
