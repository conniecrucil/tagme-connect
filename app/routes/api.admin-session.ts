import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  commitAdminSessionForUser,
  destroyAdminSession,
  getAuthorizedAdminFromSession,
  verifyAuth0IdToken,
} from "~/lib/server/admin-auth-session.server";

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function sanitizeReturnTo(value: FormDataEntryValue | null, request: Request) {
  const fallback = "/admin";
  if (typeof value !== "string" || !value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  const currentUrl = new URL(request.url);
  const targetUrl = new URL(value, currentUrl.origin);
  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const result = await getAuthorizedAdminFromSession(request);
  return json({
    state: result.state,
    user: result.user,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "DELETE") {
    const setCookie = await destroyAdminSession(request);
    return json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": setCookie,
        },
      },
    );
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    const isFormPost =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data");

    let idToken = "";
    let returnTo = "/admin";

    if (isFormPost) {
      const formData = await request.formData();
      const rawIdToken = formData.get("idToken");
      idToken = typeof rawIdToken === "string" ? rawIdToken : "";
      returnTo = sanitizeReturnTo(formData.get("returnTo"), request);
    } else {
      const body = (await request.json()) as { idToken?: string };
      idToken = body.idToken ?? "";
    }
    const user = await verifyAuth0IdToken(idToken);
    const setCookie = await commitAdminSessionForUser(request, user);

    if (isFormPost) {
      return redirect(returnTo, {
        headers: {
          "Set-Cookie": setCookie,
        },
      });
    }

    return json(
      { ok: true, user },
      {
        headers: {
          "Set-Cookie": setCookie,
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("[api.admin-session] Failed to establish admin session:", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to establish session",
      },
      { status: 401 },
    );
  }
}

export default function ApiAdminSessionRoute() {
  return null;
}
