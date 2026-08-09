import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  GatheringRepository,
  GatheringRevisionConflictError,
  GatheringValidationError,
  parseGatheringPutCommand,
  serializePublicGatherings,
} from "@/lib/gatherings";

function bearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length);
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const repository = new GatheringRepository();
    const store = await repository.getEffectiveStore();
    const token = bearerToken(request);

    if (token) {
      if (!verifyToken(token)) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
      }
      return noStoreJson(store);
    }

    return noStoreJson(serializePublicGatherings(store));
  } catch (error) {
    console.error("Error fetching gatherings:", error);
    return noStoreJson(
      { error: "Failed to fetch gatherings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = bearerToken(request);
  if (!token || !verifyToken(token)) {
    return noStoreJson({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const command = parseGatheringPutCommand(await request.json());
    const repository = new GatheringRepository();
    let store;
    if (command.operation === "upsert-series") {
      store = await repository.upsertSeries(
        command.series,
        command.expectedRevision,
      );
    } else if (command.operation === "upsert-occurrence") {
      store = await repository.upsertOccurrence(
        command.occurrence,
        command.expectedRevision,
      );
    } else if (command.operation === "publish-occurrence") {
      store = await repository.publishOccurrence(
        command.series,
        command.occurrence,
        command.expectedRevision,
      );
    } else {
      store = await repository.deleteOccurrence(
        command.occurrenceId,
        command.expectedRevision,
      );
    }
    return noStoreJson(store);
  } catch (error) {
    if (error instanceof GatheringValidationError) {
      return noStoreJson(
        { error: "Invalid gathering data", issues: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof GatheringRevisionConflictError) {
      return noStoreJson(
        {
          error: "Gatherings changed since they were loaded",
          expectedRevision: error.expectedRevision,
          actualRevision: error.actualRevision,
        },
        { status: 409 },
      );
    }
    if (error instanceof SyntaxError) {
      return noStoreJson({ error: "Invalid JSON body" }, { status: 400 });
    }
    console.error("Error updating gatherings:", error);
    return noStoreJson(
      { error: "Failed to update gatherings" },
      { status: 500 },
    );
  }
}
