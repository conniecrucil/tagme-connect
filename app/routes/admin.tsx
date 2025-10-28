import { Outlet } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth0 } from "@auth0/auth0-react";
import { Auth0ProviderWrapper } from "~/providers/auth0-provider";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import { useEffect, useState } from "react";
import { AdminBreadcrumbs } from "~/components/AdminBreadcrumbs";

export function handle() {
  return {
    breadcrumb: { label: "Admin Dashboard" }
  };
}


function AdminContent() {
  const { isAuthenticated, isLoading, loginWithRedirect, user, logout } = useAuth0();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
      },
      appState: {
        returnTo: '/admin',
      },
    });
  };

  // Check authorization when user becomes authenticated
  useEffect(() => {
    const checkAuthorization = async () => {
      if (isAuthenticated && user?.email) {
        setCheckingAuth(true);
        try {
          // In development, bypass authorization check if VITE_ADMIN_AUTH_BYPASS is true
          const authBypass = import.meta.env.DEV && import.meta.env.VITE_ADMIN_AUTH_BYPASS === 'true';
          
          if (authBypass) {
            console.log('[DEV] Authorization bypass enabled via VITE_ADMIN_AUTH_BYPASS');
            setIsAuthorized(true);
          } else {
            const response = await fetch(
              `/.netlify/functions/check-admin-authorization?email=${encodeURIComponent(user.email)}`
            );
            const data = await response.json();
            setIsAuthorized(data.authorized === true);
          }
        } catch (error) {
          console.error('Authorization check failed:', error);
          setIsAuthorized(false);
        } finally {
          setCheckingAuth(false);
        }
      }
    };

    checkAuthorization();
  }, [isAuthenticated, user?.email]);

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
      </div>
    );
  }

  // Show loading while checking authorization
  if (checkingAuth || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user is not in admin list
  if (isAuthenticated && !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You are signed in as <strong>{user?.email}</strong>, but you do not have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">
              Please contact an administrator if you believe you should have access.
            </p>
            <Button 
              onClick={() => logout()} 
              className="w-full" 
              variant="outline"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pass user data to AppSidebar
  const userData = {
    name: user?.name || 'Admin User',
    email: user?.email || '',
    avatar: user?.picture,
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
