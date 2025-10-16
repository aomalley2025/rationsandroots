
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event) {
  try {
    const { customerEmail, planName, description, total } = JSON.parse(event.body);

    const businessEmail = 'orders@rationsandrootsmeal.com';
    const logoURL = 'https://www.rationsandrootsmeal.com/images/rooted-in-purpose-badge.png';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <img src="${logoURL}" alt="Rations & Roots Logo" style="width: 160px; margin-bottom: 20px;">
        <h1 style="color: #2e7d32;">Thank You for Your Order!</h1>
        <p style="font-size: 16px; color: #555;">
          We’ve received your order and it’s being prepared with love and fresh ingredients. 💚
        </p>
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; display: inline-block; text-align: left;">
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Details:</strong> ${description}</p>
          <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        </div>
        <p style="margin-top: 20px; color: #444;">
          Questions? Reach us anytime at <a href="mailto:orders@rationsandrootsmeal.com">orders@rationsandrootsmeal.com</a>
        </p>
        <p style="font-weight: bold; color: #388e3c;">🌱 Fuel Your Body. Fork the Rest.</p>
      </div>
    `;

    // Send to both the customer and business
    const msg = {
      to: [customerEmail, businessEmail],
      from: businessEmail,
      subject: `Rations & Roots Order Confirmation — ${planName}`,
      html: htmlContent,
    };

    await sgMail.sendMultiple(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Email send error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
