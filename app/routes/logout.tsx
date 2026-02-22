import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef } from "react";
import { Auth0ProviderWrapper } from "~/providers/auth0-provider";

function LogoutContent() {
  const { logout } = useAuth0();
  const hasStartedLogout = useRef(false);

  useEffect(() => {
    if (hasStartedLogout.current) return;
    hasStartedLogout.current = true;

    try {
      logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Logout failed, redirecting home:", error);
      window.location.replace("/");
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      window.location.replace("/");
    }, 1500);

    return () => window.clearTimeout(fallbackTimer);
  }, [logout]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-gray-600">Signing you out...</p>
    </main>
  );
}

function LogoutFallback() {
  useEffect(() => {
    window.location.replace("/");
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-gray-600">Redirecting...</p>
    </main>
  );
}

export default function LogoutPage() {
  const hasAuth0Config =
    Boolean(import.meta.env.VITE_AUTH0_DOMAIN) &&
    Boolean(import.meta.env.VITE_AUTH0_CLIENT_ID);

  if (!hasAuth0Config) {
    return <LogoutFallback />;
  }

  return (
    <Auth0ProviderWrapper>
      <LogoutContent />
    </Auth0ProviderWrapper>
  );
}
