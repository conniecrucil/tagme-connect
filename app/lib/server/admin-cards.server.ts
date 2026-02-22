import { listCards } from "~/lib/server/api-legacy/utils/supabase";

export async function listAdminCardsFromRequest(request: Request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const customer_email = url.searchParams.get("customer_email") || undefined;
  const status = url.searchParams.get("status") as "success" | "error" | "pending" | null;
  const date_from = url.searchParams.get("date_from") || undefined;
  const date_to = url.searchParams.get("date_to") || undefined;

  if (limit < 1 || limit > 100) {
    const err = new Error("Limit must be between 1 and 100");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
  if (offset < 0) {
    const err = new Error("Offset must be non-negative");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
  if (status && !["success", "error", "pending"].includes(status)) {
    const err = new Error("Status must be success, error, or pending");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
  if (date_from && isNaN(Date.parse(date_from))) {
    const err = new Error("Invalid date_from format");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
  if (date_to && isNaN(Date.parse(date_to))) {
    const err = new Error("Invalid date_to format");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }

  return listCards({
    limit,
    offset,
    customer_email,
    status: status || undefined,
    date_from,
    date_to,
  });
}
