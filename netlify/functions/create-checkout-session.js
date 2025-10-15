import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    console.log("Incoming body:", event.body);
    const { planName, description, total } = JSON.parse(event.body);

    if (!total || total <= 0) {
      console.error("Invalid total received:", total);
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Invalid total amount" }),
      };
    }

    console.log("Creating session with total:", total);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      automatic_tax: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planName,
              description: description,
            },
            unit_amount: Math.round(total * 100), // Convert dollars → cents
          },
          quantity: 1,
        },
      ],
      success_url: "https://www.rationsandrootsmeal.com/success",
      cancel_url: "https://www.rationsandrootsmeal.com/cancel",
    });

   console.log("Session created successfully:", session.url);

// ✉️ Send notification email using Netlify’s built-in email integration
try {
  await fetch("https://api.netlify.com/api/v1/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NETLIFY_API_TOKEN}`,
    },
    body: JSON.stringify({
      from: "Rations & Roots <orders@rationsandrootsmeal.com>",
      to: "orders@rationsandrootsmeal.com",
      subject: `New Order: ${planName}`,
      body: `
        <h2>New Order Received!</h2>
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p><strong>Stripe Session:</strong> ${session.url}</p>
      `,
    }),
  });
  console.log("✅ Order notification sent to GoDaddy inbox");
} catch (emailError) {
  console.error("⚠️ Failed to send order email:", emailError);
}

return {
  statusCode: 200,
  body: JSON.stringify({ url: session.url }),
};

  } catch (err) {
    console.error("Stripe error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
