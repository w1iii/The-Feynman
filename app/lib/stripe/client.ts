import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY || ''
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null

export function getStripeClient() {
  if (!stripe) {
    throw new Error('Stripe not configured: missing STRIPE_SECRET_KEY')
  }
  return stripe
}
