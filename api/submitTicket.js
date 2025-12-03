const fetch = require('node-fetch');
const admin = require('firebase-admin');

// -------------------------------------------------------------------
// 1. FIREBASE INITIALIZATION
// -------------------------------------------------------------------
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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { captchaToken, ...ticketData } = req.body;

  try {
    // -----------------------------------------------------------------
    // STEP 1: Verify reCAPTCHA with Google
    // -----------------------------------------------------------------
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("Missing RECAPTCHA_SECRET_KEY in Vercel Env Variables");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

    const googleResponse = await fetch(verifyUrl, { method: 'POST' });
    const googleData = await googleResponse.json();

    if (!googleData.success) {
      console.warn("Bot attempt blocked:", googleData);
      return res.status(400).json({ message: 'Captcha verification failed. Please try again.' });
    }

    // -----------------------------------------------------------------
    // STEP 2: Save to Firestore
    // -----------------------------------------------------------------
    const docRef = await db.collection('supportTickets').add({
      ...ticketData,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
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