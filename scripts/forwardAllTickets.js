const fetch = require('node-fetch');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.CRM_FIREBASE_CREDENTIALS))
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const snapshot = await db.collection('supportTickets').get();
    if (snapshot.empty) {
      return res.status(200).json({ message: 'No tickets found.' });
    }

    const results = [];
    for (const doc of snapshot.docs) {
      const ticket = doc.data();

      const posPayload = {
        ticketid: doc.id,
        subject: ticket.issueTitle ?? null,
        description: ticket.issueDescription ?? null,
        issue_category: ticket.issueCategory ?? null,
        requesteremail: ticket.userEmail ?? null,
        severity: 'IMMEDIATE_ATTENTION',
        task: ticket.issueCategory === 'billing'
          ? 'CUSTOMER_REFUND_ALERT'
          : ticket.issueCategory === 'stock_issue'
            ? 'VERIFY_STOCK'
            : 'GENERAL_SUPPORT'
      };

      const response = await fetch(
        "https://spobwqqaskuhcmyeklgk.supabase.co/functions/v1/ticket",
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(posPayload)
        }
      );

      const result = await response.json();
      results.push({
        ticketid: doc.id,
        status: response.ok ? 'Forwarded successfully' : `Failed: ${result.error || response.status}`
      });
    }

    return res.status(200).json({ forwarded: results });
  } catch (e) {
    console.error('Bulk Forward Error:', e.message);
    return res.status(500).json({ message: 'Failed to forward tickets', error: e.message });
  }
};
