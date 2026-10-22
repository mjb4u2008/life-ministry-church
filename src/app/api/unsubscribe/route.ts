import { NextRequest, NextResponse } from "next/server";
import { MessagingRepository, SubscriberNotFoundError, verifyUnsubscribeToken } from "@/lib/messaging";

function redirect(request: NextRequest, status: "success" | "invalid") {
  const response = NextResponse.redirect(new URL(`/unsubscribe?status=${status}`, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const token = contentType.includes("application/json")
      ? (await request.json() as Record<string, unknown>).token
      : (await request.formData()).get("token");
    const subscriberId = verifyUnsubscribeToken(token);
    if (!subscriberId) return redirect(request, "invalid");
    try { await new MessagingRepository().suppress(subscriberId, "unsubscribe"); }
    catch (error) { if (!(error instanceof SubscriberNotFoundError)) throw error; }
    return redirect(request, "success");
  } catch (error) {
    console.error("Unsubscribe failed", error instanceof Error ? error.name : "UnknownError");
    return redirect(request, "invalid");
  }
}
