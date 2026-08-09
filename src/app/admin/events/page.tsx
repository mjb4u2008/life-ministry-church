"use client";

import { AdminSession } from "@/components/admin/AdminSession";
import { EventCenter } from "@/components/admin/EventCenter";

export default function AdminEventsPage() {
  return <AdminSession>{({ token, logout }) => <EventCenter logout={logout} token={token} />}</AdminSession>;
}
