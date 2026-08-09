"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminSession } from "@/components/admin/AdminSession";

export default function AdminPage() {
  return (
    <AdminSession>
      {({ token, logout }) => <AdminDashboard logout={logout} token={token} />}
    </AdminSession>
  );
}
