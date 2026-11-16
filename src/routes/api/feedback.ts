import { createFileRoute } from "@tanstack/react-router";
import { cloudflareEnv } from "@/server/cloudflare-env";
import { handleFeedback } from "@/server/feedback";

// Server-only route: TanStack Start strips these handlers from the client bundle.
export const Route = createFileRoute("/api/feedback")({
  server: {
    handlers: {
      POST: async ({ request }) => handleFeedback(request, await cloudflareEnv(), new Date()),
      GET: () =>
        new Response(JSON.stringify({ error: "Send notes with POST." }), {
          status: 405,
          headers: { allow: "POST", "content-type": "application/json; charset=utf-8" },
        }),
    },
  },
});
