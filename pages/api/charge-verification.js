export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Step 1: Client calls GET to create a SetupIntent
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Payment system not configured.' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    try {
      const { email, name } = req.query;

      // Create or find customer
      let customer;
      if (email) {
        const existing = await stripe.customers.list({ email, limit: 1 });
        if (existing.data.length > 0) {
          customer = existing.data[0];
        } else {
          customer = await stripe.customers.create({
            email: email,
            name: name || undefined,
          });
        }
      } else {
        customer = await stripe.customers.create({
          name: name || 'Healing Soulutions Patient',
        });
      }

      // Create SetupIntent - this is Stripe's recommended way to save a card
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
        metadata: {
          type: 'card_on_file',
          patient_name: name || '',
          patient_email: email || '',
        },
      });

      return res.status(200).json({
        clientSecret: setupIntent.client_secret,
        customerId: customer.id,
      });
    } catch (error) {
      console.error('SetupIntent creation error:', error.message);
      return res.status(500).json({ error: 'Could not initialize payment form.' });
    }
  }

  if (req.method === 'POST') {
    // Step 2: Client confirms card was saved, we do $0.01 verification
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Payment system not configured.' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    try {
      const { setupIntentId, customerId } = req.body;

      // Retrieve the SetupIntent to get the payment method
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

      if (setupIntent.status !== 'succeeded') {
        return res.status(400).json({ error: 'Card setup did not complete.' });
      }

      const paymentMethodId = setupIntent.payment_method;

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      // Do $0.01 verification charge
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 1,
          currency: 'usd',
          customer: customerId,
          payment_method: paymentMethodId,
          payment_method_types: ['card'],
          confirm: true,
          off_session: true,
          description: 'Healing Soulutions - Card verification (refundable)',
        });

        if (paymentIntent.status === 'succeeded') {
          // Refund immediately
          await stripe.refunds.create({
            payment_intent: paymentIntent.id,
            reason: 'requested_by_customer',
          });
        }
      } catch (chargeErr) {
        // $0.01 charge failed but card is still saved - this is OK
        console.log('Verification charge skipped:', chargeErr.message);
      }

      // Get card details for confirmation
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

      return res.status(200).json({
        success: true,
        customerId: customerId,
        paymentMethodId: paymentMethodId,
        brand: pm.card ? pm.card.brand : '',
        last4: pm.card ? pm.card.last4 : '',
      });
    } catch (error) {
      console.error('Card verification error:', error.message);
      return res.status(400).json({ error: 'Card verification failed: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
