"use client";

import { useParams } from "next/navigation";
import { AdminSession } from "@/components/admin/AdminSession";
import { GatheringEditor } from "@/components/admin/GatheringEditor";

export default function AdminGatheringPage() {
  const params = useParams<{ seriesId: string }>();
  return (
    <AdminSession>
      {({ token, logout }) => (
        <GatheringEditor
          onUnauthorized={logout}
          seriesId={params.seriesId}
          token={token}
        />
      )}
    </AdminSession>
  );
}
