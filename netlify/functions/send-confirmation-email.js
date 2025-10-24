// netlify/functions/send-confirmation-email.js
const sgMail = require("@sendgrid/mail");

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");

    // Expecting: { email, total, mealsSelected, delivery, kids, address }
    const {
      email,
      total,
      mealsSelected,
      delivery,
      kids,
      address
    } = data;

    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Create the shared HTML summary
    const summaryHTML = `
      <h2>Rations & Roots Meal Prep Order</h2>
      <p><strong>Meals Selected:</strong> ${mealsSelected}</p>
      <p><strong>Kids Meals:</strong> ${kids}</p>
      <p><strong>Delivery Option:</strong> ${delivery}</p>
      ${
        delivery === "delivery"
          ? `<p><strong>Delivery Address:</strong> ${address}</p>`
          : ""
      }
      <p><strong>Total:</strong> $${total}</p>
      <br>
      <p>Thank you for choosing <strong>Rations & Roots</strong> 🌱<br>
      <em>Fuel Your Body. Fork the Rest.</em></p>
    `;

    // Send email to you (the business)
    const ownerMsg = {
      to: "orders@rationsandrootsmeal.com",
      from: "orders@rationsandrootsmeal.com",
      subject: "📦 New Meal Prep Order Received!",
      html: summaryHTML,
    };

    // Send confirmation to customer (if they included their email)
    const customerMsg = email
      ? {
          to: email,
          from: "orders@rationsandrootsmeal.com",
          subject: "🌱 Your Rations & Roots Order Confirmation",
          html: `
            <p>Hi there!</p>
            <p>Thank you for your order with <strong>Rations & Roots</strong>!</p>
            ${summaryHTML}
            <p>We'll reach out soon with delivery/pickup details.</p>
          `,
        }
      : null;

    // Send both messages
    const sends = [sgMail.send(ownerMsg)];
    if (customerMsg) sends.push(sgMail.send(customerMsg));

    await Promise.all(sends);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Emails sent successfully" }),
    };
  } catch (err) {
    console.error("❌ SendGrid email error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
