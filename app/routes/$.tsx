import { redirect } from "react-router";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  console.warn("[catchall.loader] Unmatched route request", {
    method: request.method,
    path: url.pathname,
    search: url.search,
  });
  
  // If someone tries to access /index.html, redirect to home
  if (url.pathname === "/index.html") {
    throw redirect("/", { status: 301 });
  }
  
  // For any other unmatched routes, show 404
  throw new Response("Not Found", { status: 404 });
}

export default function CatchAll() {
  return null;
}
