/**
 * Root page — redirects to /dashboard or /login
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  // In production, this would check auth state server-side.
  // For now, redirect to login.
  redirect("/login");
}
