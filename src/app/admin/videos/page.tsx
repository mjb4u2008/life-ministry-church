"use client";

import { AdminSession } from "@/components/admin/AdminSession";
import { VideoEditor } from "@/components/admin/VideoEditor";

export default function AdminVideosPage() {
  return <AdminSession>{({ token, logout }) => <VideoEditor logout={logout} token={token} />}</AdminSession>;
}
