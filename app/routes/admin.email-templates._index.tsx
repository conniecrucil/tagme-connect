import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export function meta() {
  return [
    { title: "Email Templates - Admin - TagMe Connections" },
    { name: "description", content: "Preview and manage email templates used in the TagMe system. View admin notifications and customer confirmation emails." },
  ];
}

export default function AdminEmailTemplates() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-gray-600 mt-2">
                Preview and manage email templates used in the system
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Confirmation Email</CardTitle>
              <CardDescription>
                Email sent to customers after successful purchase confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This email includes order details, shipping information, and links to generated contact cards.
                </p>
                <Button asChild className="w-full">
                  <Link to="/admin/email-templates/customer-confirmation">
                    Preview Template
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Notification Email</CardTitle>
              <CardDescription>
                Email sent to admin for each card instance in an order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This email includes customer details, card configuration, shipping address, and attachments.
                </p>
                <Button asChild className="w-full">
                  <Link to="/admin/email-templates/admin-notification">
                    Preview Template
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Email Template Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Customer Confirmation Email</h4>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• Sent automatically when confirmation page loads</li>
                    <li>• Includes order summary and shipping details</li>
                    <li>• Contains links to generated contact cards (if applicable)</li>
                    <li>• Professional HTML template with company branding</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Admin Notification Email</h4>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• Sent for each card instance in the order</li>
                    <li>• Includes customer information and card configuration</li>
                    <li>• Contains shipping address and order details</li>
                    <li>• Attachments: vCard files and customer images</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
