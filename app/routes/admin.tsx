import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Temporarily bypass auth for development
  const [isLoading, setIsLoading] = useState(false); // Skip loading for development
  const { toast } = useToast();

  useEffect(() => {
    // checkAuth(); // Temporarily disabled for development
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/.netlify/functions/admin-auth");
      
      if (response.status === 200) {
        setIsAuthenticated(true);
      } else if (response.status === 401) {
        // Prompt for basic auth
        const username = prompt("Enter admin username:");
        const password = prompt("Enter admin password:");
        
        if (username && password) {
          const credentials = btoa(`${username}:${password}`);
          const authResponse = await fetch("/.netlify/functions/admin-auth", {
            headers: {
              Authorization: `Basic ${credentials}`,
            },
          });
          
          if (authResponse.status === 200) {
            setIsAuthenticated(true);
            toast({
              title: "Authentication Successful",
              description: "Welcome to the admin dashboard.",
            });
          } else {
            toast({
              title: "Authentication Failed",
              description: "Invalid credentials. Please try again.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Authentication Error",
          description: "An error occurred during authentication.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Unable to connect to authentication service.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Authenticating...</p>
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
              Please authenticate to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkAuth} className="w-full">
              Authenticate
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authenticated, render child routes
  return <Outlet />;
}
