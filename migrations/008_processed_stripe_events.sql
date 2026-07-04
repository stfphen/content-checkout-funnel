-- 008: Stripe webhook idempotency ledger (event.id insert-or-ignore).
-- The webhook claims an event id here BEFORE fulfilling so at-least-once
-- delivery (and concurrent retries) can't double-fulfill. Keep the DDL
-- consistent with the inline bootstrap in lib/store.js ensureSchema.

create table if not exists processed_stripe_events (
  event_id text primary key,
  created_at timestamptz not null default now()
);
