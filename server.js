
require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

// DATABASE SIMULATION
// In a real production app, replace these with a database like MongoDB or PostgreSQL
let webhookLogs = [];
let apiKeys = [
  { id: '1', key: 'am_live_67a2b92k1c49', label: 'Production Key', created: Date.now() }
];

// MIDDLEWARE
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Restrict this to your GitHub pages URL in production
  methods: ['GET', 'POST']
}));

// WEBHOOK HANDLER (Must be before general body parsing)
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
    console.error(`⚠️ Webhook Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Record the event in our simulation logs
  const logEntry = {
    id: event.id,
    type: event.type,
    timestamp: Date.now(),
    status: 'success',
    payload: event.data.object
  };
  webhookLogs.unshift(logEntry);
  if (webhookLogs.length > 50) webhookLogs.pop();

  // Handle successful payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`✅ Payment successful for customer: ${session.customer_email}`);
    // UPDATE USER CREDITS IN DATABASE HERE
  }

  res.json({received: true});
});

// ROUTE PARSING
app.use(express.json());

// API: Create a checkout session
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
    console.error(`❌ Stripe Session Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

// API: Get Logs for the Developer Console
app.get('/api/logs', (req, res) => res.json(webhookLogs));

// API: Get simulated API keys
app.get('/api/keys', (req, res) => res.json(apiKeys));

// API: Rotate keys
app.post('/api/keys/rotate', (req, res) => {
  const { id } = req.body;
  const index = apiKeys.findIndex(k => k.id === id);
  if (index !== -1) {
    apiKeys[index].key = `am_live_${Math.random().toString(36).substring(2, 16)}`;
  }
  res.json(apiKeys);
});

app.listen(port, () => {
  console.log(`🚀 Backend server launched and listening on port ${port}`);
  console.log(`🔗 Frontend URL configured: ${process.env.FRONTEND_URL || 'Not Set (Allowing All)'}`);
});
