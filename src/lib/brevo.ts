interface BrevoEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: {
    email: string;
    name: string;
  };
}

interface BrevoResponse {
  messageId?: string;
  error?: string;
  success: boolean;
}

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@trevins.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Trevins';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send email using Brevo API
 */
export async function sendEmail(params: BrevoEmailParams): Promise<BrevoResponse> {
  try {
    if (!BREVO_API_KEY) {
      console.warn('Brevo API key not configured, email not sent');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: params.sender || {
          email: BREVO_SENDER_EMAIL,
          name: BREVO_SENDER_NAME,
        },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', data);
      return {
        success: false,
        error: data.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  email: string,
  bookingCode: string,
  eventName: string,
  amount: number
): Promise<BrevoResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Thank you for your booking</h2>
            <p>Dear Customer,</p>
            <p>Your booking has been confirmed successfully. Here are the details:</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Booking Code:</strong> ${bookingCode}</p>
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Total Amount:</strong> Rp ${amount.toLocaleString('id-ID')}</p>
            </div>
            
            <p>Please keep this booking code for your reference. You can use it to check your booking status anytime.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" class="button">View My Bookings</a>
            
            <p>If you have any questions, feel free to contact us.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Trevins. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Booking Confirmed - ${bookingCode}`,
    htmlContent,
    textContent: `Your booking ${bookingCode} for ${eventName} has been confirmed. Total amount: Rp ${amount.toLocaleString('id-ID')}`,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  transactionCode: string,
  amount: number
): Promise<BrevoResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful!</h1>
          </div>
          <div class="content">
            <h2>Your payment has been processed</h2>
            <p>Dear Customer,</p>
            <p>Your payment has been successfully processed. Here are the details:</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Transaction Code:</strong> ${transactionCode}</p>
              <p><strong>Amount Paid:</strong> Rp ${amount.toLocaleString('id-ID')}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
            </div>
            
            <p>Thank you for your payment. Your booking is now confirmed.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Trevins. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Successful - ${transactionCode}`,
    htmlContent,
    textContent: `Your payment of Rp ${amount.toLocaleString('id-ID')} has been processed successfully. Transaction code: ${transactionCode}`,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<BrevoResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👋 Welcome to Trevins!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for signing up with Trevins! We're excited to have you on board.</p>
            
            <p>With Trevins, you can:</p>
            <ul>
              <li>Discover amazing events and activities</li>
              <li>Book accommodations for your trips</li>
              <li>Get exclusive deals and discounts</li>
              <li>Track all your bookings in one place</li>
            </ul>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">Start Exploring</a>
            
            <p>If you have any questions, feel free to reach out to us anytime.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Trevins. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Trevins!',
    htmlContent,
    textContent: `Welcome ${name}! Thank you for signing up with Trevins. Start exploring amazing events and activities today.`,
  });
}