// netlify/functions/create-checkout-session.js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const {
      email,
      address,
      delivery,
      kids,
      lineItems,        // meals + extras coming directly from frontend
      selectedMeals,    // fallback if older structure used
      selectedExtras,   // fallback for old extras format
      recurring         // 🌿 new field from checkbox
    } = JSON.parse(event.body || "{}");

    let line_items = [];

    // ✅ If the frontend already sent a ready-to-use lineItems array
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      line_items = lineItems;
    } else {
      // Legacy fallback: build manually if needed
      (selectedMeals || []).forEach(meal => {
        if (meal.name && meal.qty > 0 && !isNaN(meal.price)) {
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: { name: meal.name },
              unit_amount: Math.round(meal.price * 100)
            },
            quantity: meal.qty
          });
        }
      });

      // Delivery
      if (delivery === "delivery") {
        line_items.push({
          price_data: {
            currency: "usd",
            product_data: { name: "Home Delivery" },
            unit_amount: 999
          },
          quantity: 1
        });
      }

      // Kids meals
      const kidsNum = parseInt(kids, 10);
      if (kidsNum > 0) {
        line_items.push({
          price_data: {
            currency: "usd",
            product_data: { name: `Kids Meal x${kidsNum}` },
            unit_amount: 750
          },
          quantity: 1
        });
      }

      // Extras
      (selectedExtras || []).forEach(extra => {
        if (extra.name && !isNaN(extra.price)) {
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: { name: extra.name },
              unit_amount: Math.round(extra.price * 100)
            },
            quantity: 1
          });
        }
      });
    }

    if (line_items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No items selected." })
      };
    }

    // 🌿 Optional: Add recurring note to description for quick view
    const recurringNote = recurring ? " | Recurring Weekly Order" : "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      customer_email: email,
      metadata: {
        delivery,
        address,
        kids,
        recurring, // 🌿 added here so you can see it in Stripe metadata
        selectedMeals: JSON.stringify(selectedMeals || []),
        selectedExtras: JSON.stringify(selectedExtras || [])
      },
      success_url: `${process.env.SITE_URL}/success.html`,
      cancel_url: `${process.env.SITE_URL}/cancel.html`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

