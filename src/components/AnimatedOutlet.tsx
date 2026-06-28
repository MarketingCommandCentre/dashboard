import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  // Each route gets its own keyed motion.div so AnimatePresence (mode="wait")
  // can run the exit animation before mounting the next page.
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        onAnimationStart={(definition) => {
          if (definition === 'animate') {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
          }
        }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
