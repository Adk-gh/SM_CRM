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
    // STEP 2: Save to Firestore (FIXED FIELD MAPPING)
    // -----------------------------------------------------------------
    
    // Destructure specifically to ensure we catch all fields sent by Frontend
    const { 
      userName, 
      userEmail, 
      userPhone,
      smBranch,
      branchLabel,      // NEW: Required by Admin
      issueCategory, 
      categoryLabel,    // NEW: Required by Admin
      issueTitle, 
      issueDescription,
      attachments = [],
      priority = 'Unassigned',
      status = 'open',
      agentReply = '',
      rejectionReason = ''
    } = rawBody;

    // Validation
    if (!userName || !userEmail || !issueDescription || !issueTitle) {
       console.error("Missing fields. Received:", rawBody);
       return res.status(400).json({ message: 'Missing required fields.' });
    }

    //  - Conceptual visualization
    // We map these DIRECTLY to the keys the Admin Dashboard uses.
    const docRef = await db.collection('supportTickets').add({
      // --- Identity ---
      userName: userName,           // CORRECT: Admin looks for data.userName
      userEmail: userEmail,         // CORRECT: Admin looks for data.userEmail
      userPhone: userPhone || '',   // CORRECT: Admin looks for data.userPhone

      // --- Location ---
      smBranch: smBranch,           // CORRECT: Admin looks for data.smBranch
      branchLabel: branchLabel,     // CORRECT: Admin looks for data.branchLabel

      // --- Categorization ---
      issueCategory: issueCategory, // CORRECT: Admin uses this for map
      categoryLabel: categoryLabel, // CORRECT: Admin looks for data.categoryLabel
      department: null,             // CORRECT: We let Admin calculate this based on category

      // --- Issue ---
      issueTitle: issueTitle,             // CORRECT: Admin looks for data.issueTitle
      issueDescription: issueDescription, // CORRECT: Admin looks for data.issueDescription
      
      // --- Workflow ---
      status: status,
      priority: priority,
      attachments: attachments,
      agentReply: agentReply,
      rejectionReason: rejectionReason,
      resolutionImageURL: null,

      // --- Meta ---
      source: 'web-portal',
      captchaVerified: true,
      
      // We use serverTimestamp to ensure consistent sorting in the dashboard
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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