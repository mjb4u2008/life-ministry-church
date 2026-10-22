import { NextResponse } from "next/server";
import { EventRepository, eventCalendar, selectPublicEvent } from "@/lib/events";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const now = new Date();
    const store = await new EventRepository().getStore(now);
    const event = selectPublicEvent(store, id, now);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new NextResponse(eventCalendar(event, now), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="life-ministry-event.ics"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Event calendar failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Calendar could not be created" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
