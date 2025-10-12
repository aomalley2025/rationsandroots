import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    const { planName, description, total } = JSON.parse(event.body);

    if (!total || total <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid total amount' }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: description,
            },
            unit_amount: Math.round(total * 100), // convert dollars → cents
          },
          quantity: 1,
        },
      ],
      success_url: 'https://www.rationsandrootsmeal.com/success',
      cancel_url: 'https://www.rationsandrootsmeal.com/cancel',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
