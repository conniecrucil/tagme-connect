import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { createCookieSessionStorage } from "react-router";
import { isAdminEmailAuthorized } from "~/lib/server/admin-users.server";

export interface AdminSessionUser {
  email: string;
  sub?: string;
  name?: string;
  picture?: string;
}

interface AdminSessionData {
  user?: AdminSessionUser;
}

interface Auth0IdTokenClaims extends jwt.JwtPayload {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function getRequiredAuth0Config() {
  const rawDomain =
    process.env.AUTH0_DOMAIN ??
    process.env.VITE_AUTH0_DOMAIN ??
    "";
  const clientId =
    process.env.AUTH0_CLIENT_ID ??
    process.env.VITE_AUTH0_CLIENT_ID ??
    "";

  const domain = rawDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (!domain || !clientId) {
    throw new Error("Auth0 server configuration is missing (AUTH0_DOMAIN/VITE_AUTH0_DOMAIN and AUTH0_CLIENT_ID/VITE_AUTH0_CLIENT_ID)");
  }

  return { domain, clientId };
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    console.warn("[admin-session] Using development fallback session secret. Set ADMIN_SESSION_SECRET for stable sessions.");
    return "dev-insecure-admin-session-secret";
  }

  throw new Error("Missing ADMIN_SESSION_SECRET (or SESSION_SECRET) in production");
}

const sessionStorage = createCookieSessionStorage<AdminSessionData>({
  cookie: {
    name: "__tagme_admin_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    secrets: [getSessionSecret()],
  },
});

function getJwksClient(domain: string) {
  return jwksClient({
    jwksUri: `https://${domain}/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000,
  });
}

function getSigningKeyForDomain(domain: string) {
  const client = getJwksClient(domain);
  return (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    if (!header.kid) {
      callback(new Error("No kid in token header"));
      return;
    }

    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
        return;
      }
      if (!key) {
        callback(new Error("No signing key returned"));
        return;
      }
      callback(null, key.getPublicKey());
    });
  };
}

export async function verifyAuth0IdToken(idToken: string): Promise<AdminSessionUser> {
  if (!idToken) {
    throw new Error("idToken is required");
  }

  const { domain, clientId } = getRequiredAuth0Config();

  const decoded = await new Promise<Auth0IdTokenClaims>((resolve, reject) => {
    jwt.verify(
      idToken,
      getSigningKeyForDomain(domain),
      {
        audience: clientId,
        issuer: `https://${domain}/`,
        algorithms: ["RS256"],
      },
      (err, payload) => {
        if (err) {
          reject(err);
          return;
        }
        if (!payload || typeof payload === "string") {
          reject(new Error("Unexpected token payload"));
          return;
        }
        resolve(payload as Auth0IdTokenClaims);
      },
    );
  });

  if (!decoded.email) {
    throw new Error("Authenticated token is missing email claim");
  }

  if (decoded.email_verified === false) {
    throw new Error("Authenticated email is not verified");
  }

  return {
    email: decoded.email,
    sub: decoded.sub,
    name: decoded.name,
    picture: decoded.picture,
  };
}

export async function getAdminSession(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  console.log("[admin-session] getAdminSession", {
    hasCookieHeader: Boolean(cookieHeader),
    hasAdminSessionCookie: cookieHeader?.includes("__tagme_admin_session=") ?? false,
    cookieHeaderLength: cookieHeader?.length ?? 0,
  });
  const session = await sessionStorage.getSession(cookieHeader);
  const user = session.get("user") as AdminSessionUser | undefined;
  console.log("[admin-session] Parsed session", {
    hasUser: Boolean(user),
    email: user?.email ?? null,
  });
  return { session, user };
}

export async function commitAdminSessionForUser(request: Request, user: AdminSessionUser) {
  const { session } = await getAdminSession(request);
  session.set("user", user);
  const setCookie = await sessionStorage.commitSession(session);
  console.log("[admin-session] commitAdminSessionForUser", {
    email: user.email,
    setCookieLength: setCookie.length,
    cookiePrefix: setCookie.split(";")[0]?.slice(0, 120) ?? "",
  });
  return setCookie;
}

export async function destroyAdminSession(request: Request) {
  const { session } = await getAdminSession(request);
  const setCookie = await sessionStorage.destroySession(session);
  console.log("[admin-session] destroyAdminSession", {
    setCookieLength: setCookie.length,
  });
  return setCookie;
}

export async function getAuthorizedAdminFromSession(request: Request) {
  const { user } = await getAdminSession(request);
  if (!user?.email) {
    return { state: "unauthenticated" as const, user: null };
  }

  const authorized = await isAdminEmailAuthorized(user.email);
  if (!authorized) {
    return { state: "forbidden" as const, user };
  }

  return { state: "authorized" as const, user };
}
