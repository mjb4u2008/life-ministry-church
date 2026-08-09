import { NextResponse } from "next/server";

// The previous Stripe checkout is intentionally unavailable while giving is
// handled by Zeffy. Its implementation remains beside this route as a dormant
// rollback artifact until the production Zeffy campaign has been verified.
export async function POST() {
  return new NextResponse(null, { status: 404 });
}
