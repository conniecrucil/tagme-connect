import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { listAdminCardsFromRequest } from "~/lib/server/admin-cards.server";
import { getDashboardMetricsData } from "~/lib/server/admin-dashboard.server";
import { getAdminOrderDetails, listAdminOrdersFromRequest } from "~/lib/server/admin-orders.server";

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function callLegacyHandler(functionName: string | undefined, request: Request) {
  const url = new URL(request.url);
  console.log("[api.$function] Request", {
    method: request.method,
    path: url.pathname,
    functionName: functionName ?? null,
  });

  if (!functionName) {
    return jsonError(400, "Function name is required");
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

  console.warn("[api.$function] Unknown API endpoint", {
    method: request.method,
    path: url.pathname,
    functionName,
  });
  return jsonError(404, `Unknown API endpoint: ${functionName}`);
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
