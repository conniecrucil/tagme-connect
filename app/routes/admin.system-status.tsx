import { useState } from "react";
import { useLoaderData } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useToast } from "~/components/ui/use-toast";

export function meta() {
  return [
    { title: "System Status - Admin - TagMe Connections" },
    { name: "description", content: "Check system configuration and environment variables status." },
  ];
}

export async function clientLoader(_args: ClientLoaderFunctionArgs) {
  try {
    const response = await fetch(`/.netlify/functions/check-system-status`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch system status');
    }

    const data: SystemStatusResponse = await response.json();
    return { systemStatus: data };
  } catch (error) {
    console.error('Error fetching system status:', error);
    throw error;
  }
}

export function handle() {
  return {
    breadcrumb: { label: "System Status" }
  };
}

interface SystemStatus {
  stripe: {
    secretKey: boolean;
    publishableKey: boolean;
  };
  email: {
    resendApiKey: boolean;
    emailFrom: boolean;
    adminEmail: boolean;
    supportEmail: boolean;
  };
  company: {
    name: boolean;
    website: boolean;
  };
  aws: {
    accessKeyId: boolean;
    secretAccessKey: boolean;
    region: boolean;
    bucketName: boolean;
  };
  admin: {
    user: boolean;
    pass: boolean;
  };
  netlify: {
    siteUrl: boolean;
  };
  supabase: {
    url: boolean;
    serviceRoleKey: boolean;
    databaseUrl: boolean;
  };
  postgres: {
    password: boolean;
    db: boolean;
    user: boolean;
    jwtSecret: boolean;
  };
  connectivity: {
    bucketAccess: boolean;
    supabaseConnectivity: boolean;
    posthogConfigured: boolean;
    sentryConfigured: boolean;
  };
}

interface StatusSummary {
  isHealthy: boolean;
  criticalServices: number;
  totalCritical: number;
  awsConfigured: number;
  totalAws: number;
  healthPercentage: number;
}

interface SystemStatusResponse {
  status: SystemStatus;
  summary: StatusSummary;
  lastChecked: string;
}

export default function AdminSystemStatus() {
  const { toast } = useToast();
  const { systemStatus: loaderStatus } = useLoaderData<typeof clientLoader>();
  const [systemStatus, setSystemStatus] = useState(loaderStatus);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemStatus = async () => {
    try {
      setError(null);
      
      const response = await fetch(`/.netlify/functions/check-system-status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }

      const data: SystemStatusResponse = await response.json();
      setSystemStatus(data);
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load system status');
      toast({
        title: "Error",
        description: "Failed to load system status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (isConfigured: boolean) => {
    return isConfigured ? (
      <Badge className="bg-green-100 text-green-800">Configured</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Missing</Badge>
    );
  };

  const getHealthBadge = (percentage: number) => {
    if (percentage === 100) {
      return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
    } else if (percentage >= 75) {
      return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (error || !systemStatus) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">System Status Unavailable</h1>
            <p className="text-gray-600 mb-6">{error || 'Unable to load system status.'}</p>
            <Button onClick={fetchSystemStatus}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
            <p className="text-gray-600 mt-2">
              Check system configuration and environment variables status.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchSystemStatus} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Overall System Health
              {getHealthBadge(systemStatus.summary.healthPercentage)}
            </CardTitle>
            <CardDescription>
              Last checked: {formatDate(systemStatus.lastChecked)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {systemStatus.summary.healthPercentage}%
                </div>
                <div className="text-sm text-gray-600">Health Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemStatus.summary.criticalServices}
                </div>
                <div className="text-sm text-gray-600">Configured Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {systemStatus.summary.totalCritical - systemStatus.summary.criticalServices}
                </div>
                <div className="text-sm text-gray-600">Missing Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {systemStatus.summary.awsConfigured}/{systemStatus.summary.totalAws}
                </div>
                <div className="text-sm text-gray-600">AWS Services</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stripe Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Stripe Configuration
                {systemStatus.status.stripe.secretKey && systemStatus.status.stripe.publishableKey ? (
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Incomplete</Badge>
                )}
              </CardTitle>
              <CardDescription>Payment processing configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Secret Key</span>
                {getStatusBadge(systemStatus.status.stripe.secretKey)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Publishable Key</span>
                {getStatusBadge(systemStatus.status.stripe.publishableKey)}
              </div>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Email Configuration
                {systemStatus.status.email.resendApiKey && systemStatus.status.email.emailFrom && 
                 systemStatus.status.email.adminEmail && systemStatus.status.email.supportEmail ? (
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Incomplete</Badge>
                )}
              </CardTitle>
              <CardDescription>Email service configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Resend API Key</span>
                {getStatusBadge(systemStatus.status.email.resendApiKey)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">From Email</span>
                {getStatusBadge(systemStatus.status.email.emailFrom)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Admin Email</span>
                {getStatusBadge(systemStatus.status.email.adminEmail)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Support Email</span>
                {getStatusBadge(systemStatus.status.email.supportEmail)}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Company Information
                {systemStatus.status.company.name && systemStatus.status.company.website ? (
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Incomplete</Badge>
                )}
              </CardTitle>
              <CardDescription>Company branding configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Company Name</span>
                {getStatusBadge(systemStatus.status.company.name)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Company Website</span>
                {getStatusBadge(systemStatus.status.company.website)}
              </div>
            </CardContent>
          </Card>

          {/* Supabase Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Supabase Configuration
                {systemStatus.status.supabase.url && 
                 systemStatus.status.supabase.serviceRoleKey && systemStatus.status.supabase.databaseUrl ? (
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Incomplete</Badge>
                )}
              </CardTitle>
              <CardDescription>Database and API configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Supabase URL</span>
                {getStatusBadge(systemStatus.status.supabase.url)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Service Role Key</span>
                {getStatusBadge(systemStatus.status.supabase.serviceRoleKey)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Database URL</span>
                {getStatusBadge(systemStatus.status.supabase.databaseUrl)}
              </div>
            </CardContent>
          </Card>



          {/* Connectivity Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Connectivity Status
                {systemStatus.status.connectivity.bucketAccess && 
                 systemStatus.status.connectivity.supabaseConnectivity && 
                 systemStatus.status.connectivity.posthogConfigured && 
                 systemStatus.status.connectivity.sentryConfigured ? (
                  <Badge className="bg-green-100 text-green-800">All Connected</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">Some Issues</Badge>
                )}
              </CardTitle>
              <CardDescription>Actual connectivity checks for external services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">S3 Bucket Access</span>
                  </div>
                  {systemStatus.status.connectivity.bucketAccess ? (
                    <Badge className="bg-green-100 text-green-800">✅ Can Access</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">❌ Cannot Access</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Supabase Connectivity</span>
                  </div>
                  {systemStatus.status.connectivity.supabaseConnectivity ? (
                    <Badge className="bg-green-100 text-green-800">✅ Connected</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">❌ Disconnected</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">PostHog Analytics</span>
                  </div>
                  {systemStatus.status.connectivity.posthogConfigured ? (
                    <Badge className="bg-green-100 text-green-800">✅ Configured</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">❌ Not Configured</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Sentry.io Error Tracking</span>
                  </div>
                  {systemStatus.status.connectivity.sentryConfigured ? (
                    <Badge className="bg-green-100 text-green-800">✅ Configured</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">❌ Not Configured</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AWS Configuration (Optional) */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              AWS S3 Configuration (Optional)
              {systemStatus.status.aws.accessKeyId && systemStatus.status.aws.secretAccessKey && 
               systemStatus.status.aws.region && systemStatus.status.aws.bucketName ? (
                <Badge className="bg-green-100 text-green-800">Ready</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">Not Configured</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Production file storage configuration (optional for development)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Access Key ID</span>
              {getStatusBadge(systemStatus.status.aws.accessKeyId)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Secret Access Key</span>
              {getStatusBadge(systemStatus.status.aws.secretAccessKey)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Region</span>
              {getStatusBadge(systemStatus.status.aws.region)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Bucket Name</span>
              {getStatusBadge(systemStatus.status.aws.bucketName)}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
