import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function PhoneShell({ children }: Props) {
  return (
    <div className="flex min-h-dvh justify-center bg-gradient-to-b from-cream via-cream to-cream-deep px-4 py-8 sm:py-10">
      <div
        className={[
          "flex w-full max-w-[400px] flex-col",
          "rounded-[2rem] rounded-tl-[2.1rem] rounded-br-[1.85rem]",
          "border-[1.5px] border-cocoa/12 bg-warm-white/70",
          "doodle-shadow backdrop-blur-sm",
          "min-h-[min(640px,calc(100dvh-4rem))] sm:min-h-[680px]",
        ].join(" ")}
      >
        <div className="flex flex-1 flex-col px-5 pb-6 pt-7 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
