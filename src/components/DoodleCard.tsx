import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function DoodleCard({ children, className = "", id }: Props) {
  return (
    <div
      id={id}
      className={[
        "doodle-shadow rounded-[1.35rem] rounded-tl-[1.5rem] rounded-br-[1.2rem]",
        "border-[1.5px] border-cocoa/15 bg-warm-white/90",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
