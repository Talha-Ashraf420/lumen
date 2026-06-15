"use client";

import { motion } from "framer-motion";

/** Oversized heading whose words rise + fade in with a stagger (kinetic type). */
export function KineticTitle({
  text,
  eyebrow,
  className = "",
}: {
  text: string;
  eyebrow?: string;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <div className={className}>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-1 font-mono text-xs uppercase tracking-[0.3em] text-iris-400"
        >
          {eyebrow}
        </motion.p>
      )}
      <h1 className="flex flex-wrap gap-x-3 text-4xl font-bold tracking-tight sm:text-6xl">
        {words.map((w, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: "0.5em", filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block bg-gradient-to-br from-foreground to-fog-400 bg-clip-text text-transparent"
          >
            {w}
          </motion.span>
        ))}
      </h1>
    </div>
  );
}
