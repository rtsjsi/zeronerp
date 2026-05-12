import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Cloudflare Configuration for ZeronERP
 * 
 * We are enabling 'split' mode to break the application into multiple
 * smaller workers, helping us stay under the 3MiB limit of the Free plan.
 */
export default defineCloudflareConfig({
  functions: {
    // Default worker configuration
    default: {
      minify: true,
    },
    // Split routes into separate workers to reduce individual worker size
    dashboard: {
      patterns: [
        "dashboard", 
        "dashboard/*", 
        "inventory", 
        "inventory/*", 
        "procurement", 
        "procurement/*", 
        "sales", 
        "sales/*", 
        "finance", 
        "finance/*", 
        "hr", 
        "hr/*"
      ],
      minify: true,
    },
    api: {
      patterns: ["api/*"],
      minify: true,
    },
    auth: {
      patterns: ["login", "login/*", "api/auth/*"],
      minify: true,
    }
  }
});
