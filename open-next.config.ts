import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Cloudflare Configuration for ZeronERP
 * 
 * We are enabling 'split' mode to break the application into multiple
 * smaller workers, helping us stay under the 3MiB limit of the Free plan.
 */
export default defineCloudflareConfig({
  default: {
    minify: true,
  },
  // Split routes into separate workers to reduce individual worker size
  functions: {
    dashboard: {
      patterns: ["dashboard/*", "inventory/*", "procurement/*", "sales/*", "finance/*", "hr/*"],
      minify: true,
    },
    api: {
      patterns: ["api/*"],
      minify: true,
    },
    auth: {
      patterns: ["login/*", "api/auth/*"],
      minify: true,
    }
  }
});
