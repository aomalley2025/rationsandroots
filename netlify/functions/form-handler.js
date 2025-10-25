import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event) {
  try {
    // Netlify form submission payload structure
    const body = JSON.parse(event.body);
    const data = body.payload && body.payload.data ? body.payload.data : {};

    const name = data.name || "Unknown";
    const email = data.email || "No email provided";
    const message = data.message || "No message";

    const businessEmail = "orders@rationsandrootsmeal.com";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>📩 New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${message}</blockquote>
        <hr />
        <p>🌱 Sent from your website: <a href="https://www.rationsandrootsmeal.com">Rations & Roots</a></p>
      </div>
    `;

    const msg = {
      to: businessEmail,
      from: businessEmail,
      subject: `New Contact Form Submission from ${name}`,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log("✅ Email sent successfully to", businessEmail);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("❌ Form email error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
