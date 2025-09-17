import { Resend } from 'resend';
import type { Context } from '@netlify/functions';
import { createVCardAttachment, type VCardConfig } from './utils/vcard-generator.js';

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
      customerInfo = {
        name: session.metadata.customerName || 'Customer',
        email: session.metadata.customerEmail || 'customer@example.com',
        phone: ''
      };
    }

    // Send customer confirmation email
    await sendCustomerConfirmationEmail(session, customerInfo, cart);

    // Send admin notification emails (one per card)
    for (const item of cart) {
      for (let i = 0; i < item.quantity; i++) {
        await sendAdminNotificationEmail(session, customerInfo, item, i + 1);
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

async function sendCustomerConfirmationEmail(session: any, customerData: any, cart: any) {
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
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background: #f8f9fa; padding: 15px; margin: 20px 0; }
            .item { margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
              <p>Thank you for your purchase!</p>
            </div>
            
            <div class="content">
              <h2>Order Details</h2>
              <div class="order-details">
                <p><strong>Order Number:</strong> ${session.id}</p>
                <p><strong>Customer:</strong> ${customerData.name}</p>
                <p><strong>Email:</strong> ${customerData.email}</p>
                <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
              </div>

              <h3>Items Ordered:</h3>
              ${cart.map((item: any) => `
                <div class="item">
                  <strong>${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}</strong><br>
                  Quantity: ${item.quantity}<br>
                  Price: $${item.productType === 'basic' ? '40.00' : '47.00'} each
                </div>
              `).join('')}

              <h3>Shipping Information</h3>
              <p>Your order will be processed and shipped within 15-20 business days.</p>
              <p>You will receive a tracking number once your order ships.</p>

              <h3>Support</h3>
              <p>If you have any questions about your order, please contact us at ${process.env.SUPPORT_EMAIL}</p>
            </div>

            <div class="footer">
              <p>© ${process.env.COMPANY_NAME} | ${process.env.COMPANY_WEBSITE}</p>
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

async function sendAdminNotificationEmail(session: any, customerData: any, item: any, cardNumber: any) {
  try {
    // Generate vCard attachment from item configuration
    let vcardAttachment = null;
    let customerImages = [];
    
    if (item.configuration) {
      // Create vCard configuration from item data
      const vcardConfig: VCardConfig = {
        name: item.configuration.name,
        email: item.configuration.email,
        phone: item.configuration.phone,
        company: item.configuration.company,
        title: item.configuration.title,
        website: item.configuration.website,
        socialMedia: item.configuration.socialMedia,
        customMessage: item.configuration.customMessage
      };
      
      // Generate vCard attachment
      vcardAttachment = createVCardAttachment(vcardConfig, session.id, cardNumber);
      
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

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Order - Card ${cardNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background: #f8f9fa; padding: 15px; margin: 20px 0; }
            .card-config { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Order Notification</h1>
              <p>Card Instance #${cardNumber}</p>
            </div>
            
            <div class="content">
              <h2>Order Information</h2>
              <div class="order-details">
                <p><strong>Order Number:</strong> ${session.id}</p>
                <p><strong>Product:</strong> ${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'}</p>
                <p><strong>Card Instance:</strong> ${cardNumber} of ${item.quantity}</p>
              </div>

              <h3>Customer Information</h3>
              <div class="card-config">
                <p><strong>Name:</strong> ${customerData.name}</p>
                <p><strong>Email:</strong> ${customerData.email}</p>
                <p><strong>Phone:</strong> ${customerData.phone || 'Not provided'}</p>
                <p><strong>Company:</strong> ${customerData.company || 'Not provided'}</p>
                <p><strong>Title:</strong> ${customerData.title || 'Not provided'}</p>
                <p><strong>Website:</strong> ${customerData.website || 'Not provided'}</p>
              </div>

              <h3>Card Configuration</h3>
              <div class="card-config">
                <p><strong>Social Media Links:</strong></p>
                <ul>
                  ${item.configuration?.socialMedia ? Object.entries(item.configuration.socialMedia).map(([platform, url]) => 
                    `<li>${platform}: ${url}</li>`
                  ).join('') : '<li>No social media links provided</li>'}
                </ul>
                
                <p><strong>Custom Message:</strong></p>
                <p>${item.configuration?.customMessage || 'No custom message provided'}</p>
              </div>

              <h3>Shipping Address</h3>
              <div class="card-config">
                <p><strong>Address:</strong> ${session.shipping?.address?.line1 || 'Not provided'}</p>
                <p><strong>City:</strong> ${session.shipping?.address?.city || 'Not provided'}</p>
                <p><strong>State:</strong> ${session.shipping?.address?.state || 'Not provided'}</p>
                <p><strong>Postal Code:</strong> ${session.shipping?.address?.postal_code || 'Not provided'}</p>
                <p><strong>Country:</strong> ${session.shipping?.address?.country || 'Not provided'}</p>
              </div>

              <h3>Attachments</h3>
              <div class="card-config">
                <p><strong>vCard File:</strong> ${vcardAttachment ? vcardAttachment.filename : 'Not generated'}</p>
                <p><strong>Customer Images:</strong> ${customerImages.length} file(s) attached</p>
                <ul>
                  ${customerImages.map(img => `<li>${img.filename}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Prepare attachments array
    const attachments = [];
    
    if (vcardAttachment) {
      attachments.push({
        filename: vcardAttachment.filename,
        content: vcardAttachment.content,
        contentType: 'text/vcard'
      });
    }
    
    // Add customer images
    attachments.push(...customerImages);

    await resend.emails.send({
      from: emailFrom, // This should be your verified domain
      to: [adminEmail],
      subject: `New Order - ${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'} #${cardNumber}`,
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    console.log(`Admin notification email sent for card ${cardNumber} with ${attachments.length} attachments`);
  } catch (error) {
    console.error(`Error sending admin notification email for card ${cardNumber}:`, error);
  }
}

