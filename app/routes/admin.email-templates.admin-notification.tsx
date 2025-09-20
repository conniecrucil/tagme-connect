import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { transformS3UrlToDomain } from "~/lib/utils";

export default function AdminNotificationTemplate() {
  // Sample data for preview
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
    item: {
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
    },
    cardNumber: 1,
    s3Data: {
      folderId: "contact-card-12345",
      urls: {
        html: "https://example.com/contact/john-smith-1",
        vcard: "https://example.com/vcard/john-smith-1.vcf"
      },
      imageUrls: {
        logo: "https://example.com/images/logo.jpg",
        photo: "https://example.com/images/photo.jpg",
        cover: "https://example.com/images/cover.jpg"
      }
    }
  };

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order - Card ${sampleData.cardNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 30px 20px; text-align: center; border-bottom: 3px solid #10b981; }
          .logo { max-width: 200px; height: auto; margin-bottom: 20px; }
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
            <img src="https://demo.bancroft.io/tagme-logo.png" alt="TagMe Connections" class="logo">
            <h1 style="margin: 0; color: #10b981;">New Order Notification</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Card Instance #${sampleData.cardNumber}</strong> of ${sampleData.item.quantity}</p>
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
              <p><strong>Product:</strong> ${sampleData.item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}</p>
              <p><strong>Card Instance:</strong> ${sampleData.cardNumber} of ${sampleData.item.quantity}</p>
            </div>

            <h3>Customer Information</h3>
            <div class="card-config">
              <p><strong>Name:</strong> ${sampleData.customerData.name}</p>
              <p><strong>Email:</strong> ${sampleData.customerData.email}</p>
              <p><strong>Phone:</strong> ${sampleData.customerData.phone || 'Not provided'}</p>
              <p><strong>Company:</strong> ${sampleData.customerData.company || 'Not provided'}</p>
              <p><strong>Title:</strong> ${sampleData.customerData.title || 'Not provided'}</p>
              <p><strong>Website:</strong> ${sampleData.customerData.website || 'Not provided'}</p>
            </div>

            <h3 class="section-title">Card Configuration Details</h3>
            <div class="card-config">
              <h4>Contact Information:</h4>
              <p><strong>Name:</strong> ${sampleData.item.configuration?.name || 'Not provided'}</p>
              <p><strong>Email:</strong> ${sampleData.item.configuration?.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> ${sampleData.item.configuration?.phone || 'Not provided'}</p>
              <p><strong>Company:</strong> ${sampleData.item.configuration?.company || 'Not provided'}</p>
              <p><strong>Title:</strong> ${sampleData.item.configuration?.title || 'Not provided'}</p>
              <p><strong>Website:</strong> ${sampleData.item.configuration?.website || 'Not provided'}</p>
              
              <h4>Social Media Links:</h4>
              ${sampleData.item.configuration?.socialMedia && Object.keys(sampleData.item.configuration.socialMedia).length > 0 ? `
                <ul>
                  ${Object.entries(sampleData.item.configuration.socialMedia).map(([platform, url]) => 
                    `<li><strong>${platform.charAt(0).toUpperCase() + platform.slice(1)}:</strong> <a href="${url}" target="_blank">${url}</a></li>`
                  ).join('')}
                </ul>
              ` : '<p>No social media links provided</p>'}
              
              <h4>Custom Message:</h4>
              <p style="font-style: italic; background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                "${sampleData.item.configuration?.customMessage || 'No custom message provided'}"
              </p>
            </div>

            <h3>Shipping Address</h3>
            <div class="card-config">
              <p><strong>Address:</strong> ${sampleData.session.shipping?.address?.line1 || 'Not provided'}</p>
              <p><strong>City:</strong> ${sampleData.session.shipping?.address?.city || 'Not provided'}</p>
              <p><strong>State:</strong> ${sampleData.session.shipping?.address?.state || 'Not provided'}</p>
              <p><strong>Postal Code:</strong> ${sampleData.session.shipping?.address?.postal_code || 'Not provided'}</p>
              <p><strong>Country:</strong> ${sampleData.session.shipping?.address?.country || 'Not provided'}</p>
            </div>

            <h3 class="section-title">Generated Contact Card Website</h3>
            <div class="success-box">
              <h4 style="color: #10b981; margin-top: 0;">Contact Card Successfully Generated!</h4>
              
              <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 15px 0;">
                <h5>Live Contact Card:</h5>
                <p><strong>Website URL:</strong> <a href="${transformS3UrlToDomain(sampleData.s3Data.urls.html)}" target="_blank" style="color: #10b981; text-decoration: none; font-weight: bold;">${transformS3UrlToDomain(sampleData.s3Data.urls.html)}</a></p>
                <p style="font-size: 14px; color: #666; margin: 8px 0;">This is a fully functional mobile-optimized contact card website</p>
              </div>
              
              <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 15px 0;">
                <h5>vCard Download:</h5>
                <p><strong>vCard File:</strong> <a href="${transformS3UrlToDomain(sampleData.s3Data.urls.vcard)}" target="_blank" style="color: #10b981; text-decoration: none;">${transformS3UrlToDomain(sampleData.s3Data.urls.vcard)}</a></p>
                <p style="font-size: 14px; color: #666; margin: 8px 0;">Direct download link for contact import</p>
              </div>
              
              <div class="info-box">
                <h5>Technical Details:</h5>
                <p><strong>Folder ID:</strong> ${sampleData.s3Data.folderId}</p>
                <p><strong>Generated Images:</strong> ${sampleData.s3Data.imageUrls && Object.keys(sampleData.s3Data.imageUrls).length > 0 ? 
                  Object.keys(sampleData.s3Data.imageUrls).map(key => key).join(', ') : 'None'}</p>
                <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Live and Publicly Accessible</span></p>
              </div>
              
              <div class="info-box" style="background: #fff3cd; border-left: 4px solid #ffc107;">
                <h5>Admin Notes:</h5>
                <p style="margin: 8px 0;">• Contact card is mobile-first optimized</p>
                <p style="margin: 8px 0;">• Includes SEO meta tags and social media previews</p>
                <p style="margin: 8px 0;">• All files are publicly accessible</p>
                <p style="margin: 8px 0;">• Customer can share the website URL directly</p>
              </div>
            </div>

            <h3 class="section-title">Attachments</h3>
              <div class="card-config">
                <p><strong>Customer Images:</strong> 3 file(s) attached</p>
                <ul>
                  <li>logo-${sampleData.session.id}-${sampleData.cardNumber}.jpg</li>
                  <li>photo-${sampleData.session.id}-${sampleData.cardNumber}.jpg</li>
                  <li>cover-${sampleData.session.id}-${sampleData.cardNumber}.jpg</li>
                </ul>
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
                <p className="text-sm text-gray-600">Customer details, card configuration, shipping address</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Attachments</h4>
                <p className="text-sm text-gray-600">vCard files and customer images</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
