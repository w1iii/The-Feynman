import Paymongo from 'paymongo-node'

const paymongoSecret = process.env.PAYMONGO_SECRET_KEY || ''
const paymongo = paymongoSecret ? Paymongo(paymongoSecret) : null

export function getPaymongoClient() {
  if (!paymongo) {
    throw new Error('PayMongo not configured: missing PAYMONGO_SECRET_KEY')
  }
  return paymongo
}
