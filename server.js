import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import bodyParser from 'body-parser';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 3001;

// DATABASE SIMULATION (Replace with Convex/MongoDB for real persistence)
let webhookLogs = [];
let apiKeys = [
  { id: '1', key: 'am_live_67a2b92k1c49', label: 'Production Key', created: Date.now() }
];

// MIDDLEWARE
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Your Netlify URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'stripe-signature']
}));

// WEBHOOK HANDLER (Must be before express.json() for Stripe signatures)
app.post('/api/webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`⚠️ Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const logEntry = {
    id: event.id,
    type: event.type,
    timestamp: Date.now(),
    status: 'success',
    payload: event.data.object
  };
  
  webhookLogs.unshift(logEntry);
  if (webhookLogs.length > 50) webhookLogs.pop();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Here you would normally update your database (Convex) to give user credits
    console.log(`✅ Payment successful for session: ${session.id}`);
  }

  res.json({received: true});
});

// JSON PARSING FOR REST OF ROUTES
app.use(express.json());

// API ROUTES
app.post('/api/create-checkout-session', async (req, res) => {
  const { plan, price } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: `Architect.io ${plan} Plan`,
            description: `Professional Prompt Engineering Suite - ${plan} Access`
          },
          unit_amount: price * 100, // Stripe expects cents
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/build`,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error(`❌ Stripe Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/logs', (req, res) => res.json(webhookLogs));
app.get('/api/keys', (req, res) => res.json(apiKeys));

app.post('/api/keys/rotate', (req, res) => {
  const { id } = req.body;
  const index = apiKeys.findIndex(k => k.id === id);
  if (index !== -1) {
    apiKeys[index].key = `am_live_${Math.random().toString(36).substring(2, 16)}`;
  }
  res.json(apiKeys);
});

// HEALTH CHECK (Required by Render to verify deployment success)
app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Render Backend live on port ${port}`);
  console.log(`📡 Expecting Frontend at: ${process.env.FRONTEND_URL}`);
});