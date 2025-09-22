import { transformS3UrlToDomain } from './url-transform.js';

export interface CustomerConfirmationEmailData {
  session: {
    id: string;
  };
  customerData: {
    name: string;
    email: string;
    phone?: string;
  };
  cart: Array<{
    productType: 'basic' | 'core';
    quantity: number;
    configuration?: any;
    url?: string;
  }>;
  s3Urls?: Array<{
    urls: {
      html: string;
      vcard: string;
    };
  }>;
}

export interface AdminNotificationEmailData {
  session: {
    id: string;
    shipping?: {
      address?: {
        line1?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
    };
  };
  customerData: {
    name: string;
    email: string;
    phone?: string;
  };
  item: {
    productType: 'basic' | 'core';
    quantity: number;
    configuration?: any;
    url?: string;
  };
  cardNumber: number;
  s3Data?: {
    urls: {
      html: string;
      vcard: string;
    };
  } | null;
  cardDesignZipUrl?: string;
}

export interface AdminContactCreationEmailData {
  sessionId: string;
  configuration: {
    name?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    company?: string;
    title?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    socialMedia?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
    customMessage?: string;
  };
  s3Data?: {
    urls: {
      html: string;
      vcard: string;
    };
  } | null;
}

/**
 * Generates customer confirmation email HTML template
 */
export function generateCustomerConfirmationEmail(data: CustomerConfirmationEmailData): string {
  const { session, customerData, cart, s3Urls = [] } = data;

  const totalAmount = cart.reduce((sum: number, item: any) => {
    const price = item.productType === 'basic' ? 40 : 47;
    return sum + (price * item.quantity);
  }, 0);

  return `
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
            <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase, ${customerData.name}!</p>
          </div>

          <div class="content">
            <h2 class="section-title">Order Summary</h2>
            <div class="order-details">
              <p><strong>Order Number:</strong> ${session.id}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Customer:</strong> ${customerData.name}</p>
              <p><strong>Email:</strong> ${customerData.email}</p>
              <p><strong>Total Items:</strong> ${cart.reduce((sum: number, item: any) => sum + item.quantity, 0)}</p>
              <p><strong>Subtotal:</strong> $${totalAmount.toFixed(2)}</p>
              <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
            </div>

            <h3 class="section-title">Items Ordered</h3>
            ${cart.map((item: any, index: number) => `
              <div class="item">
                <strong>${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}</strong><br>
                Quantity: ${item.quantity}<br>
                Unit Price: $${item.productType === 'basic' ? '40.00' : '47.00'}<br>
                Item Total: $${((item.productType === 'basic' ? 40 : 47) * item.quantity).toFixed(2)}
                ${item.configuration ? `
                  ${item.productType === 'basic' ?
                    `<br><em>Website URL: <a href="${item.url || item.configuration.website}" target="_blank" style="color: #10b981;">${item.url || item.configuration.website}</a></em>` :
                    `<br><em>Configured for: ${item.configuration.name || 'Contact'}</em>`
                  }
                ` : item.productType === 'basic' && item.url ? `
                  <br><em>Website URL: <a href="${item.url}" target="_blank" style="color: #10b981;">${item.url}</a></em>
                ` : ''}
              </div>
            `).join('')}

            <h3>Shipping Information</h3>
            <p>Your order will be processed and shipped within 15-20 business days.</p>
            <p>You will receive a tracking number once your order ships.</p>

            ${s3Urls.length > 0 ? `
              <h3 class="section-title">Your Digital Contact Cards</h3>
              <div class="order-details">
                <p><strong>Great news!</strong> Your contact cards have been automatically generated and are live online. Share these links with anyone, anywhere!</p>
                <div style="margin: 20px 0;">
                  ${s3Urls.map((url, index) => `
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

            ${cart.some((item: any) => item.productType === 'basic') ? `
              <h3 class="section-title">Your Basic Cards</h3>
              <div class="order-details">
                <p><strong>Simple and effective!</strong> Your basic cards are configured to redirect to your specified website URLs.</p>
                <div style="margin: 20px 0;">
                  ${cart.filter((item: any) => item.productType === 'basic').map((item: any, index: number) => `
                    <div style="border: 1px solid #ddd; padding: 20px; margin: 15px 0; border-radius: 8px; background: #fff;">
                      <h4 style="margin: 0 0 15px 0; color: #10b981;">Basic Card ${index + 1}</h4>
                      <p style="margin: 8px 0;"><strong>Website URL:</strong> <a href="${item.url || item.configuration?.website}" target="_blank" style="color: #10b981; text-decoration: none;">${item.url || item.configuration?.website}</a></p>
                      <p style="margin: 8px 0; font-size: 14px; color: #666;">When someone taps this card, they'll be redirected to your website!</p>
                    </div>
                  `).join('')}
                </div>
                <div class="highlight-box">
                  <strong>Pro Tip:</strong> Basic cards are perfect for directing people to your website, portfolio, or any online destination. Simple, clean, and effective!
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
}

/**
 * Generates admin notification email HTML template
 */
export function generateAdminNotificationEmail(data: AdminNotificationEmailData): string {
  const { session, customerData, item, cardNumber, s3Data, cardDesignZipUrl } = data;

  // Determine website location and card design URL
  const websiteLocation = item.productType === 'basic' 
    ? (item.url || item.configuration?.website) 
    : (s3Data ? transformS3UrlToDomain(s3Data.urls.html) : 'Not generated');
  
  const cardDesignUrl = cardDesignZipUrl 
    ? `<a href="${cardDesignZipUrl}" target="_blank" style="color: #10b981;">download zip</a>`
    : 'None specified';

  // Get customer contact information
  const customerName = customerData?.name || 'Not provided';
  const customerEmail = customerData?.email || 'Not provided';
  const customerPhone = customerData?.phone || 'Not provided';

  // Get configuration details for core cards
  const configuration = item.configuration || {};
  const contactName = configuration.name || 'Not provided';
  const contactEmail = configuration.email || 'Not provided';
  const contactPhone = configuration.phone || 'Not provided';
  const contactTitle = configuration.title || 'Not provided';
  const contactCompany = configuration.company || 'Not provided';
  const contactWebsite = configuration.website || 'Not provided';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order - ${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'} #${cardNumber}</title>
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
          .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .contact-section { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-success { background: #10b981; color: white; }
          .status-pending { background: #f59e0b; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #10b981;">New Order Notification</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Card Instance #${cardNumber}</strong> of ${item.quantity}</p>
            <p style="font-size: 14px; margin-top: 10px;">Order placed on ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <span class="status-badge status-success">NEW ORDER</span>
          </div>
          
          <div class="content">
            <h2 class="section-title">Order Information</h2>
            <div class="order-details">
              <p><strong>Order Number:</strong> ${session.id}</p>
              <p><strong>Product:</strong> ${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}</p>
              <p><strong>Card Instance:</strong> ${cardNumber} of ${item.quantity}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            <h3 class="section-title">Customer Information</h3>
            <div class="card-config">
              <p><strong>Customer Name:</strong> ${customerName}</p>
              <p><strong>Customer Email:</strong> <a href="mailto:${customerEmail}" style="color: #10b981;">${customerEmail}</a></p>
              <p><strong>Customer Phone:</strong> ${customerPhone}</p>
            </div>


            <h3 class="section-title">Card Instructions</h3>
            <div class="card-config">
              <p><strong>Quantity:</strong> ${item.quantity}</p>
              <p><strong>Website Location:</strong> <a href="${websiteLocation}" target="_blank" style="color: #10b981;">${websiteLocation}</a></p>
              <p><strong>Card Design Location:</strong> ${cardDesignUrl}</p>
            </div>

            <h3 class="section-title">Shipping Address</h3>
            <div class="card-config">
              <p><strong>Address:</strong> ${session.shipping?.address?.line1 || 'Not provided'}</p>
              <p><strong>City:</strong> ${session.shipping?.address?.city || 'Not provided'}</p>
              <p><strong>State:</strong> ${session.shipping?.address?.state || 'Not provided'}</p>
              <p><strong>Postal Code:</strong> ${session.shipping?.address?.postal_code || 'Not provided'}</p>
              <p><strong>Country:</strong> ${session.shipping?.address?.country || 'Not provided'}</p>
            </div>

          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates admin contact creation email HTML template
 */
export function generateAdminContactCreationEmail(data: AdminContactCreationEmailData): string {
  const { sessionId, configuration, s3Data } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Admin Contact Creation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: white; }
          .card-config { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f8f9fa; border-radius: 0 0 8px 8px; }
          .success-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .url-box { background: #e0f2fe; padding: 15px; border-radius: 8px; border-left: 4px solid #0288d1; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Admin Contact Created</h1>
            <p>A new contact has been successfully created through the admin panel.</p>
            <span class="success-badge">CREATED</span>
          </div>
          
          <div class="content">
            <h2>Creation Information</h2>
            <div class="card-config">
              <p><strong>Creation ID:</strong> ${sessionId}</p>
              <p><strong>Created At:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Method:</strong> Admin Panel</p>
            </div>

            <h3>📋 Contact Details</h3>
            <div class="card-config">
              <h4>Basic Information:</h4>
              <p><strong>Name:</strong> ${configuration.name || 'Not provided'}</p>
              <p><strong>Email:</strong> ${configuration.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> ${configuration.phone || 'Not provided'}</p>
              <p><strong>Mobile:</strong> ${configuration.mobile || 'Not provided'}</p>
              <p><strong>Company:</strong> ${configuration.company || 'Not provided'}</p>
              <p><strong>Title:</strong> ${configuration.title || 'Not provided'}</p>
              <p><strong>Website:</strong> ${configuration.website || 'Not provided'}</p>
              
              <h4>Address Information:</h4>
              <p><strong>Street:</strong> ${configuration.address?.street || 'Not provided'}</p>
              <p><strong>City:</strong> ${configuration.address?.city || 'Not provided'}</p>
              <p><strong>State:</strong> ${configuration.address?.state || 'Not provided'}</p>
              <p><strong>Postal Code:</strong> ${configuration.address?.postalCode || 'Not provided'}</p>
              <p><strong>Country:</strong> ${configuration.address?.country || 'Not provided'}</p>
              
              <h4>Social Media:</h4>
              <p><strong>LinkedIn:</strong> ${configuration.socialMedia?.linkedin || 'Not provided'}</p>
              <p><strong>Twitter:</strong> ${configuration.socialMedia?.twitter || 'Not provided'}</p>
              <p><strong>Facebook:</strong> ${configuration.socialMedia?.facebook || 'Not provided'}</p>
              <p><strong>Instagram:</strong> ${configuration.socialMedia?.instagram || 'Not provided'}</p>
              
              ${configuration.customMessage ? `
                <h4>Custom Message:</h4>
                <p><em>${configuration.customMessage}</em></p>
              ` : ''}
            </div>

            ${s3Data ? `
              <div class="url-box">
                <h3>🌐 Generated Contact Card URLs</h3>
                <p><strong>Live Contact Card:</strong> <a href="${transformS3UrlToDomain(s3Data.urls.html)}" target="_blank" style="color: #10b981;">${transformS3UrlToDomain(s3Data.urls.html)}</a></p>
                <p><strong>vCard Download:</strong> <a href="${transformS3UrlToDomain(s3Data.urls.vcard)}" target="_blank" style="color: #10b981;">Download vCard</a></p>
                <p><em>The contact card is now live and can be shared with anyone!</em></p>
              </div>
            ` : ''}

            <h3>📝 Next Steps</h3>
            <div class="card-config">
              <ul>
                <li>Contact card has been generated and uploaded to S3</li>
                <li>vCard file is available for download</li>
                <li>Contact can now be shared via the live URL</li>
                <li>All contact information is properly formatted and ready for use</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>© TagMe Connections | Admin Panel</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
