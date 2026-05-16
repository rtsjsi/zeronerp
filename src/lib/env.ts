/**
 * Environment Variable Helper
 * 
 * Securely retrieves environment variables, checking both Node.js process.env
 * and Cloudflare Workers bindings (via OpenNext context).
 */

export function getEnv(key: string): string | undefined {
  // 1. Check Node.js process.env first (handles NEXT_PUBLIC_ vars and local dev)
  if (process.env[key]) {
    return process.env[key];
  }

  // 2. Check Cloudflare bindings via OpenNext context
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const context = getCloudflareContext();
    
    // @ts-ignore - Dynamic key access
    if (context?.env && context.env[key]) {
      // @ts-ignore
      return context.env[key];
    }
  } catch (error) {
    // Ignore errors if we are not running inside the OpenNext Cloudflare environment
  }

  return undefined;
}
