import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { listAdminCardsFromRequest } from "~/lib/server/admin-cards.server";
import { getDashboardMetricsData } from "~/lib/server/admin-dashboard.server";
import {
  getAdminOrderDetails,
  getStripeReceiptUrlForSession,
  listAdminOrdersFromRequest,
  updateAdminOrderFulfillment,
} from "~/lib/server/admin-orders.server";
import { createAdminUser, deleteAdminUser, isAdminEmailAuthorized, listAdminUsers } from "~/lib/server/admin-users.server";

type LegacyRequestHandler = (request: Request, context: any) => Promise<Response> | Response;

function importLegacyApiModule(moduleName: string) {
  return import(`../lib/server/api-legacy/${moduleName}`);
}

const requestHandlerLoaders: Record<string, () => Promise<LegacyRequestHandler>> = {
  "admin-create-contact": async () => (await importLegacyApiModule("admin-create-contact")).default as LegacyRequestHandler,
  "create-checkout-session": async () => (await importLegacyApiModule("create-checkout-session")).default as LegacyRequestHandler,
  "delete-card": async () => (await importLegacyApiModule("delete-card")).default as LegacyRequestHandler,
  "get-card-details": async () => (await importLegacyApiModule("get-card-details")).default as LegacyRequestHandler,
  "get-stripe-session": async () => (await importLegacyApiModule("get-stripe-session")).default as LegacyRequestHandler,
  "send-purchase-emails": async () => (await importLegacyApiModule("send-purchase-emails")).default as LegacyRequestHandler,
  "update-contact-data": async () => (await importLegacyApiModule("update-contact-data")).default as LegacyRequestHandler,
  "upload-logo-zip": async () => (await importLegacyApiModule("upload-logo-zip")).default as LegacyRequestHandler,
  "upload-to-s3": async () => (await importLegacyApiModule("upload-to-s3")).default as LegacyRequestHandler,
  "validate-card": async () => (await importLegacyApiModule("validate-card")).default as LegacyRequestHandler,
};

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function netlifyEventFromRequest(request: Request) {
  const url = new URL(request.url);

  return {
    httpMethod: request.method,
    path: url.pathname,
    rawUrl: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    body: null,
    isBase64Encoded: false,
  };
}

async function callLegacyHandler(functionName: string | undefined, request: Request) {
  if (!functionName) {
    return jsonError(400, "Function name is required");
  }

  if (functionName === "check-system-status") {
    const { handler: checkSystemStatusHandler } = await importLegacyApiModule("check-system-status");
    const result = (await checkSystemStatusHandler(
      netlifyEventFromRequest(request) as never,
      {} as never,
      (() => {}) as never,
    )) as { statusCode?: number; headers?: HeadersInit; body?: string } | void;

    if (!result) {
      return jsonError(500, "System status handler returned no response");
    }

    return new Response(result.body ?? "", {
      status: result.statusCode ?? 200,
      headers: result.headers,
    });
  }

  if (functionName === "admin-users-list") {
    if (request.method !== "GET") return jsonError(405, "Method not allowed");
    try {
      return new Response(JSON.stringify({ users: await listAdminUsers() }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return jsonError(500, error instanceof Error ? error.message : "Failed to fetch admin users");
    }
  }

  if (functionName === "admin-users-create") {
    if (request.method !== "POST") return jsonError(405, "Method not allowed");
    try {
      const body = await request.json();
      const user = await createAdminUser(body.email);
      return new Response(JSON.stringify({ user }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const status = (error as Error & { status?: number })?.status ?? 500;
      return jsonError(status, error instanceof Error ? error.message : "Failed to create admin user");
    }
  }

  if (functionName === "admin-users-delete") {
    if (request.method !== "DELETE") return jsonError(405, "Method not allowed");
    try {
      const body = await request.json();
      await deleteAdminUser(body.id);
      return new Response(JSON.stringify({ success: true, message: "Admin user deleted successfully" }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const status = (error as Error & { status?: number })?.status ?? 500;
      return jsonError(status, error instanceof Error ? error.message : "Failed to delete admin user");
    }
  }

  if (functionName === "check-admin-authorization") {
    if (request.method !== "GET") return jsonError(405, "Method not allowed");
    try {
      const email = new URL(request.url).searchParams.get("email");
      if (!email) {
        return new Response(JSON.stringify({ authorized: false, error: "Email parameter is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const authorized = await isAdminEmailAuthorized(email);
      return new Response(JSON.stringify({ authorized, email }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          authorized: false,
          error: error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (functionName === "get-dashboard-metrics") {
    if (request.method !== "GET") return jsonError(405, "Method not allowed");
    try {
      return new Response(JSON.stringify(await getDashboardMetricsData()), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch dashboard metrics",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (functionName === "get-orders") {
    if (request.method !== "GET") return jsonError(405, "Method not allowed");
    try {
      return new Response(JSON.stringify(await listAdminOrdersFromRequest(request)), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders", details: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (functionName === "get-order") {
    if (request.method !== "GET") return jsonError(405, "Method not allowed");
    try {
      const orderId = new URL(request.url).searchParams.get("orderId") ?? "";
      const data = await getAdminOrderDetails(orderId);
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      const status = (error as Error & { status?: number })?.status ?? 500;
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch order" }),
        { status, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (functionName === "update-order-fulfillment") {
    if (request.method !== "POST") return jsonError(405, "Method not allowed");
    try {
      const body = await request.json();
      const updated = await updateAdminOrderFulfillment(body);
      return new Response(JSON.stringify(updated), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      const status = (error as Error & { status?: number })?.status ?? 500;
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Failed to update order fulfillment" }),
        { status, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (functionName === "get-stripe-receipt-url") {
    if (request.method !== "POST") return jsonError(405, "Method not allowed");
    try {
      const body = await request.json();
      return new Response(JSON.stringify(await getStripeReceiptUrlForSession(body.sessionId)), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const status = (error as Error & { status?: number })?.status ?? 500;
      return new Response(
        JSON.stringify({ error: "Failed to retrieve receipt URL", details: error instanceof Error ? error.message : "Unknown error" }),
        { status, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (functionName === "get-cards") {
    if (request.method !== "GET") return jsonError(405, "Method not allowed");
    try {
      return new Response(JSON.stringify(await listAdminCardsFromRequest(request)), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const status = (error as Error & { status?: number })?.status ?? 500;
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Failed to retrieve cards" }),
        { status, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const loadHandler = requestHandlerLoaders[functionName];
  if (!loadHandler) {
    return jsonError(404, `Unknown API endpoint: ${functionName}`);
  }

  try {
    const handler = await loadHandler();
    return await handler(request, {});
  } catch (error) {
    console.error(`Error in API endpoint ${functionName}:`, error);
    return jsonError(500, error instanceof Error ? error.message : "Internal server error");
  }
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  return callLegacyHandler(params.function, request);
}

export async function action({ params, request }: ActionFunctionArgs) {
  return callLegacyHandler(params.function, request);
}

export default function ApiFunctionRoute() {
  return null;
}
