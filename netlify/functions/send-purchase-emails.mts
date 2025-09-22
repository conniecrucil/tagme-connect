import { Resend } from 'resend';
import type { Context } from '@netlify/functions';
import { transformS3UrlToDomain } from './utils/url-transform.js';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const emailFrom = process.env.EMAIL_FROM || 'hello@brianbancroft.ca';
const adminEmail = process.env.ADMIN_EMAIL || 'connectme-test@mailinator.com';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { sessionId, customerInfo, cart } = body;

    if (!sessionId || !customerInfo || !cart) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate customer email is provided
    if (!customerInfo.email || !customerInfo.email.trim()) {
      return new Response(JSON.stringify({ error: 'Customer email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a mock session object for compatibility with existing functions
    const session = {
      id: sessionId,
      metadata: {
        sessionId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        totalItems: cart.reduce((sum: number, item: any) => sum + item.quantity, 0).toString(),
        totalAmount: cart.reduce((sum: number, item: any) => {
          const price = item.productType === 'basic' ? 40 : 47;
          return sum + (price * item.quantity);
        }, 0).toString()
      },
      shipping: customerInfo.shipping || null
    };

    await handleCheckoutSessionCompleted(session, cart, customerInfo);

    return new Response(JSON.stringify({ success: true, message: 'Emails sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing purchase emails:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function handleCheckoutSessionCompleted(session: any, cart?: any, customerInfo?: any) {
  try {
    // Use provided data or fallback to metadata
    if (!cart || !customerInfo) {
      cart = [{
        productId: 'unknown',
        productType: 'basic',
        quantity: parseInt(session.metadata.totalItems) || 1,
        price: parseFloat(session.metadata.totalAmount) || 40
      }];
      // Validate that we have required customer email
      if (!session.metadata.customerEmail || !session.metadata.customerEmail.trim()) {
        throw new Error('Customer email is required but not found in session metadata');
      }
      
      customerInfo = {
        name: session.metadata.customerName || 'Customer',
        email: session.metadata.customerEmail,
        phone: ''
      };
    }

    // Upload contact cards to S3 (one per card) - only for core cards
    const s3Urls = [];
    for (const item of cart) {
      for (let i = 0; i < item.quantity; i++) {
        if (item.configuration && item.productType === 'core') {
          try {
            const s3Response = await uploadContactCardToS3(session.id, item.configuration, i + 1);
            s3Urls.push(s3Response);
          } catch (error) {
            console.error(`Failed to upload card ${i + 1} to S3:`, error);
          }
        }
      }
    }

    // Send customer confirmation email
    await sendCustomerConfirmationEmail(session, customerInfo, cart, s3Urls);

    // Send admin notification emails (one per card)
    for (const item of cart) {
      for (let i = 0; i < item.quantity; i++) {
        await sendAdminNotificationEmail(session, customerInfo, item, i + 1, s3Urls[i] || null);
      }
    }

    console.log('Successfully processed checkout session:', session.id);
  } catch (error) {
    console.error('Error handling checkout session:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  // Additional payment success logic can be added here
}

async function uploadContactCardToS3(sessionId: string, configuration: any, cardNumber: number) {
  try {
    const response = await fetch(`${process.env.NETLIFY_SITE_URL || 'http://localhost:8888'}/.netlify/functions/upload-to-s3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactData: configuration,
        sessionId: `${sessionId}-${cardNumber}`
      })
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

async function sendCustomerConfirmationEmail(session: any, customerData: any, cart: any, s3Urls: any[] = []) {
  try {
    const totalAmount = cart.reduce((sum: number, item: any) => {
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

    await resend.emails.send({
      from: emailFrom, // This should be your verified domain
      to: [customerData.email],
      subject: `Order Confirmation - ${session.id}`,
      html: emailHtml,
    });

    console.log('Customer confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
  }
}

async function sendAdminNotificationEmail(session: any, customerData: any, item: any, cardNumber: any, s3Data: any = null) {
  try {
    // Handle customer images if they exist
    let customerImages = [];
    
    if (item.configuration && item.productType === 'core') {
      
      // Handle customer images if they exist
      if (item.configuration.images) {
        const { logo, photo, cover } = item.configuration.images;
        
        if (logo?.blob) {
          customerImages.push({
            filename: `logo-${session.id}-${cardNumber}.${logo.ext || 'jpg'}`,
            content: logo.blob.split(',')[1], // Remove data:image/jpeg;base64, prefix
            contentType: logo.mime || 'image/jpeg'
          });
        }
        
        if (photo?.blob) {
          customerImages.push({
            filename: `photo-${session.id}-${cardNumber}.${photo.ext || 'jpg'}`,
            content: photo.blob.split(',')[1], // Remove data:image/jpeg;base64, prefix
            contentType: photo.mime || 'image/jpeg'
          });
        }
        
        if (cover?.blob) {
          customerImages.push({
            filename: `cover-${session.id}-${cardNumber}.${cover.ext || 'jpg'}`,
            content: cover.blob.split(',')[1], // Remove data:image/jpeg;base64, prefix
            contentType: cover.mime || 'image/jpeg'
          });
        }
      }
    }

    // Determine website location and logo URL
    const websiteLocation = item.productType === 'basic' 
      ? (item.url || item.configuration?.website) 
      : (s3Data ? transformS3UrlToDomain(s3Data.urls.html) : 'Not generated');
    
    const logoUrl = item.configuration?.images?.logo?.blob 
      ? `Customer uploaded logo (attached as logo-${session.id}-${cardNumber}.${item.configuration.images.logo.ext || 'jpg'})`
      : 'None specified';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Order - Card ${cardNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 30px 20px; text-align: center; border-bottom: 3px solid #10b981; }
            .content { padding: 20px; }
            .order-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .card-config { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 15px 0; border-radius: 8px; }
            .section-title { color: #10b981; font-size: 18px; font-weight: bold; margin: 25px 0 15px 0; }
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
            </div>
            
            <div class="content">
              <h2>Order Information</h2>
              <div class="order-details">
                <p><strong>Order Number:</strong> ${session.id}</p>
                <p><strong>Product:</strong> ${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}</p>
                <p><strong>Card Instance:</strong> ${cardNumber} of ${item.quantity}</p>
              </div>

              <h3>Card Instructions</h3>
              <div class="card-config">
                <p><strong>Quantity:</strong> ${item.quantity}</p>
                <p><strong>Website Location:</strong> <a href="${websiteLocation}" target="_blank" style="color: #10b981;">${websiteLocation}</a></p>
                <p><strong>Logo Location:</strong> ${logoUrl}</p>
              </div>

              <h3>Shipping Address</h3>
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

    await resend.emails.send({
      from: emailFrom, // This should be your verified domain
      to: [adminEmail],
      subject: `New Order - ${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'} #${cardNumber}`,
      html: emailHtml
    });

    console.log(`Admin notification email sent for card ${cardNumber} - no attachments`);
  } catch (error) {
    console.error(`Error sending admin notification email for card ${cardNumber}:`, error);
  }
}

