import { redirect } from "react-router";
import { destroyAdminSession } from "~/lib/server/admin-auth-session.server";

export async function loader({ request }: { request: Request }) {
  const rawDomain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

  if (!rawDomain) {
    throw redirect("/");
  }

  const domain = rawDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const returnTo = new URL("/", request.url).toString();
  const logoutUrl = new URL(`https://${domain}/v2/logout`);
  logoutUrl.searchParams.set("returnTo", returnTo);

  if (clientId) {
    logoutUrl.searchParams.set("client_id", clientId);
  }

  const setCookie = await destroyAdminSession(request);

  throw redirect(logoutUrl.toString(), {
    headers: {
      "Set-Cookie": setCookie,
    },
  });
}

export default function LogoutPage() {
  return null;
}
