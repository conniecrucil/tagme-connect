import { Link, useLoaderData, useNavigation } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { DashboardMetricCard } from "~/components/DashboardMetricCard";
import { CreditCard, Users, ShoppingCart, FileText } from "lucide-react";
import { getDashboardMetricsData } from "~/lib/server/admin-dashboard.server";
import { AdminDashboardPageSkeleton } from "~/components/AdminPageSkeletons";

export function meta() {
  return [
    { title: "Admin Dashboard - TagMe Connections" },
    { name: "description", content: "Admin dashboard for managing TagMe contact card system. Track metrics, create contacts, and manage orders." },
  ];
}

export function handle() {
  return {
    breadcrumb: { label: "Homepage" }
  };
}

interface DashboardMetrics {
  cards: {
    total: number;
    purchased: number;
    admin: number;
  };
  revenue: {
    total: number;
    formatted: string;
  };
  customers: {
    total: number;
    currentQuarter: number;
    previousQuarter: number;
    change: number;
    changePercent: number;
  };
}

export async function loader() {
  try {
    return (await getDashboardMetricsData()) as DashboardMetrics;
  } catch (error) {
    console.error('Error in loader:', error);
    throw error;
  }
}


export default function AdminIndex() {
  const metrics = useLoaderData<DashboardMetrics>();
  const navigation = useNavigation();
  const isPendingCurrentRoute =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/admin";

  if (isPendingCurrentRoute || !metrics) {
    return <AdminDashboardPageSkeleton />;
  }

  return (
    <div className="space-y-6">
   

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Total Cards"
          value={metrics.cards.total}
          subtitle={`${metrics.cards.purchased} purchased, ${metrics.cards.admin} admin`}
          icon={<FileText className="h-4 w-4" />}
        />
        <DashboardMetricCard
          title="Total Revenue"
          value={metrics.revenue.formatted}
          subtitle="From online purchases"
          icon={<CreditCard className="h-4 w-4" />}
        />
        <DashboardMetricCard
          title="Total Customers"
          value={metrics.customers.total}
          trend={{
            value: metrics.customers.changePercent,
            isPositive: metrics.customers.change >= 0,
          }}
          icon={<Users className="h-4 w-4" />}
        />
        <DashboardMetricCard
          title="Pending Orders"
          value="View All"
          subtitle="Manage orders and fulfillment"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Create Contact</CardTitle>
              <CardDescription>
                Create contact cards without purchasing. All cards will be uploaded to S3 and admin will be notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/admin/create">Create New Contact</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>View All Cards</CardTitle>
              <CardDescription>
                Browse, search, and manage all contact cards created through the system. Filter by customer, status, and date.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/admin/cards">View All Cards</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>View Orders</CardTitle>
              <CardDescription>
                Manage customer orders, track fulfillment, and view purchase history.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/admin/orders">View Orders</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Check system configuration and environment variables status. Verify all services are properly configured.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/admin/system-status">Check System Status</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Preview and manage email templates used in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/admin/email-templates">View Templates</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Card Preview</CardTitle>
              <CardDescription>
                Preview how contact cards will look with dummy data. Test different layouts and configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/admin/preview">Preview Cards</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
