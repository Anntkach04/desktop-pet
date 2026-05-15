/**
 * Placeholder for AI-powered copy. Replace the body with a fetch to OpenAI,
 * an n8n webhook, or your preferred provider — keep this signature.
 */
export type SecondBrainResult = {
  feelings: string[];
  reframe: string;
  actions: string[];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function uniqueStrings(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const k = s.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export async function generateSecondBrainResponse(
  input: string,
): Promise<SecondBrainResult> {
  await sleep(280);

  const raw = input.trim();
  const t = raw.toLowerCase();

  const feelingsPool: string[] = [];

  const push = (...xs: string[]) => feelingsPool.push(...xs);

  if (/\b(fear|scared|afraid|anxious|worry|worried|panic)\b/.test(t)) {
    push("fear", "uncertainty");
  }
  if (/\b(pressure|deadline|rush|hurry|must|have to)\b/.test(t)) {
    push("pressure");
  }
  if (/\b(doubt|not enough|impost|fake|fraud)\b/.test(t)) {
    push("self-doubt");
  }
  if (/\b(compare|comparison|everyone else|instagram|social)\b/.test(t)) {
    push("comparison");
  }
  if (/\b(overwhelm|too much|burnout|exhaust|tired|stuck)\b/.test(t)) {
    push("overwhelm");
  }
  if (/\b(goal|dream|future|plan|career|build|project)\b/.test(t)) {
    push("hope", "ambition");
  }
  if (/\b(lonely|alone|isolated|friend)\b/.test(t)) {
    push("longing");
  }
  if (/\b(relationship|partner|family|mom|dad)\b/.test(t)) {
    push("care", "tenderness");
  }

  push("curiosity");

  const feelings = uniqueStrings(feelingsPool, 6).slice(0, 6);
  while (feelings.length < 4) {
    const fallback = ["uncertainty", "care", "pressure", "hope"];
    for (const f of fallback) {
      if (feelings.length >= 4) break;
      if (!feelings.map((x) => x.toLowerCase()).includes(f)) feelings.push(f);
    }
  }

  let reframe =
    "Part of you can already touch the feeling you’re chasing — not because the goal is done, but because the care behind it is real. Your mind is rehearsing importance, not failure.";

  if (/\b(behind|late|too old|everyone else)\b/.test(t)) {
    reframe =
      "You can already feel the pull toward something meaningful — that’s why “behind” stings. The feeling isn’t proof you’re late; it’s proof you’re invested, and investment counts before the finish line.";
  } else if (/\b(fear|scared|afraid|worry)\b/.test(t)) {
    reframe =
      "You can already feel how much this matters — fear is clumsy, but it often shows up when something feels important. Caring isn’t the same as being broken.";
  } else if (/\b(compare|instagram|everyone)\b/.test(t)) {
    reframe =
      "You can already feel the gap between your real life and a highlight reel — that honesty is a kind of clarity. You don’t need to win the comparison to be allowed to move at your pace.";
  } else if (/\b(overwhelm|too much|stuck)\b/.test(t)) {
    reframe =
      "You can already feel that something needs to shift — overwhelm is noisy, but it’s also information. Smaller steps aren’t a downgrade; they’re how your nervous system says yes.";
  } else if (/\b(goal|dream|build|start)\b/.test(t)) {
    reframe =
      "You can already feel the tenderness of wanting more — that’s not greed, it’s direction. Wanting is allowed before you have proof you “deserve” the outcome.";
  }

  const snippet =
    raw.length > 80 ? `${raw.slice(0, 77).trim()}…` : raw || "what you shared";

  const actions: string[] = [
    `Write one tiny thing you can control today about: “${snippet}”.`,
    "Pick the smallest version of one worry and name it in one sentence.",
    "Do a 10-minute reset: water, stretch, one slow breath before screens.",
    "Send or draft the one message you’ve been circling — even a rough note counts.",
    "Park one spiral thought in a note titled “for later” so your brain can rest.",
  ];

  if (/\b(message|text|reply|email)\b/.test(t)) {
    actions[3] =
      "Open the draft, write the first messy line only — no need to send yet.";
  }
  if (/\b(sleep|rest|tired|exhaust)\b/.test(t)) {
    actions[2] =
      "Give yourself one real pause: dim lights, phone away, 5 minutes of nothing.";
  }

  return {
    feelings,
    reframe,
    actions: actions.slice(0, 4),
  };
}
