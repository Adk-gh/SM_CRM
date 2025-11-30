// sm-crm-app/api/forward-all.js
const fetch = require('node-fetch');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.CRM_FIREBASE_CREDENTIALS))
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
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

    return res.status(200).json({ forwarded: results });
  } catch (e) {
    console.error('Bulk Forward Error:', e.message);
    return res.status(500).json({ message: 'Failed to forward tickets', error: e.message });
  }
};