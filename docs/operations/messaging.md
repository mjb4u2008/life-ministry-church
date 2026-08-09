# Messaging operations

## Consent and suppression

Every subscriber record stores when, where, and under which copy version consent
was recorded. Public signup requires an explicit checkbox. Admin-entered and
imported contacts require the administrator to confirm that each person asked to
receive messages. Email unsubscribe links are signed and contain only the record
ID; they remain valid until `ADMIN_PASSWORD` changes. Suppressed records are
excluded by the shared selector used for both manual and scheduled sends.

## Email unsubscribe

Resend messages link to `/unsubscribe`, where the person confirms before the
suppression write occurs. The confirmation step prevents link-scanning software
from unsubscribing people merely by opening the URL. Provider errors are reduced
to aggregate counts; recipient contact details and provider error bodies are not
returned or logged.

## SMS STOP status: blocked on provider configuration

Outbound texts include `Reply STOP to opt out`, and locally suppressed phone
records are never selected. Automatic synchronization of inbound STOP events into
the local suppression record is intentionally deferred. It cannot be safely
implemented or verified until the production Twilio number, Messaging Service,
public webhook URL, and request-signature configuration are supplied.

Before enabling production SMS, configure and test a Twilio webhook that:

1. validates Twilio's request signature;
2. maps STOP/unsubscribe events to the normalized phone record;
3. writes `suppressionReason: "provider"` without logging the phone number;
4. treats repeated events idempotently; and
5. is verified end to end against the production sender.

Until that work is complete, Twilio's provider-level STOP handling is the external
safety net; the site does not claim that inbound STOP is synchronized locally.
SMS delivery fails closed unless `TWILIO_STOP_SYNC_VERIFIED=true` is deliberately
set after the production webhook passes every check above.

Scheduled email retries use a stable
[Resend idempotency key](https://resend.com/docs/dashboard/emails/idempotency-keys).
SMS delivery leases are intentionally not auto-reclaimed because Twilio message
creation does not provide an equivalent deduplication guarantee; investigate an
in-flight SMS lease manually instead of risking a duplicate text.
