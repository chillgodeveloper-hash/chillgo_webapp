import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function createPaymentIntent(amount: number, bookingId: string, customerEmail: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'thb',
    payment_method_types: ['card', 'promptpay'],
    metadata: { bookingId },
    receipt_email: customerEmail,
  });
  return paymentIntent;
}
