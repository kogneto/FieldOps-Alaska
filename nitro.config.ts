// Read by Nitro itself (through c12) alongside the options Lovable's Vite
// config passes it. Only adds the plugin that runs the feedback purge on the
// Worker's daily cron.
import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  plugins: ["./src/server/purge-plugin.ts"],
});
