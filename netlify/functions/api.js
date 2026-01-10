const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const router = express.Router();

// DATABASE SIMULATION (Note: These reset on function cold starts)
let webhookLogs = [];
let apiKeys = [
  { id: '1', key: 'am_live_67a2b92k1c49', label: 'Production Key', created: Date.now() }
];

app.use(cors());

// WEBHOOK HANDLER
router.post('/webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`✅ Payment successful: ${session.customer_email}`);
  }

  res.json({received: true});
});

// JSON PARSING FOR OTHER ROUTES
app.use(express.json());

// API ROUTES
router.post('/create-checkout-session', async (req, res) => {
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
          unit_amount: price * 100,
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || req.headers.origin}/build`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/logs', (req, res) => res.json(webhookLogs));
router.get('/keys', (req, res) => res.json(apiKeys));

router.post('/keys/rotate', (req, res) => {
  const { id } = req.body;
  const index = apiKeys.findIndex(k => k.id === id);
  if (index !== -1) {
    apiKeys[index].key = `am_live_${Math.random().toString(36).substring(2, 16)}`;
  }
  res.json(apiKeys);
});

app.use('/api', router);
app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app);