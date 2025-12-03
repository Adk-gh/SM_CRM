// sm-crm-app/api/customer.js
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization for CRM DB ---
if (!admin.apps.length) {
  try {
    let serviceAccountJson = process.env.CRM_FIREBASE_CREDENTIALS;
    if (!serviceAccountJson) {
      throw new Error("CRM_FIREBASE_CREDENTIALS environment variable is not set.");
    }

    // 🛡️ CRASH PROTECTION: Fix Vercel escaped newlines in private key
    // If the string contains literal "\n" characters, replace them with actual newlines
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
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // -------------------------------------------------------------------
  // 🔑 END CORS FIX
  // -------------------------------------------------------------------

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // -----------------------------------------------------------------
    // ✅ FIX: Use WHATWG URL API instead of legacy url.parse / req.query
    // This removes the [DEP0169] DeprecationWarning in your logs
    // -----------------------------------------------------------------
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    // We construct the full URL to safely parse search params
    const currentUrl = new URL(req.url, `${protocol}://${host}`);
    const targetEmail = currentUrl.searchParams.get('email');

    // 🔎 Call Shopping API
    const response = await fetch(
      targetEmail
        ? `${process.env.SHOPPING_API_URL}?email=${encodeURIComponent(targetEmail)}`
        : `${process.env.SHOPPING_API_URL}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Shopping API failed (${response.status}): ${errorDetails}`);
    }

    const data = await response.json();

    // 💾 Save to CRM DB (create/update customers collection)
    if (data.customers && Array.isArray(data.customers)) {
        for (const customer of data.customers) {
          // 💾 Using customer.userId as the document ID
          if (customer.userId) {
             await db.collection('customers').doc(customer.userId).set(customer, { merge: true });
          }
        }
    }

    // ✅ Return to frontend
    return res.status(200).json(data);

  } catch (err) {
    console.error("CRM → Shopping API error:", err.message);
    return res.status(500).json({ message: "Failed to fetch customers", error: err.message });
  }
};