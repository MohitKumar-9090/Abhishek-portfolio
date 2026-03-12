import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function Section({ id, title, subtitle, action, children }) {
  return (
    <motion.section
      id={id}
      data-track={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
      className="mx-auto w-full max-w-6xl rounded-2xl border border-sky-200 bg-white/85 p-6 shadow-neon backdrop-blur md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold text-sky-900 md:text-3xl">{title}</h2>
        {action ? <div>{action}</div> : null}
      </div>
      {subtitle ? <p className="mt-2 text-sky-700">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}
