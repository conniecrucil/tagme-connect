import type { LoaderFunctionArgs } from "react-router";
import { Link, Navigate, Outlet, useLoaderData, useLocation } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth0 } from "@auth0/auth0-react";
import { Auth0ProviderWrapper } from "~/providers/auth0-provider";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import { useEffect, useRef, useState } from "react";
import { AdminBreadcrumbs } from "~/components/AdminBreadcrumbs";
import { getAuthorizedAdminFromSession } from "~/lib/server/admin-auth-session.server";

type AdminLoaderData = {
  authState: "authorized" | "unauthenticated" | "forbidden";
  sessionUser: { email: string; name?: string; picture?: string } | null;
};

function json(data: AdminLoaderData) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  console.log("[admin.loader] Request", {
    method: request.method,
    path: url.pathname,
  });

  const result = await getAuthorizedAdminFromSession(request);
  console.log("[admin.loader] Session auth result", {
    state: result.state,
    email: result.user?.email ?? null,
  });
  return json({
    authState: result.state,
    sessionUser: result.user
      ? {
          email: result.user.email,
          name: result.user.name,
          picture: result.user.picture,
        }
      : null,
  });
}

export function handle() {
  return {
    breadcrumb: { label: "Admin Dashboard" }
  };
}


function AdminContent() {
  const loaderData = useLoaderData<typeof loader>() as AdminLoaderData;
  const { isAuthenticated, isLoading, user, getIdTokenClaims } = useAuth0();
  const location = useLocation();
  const [syncingServerSession, setSyncingServerSession] = useState(false);
  const [serverSessionSyncError, setServerSessionSyncError] = useState<string | null>(null);
  const lastSyncedEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (loaderData.authState !== "unauthenticated") {
      setServerSessionSyncError(null);
      return;
    }

    if (isLoading || !isAuthenticated || !user?.email) {
      return;
    }

    if (lastSyncedEmailRef.current === user.email) {
      return;
    }

    lastSyncedEmailRef.current = user.email;

    let cancelled = false;
    void (async () => {
      setSyncingServerSession(true);
      try {
        const claims = await getIdTokenClaims();
        const idToken = claims?.__raw;

        if (!idToken) {
          throw new Error("Auth0 ID token is unavailable");
        }

        if (!cancelled) {
          setServerSessionSyncError(null);
          const returnTo = `${location.pathname}${location.search}${location.hash}` || "/admin";
          console.log("Submitting admin session sync form for document redirect", {
            returnTo,
            email: user.email,
          });

          const form = document.createElement("form");
          form.method = "POST";
          form.action = "/api/admin-session";
          form.style.display = "none";

          const idTokenInput = document.createElement("input");
          idTokenInput.type = "hidden";
          idTokenInput.name = "idToken";
          idTokenInput.value = idToken;

          const returnToInput = document.createElement("input");
          returnToInput.type = "hidden";
          returnToInput.name = "returnTo";
          returnToInput.value = returnTo;

          form.appendChild(idTokenInput);
          form.appendChild(returnToInput);
          document.body.appendChild(form);
          form.submit();
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Admin server session sync failed:", error);
          setServerSessionSyncError(error instanceof Error ? error.message : "Failed to sync admin session");
        }
      } finally {
        if (!cancelled) {
          setSyncingServerSession(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    loaderData.authState,
    isAuthenticated,
    isLoading,
    user?.email,
    getIdTokenClaims,
  ]);

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (
    loaderData.authState === "unauthenticated" &&
    syncingServerSession
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (loaderData.authState === "unauthenticated" && serverSessionSyncError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>
              We could not establish a server session for the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 break-words">{serverSessionSyncError}</p>
            <Button asChild className="w-full" variant="outline">
              <Link to="/logout">Sign Out</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loaderData.authState === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Preparing admin session...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user is authenticated but not in admin list
  if (loaderData.authState === "forbidden") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You are signed in as <strong>{loaderData.sessionUser?.email || user?.email}</strong>, but you do not have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">
              Please contact an administrator if you believe you should have access.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link to="/logout">Sign Out</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pass user data to AppSidebar
  const userData = {
    name: user?.name || loaderData.sessionUser?.name || 'Admin User',
    email: user?.email || loaderData.sessionUser?.email || '',
    avatar: user?.picture || loaderData.sessionUser?.picture,
  };

  // If authenticated, render child routes with sidebar
  return (
    <SidebarProvider>
      <AppSidebar user={userData} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <AdminBreadcrumbs />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Admin() {
  return (
    <Auth0ProviderWrapper>
      <AdminContent />
    </Auth0ProviderWrapper>
  );
}
