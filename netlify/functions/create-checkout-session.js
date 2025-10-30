// netlify/functions/create-checkout-session.js
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const {
      total,
      mealsSelected,
      delivery,
      kids,
      address,
      extras,
      email,
      selectedMeals // ✅ new
    } = JSON.parse(event.body || "{}");

    // ✅ Validate input
    if (!total || isNaN(total)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid total amount." }),
      };
    }

    // ✅ Convert total to cents for Stripe
    const amountInCents = Math.round(parseFloat(total) * 100);

    // ✅ Create checkout session
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
              }${extras ? ` | Extras: ${extras}` : ""}${selectedMeals?.length ? ` | Meals: ${Array.isArray(selectedMeals) ? selectedMeals.join(", ") : selectedMeals}` : ""}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: email, // ✅ prefill Stripe Checkout with their email
      metadata: {
        mealsSelected,
        kids,
        delivery,
        address,
        extras,
        total,
        email,
        selectedMeals: Array.isArray(selectedMeals) ? selectedMeals.join(", ") : selectedMeals // ✅ add here
      },
      success_url: `${process.env.SITE_URL}/success.html`,
	  cancel_url: `${process.env.SITE_URL}/cancel.html`,

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
