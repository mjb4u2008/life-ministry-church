"use client";

import { AdminSession } from "@/components/admin/AdminSession";
import { CareInbox } from "@/components/admin/CareInbox";

export default function AdminCarePage() {
  return <AdminSession>{({ token, logout }) => <CareInbox logout={logout} token={token} />}</AdminSession>;
}
