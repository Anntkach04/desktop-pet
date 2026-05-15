import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function MagicButton({ children, className = "", disabled, onClick }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      disabled={disabled}
      onClick={onClick}
      className={[
        "relative w-full overflow-hidden rounded-[1.15rem] rounded-br-[1.35rem] rounded-tl-[1.25rem] px-5 py-3.5",
        "font-semibold tracking-wide text-cocoa shadow-[0_4px_20px_rgba(234,179,8,0.35),inset_0_1px_0_rgba(255,255,255,0.65)]",
        "bg-gradient-to-br from-[#fff6d0] via-[#fce7a8] to-[#f4d06f]",
        "ring-2 ring-amber-200/80 ring-offset-2 ring-offset-cream",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/40 before:to-transparent before:opacity-70",
        "disabled:cursor-not-allowed disabled:opacity-55 disabled:ring-amber-100/50",
        className,
      ].join(" ")}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
