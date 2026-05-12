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
    "Your brain isn’t against you — it’s trying to keep what matters safe. The swirl you feel is your mind asking for a little clarity, not proof that you’ve failed.";

  if (/\b(behind|late|too old|everyone else)\b/.test(t)) {
    reframe =
      "You’re not behind — you’re building something that actually means something to you. Timelines look neat from the outside; yours can still be real and yours.";
  } else if (/\b(fear|scared|afraid|worry)\b/.test(t)) {
    reframe =
      "This fear is awkward, but it also shows you care about the outcome. Caring is loud sometimes. It doesn’t mean something is wrong with you.";
  } else if (/\b(compare|instagram|everyone)\b/.test(t)) {
    reframe =
      "Comparison steals the nuance of your own path. You’re allowed to move at a pace that fits your life — not a highlight reel.";
  } else if (/\b(overwhelm|too much|stuck)\b/.test(t)) {
    reframe =
      "When everything feels loud, your brain is asking for smaller steps — not a heroic fix tonight. One gentle move still counts.";
  } else if (/\b(goal|dream|build|start)\b/.test(t)) {
    reframe =
      "Wanting more for yourself is tender, not greedy. You can want things and still be kind to yourself while you build them.";
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
    actions: actions.slice(0, 5),
  };
}
