// sm-crm-app/api/reviews.js

// ❌ REMOVED: const fetch = require('node-fetch');
// Native Node.js fetch is used below.

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
  // 🔑 START CORS FIX (Dynamic)
  // -------------------------------------------------------------------
  const allowedOrigins = [
    'http://localhost:5173', 
    'https://304sm-crm-rho.vercel.app', // Your production domain
    // 'https://your-custom-domain.com' 
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    // Parse URL safely using standard API
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const currentUrl = new URL(req.url, `${protocol}://${host}`);
    const targetEmail = currentUrl.searchParams.get('email');

    // 🔎 Call Shopping API (Using Native Fetch)
    // Note: I kept your variable 'SHOPPING_API_URLS'. Ensure this matches your .env file.
    const baseUrl = process.env.SHOPPING_API_URLS; 
    const apiUrl = targetEmail
      ? `${baseUrl}?email=${encodeURIComponent(targetEmail)}`
      : baseUrl;

    const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`,
          'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Shopping API failed (${response.status}): ${errorDetails}`);
    }

    const data = await response.json();

    // 💾 OPTIMIZED: Batch Write to CRM DB
    if (data.reviews && Array.isArray(data.reviews)) {
      const batch = db.batch();
      let operationCount = 0;

      for (const review of data.reviews) {
        // Create a unique ID if one doesn't exist
        const docId = review.id ? String(review.id) : `${review.userId}_${Date.now()}`;
        const docRef = db.collection('reviews').doc(docId);

        batch.set(docRef, {
            ...review,
            syncedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        operationCount++;

        // Commit batch if we hit the limit (500)
        if (operationCount >= 499) {
            await batch.commit();
            operationCount = 0; // Reset for next chunk logic if needed
            break; // For now, we stop at 500 to allow the function to return
        }
      }

      if (operationCount > 0) {
        await batch.commit();
      }
      console.log(`Synced ${operationCount} reviews.`);
    }

    // ✅ Return to frontend
    return res.status(200).json(data);

  } catch (err) {
    console.error("CRM → Shopping API (reviews) error:", err.message);
    return res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
};