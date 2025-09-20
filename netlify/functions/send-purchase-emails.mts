import { Resend } from 'resend';
import type { Context } from '@netlify/functions';

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
              <h1>🎉 Order Confirmation</h1>
              <p>Thank you for your purchase, ${customerData.name}!</p>
            </div>
            
            <div class="content">
              <h2>📋 Order Summary</h2>
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
                <p><strong>Shipping:</strong> FREE</p>
                <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
              </div>

              <h3>🛍️ Items Ordered:</h3>
              ${cart.map((item: any, index: number) => `
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

              ${s3Urls.length > 0 ? `
                <h3>🌐 Your Digital Contact Cards</h3>
                <div class="order-details">
                  <p><strong>Great news!</strong> Your contact cards have been automatically generated and are live online. Share these links with anyone, anywhere!</p>
                  <div style="margin: 20px 0;">
                    ${s3Urls.map((url, index) => `
                      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fff;">
                        <h4 style="margin: 0 0 10px 0; color: #10b981;">Contact Card ${index + 1}</h4>
                        <p style="margin: 5px 0;"><strong>📱 View Online:</strong> <a href="${url.urls.html}" target="_blank" style="color: #10b981; text-decoration: none;">${url.urls.html}</a></p>
                        <p style="margin: 5px 0;"><strong>📥 Download vCard:</strong> <a href="${url.urls.vcard}" download style="color: #10b981; text-decoration: none;">Save to Contacts</a></p>
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">Share this URL with anyone to let them save your contact information instantly!</p>
                      </div>
                    `).join('')}
                  </div>
                  <p style="background: #e0f2fe; padding: 15px; border-radius: 8px; border-left: 4px solid #0288d1;">
                    <strong>💡 Pro Tip:</strong> You can share these links via text message, email, or social media. When someone clicks the link on their phone, they'll see your contact card and can save it directly to their contacts!
                  </p>
                </div>
              ` : ''}

              ${cart.some((item: any) => item.productType === 'basic') ? `
                <h3>🔗 Your Basic Cards</h3>
                <div class="order-details">
                  <p><strong>Simple and effective!</strong> Your basic cards are configured to redirect to your specified website URLs.</p>
                  <div style="margin: 20px 0;">
                    ${cart.filter((item: any) => item.productType === 'basic').map((item: any, index: number) => `
                      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fff;">
                        <h4 style="margin: 0 0 10px 0; color: #10b981;">Basic Card ${index + 1}</h4>
                        <p style="margin: 5px 0;"><strong>🌐 Website URL:</strong> <a href="${item.configuration.website}" target="_blank" style="color: #10b981; text-decoration: none;">${item.configuration.website}</a></p>
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">When someone taps this card, they'll be redirected to your website!</p>
                      </div>
                    `).join('')}
                  </div>
                  <p style="background: #e0f2fe; padding: 15px; border-radius: 8px; border-left: 4px solid #0288d1;">
                    <strong>💡 Pro Tip:</strong> Basic cards are perfect for directing people to your website, portfolio, or any online destination. Simple, clean, and effective!
                  </p>
                </div>
              ` : ''}

              <h3>📦 What Happens Next?</h3>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; align-items: center; margin: 10px 0;">
                  <div style="background: #10b981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">1</div>
                  <div><strong>Digital Cards Ready:</strong> Your contact cards are live and ready to share immediately!</div>
                </div>
                <div style="display: flex; align-items: center; margin: 10px 0;">
                  <div style="background: #10b981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">2</div>
                  <div><strong>Physical Cards:</strong> We'll start production within 24 hours</div>
                </div>
                <div style="display: flex; align-items: center; margin: 10px 0;">
                  <div style="background: #10b981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">3</div>
                  <div><strong>Shipping:</strong> Your physical cards will ship within 15-20 business days</div>
                </div>
                <div style="display: flex; align-items: center; margin: 10px 0;">
                  <div style="background: #10b981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold;">4</div>
                  <div><strong>Tracking:</strong> You'll receive tracking information once your order ships</div>
                </div>
              </div>

              <h3>🆘 Support</h3>
              <p>If you have any questions about your order, please contact us at <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #10b981;">${process.env.SUPPORT_EMAIL}</a></p>
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
              <h1>🛒 New Order Notification</h1>
              <p><strong>Card Instance #${cardNumber}</strong> of ${item.quantity}</p>
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

              <h3>Customer Information</h3>
              <div class="card-config">
                <p><strong>Name:</strong> ${customerData.name}</p>
                <p><strong>Email:</strong> ${customerData.email}</p>
                <p><strong>Phone:</strong> ${customerData.phone || 'Not provided'}</p>
                <p><strong>Company:</strong> ${customerData.company || 'Not provided'}</p>
                <p><strong>Title:</strong> ${customerData.title || 'Not provided'}</p>
                <p><strong>Website:</strong> ${customerData.website || 'Not provided'}</p>
              </div>

              ${item.productType === 'basic' ? `
                <h3>🔗 Basic Card Configuration</h3>
                <div class="card-config">
                  <h4>Website URL:</h4>
                  <p><strong>Target URL:</strong> <a href="${item.configuration?.website}" target="_blank" style="color: #10b981;">${item.configuration?.website}</a></p>
                  <p style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-top: 10px;">
                    <strong>Note:</strong> This basic card will redirect users directly to the specified website when tapped.
                  </p>
                </div>
              ` : `
                <h3>📋 Card Configuration Details</h3>
                <div class="card-config">
                  <h4>Contact Information:</h4>
                  <p><strong>Name:</strong> ${item.configuration?.name || 'Not provided'}</p>
                  <p><strong>Email:</strong> ${item.configuration?.email || 'Not provided'}</p>
                  <p><strong>Phone:</strong> ${item.configuration?.phone || 'Not provided'}</p>
                  <p><strong>Company:</strong> ${item.configuration?.company || 'Not provided'}</p>
                  <p><strong>Title:</strong> ${item.configuration?.title || 'Not provided'}</p>
                  <p><strong>Website:</strong> ${item.configuration?.website || 'Not provided'}</p>
                  
                  <h4>Social Media Links:</h4>
                  ${item.configuration?.socialMedia && Object.keys(item.configuration.socialMedia).length > 0 ? `
                    <ul>
                      ${Object.entries(item.configuration.socialMedia).map(([platform, url]) => 
                        `<li><strong>${platform.charAt(0).toUpperCase() + platform.slice(1)}:</strong> <a href="${url}" target="_blank">${url}</a></li>`
                      ).join('')}
                    </ul>
                  ` : '<p>No social media links provided</p>'}
                  
                  <h4>Custom Message:</h4>
                  <p style="font-style: italic; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                    "${item.configuration?.customMessage || 'No custom message provided'}"
                  </p>
                </div>
              `}

              <h3>Shipping Address</h3>
              <div class="card-config">
                <p><strong>Address:</strong> ${session.shipping?.address?.line1 || 'Not provided'}</p>
                <p><strong>City:</strong> ${session.shipping?.address?.city || 'Not provided'}</p>
                <p><strong>State:</strong> ${session.shipping?.address?.state || 'Not provided'}</p>
                <p><strong>Postal Code:</strong> ${session.shipping?.address?.postal_code || 'Not provided'}</p>
                <p><strong>Country:</strong> ${session.shipping?.address?.country || 'Not provided'}</p>
              </div>

              ${item.productType === 'core' ? `
                <h3>Attachments</h3>
                <div class="card-config">
                  <p><strong>Customer Images:</strong> ${customerImages.length} file(s) attached</p>
                  <ul>
                    ${customerImages.map(img => `<li>${img.filename}</li>`).join('')}
                  </ul>
                </div>
              ` : `
                <h3>Basic Card Setup</h3>
                <div class="card-config">
                  <p><strong>No attachments required</strong> - Basic cards only need the website URL configuration.</p>
                  <p style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-top: 10px;">
                    <strong>Production Note:</strong> The NFC card will be programmed to redirect to: <a href="${item.configuration?.website}" target="_blank" style="color: #10b981;">${item.configuration?.website}</a>
                  </p>
                </div>
              `}

              ${item.productType === 'core' ? (
                s3Data ? `
                  <h3>🌐 Generated Contact Card Website</h3>
                  <div class="card-config" style="border: 2px solid #10b981; background: #f0fdf4;">
                    <h4 style="color: #10b981; margin-top: 0;">✅ Contact Card Successfully Generated!</h4>
                    
                    <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 10px 0;">
                      <h5>📱 Live Contact Card:</h5>
                      <p><strong>Website URL:</strong> <a href="${s3Data.urls.html}" target="_blank" style="color: #10b981; text-decoration: none; font-weight: bold;">${s3Data.urls.html}</a></p>
                      <p style="font-size: 12px; color: #666; margin: 5px 0;">This is a fully functional mobile-optimized contact card website</p>
                    </div>
                    
                    <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 10px 0;">
                      <h5>📥 vCard Download:</h5>
                      <p><strong>vCard File:</strong> <a href="${s3Data.urls.vcard}" target="_blank" style="color: #10b981; text-decoration: none;">${s3Data.urls.vcard}</a></p>
                      <p style="font-size: 12px; color: #666; margin: 5px 0;">Direct download link for contact import</p>
                    </div>
                    
                    <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 10px 0;">
                      <h5>🔧 Technical Details:</h5>
                      <p><strong>Folder ID:</strong> ${s3Data.folderId}</p>
                      <p><strong>Generated Images:</strong> ${s3Data.imageUrls && Object.keys(s3Data.imageUrls).length > 0 ? 
                        Object.keys(s3Data.imageUrls).map(key => key).join(', ') : 'None'}</p>
                      <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">✅ Live and Publicly Accessible</span></p>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #ffc107;">
                      <h5>💡 Admin Notes:</h5>
                      <p style="margin: 5px 0;">• Contact card is mobile-first optimized</p>
                      <p style="margin: 5px 0;">• Includes SEO meta tags and social media previews</p>
                      <p style="margin: 5px 0;">• All files are publicly accessible</p>
                      <p style="margin: 5px 0;">• Customer can share the website URL directly</p>
                    </div>
                  </div>
                ` : `
                  <h3>⚠️ Contact Card Generation</h3>
                  <div class="card-config" style="border: 2px solid #f59e0b; background: #fffbeb;">
                    <p style="color: #92400e; margin: 0;">Contact card was not generated - no configuration data available</p>
                  </div>
                `
              ) : `
                <h3>🔗 Basic Card Configuration</h3>
                <div class="card-config" style="border: 2px solid #10b981; background: #f0fdf4;">
                  <h4 style="color: #10b981; margin-top: 0;">✅ Basic Card Ready for Production!</h4>
                  
                  <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <h5>🌐 Target Website:</h5>
                    <p><strong>Website URL:</strong> <a href="${item.configuration?.website}" target="_blank" style="color: #10b981; text-decoration: none; font-weight: bold;">${item.configuration?.website}</a></p>
                    <p style="font-size: 12px; color: #666; margin: 5px 0;">This is where users will be redirected when they tap the NFC card</p>
                  </div>
                  
                  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #ffc107;">
                    <h5>💡 Production Notes:</h5>
                    <p style="margin: 5px 0;">• No website generation required - direct URL redirect</p>
                    <p style="margin: 5px 0;">• Simple and effective for basic use cases</p>
                    <p style="margin: 5px 0;">• Perfect for portfolios, business websites, or landing pages</p>
                    <p style="margin: 5px 0;">• Lower cost and faster production time</p>
                  </div>
                </div>
              `}
            </div>
          </div>
        </body>
      </html>
    `;

    // Prepare attachments array
    const attachments = [];
    
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

