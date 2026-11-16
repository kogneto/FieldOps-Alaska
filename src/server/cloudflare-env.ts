import type { FeedbackEnv } from "./feedback";

// "cloudflare:workers" exists only inside the Workers runtime. Import it lazily
// by a variable name, so the dev server and the prerender step (both Node)
// never try to load it, and return null wherever it's missing.
const CLOUDFLARE_WORKERS = "cloudflare:workers";

export async function cloudflareEnv(): Promise<FeedbackEnv | null> {
  try {
    const mod = (await import(/* @vite-ignore */ CLOUDFLARE_WORKERS)) as {
      env?: Partial<FeedbackEnv>;
    };
    const env = mod.env;
    return env?.DB && env.FEEDBACK_LIMITER ? (env as FeedbackEnv) : null;
  } catch {
    return null;
  }
}
