import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export function meta() {
  return [
    { title: "Admin Dashboard - TagMe Connections" },
    { name: "description", content: "Admin dashboard for managing TagMe contact card system. Create contacts, update existing cards, and manage email templates." },
  ];
}

export function handle() {
  return {
    breadcrumb: { label: "Homepage" }
  };
}

export default function AdminIndex() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your TagMe contact card system
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Create Contact</CardTitle>
              <CardDescription>
                Create contact cards without purchasing. All cards will be uploaded to S3 and admin will be notified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/create">Create New Contact</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Contact</CardTitle>
              <CardDescription>
                Retrieve and update existing TAG Core card sites by URL. Edit contact details and re-publish under the same UUID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/update">Update Existing Contact</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>View All Cards</CardTitle>
              <CardDescription>
                Browse, search, and manage all contact cards created through the system. Filter by customer, status, and date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/cards">View All Cards</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Check system configuration and environment variables status. Verify all services are properly configured.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/system-status">Check System Status</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>View Analytics</CardTitle>
              <CardDescription>
                View contact card analytics, usage statistics, and performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Generate and download reports for contacts, sales, and usage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Preview and manage email templates used in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/email-templates">View Templates</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card Preview</CardTitle>
              <CardDescription>
                Preview how contact cards will look with dummy data. Test different layouts and configurations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/preview">Preview Cards</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>
                Access support tools, view tickets, and manage customer inquiries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}