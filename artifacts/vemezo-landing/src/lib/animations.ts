import { type Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.25, ease: "easeIn" } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.94, transition: { duration: 0.2 } },
};

// Parent: stagger its children
export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

// Child card that slides + fades in when parent staggers
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// Smooth page transition preset
export const pageTransition: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// Hover props for interactive cards
export const cardHoverProps = {
  whileHover: { y: -2, transition: { duration: 0.18 } },
  whileTap:   { scale: 0.98 },
};

// Hover props for buttons
export const buttonHoverProps = {
  whileHover: { scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 20 } },
  whileTap:   { scale: 0.97 },
};
