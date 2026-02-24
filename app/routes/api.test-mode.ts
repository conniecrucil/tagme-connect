import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const active = String(process.env.TEST_ENV || "").toLowerCase() === "true";

  return new Response(JSON.stringify({ active }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
