"use client";

import { motion, useReducedMotion } from "framer-motion";

// Scroll-triggered fade/slide-up. Wraps existing markup without changing its
// structure — pass `as` to control the rendered element (default <div>). Motion
// is automatically disabled when the user prefers reduced motion.
export default function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  y = 24,
  once = true,
  amount = 0.2,
  ...rest
}) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
