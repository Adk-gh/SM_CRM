// sm-crm-app/api/customer.js
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization for CRM DB ---
if (!admin.apps.length) {
 try {
  const serviceAccountJson = process.env.CRM_FIREBASE_CREDENTIALS;
  if (!serviceAccountJson) {
   throw new Error("CRM_FIREBASE_CREDENTIALS environment variable is not set.");
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
    
    // 1. Set the specific allowed origin (your React dev server)
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    
    // 2. Set the allowed methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // 3. Set the allowed request headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests (OPTIONS method)
    if (req.method === 'OPTIONS') {
        // Browser checks permissions, send back OK status
        return res.status(200).end();
    }
    // -------------------------------------------------------------------
    // 🔑 END CORS FIX
    // -------------------------------------------------------------------

 if (req.method !== 'GET') {
  return res.status(405).json({ message: 'Method Not Allowed' });
 }

 try {
  const targetEmail = req.query.email;

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
  for (const customer of data.customers) {
   await db.collection('customers').doc(customer.email).set(customer, { merge: true });
  }

  // ✅ Return to frontend
  return res.status(200).json(data);

 } catch (err) {
  console.error("CRM → Shopping API error:", err.message);
  return res.status(500).json({ message: "Failed to fetch customers", error: err.message });
 }
};