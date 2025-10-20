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

    // ✅ Optional: trigger confirmation email
    try {
      await fetch(`${process.env.URL || 'https://www.rationsandrootsmeal.com'}/.netlify/functions/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: 'orders@rationsandrootsmeal.com', // can replace with real customer email
          planName,
          description,
          total,
        }),
      });
      console.log("✅ Confirmation email triggered successfully");
    } catch (emailError) {
      console.error("⚠️ Failed to trigger SendGrid confirmation email:", emailError);
    }

    console.log("Session created successfully:", session.url);

    // ✅ Return the Stripe session URL to frontend
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
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
