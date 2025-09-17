const Stripe = require('stripe');
const { Resend } = require('resend');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(stripeEvent.data.object);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(stripeEvent.data.object);
      break;
    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};

async function handleCheckoutSessionCompleted(session) {
  try {
    const { cart, customerInfo } = JSON.parse(session.metadata.cart);
    const customerData = JSON.parse(session.metadata.customerInfo);

    // Send customer confirmation email
    await sendCustomerConfirmationEmail(session, customerData, cart);

    // Send admin notification emails (one per card)
    for (const item of cart) {
      for (let i = 0; i < item.quantity; i++) {
        await sendAdminNotificationEmail(session, customerData, item, i + 1);
      }
    }

    console.log('Successfully processed checkout session:', session.id);
  } catch (error) {
    console.error('Error handling checkout session:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  // Additional payment success logic can be added here
}

async function sendCustomerConfirmationEmail(session, customerData, cart) {
  try {
    const totalAmount = cart.reduce((sum, item) => {
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
              ${cart.map(item => `
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
      from: 'noreply@yourcompany.com', // This should be your verified domain
      to: [customerData.email],
      subject: `Order Confirmation - ${session.id}`,
      html: emailHtml,
    });

    console.log('Customer confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
  }
}

async function sendAdminNotificationEmail(session, customerData, item, cardNumber) {
  try {
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
                  ${customerData.socialMedia ? Object.entries(customerData.socialMedia).map(([platform, url]) => 
                    `<li>${platform}: ${url}</li>`
                  ).join('') : '<li>No social media links provided</li>'}
                </ul>
                
                <p><strong>Custom Message:</strong></p>
                <p>${customerData.customMessage || 'No custom message provided'}</p>
              </div>

              <h3>Shipping Address</h3>
              <div class="card-config">
                <p><strong>Address:</strong> ${session.shipping?.address?.line1 || 'Not provided'}</p>
                <p><strong>City:</strong> ${session.shipping?.address?.city || 'Not provided'}</p>
                <p><strong>State:</strong> ${session.shipping?.address?.state || 'Not provided'}</p>
                <p><strong>Postal Code:</strong> ${session.shipping?.address?.postal_code || 'Not provided'}</p>
                <p><strong>Country:</strong> ${session.shipping?.address?.country || 'Not provided'}</p>
              </div>

              <p><em>Note: Customer-uploaded images and generated vCard files will be attached to this email.</em></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'orders@yourcompany.com', // This should be your verified domain
      to: [process.env.ADMIN_EMAIL],
      subject: `New Order - ${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'} #${cardNumber}`,
      html: emailHtml,
      // Note: In a real implementation, you would attach the vCard file and customer images here
      // attachments: [
      //   {
      //     filename: `vcard-${session.id}-${cardNumber}.vcf`,
      //     content: vcardContent,
      //   },
      //   ...customerImages
      // ]
    });

    console.log(`Admin notification email sent for card ${cardNumber}`);
  } catch (error) {
    console.error(`Error sending admin notification email for card ${cardNumber}:`, error);
  }
}

