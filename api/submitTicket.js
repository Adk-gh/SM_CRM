// sm-crm-app/api/submitTicket.js

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
    throw new Error("Database connection failed");
  }
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // -------------------------------------------------------------------
  // 🔑 START CORS FIX (Robust)
  // -------------------------------------------------------------------
  const allowedOrigins = [
    'http://localhost:5173', 
    'https://304sm-crm-rho.vercel.app',
    'https://crm-db-6f861.web.app', // Your production domain
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://crm-db-6f861.web.app');
  }

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // -------------------------------------------------------------------
  // 🔑 END CORS FIX
  // -------------------------------------------------------------------

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Extract raw body
  const { captchaToken, ...rawBody } = req.body;

  try {
    // -----------------------------------------------------------------
    // STEP 1: Verify reCAPTCHA with Google
    // -----------------------------------------------------------------
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("Missing RECAPTCHA_SECRET_KEY in Vercel Env Variables");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const verifyUrl = new URL('https://www.google.com/recaptcha/api/siteverify');
    verifyUrl.searchParams.append('secret', secretKey);
    verifyUrl.searchParams.append('response', captchaToken);

    const googleResponse = await fetch(verifyUrl.toString(), { method: 'POST' });
    const googleData = await googleResponse.json();

    if (!googleData.success) {
      console.warn("Bot attempt blocked:", googleData);
      return res.status(400).json({ message: 'Captcha verification failed. Please try again.' });
    }

    // -----------------------------------------------------------------
    // STEP 2: Save to Firestore (FIXED VARIABLE NAMES)
    // -----------------------------------------------------------------
    
    // We extract the names sent by the frontend (userName, issueCategory, etc)
    const { 
      userName, 
      userEmail, 
      userPhone,
      smBranch,
      issueCategory, 
      issueTitle, 
      issueDescription,
      attachments = [],
      priority = 'normal'
    } = rawBody;

    // Validation: Check if the *Frontend* fields exist
    if (!userName || !userEmail || !issueDescription || !issueCategory) {
       console.error("Missing fields. Received:", rawBody);
       return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Map them to your Database Schema
    const docRef = await db.collection('supportTickets').add({
      fullName: userName,        // Map userName -> fullName
      email: userEmail,          // Map userEmail -> email
      phone: userPhone || '',
      branch: smBranch,
      department: issueCategory, // Map issueCategory -> department
      subject: issueTitle,       // Map issueTitle -> subject
      description: issueDescription, // Map issueDescription -> description
      attachments: attachments,
      priority,
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