/**
 * In-memory Supabase + Stripe mock for commerce runtime audit.
 * Exercises real edge-function handler code paths via HTTP.
 */

export type OrderRow = {
  id: string;
  buyer_id: string;
  subtotal_eur: number;
  total_eur: number;
  platform_fee_eur: number;
  impact_eur: number;
  status: string;
  currency: string;
  stripe_payment_intent?: string | null;
  payment_confirmed_at?: string | null;
  shipping_address?: unknown;
  contact_name?: string | null;
  contact_email?: string | null;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  creator_id: string | null;
  item_type: string;
  item_id: string | null;
  snapshot: Record<string, unknown>;
  shipping_type: string;
  quantity: number;
  unit_price_eur: number;
  shipping_eur: number;
  payout_eur: number;
  impact_eur: number;
  fulfillment_status: string;
  payout_status: string;
};

export class MockCommerceStore {
  orders = new Map<string, OrderRow>();
  orderItems: OrderItemRow[] = [];
  commerceEvents: Array<Record<string, unknown>> = [];
  webhookEvents = new Map<string, { id: string; status: string }>();
  notifications: Array<Record<string, unknown>> = [];
  impactRounds = new Map<string, { id: string; pool_eur: number; status: string }>();
  creatorWallets = new Map<string, { user_id: string; balance: number; total_earned: number }>();
  priceAuthority = new Map<string, { item_id: string; price_eur: number }>();
  paymentIntents = new Map<string, {
    id: string;
    amount: number;
    currency: string;
    client_secret: string;
    metadata: Record<string, string>;
    status: string;
  }>();
  users = new Map<string, { id: string; email: string }>();
  profiles = new Map<string, { membership_type: string }>();

  private counters = { order: 0, item: 0, pi: 0, webhook: 0, notif: 0 };

  constructor() {
    const buyerId = "buyer-uuid-001";
    const creatorId = "creator-uuid-001";
    const workId = "work-uuid-001";
    this.users.set(buyerId, { id: buyerId, email: "buyer@test.hui" });
    this.users.set(creatorId, { id: creatorId, email: "creator@test.hui" });
    this.profiles.set("admin-uuid", { membership_type: "admin" });
    this.priceAuthority.set(workId, { item_id: workId, price_eur: 25.0 });
    this.impactRounds.set("round-1", { id: "round-1", pool_eur: 100, status: "active" });
    this.creatorWallets.set(creatorId, { user_id: creatorId, balance: 0, total_earned: 0 });
  }

  nextOrderId() {
    this.counters.order += 1;
    return `order-${String(this.counters.order).padStart(4, "0")}`;
  }

  nextItemId() {
    this.counters.item += 1;
    return `item-${String(this.counters.item).padStart(4, "0")}`;
  }

  nextPiId() {
    this.counters.pi += 1;
    return `pi_test_${String(this.counters.pi).padStart(4, "0")}`;
  }

  nextWebhookId() {
    this.counters.webhook += 1;
    return `evt_test_${String(this.counters.webhook).padStart(4, "0")}`;
  }
}

export function createMockSupabaseHandler(store: MockCommerceStore, serviceRole = true) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Auth: getUser
    if (path.includes("/auth/v1/user") && method === "GET") {
      const auth = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
      const user = store.users.get(auth);
      if (!user) {
        return json({ error: "invalid" }, 401);
      }
      return json({ user });
    }

    // commerce_price_authority
    if (path.includes("/rest/v1/commerce_price_authority")) {
      const ids = url.searchParams.get("item_id")?.match(/in\.\(([^)]+)\)/)?.[1]?.split(",") ?? [];
      const rows = ids.map((id) => store.priceAuthority.get(id)).filter(Boolean);
      return json(rows);
    }

    // orders
    if (path.includes("/rest/v1/orders")) {
      if (method === "POST") {
        const body = await req.json();
        const row = Array.isArray(body) ? body[0] : body;
        const id = store.nextOrderId();
        const order: OrderRow = { id, ...row };
        store.orders.set(id, order);
        return json([{ id }], 201, { Prefer: "return=representation" });
      }
      if (method === "PATCH") {
        const body = await req.json();
        const idFilter = url.searchParams.get("id")?.match(/eq\.([^&]+)/)?.[1];
        const statusFilter = url.searchParams.get("status")?.match(/eq\.([^&]+)/)?.[1];
        for (const [id, order] of store.orders) {
          if (idFilter && id !== idFilter) continue;
          if (statusFilter && order.status !== statusFilter) continue;
          Object.assign(order, body);
        }
        return json({}, 204);
      }
      if (method === "GET" && url.searchParams.has("stripe_payment_intent")) {
        const pi = url.searchParams.get("stripe_payment_intent")?.match(/eq\.([^&]+)/)?.[1];
        const status = url.searchParams.get("status")?.match(/eq\.([^&]+)/)?.[1];
        const order = [...store.orders.values()].find(
          (o) => o.stripe_payment_intent === pi && (!status || o.status === status),
        );
        if (!order) return json({ message: "not found" }, 404);
        const items = store.orderItems.filter((i) => i.order_id === order.id);
        return json({ ...order, order_items: items });
      }
    }

    // order_items
    if (path.includes("/rest/v1/order_items")) {
      if (method === "POST") {
        const body = await req.json();
        const rows = Array.isArray(body) ? body : [body];
        for (const row of rows) {
          store.orderItems.push({ id: store.nextItemId(), ...row });
        }
        return json(rows, 201);
      }
    }

    // commerce_events
    if (path.includes("/rest/v1/commerce_events") && method === "POST") {
      const body = await req.json();
      store.commerceEvents.push(body);
      return json(body, 201);
    }

    // webhook_events
    if (path.includes("/rest/v1/webhook_events")) {
      if (method === "GET") {
        const evtId = url.searchParams.get("stripe_event_id")?.match(/eq\.([^&]+)/)?.[1];
        const existing = evtId ? store.webhookEvents.get(evtId) : null;
        if (!existing) return json({ message: "not found" }, 404);
        return json(existing);
      }
      if (method === "POST") {
        const body = await req.json();
        if (store.webhookEvents.has(body.stripe_event_id)) {
          return json({ message: "duplicate" }, 409);
        }
        const id = store.nextWebhookId();
        store.webhookEvents.set(body.stripe_event_id, { id, status: body.status });
        return json({ id }, 201);
      }
      if (method === "PATCH") {
        const body = await req.json();
        const evtId = url.searchParams.get("stripe_event_id")?.match(/eq\.([^&]+)/)?.[1];
        if (evtId && store.webhookEvents.has(evtId)) {
          store.webhookEvents.get(evtId)!.status = body.status;
        }
        return json({}, 204);
      }
    }

    // notifications
    if (path.includes("/rest/v1/notifications") && method === "POST") {
      const body = await req.json();
      store.notifications.push({ id: `notif-${store.notifications.length + 1}`, ...body });
      return json(body, 201);
    }

    // impact_rounds
    if (path.includes("/rest/v1/impact_rounds")) {
      if (method === "GET") {
        const active = [...store.impactRounds.values()].find((r) => r.status === "active");
        return json(active ?? null);
      }
      if (method === "PATCH") {
        const body = await req.json();
        const id = url.searchParams.get("id")?.match(/eq\.([^&]+)/)?.[1];
        if (id && store.impactRounds.has(id)) {
          Object.assign(store.impactRounds.get(id)!, body);
        }
        return json({}, 204);
      }
    }

    // profiles
    if (path.includes("/rest/v1/profiles")) {
      const id = url.searchParams.get("id")?.match(/eq\.([^&]+)/)?.[1];
      const profile = id ? store.profiles.get(id) : null;
      return json(profile ?? { membership_type: "user" });
    }

    return json({ error: `unhandled mock path: ${method} ${path}` }, 404);
  };
}

export function createMockStripeHandler(store: MockCommerceStore) {
  const createdKeys = new Set<string>();

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname.endsWith("/payment_intents")) {
      const idempotencyKey = req.headers.get("Idempotency-Key") ?? "";
      const body = await req.json();

      if (idempotencyKey && createdKeys.has(idempotencyKey)) {
        const existing = [...store.paymentIntents.values()].find(
          (pi) => pi.metadata.hui_order_id && idempotencyKey.includes(pi.metadata.hui_order_id),
        );
        if (existing) {
          return json(existing);
        }
      }

      const id = store.nextPiId();
      const pi = {
        id,
        amount: body.amount,
        currency: body.currency,
        client_secret: `${id}_secret_test`,
        metadata: body.metadata ?? {},
        status: "requires_payment_method",
      };
      store.paymentIntents.set(id, pi);
      if (idempotencyKey) createdKeys.add(idempotencyKey);

      return json(pi);
    }

    if (req.method === "POST" && url.pathname.includes("/webhooks/construct")) {
      return json({ error: "use stripe.webhooks.constructEvent in-process" }, 400);
    }

    return json({ error: `unhandled stripe mock: ${req.method} ${url.pathname}` }, 404);
  };
}

function json(data: unknown, status = 200, _headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
