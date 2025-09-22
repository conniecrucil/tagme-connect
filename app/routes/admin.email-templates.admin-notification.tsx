import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { transformS3UrlToDomain } from "~/lib/utils";

export function meta() {
  return [
    { title: "Admin Notification Email Template - TagMe Connections" },
    { name: "description", content: "Preview the admin notification email template sent when new contact cards are created through the admin system." },
  ];
}

export default function AdminNotificationTemplate() {
  // Sample data for preview - showing multiple card types
  const sampleCards = [
    {
      productType: "basic",
      quantity: 3,
      website: "https://johnsmith.dev",
      logoUrl: "https://example.com/images/logo1.jpg"
    },
    {
      productType: "core",
      quantity: 2,
      website: "https://example.com/contact/john-smith-1",
      logoUrl: "https://example.com/images/logo2.jpg"
    },
    {
      productType: "core",
      quantity: 1,
      website: "https://example.com/contact/john-smith-2",
      logoUrl: null
    }
  ];

  const sampleData = {
    session: {
      id: "cs_test_1234567890abcdef",
      shipping: {
        address: {
          line1: "123 Main Street",
          city: "Vancouver",
          state: "BC",
          postal_code: "V6B 1A1",
          country: "CA"
        }
      }
    },
    customerData: {
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
      company: "Acme Corporation",
      title: "Senior Developer",
      website: "https://johnsmith.dev"
    },
    cards: sampleCards
  };

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order - Multiple Cards</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 30px 20px; text-align: center; border-bottom: 3px solid #10b981; }
          .content { padding: 20px; }
          .order-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .card-config { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 15px 0; border-radius: 8px; }
          .section-title { color: #10b981; font-size: 18px; font-weight: bold; margin: 25px 0 15px 0; }
          .success-box { border: 2px solid #10b981; background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .warning-box { border: 2px solid #f59e0b; background: #fffbeb; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .info-box { background: #e0f2fe; padding: 20px; border-radius: 8px; border-left: 4px solid #0288d1; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #10b981;">New Order Notification</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Total Cards:</strong> ${sampleData.cards.reduce((sum, card) => sum + card.quantity, 0)}</p>
            <p style="font-size: 14px; margin-top: 10px;">Order placed on ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="content">
            <h2>Order Information</h2>
            <div class="order-details">
              <p><strong>Order Number:</strong> ${sampleData.session.id}</p>
              <p><strong>Total Cards:</strong> ${sampleData.cards.reduce((sum, card) => sum + card.quantity, 0)}</p>
            </div>

            <h3>Card Instructions</h3>
            ${sampleData.cards.map((card, index) => `
              <div class="card-config">
                <h4>Card Set ${index + 1}: ${card.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}</h4>
                <p><strong>Quantity:</strong> ${card.quantity}</p>
                <p><strong>Website Location:</strong> <a href="${card.website}" target="_blank" style="color: #10b981;">${card.website}</a></p>
                <p><strong>Card Design Location:</strong> ${card.logoUrl ? `<a href="${card.logoUrl}" target="_blank" style="color: #10b981;">${card.logoUrl}</a>` : 'None specified'}</p>
              </div>
            `).join('')}

            <h3>Shipping Address</h3>
            <div class="card-config">
              <p><strong>Address:</strong> ${sampleData.session.shipping?.address?.line1 || 'Not provided'}</p>
              <p><strong>City:</strong> ${sampleData.session.shipping?.address?.city || 'Not provided'}</p>
              <p><strong>State:</strong> ${sampleData.session.shipping?.address?.state || 'Not provided'}</p>
              <p><strong>Postal Code:</strong> ${sampleData.session.shipping?.address?.postal_code || 'Not provided'}</p>
              <p><strong>Country:</strong> ${sampleData.session.shipping?.address?.country || 'Not provided'}</p>
            </div>


          </div>
        </div>
      </body>
    </html>
  `;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Notification Email Template</h1>
              <p className="text-gray-600 mt-2">
                Preview of the email sent to admin for each card instance in an order
              </p>
            </div>
            <div className="flex space-x-2">
              <Button asChild variant="outline">
                <Link to="/admin/email-templates">Back to Templates</Link>
              </Button>
              <Button asChild>
                <Link to="/admin">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Email Preview</h3>
            <p className="text-sm text-gray-600">This is how the admin notification email appears</p>
          </div>
          <div className="h-[800px] overflow-auto">
            <iframe
              srcDoc={emailHtml}
              className="w-full h-full border-0"
              title="Admin Notification Email Template"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-900">Trigger</h4>
                <p className="text-sm text-gray-600">Sent for each card instance in the order</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Recipients</h4>
                <p className="text-sm text-gray-600">Admin email address from environment variables</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Content</h4>
                <p className="text-sm text-gray-600">Order details, card instructions, shipping address</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Attachments</h4>
                <p className="text-sm text-gray-600">None</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
