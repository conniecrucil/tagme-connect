import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { transformS3UrlToDomain } from "~/lib/utils";

export function meta() {
  return [
    { title: "Customer Confirmation Email Template - TagMe Connections" },
    { name: "description", content: "Preview the customer confirmation email template sent after successful purchase of smart business cards." },
  ];
}

export default function CustomerConfirmationTemplate() {
  // Sample data for preview
  const sampleData = {
    session: {
      id: "cs_test_1234567890abcdef",
    },
    customerData: {
      name: "John Smith",
      email: "john.smith@example.com",
    },
    cart: [
      {
        productType: "core",
        quantity: 2,
        configuration: {
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "+1 (555) 123-4567",
          company: "Acme Corporation",
          title: "Senior Developer",
          website: "https://johnsmith.dev",
          socialMedia: {
            linkedin: "https://linkedin.com/in/johnsmith",
            twitter: "https://twitter.com/johnsmith",
            github: "https://github.com/johnsmith"
          },
          customMessage: "Thanks for connecting! Feel free to reach out anytime."
        }
      }
    ],
    s3Urls: [
      {
        urls: {
          html: "https://example.com/contact/john-smith-1"
        }
      },
      {
        urls: {
          html: "https://example.com/contact/john-smith-2"
        }
      }
    ]
  };

  const totalAmount = sampleData.cart.reduce((sum: number, item: any) => {
    const price = item.productType === 'basic' ? 40 : 47;
    return sum + (price * item.quantity);
  }, 0);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 30px 20px; text-align: center; border-bottom: 3px solid #10b981; }
          .logo { max-width: 200px; height: auto; margin-bottom: 20px; }
          .content { padding: 20px; }
          .order-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .item { margin: 15px 0; padding: 15px; border-bottom: 1px solid #eee; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f8f9fa; }
          .section-title { color: #10b981; font-size: 18px; font-weight: bold; margin: 25px 0 15px 0; }
          .highlight-box { background: #e0f2fe; padding: 20px; border-radius: 8px; border-left: 4px solid #0288d1; margin: 20px 0; }
          .step { display: flex; align-items: center; margin: 15px 0; }
          .step-number { background: #10b981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://demo.bancroft.io/tagme-logo.png" alt="TagMe Connections" class="logo">
            <h1 style="margin: 0; color: #10b981;">Order Confirmation</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase, ${sampleData.customerData.name}!</p>
          </div>
          
          <div class="content">
            <h2 class="section-title">Order Summary</h2>
            <div class="order-details">
              <p><strong>Order Number:</strong> ${sampleData.session.id}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Customer:</strong> ${sampleData.customerData.name}</p>
              <p><strong>Email:</strong> ${sampleData.customerData.email}</p>
              <p><strong>Total Items:</strong> ${sampleData.cart.reduce((sum: number, item: any) => sum + item.quantity, 0)}</p>
              <p><strong>Subtotal:</strong> $${totalAmount.toFixed(2)}</p>
              <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
            </div>

            <h3 class="section-title">Items Ordered</h3>
            ${sampleData.cart.map((item: any, index: number) => `
              <div class="item">
                <strong>${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}</strong><br>
                Quantity: ${item.quantity}<br>
                Unit Price: $${item.productType === 'basic' ? '40.00' : '47.00'}<br>
                Item Total: $${((item.productType === 'basic' ? 40 : 47) * item.quantity).toFixed(2)}
                ${item.configuration ? `
                  ${item.productType === 'basic' ? 
                    `<br><em>Website URL: <a href="${item.configuration.website}" target="_blank" style="color: #10b981;">${item.configuration.website}</a></em>` :
                    `<br><em>Configured for: ${item.configuration.name || 'Contact'}</em>`
                  }
                ` : ''}
              </div>
            `).join('')}

            <h3>Shipping Information</h3>
            <p>Your order will be processed and shipped within 15-20 business days.</p>
            <p>You will receive a tracking number once your order ships.</p>

            ${sampleData.s3Urls.length > 0 ? `
              <h3 class="section-title">Your Digital Contact Cards</h3>
              <div class="order-details">
                <p><strong>Great news!</strong> Your contact cards have been automatically generated and are live online. Share these links with anyone, anywhere!</p>
                <div style="margin: 20px 0;">
                  ${sampleData.s3Urls.map((url, index) => `
                    <div style="border: 1px solid #ddd; padding: 20px; margin: 15px 0; border-radius: 8px; background: #fff;">
                      <h4 style="margin: 0 0 15px 0; color: #10b981;">Contact Card ${index + 1}</h4>
                      <p style="margin: 8px 0;"><strong>View Online:</strong> <a href="${transformS3UrlToDomain(url.urls.html)}" target="_blank" style="color: #10b981; text-decoration: none;">${transformS3UrlToDomain(url.urls.html)}</a></p>
                      <p style="margin: 8px 0;"><strong>Download vCard:</strong> <a href="${transformS3UrlToDomain(url.urls.vcard)}" download style="color: #10b981; text-decoration: none;">Save to Contacts</a></p>
                      <p style="margin: 8px 0; font-size: 14px; color: #666;">Share this URL with anyone to let them save your contact information instantly!</p>
                    </div>
                  `).join('')}
                </div>
                <div class="highlight-box">
                  <strong>Pro Tip:</strong> You can share these links via text message, email, or social media. When someone clicks the link on their phone, they'll see your contact card and can save it directly to their contacts!
                </div>
              </div>
            ` : ''}

            <h3 class="section-title">What Happens Next</h3>
            <div class="order-details">
              <div class="step">
                <div class="step-number">1</div>
                <div><strong>Digital Cards Ready:</strong> Your contact cards are live and ready to share immediately!</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div><strong>Physical Cards:</strong> We'll start production within 24 hours</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div><strong>Shipping:</strong> Your physical cards will ship within 15-20 business days</div>
              </div>
              <div class="step">
                <div class="step-number">4</div>
                <div><strong>Tracking:</strong> You'll receive tracking information once your order ships</div>
              </div>
            </div>

            <h3 class="section-title">Support</h3>
            <p>If you have any questions about your order, please contact us at <a href="mailto:support@tagmeconnections.com" style="color: #10b981;">support@tagmeconnections.com</a></p>
          </div>

          <div class="footer">
            <p>© TagMe Connections | https://tagmeconnections.com</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Customer Confirmation Email Template</h1>
              <p className="text-gray-600 mt-2">
                Preview of the email sent to customers after purchase confirmation
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
            <p className="text-sm text-gray-600">This is how the customer confirmation email appears</p>
          </div>
          <div className="h-[800px] overflow-auto">
            <iframe
              srcDoc={emailHtml}
              className="w-full h-full border-0"
              title="Customer Confirmation Email Template"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-900">Trigger</h4>
                <p className="text-sm text-gray-600">Sent automatically when confirmation page loads</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Recipients</h4>
                <p className="text-sm text-gray-600">Customer email address from order</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Content</h4>
                <p className="text-sm text-gray-600">Order summary, shipping info, contact card links</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Attachments</h4>
                <p className="text-sm text-gray-600">None - all content in HTML body</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
