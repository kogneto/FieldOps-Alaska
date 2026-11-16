// Nitro plugin: on the Worker's daily cron (wrangler.jsonc "triggers"), delete
// feedback notes older than the retention period. Without this, old notes would
// only go when a new note arrives or the notes are read.
import { definePlugin } from "nitro";
import { purgeOldNotes, type FeedbackEnv } from "./feedback";

interface ScheduledEvent {
  env: Partial<FeedbackEnv>;
  context: { waitUntil(promise: Promise<unknown>): void };
}

export default definePlugin((nitroApp) => {
  const hooks = nitroApp.hooks as unknown as {
    hook(name: "cloudflare:scheduled", fn: (event: ScheduledEvent) => void): void;
  };
  hooks.hook("cloudflare:scheduled", ({ env, context }) => {
    if (env.DB) context.waitUntil(purgeOldNotes(env.DB, new Date()));
  });
});
