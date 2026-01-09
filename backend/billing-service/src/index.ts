import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';

const app = express();
app.use(helmet());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Placeholder webhook endpoint for Stripe
app.post('/webhook/stripe', (req, res) => {
  // Verify webhook signature in production
  console.log('Stripe webhook received', req.body.type);
  res.status(200).send('ok');
});

const port = process.env.PORT || 3004;
app.listen(port, () => console.log(`Billing service listening on ${port}`));
