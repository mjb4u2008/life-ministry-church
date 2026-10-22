"use client";

import { AdminSession } from "@/components/admin/AdminSession";
import { GivingSettings } from "@/components/admin/GivingSettings";

export default function AdminGivingPage() {
  return <AdminSession>{({ token, logout }) => <GivingSettings logout={logout} token={token} />}</AdminSession>;
}
