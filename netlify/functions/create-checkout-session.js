// netlify/functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { total, mealsSelected, delivery, kids, address } = JSON.parse(event.body || "{}");

    // Validate input
    if (!total || isNaN(total)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid total amount." }),
      };
    }

    // Stripe requires cents
    const amountInCents = Math.round(parseFloat(total) * 100);

    // Create checkout session with ONE line item (your total)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Rations & Roots Weekly Meal Plan",
              description: `Includes ${mealsSelected} meals${kids > 0 ? ` + ${kids} kids meals` : ""}${
                delivery === "delivery" ? " (with delivery)" : ""
              }`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL || "https://rationsandrootsmeal.netlify.app"}/?success=true`,
      cancel_url: `${process.env.URL || "https://rationsandrootsmeal.netlify.app"}/?canceled=true`,
      metadata: {
        mealsSelected,
        delivery,
        kids,
        address,
        total,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
