// sm-crm-app/api/submit-ticket.js

// ❌ REMOVED: const fetch = require('node-fetch');
// Native Node.js fetch is used below to fix the [DEP0169] warning.

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
    // This is crucial for this file too, otherwise, it might crash in production
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
    // It is often safer to throw here so the function fails hard if DB connection fails
    throw new Error("Database connection failed");
  }
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // -------------------------------------------------------------------
  // 🔑 START CORS FIX (Dynamic)
  // -------------------------------------------------------------------
  const allowedOrigins = [
    'http://localhost:5173', 
    'https://304sm-crm-rho.vercel.app', // Your production domain
    // 'https://your-custom-domain.com' // Add others if needed
  ];
  
  const origin = req.headers.origin;
  
  // If the origin is in our allowed list, use it. Otherwise, fallback to localhost.
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // -------------------------------------------------------------------
  // 🔑 END CORS FIX
  // -------------------------------------------------------------------

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { captchaToken, ...ticketData } = req.body;

  try {
    // -----------------------------------------------------------------
    // STEP 1: Verify reCAPTCHA with Google (Using Native Fetch)
    // -----------------------------------------------------------------
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("Missing RECAPTCHA_SECRET_KEY in Vercel Env Variables");
      return res.status(500).json({ message: "Server configuration error." });
    }

    // Construct URL cleanly to ensure no encoding issues
    const verifyUrl = new URL('https://www.google.com/recaptcha/api/siteverify');
    verifyUrl.searchParams.append('secret', secretKey);
    verifyUrl.searchParams.append('response', captchaToken);

    // Native fetch call
    const googleResponse = await fetch(verifyUrl.toString(), { method: 'POST' });
    const googleData = await googleResponse.json();

    if (!googleData.success) {
      console.warn("Bot attempt blocked:", googleData);
      return res.status(400).json({ message: 'Captcha verification failed. Please try again.' });
    }

    // -----------------------------------------------------------------
    // STEP 2: Save to Firestore
    // -----------------------------------------------------------------
    // We use serverTimestamp() for absolute accuracy on the server side
    const docRef = await db.collection('supportTickets').add({
      ...ticketData,
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      captchaVerified: true,
      source: 'web-portal'
    });

    // -----------------------------------------------------------------
    // STEP 3: Return Success
    // -----------------------------------------------------------------
    return res.status(200).json({
      message: 'Ticket created successfully',
      id: docRef.id
    });

  } catch (err) {
    console.error("Submit Ticket Error:", err.message);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};