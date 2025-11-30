// sm-crm-app/scripts/forwardAllTickets.js
const fetch = require('node-fetch');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./crm-service-account.json'))
  });
}

const db = admin.firestore();
const CRM_FORWARD_URL = "https://sm-crm-rho.vercel.app/api/forward-ticket";

async function forwardAllTickets() {
  const snapshot = await db.collection('SupportTicket').get();
  if (snapshot.empty) {
    console.log("No tickets found.");
    return;
  }

  for (const doc of snapshot.docs) {
    const ticket = doc.data();

    const payload = {
      ticketId: doc.id,
      issueTitle: ticket.issueTitle,
      issueDescription: ticket.issueDescription,
      userEmail: ticket.userEmail,
      issueCategory: ticket.issueCategory
    };

    try {
      const response = await fetch(CRM_FORWARD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log(`Ticket ${doc.id} forwarded:`, result.message);
    } catch (err) {
      console.error(`Failed to forward ticket ${doc.id}:`, err.message);
    }
  }
}

forwardAllTickets();
