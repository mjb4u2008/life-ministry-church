"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicGatheringsResponse } from "@/lib/gatherings";

interface GatheringsState {
  data: PublicGatheringsResponse | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
}

const REFRESH_INTERVAL_MS = 30_000;

function isPublicGatheringsResponse(value: unknown): value is PublicGatheringsResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublicGatheringsResponse>;
  return (
    Array.isArray(candidate.series) &&
    Array.isArray(candidate.upcoming) &&
    Array.isArray(candidate.recent) &&
    (candidate.featured === null || typeof candidate.featured === "object")
  );
}

export function useGatherings(): GatheringsState {
  const [data, setData] = useState<PublicGatheringsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestVersion, setRequestVersion] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/gatherings", {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      const payload: unknown = await response.json();
      if (!isPublicGatheringsResponse(payload)) {
        throw new Error("The gathering response was not valid");
      }
      setData(payload);
      setError(null);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError("We couldn’t load the gathering schedule right now.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const refresh = window.setInterval(() => void load(controller.signal), REFRESH_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(refresh);
    };
  }, [load, requestVersion]);

  return {
    data,
    error,
    loading,
    retry: () => {
      setLoading(true);
      setRequestVersion((version) => version + 1);
    },
  };
}
