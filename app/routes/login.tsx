import type { LoaderFunctionArgs } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";
import { Navigate, redirect, useSearchParams } from "react-router";
import { Auth0ProviderWrapper } from "~/providers/auth0-provider";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export function meta() {
  return [
    { title: "Login - TagMe Connections" },
    { name: "description", content: "Sign in to access the TagMe admin dashboard." },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.TEST_ENV === "true") {
    const url = new URL(request.url);
    const returnTo = sanitizeReturnTo(url.searchParams.get("returnTo"));
    throw redirect(returnTo || "/admin");
  }

  return null;
}

function sanitizeReturnTo(value: string | null) {
  if (!value) return "/admin";
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

function LoginContent() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const [searchParams] = useSearchParams();

  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: "google-oauth2",
      },
      appState: {
        returnTo,
      },
    });
  };

  if (isLoading && !isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Access Required</CardTitle>
          <CardDescription>
            Please sign in with Google to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} className="w-full" size="lg">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Unavailable</CardTitle>
          <CardDescription>
            Auth0 is not configured in this environment.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  const hasAuth0Config =
    Boolean(import.meta.env.VITE_AUTH0_DOMAIN) &&
    Boolean(import.meta.env.VITE_AUTH0_CLIENT_ID);

  if (!hasAuth0Config) {
    return <LoginFallback />;
  }

  return (
    <Auth0ProviderWrapper>
      <LoginContent />
    </Auth0ProviderWrapper>
  );
}
