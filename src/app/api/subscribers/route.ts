import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  ADMIN_CONSENT_VERSION,
  MessagingRepository,
  MessagingValidationError,
  PUBLIC_CONSENT_VERSION,
  SubscriberAlreadyActiveError,
  SubscriberNotFoundError,
  SubscriberSuppressedError,
} from "@/lib/messaging";
import { checkDurableRateLimit, requestIdentifier } from "@/lib/rate-limit";

function bearer(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const token = bearer(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const store = await new MessagingRepository().getStore();
    return json({ subscribers: store.subscribers, revision: store.revision });
  } catch (error) {
    console.error("Subscriber read failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let authenticated = false;
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = bearer(request);
    authenticated = token ? verifyToken(token) : false;
    if (token && !authenticated) return json({ error: "Unauthorized" }, { status: 401 });

    if (body.bulk === true) {
      if (!authenticated) return json({ error: "Unauthorized" }, { status: 401 });
      if (body.consentConfirmed !== true) {
        return json({ error: "Confirm that every imported contact asked to receive ministry messages" }, { status: 400 });
      }
      if (!Array.isArray(body.contacts) || body.contacts.length === 0 || body.contacts.length > 500) {
        return json({ error: "Provide between 1 and 500 contacts" }, { status: 400 });
      }
      let added = 0;
      let skipped = 0;
      const failedRows: number[] = [];
      for (const [index, contact] of body.contacts.entries()) {
        try {
          if (!contact || typeof contact !== "object" || Array.isArray(contact)) throw new MessagingValidationError(["Contact is invalid"]);
          const input = contact as Record<string, unknown>;
          await new MessagingRepository().add({
            name: input.name as string,
            contactType: input.contactType as "email" | "phone",
            contact: input.contact as string,
            consentSource: "admin-import",
            consentVersion: ADMIN_CONSENT_VERSION,
          }, new Date(), true);
          added += 1;
        } catch (error) {
          if (error instanceof SubscriberAlreadyActiveError) skipped += 1;
          else failedRows.push(index + 1);
        }
      }
      return json({ added, skipped, failedRows }, { status: 201 });
    }

    if (authenticated) {
      if (body.consentConfirmed !== true) {
        return json({ error: "Confirm that this person asked to receive ministry messages" }, { status: 400 });
      }
    } else {
      const limit = await checkDurableRateLimit({
        identifier: requestIdentifier(request.headers),
        scope: "subscriber-create",
        limit: 8,
        windowSeconds: 600,
      });
      if (!limit.allowed) return json({ error: "Too many signup attempts. Please wait and try again." }, { status: 429 });
      if (body.consent !== true) return json({ error: "Please agree to receive ministry reminders" }, { status: 400 });
    }

    const source = authenticated
      ? "admin-manual" as const
      : body.signupContext === "reminder-form" ? "reminder-form" as const : "homepage" as const;
    const subscriber = await new MessagingRepository().add({
      name: body.name as string,
      contactType: body.contactType as "email" | "phone",
      contact: body.contact as string,
      consentSource: source,
      consentVersion: authenticated ? ADMIN_CONSENT_VERSION : PUBLIC_CONSENT_VERSION,
    }, new Date(), authenticated);
    return json(authenticated ? subscriber : { subscribed: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SubscriberAlreadyActiveError) {
      return authenticated
        ? json({ error: "This contact is already subscribed" }, { status: 409 })
        : json({ subscribed: true }, { status: 201 });
    }
    if (error instanceof SubscriberSuppressedError) {
      return json({ subscribed: true }, { status: 201 });
    }
    if (error instanceof MessagingValidationError || error instanceof SyntaxError) {
      return json({ error: error instanceof MessagingValidationError ? error.issues.join(". ") : "Invalid JSON body" }, { status: 400 });
    }
    console.error("Subscriber write failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = bearer(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return json({ error: "Subscriber ID is required" }, { status: 400 });
  try {
    await new MessagingRepository().delete(id);
    return json({ success: true });
  } catch (error) {
    if (error instanceof SubscriberNotFoundError) return json({ error: "Subscriber not found" }, { status: 404 });
    console.error("Subscriber delete failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
