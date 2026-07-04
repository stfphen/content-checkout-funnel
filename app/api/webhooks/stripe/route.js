import { NextResponse } from "next/server";
import {
  getLeadById,
  markStripeEventProcessed,
  unmarkStripeEventProcessed,
  updateLeadResearch
} from "../../../../lib/store";
import { handleWebhookEvent, verifyWebhookEvent } from "../../../../lib/payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook endpoint. Must NOT sit behind admin auth/CSRF. Reads the raw
 * body for signature verification, then fulfills checkout.session.completed by
 * marking the lead paid. Idempotency: the event id is claimed in the
 * processed_stripe_events ledger BEFORE fulfilling, so at-least-once delivery
 * (including concurrent retries) can't double-fulfill; a thrown fulfillment
 * releases the claim and returns 500 so Stripe retries.
 */
export async function POST(request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  const verified = await verifyWebhookEvent(rawBody, signature);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error || "Invalid signature." }, { status: 400 });
  }

  const fulfillment = handleWebhookEvent(verified.event);
  if (!fulfillment) {
    // Event we don't act on — acknowledge so Stripe stops retrying.
    return NextResponse.json({ received: true, ignored: true });
  }

  const lead = await getLeadById(fulfillment.leadId);
  if (!lead) {
    // Non-2xx so Stripe retries (a transient read failure must not lose the
    // event). A genuinely deleted lead retries until Stripe expires it.
    return NextResponse.json({ received: false, leadMissing: true }, { status: 500 });
  }

  const eventId = fulfillment.order.eventId;
  const firstDelivery = await markStripeEventProcessed(eventId);
  if (!firstDelivery) {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  const existingOrder = (lead.sourceMetadata || lead.metadata || {}).order || {};
  if (existingOrder.status === "paid") {
    // Defense-in-depth behind the ledger (covers pre-ledger orders).
    return NextResponse.json({ received: true, alreadyPaid: true });
  }

  try {
    await updateLeadResearch(fulfillment.leadId, {
      status: "won",
      metadata: { order: { ...existingOrder, ...fulfillment.order } }
    });
  } catch (error) {
    await unmarkStripeEventProcessed(eventId);
    return NextResponse.json({ received: false, error: error.message || "Fulfillment failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
