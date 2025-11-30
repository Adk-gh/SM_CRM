// sm-crm-app/api/forward-all.js
const fetch = require('node-fetch');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.CRM_FIREBASE_CREDENTIALS))
  });
}

const db = admin.firestore();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).send('OK');
  }

  if (req.method !== 'GET') {
    return res.status(405).set(corsHeaders).json({ message: 'Method Not Allowed' });
  }

  try {
    const snapshot = await db.collection('supportTickets').get();
    if (snapshot.empty) {
      return res.status(200).set(corsHeaders).json({ message: 'No tickets found.' });
    }

    const results = [];
    for (const doc of snapshot.docs) {
      const ticket = doc.data();
      const payload = {
        ticketId: doc.id,
        issueTitle: ticket.issueTitle,
        issueDescription: ticket.issueDescription,
        userEmail: ticket.userEmail,
        issueCategory: ticket.issueCategory
      };

      // Call your existing forward-ticket endpoint
      const response = await fetch(`${process.env.CRM_BASE_URL}/api/forward-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      results.push({ ticketId: doc.id, status: result.message });
    }

    return res.status(200).set(corsHeaders).json({ forwarded: results });
  } catch (e) {
    console.error('Bulk Forward Error:', e.message);
    return res.status(500).set(corsHeaders).json({ message: 'Failed to forward tickets', error: e.message });
  }
};