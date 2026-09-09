import { updateSession } from "@/utils/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all paths except static assets, API webhooks, and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|swe-worker-.*|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
