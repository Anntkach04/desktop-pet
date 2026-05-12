import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { useCallback, useMemo, useState } from "react";
import { DoodleCard } from "./components/DoodleCard";
import { GlowingBrainIcon } from "./components/GlowingBrainIcon";
import { MagicButton } from "./components/MagicButton";
import { PhoneShell } from "./components/PhoneShell";
import { generateSecondBrainResponse } from "./lib/generateSecondBrainResponse";

const stepVariants = {
  initial: { opacity: 0, x: 16, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -12, filter: "blur(3px)" },
};

function tagPositions(n: number) {
  const presets: { x: number; y: number; rotate: number }[] = [
    { x: -118, y: -72, rotate: -6 },
    { x: 108, y: -58, rotate: 5 },
    { x: -92, y: 48, rotate: 4 },
    { x: 102, y: 62, rotate: -5 },
    { x: 0, y: -98, rotate: 2 },
    { x: -12, y: 88, rotate: -3 },
    { x: 128, y: 8, rotate: 6 },
    { x: -130, y: 6, rotate: -4 },
  ];
  return presets.slice(0, n);
}

export function SecondBrainFlow() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [reframe, setReframe] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [exportBusy, setExportBusy] = useState(false);

  const canActivate = input.trim().length > 0;

  const resetAll = useCallback(() => {
    setStep(1);
    setInput("");
    setFeelings([]);
    setReframe("");
    setActions([]);
    setChecked({});
    setBusy(false);
    setExportBusy(false);
  }, []);

  const runActivate = async () => {
    if (!canActivate || busy) return;
    setBusy(true);
    try {
      const res = await generateSecondBrainResponse(input);
      setFeelings(res.feelings);
      setReframe(res.reframe);
      setActions(res.actions);
      setChecked({});
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  const notesText = useMemo(() => {
    const lines = [
      "Second Brain notes",
      "—",
      "Original thought:",
      input.trim() || "(empty)",
      "",
      "Feelings detected:",
      feelings.map((f) => `• ${f}`).join("\n"),
      "",
      "Reframe:",
      reframe,
      "",
      "Tiny next steps:",
      ...actions.map((a, i) => {
        const mark = checked[i] ? "[x]" : "[ ]";
        return `${mark} ${a}`;
      }),
    ];
    return lines.join("\n");
  }, [input, feelings, reframe, actions, checked]);

  const copyNotes = async () => {
    try {
      await navigator.clipboard.writeText(notesText);
    } catch {
      // ignore
    }
  };

  const downloadImage = async () => {
    const el = document.getElementById("second-brain-export-card");
    if (!el) return;
    setExportBusy(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#fffef9",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = "second-brain-notes.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExportBusy(false);
    }
  };

  const toggleAction = (i: number) => {
    setChecked((c) => ({ ...c, [i]: !c[i] }));
  };

  const positions = tagPositions(feelings.length);

  return (
    <PhoneShell>
      <header className="mb-6 text-center">
        <p className="font-display text-2xl font-semibold text-cocoa sm:text-[1.65rem]">
          Second Brain
        </p>
        <p className="mt-1 text-sm text-cocoa-soft/90">Turn messy thoughts into clarity.</p>
        <div
          className="mx-auto mt-4 flex max-w-[200px] justify-center gap-1.5"
          aria-hidden
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={[
                "h-1.5 flex-1 rounded-full",
                s === step
                  ? "bg-gradient-to-r from-amber-300 to-amber-500"
                  : s < step
                    ? "bg-amber-200/90"
                    : "bg-cocoa/10",
              ].join(" ")}
            />
          ))}
        </div>
      </header>

      <div className="relative flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/55">
                Step 1
              </p>
              <h1 className="mt-2 text-center font-display text-2xl text-cocoa sm:text-[1.85rem]">
                Write what’s on your mind
              </h1>
              <p className="mx-auto mt-2 max-w-[280px] text-center text-sm leading-relaxed text-cocoa-soft">
                Goals, fears, worries, overthinking — whatever feels loud right now.
              </p>

              <div className="mt-5 flex flex-1 flex-col items-center">
                <GlowingBrainIcon />
                <label className="mt-4 w-full text-left text-xs font-medium text-cocoa/60">
                  Your thoughts
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={5}
                    placeholder="Start typing…"
                    className={[
                      "mt-2 w-full resize-none rounded-[1.25rem] rounded-br-[1.45rem] rounded-tl-[1.1rem]",
                      "border-[1.5px] border-cocoa/15 bg-cream/80 px-4 py-3",
                      "text-[15px] leading-relaxed text-ink placeholder:text-cocoa/35",
                      "outline-none ring-amber-200/40 focus:border-amber-300/80 focus:ring-2",
                    ].join(" ")}
                  />
                </label>
              </div>

              <div className="mt-auto space-y-3 pt-6">
                <MagicButton disabled={!canActivate || busy} onClick={runActivate}>
                  {busy ? "Activating…" : "Activate my brain"}
                </MagicButton>
                <p className="text-center text-[11px] text-cocoa/45">
                  A small ritual — not a substitute for care you deserve offline.
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/55">
                Step 2
              </p>
              <h1 className="mt-2 text-center font-display text-2xl text-cocoa sm:text-[1.85rem]">
                Feelings behind them
              </h1>
              <p className="mx-auto mt-2 max-w-[280px] text-center text-sm text-cocoa-soft">
                Little labels your mind might be carrying — no judgment, just pattern.
              </p>

              <div className="relative mt-8 flex min-h-[220px] flex-1 items-center justify-center">
                <p className="relative z-0 max-w-[200px] text-center font-display text-xl text-cocoa/85">
                  feelings behind them
                </p>
                {feelings.map((f, i) => {
                  const p = positions[i] ?? { x: 0, y: 0, rotate: 0 };
                  return (
                    <motion.span
                      key={`${f}-${i}`}
                      initial={{ opacity: 0, scale: 0.55 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: `calc(-50% + ${p.x}px)`,
                        y: `calc(-50% + ${p.y}px)`,
                        rotate: p.rotate,
                      }}
                      transition={{
                        delay: 0.12 + i * 0.12,
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                      className="pointer-events-none absolute left-1/2 top-1/2 z-10"
                    >
                      <span
                        className={[
                          "inline-block whitespace-nowrap rounded-full rounded-br-lg rounded-tl-md",
                          "border border-cocoa/18 bg-butter/90 px-3 py-1",
                          "text-xs font-semibold capitalize text-cocoa shadow-sm",
                        ].join(" ")}
                      >
                        {f}
                      </span>
                    </motion.span>
                  );
                })}
              </div>

              <div className="mt-auto pt-6">
                <MagicButton onClick={() => setStep(3)}>Show me what my brain sees</MagicButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/55">
                Step 3
              </p>
              <h1 className="mt-2 text-center font-display text-2xl text-cocoa sm:text-[1.85rem]">
                What your second brain sees
              </h1>
              <p className="mx-auto mt-2 max-w-[280px] text-center text-sm text-cocoa-soft">
                Softer truth — not forced sunshine, just steadier ground.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mt-6 flex-1"
              >
                <DoodleCard className="p-5">
                  <p className="text-[15px] leading-relaxed text-ink">{reframe}</p>
                </DoodleCard>
              </motion.div>

              <div className="mt-auto pt-6">
                <MagicButton onClick={() => setStep(4)}>Turn this into a plan</MagicButton>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/55">
                Step 4
              </p>
              <h1 className="mt-2 text-center font-display text-2xl text-cocoa sm:text-[1.85rem]">
                Tiny things to do next
              </h1>
              <p className="mx-auto mt-2 max-w-[280px] text-center text-sm text-cocoa-soft">
                Small moves you can actually try — not a whole life overhaul.
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {actions.map((a, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.07 }}
                  >
                    <label className="flex cursor-pointer items-start gap-3 rounded-[1.1rem] border border-cocoa/10 bg-cream/70 p-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-cocoa/35 bg-warm-white">
                        <input
                          type="checkbox"
                          checked={!!checked[i]}
                          onChange={() => toggleAction(i)}
                          className="sr-only"
                        />
                        {checked[i] ? (
                          <motion.span
                            layoutId={`check-${i}`}
                            className="block h-2.5 w-2.5 rounded-full bg-amber-500"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          />
                        ) : null}
                      </span>
                      <span className="text-[14px] leading-snug text-ink">{a}</span>
                    </label>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <MagicButton onClick={() => setStep(5)}>Create my notes</MagicButton>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="s5"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/55">
                Step 5
              </p>
              <h1 className="mt-2 text-center font-display text-2xl text-cocoa sm:text-[1.85rem]">
                Your second brain notes
              </h1>
              <p className="mx-auto mt-2 max-w-[280px] text-center text-sm text-cocoa-soft">
                A tidy little snapshot you can keep.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 16 }}
                className="mt-5 flex-1 overflow-y-auto"
              >
                <DoodleCard id="second-brain-export-card" className="space-y-5 p-5">
                  <section>
                    <h2 className="font-display text-lg text-cocoa">Original thought</h2>
                    <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                      {input.trim() || "—"}
                    </p>
                  </section>
                  <section>
                    <h2 className="font-display text-lg text-cocoa">Feelings detected</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {feelings.map((f) => (
                        <span
                          key={f}
                          className="rounded-full rounded-br-md bg-honey/80 px-2.5 py-0.5 text-xs font-semibold capitalize text-cocoa"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h2 className="font-display text-lg text-cocoa">Reframe</h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink">{reframe}</p>
                  </section>
                  <section>
                    <h2 className="font-display text-lg text-cocoa">Tiny next steps</h2>
                    <ul className="mt-2 space-y-2">
                      {actions.map((a, i) => (
                        <li key={i} className="flex gap-2 text-[14px] leading-snug text-ink">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-cocoa/40 bg-warm-white">
                            {checked[i] ? (
                              <span className="block h-full w-full rounded-full bg-amber-500" />
                            ) : null}
                          </span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </DoodleCard>
              </motion.div>

              <div className="mt-5 flex flex-col gap-2.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={copyNotes}
                    className="rounded-[1rem] rounded-br-[1.2rem] border-[1.5px] border-cocoa/18 bg-cream/90 py-3 text-sm font-semibold text-cocoa transition hover:bg-cream"
                  >
                    Copy notes
                  </button>
                  <button
                    type="button"
                    disabled={exportBusy}
                    onClick={downloadImage}
                    className="rounded-[1rem] rounded-tl-[1.15rem] border-[1.5px] border-cocoa/18 bg-cream/90 py-3 text-sm font-semibold text-cocoa transition hover:bg-cream disabled:opacity-50"
                  >
                    {exportBusy ? "Preparing…" : "Download as image"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full rounded-[1rem] py-3 text-sm font-semibold text-cocoa-soft underline decoration-cocoa/25 decoration-2 underline-offset-4 hover:text-cocoa"
                >
                  Start again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PhoneShell>
  );
}
