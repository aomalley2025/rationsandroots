// netlify/functions/create-checkout-session.js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const {
      mealsSelected,
      delivery,
      kids,
      address,
      email,
      selectedMeals,  // Now array of {name, qty, price}
      selectedExtras  // Optional: array of {name, price}
    } = JSON.parse(event.body || "{}");

    // Build line_items
    const line_items = [];

    // Add meals
    (selectedMeals || []).forEach(meal => {
      if (meal.name && meal.qty > 0 && !isNaN(meal.price)) {
        line_items.push({
          price_data: {
            currency: "usd",
            product_data: { name: meal.name },
            unit_amount: Math.round(meal.price * 100),  // e.g., 15.00 -> 1500 cents
          },
          quantity: meal.qty,
        });
      }
    });

    // Add kids meals
    const kidsNum = parseInt(kids, 10);
    if (kidsNum > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Kids Meal x${kidsNum}` },
          unit_amount: 750,  // $7.50 in cents (adjust if different)
        },
        quantity: 1,  // Group as one line; or use quantity: kidsNum if per-meal
      });
    }

    // Add delivery
    if (delivery === "delivery") {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Home Delivery" },
          unit_amount: 999,  // $9.99 in cents
        },
        quantity: 1,
      });
    }

    // Add extras (if sent)
    (selectedExtras || []).forEach(extra => {
      if (extra.name && !isNaN(extra.price)) {
        line_items.push({
          price_data: {
            currency: "usd",
            product_data: { name: extra.name },
            unit_amount: Math.round(extra.price * 100),
          },
          quantity: 1,
        });
      }
    });

    // Validate: At least one item
    if (line_items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items selected." }) };
    }

    // Create session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      customer_email: email,
      metadata: {  // For your dashboard reference
        mealsSelected,
        kids,
        delivery,
        address,
        email,
        selectedMeals: selectedMeals ? JSON.stringify(selectedMeals) : ""
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