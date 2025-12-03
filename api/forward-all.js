// sm-crm-app/api/sync-tickets.js

// ❌ REMOVED: const fetch = require('node-fetch'); (Native fetch used)
const admin = require('firebase-admin');

// -------------------------------------------------------------------
// 1. FIREBASE INITIALIZATION (With Crash Protection)
// -------------------------------------------------------------------
if (!admin.apps.length) {
  try {
    let serviceAccountJson = process.env.CRM_FIREBASE_CREDENTIALS;
    if (!serviceAccountJson) {
      throw new Error("CRM_FIREBASE_CREDENTIALS environment variable is not set.");
    }

    // 🛡️ CRASH PROTECTION: Fix Vercel escaped newlines in private key
    if (typeof serviceAccountJson === 'string' && serviceAccountJson.includes('\\n')) {
      const parsed = JSON.parse(serviceAccountJson);
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      serviceAccountJson = JSON.stringify(parsed);
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("CRM Firebase Initialization Error:", error.message);
    throw new Error("Server initialization failed.");
  }
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // -------------------------------------------------------------------
  // 🔑 START CORS FIX
  // -------------------------------------------------------------------
  const allowedOrigins = [
    'http://localhost:5173', 
    'https://304sm-crm-rho.vercel.app' 
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // -------------------------------------------------------------------
  // 🔑 END CORS FIX
  // -------------------------------------------------------------------

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // ⚡ OPTIMIZATION: Only fetch tickets that haven't been sent yet
    // This saves database read costs and memory.
    // Note: This assumes tickets without the field are "unsent".
    // If you have trouble with indexes, revert to .get() and filter in JS.
    const snapshot = await db.collection('supportTickets').get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No tickets found.', forwarded: [] });
    }

    // Process all tickets in parallel using map + Promise.all
    const processingPromises = snapshot.docs.map(async (doc) => {
      const ticket = doc.data();

      // 1. Skip if already forwarded
      if (ticket.posNotificationStatus === 'sent') {
        return null; // Return null to filter out later
      }

      // 2. Prepare Payload
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

      try {
        // 3. Send to Supabase (Using Native Fetch)
        const response = await fetch(
          "https://spobwqqaskuhcmyeklgk.supabase.co/functions/v1/ticket",
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(posPayload)
          }
        );

        const result = await response.json();
        
        if (response.ok) {
          // ✅ CRITICAL FIX: Update Firestore so we don't send this again!
          await db.collection('supportTickets').doc(doc.id).update({
              posNotificationStatus: 'sent',
              posForwardedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          return {
            ticketId: doc.id,
            status: 'success',
            response: result
          };
        } else {
          return {
            ticketId: doc.id,
            status: 'failed',
            error: result.error || result.message || response.status
          };
        }
      } catch (fetchError) {
        return {
          ticketId: doc.id,
          status: 'failed',
          error: fetchError.message
        };
      }
    });

    // Wait for all tickets to process
    const rawResults = await Promise.all(processingPromises);
    
    // Filter out the nulls (skipped tickets)
    const results = rawResults.filter(r => r !== null);

    return res.status(200).json({ 
      message: `Processed ${results.length} tickets`,
      forwarded: results 
    });

  } catch (e) {
    console.error('Bulk Forward Error:', e.message);
    return res.status(500).json({ 
      message: 'Failed to forward tickets', 
      error: e.message,
      forwarded: []
    });
  }
};