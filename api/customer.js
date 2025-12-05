// sm-crm-app/api/customer.js

const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization for CRM DB ---
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
  // 🔑 START CORS FIX (UPDATED)
  // -------------------------------------------------------------------
  const allowedOrigins = [
    'http://localhost:5173',                  // Local Development
    'https://sm-crm-rho.vercel.app',          // Your Vercel Backend Production
    'https://crm-db-6f861.web.app',           // 🟢 YOUR FIREBASE FRONTEND (Added)
    'https://crm-db-6f861.firebaseapp.com'    // 🟢 Firebase Alternate (Added)
  ];
  
  const origin = req.headers.origin;
  
  // Logic: Only set the header if the origin is explicitly allowed.
  // We removed the 'else' block that forced 'localhost', which caused the CORS error.
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } 

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests immediately
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
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const currentUrl = new URL(req.url, `${protocol}://${host}`);
    const targetEmail = currentUrl.searchParams.get('email');

    // 🔎 Call Shopping API (Using Native Fetch)
    const apiUrl = targetEmail
      ? `${process.env.SHOPPING_API_URL}?email=${encodeURIComponent(targetEmail)}`
      : `${process.env.SHOPPING_API_URL}`;

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
    if (data.customers && Array.isArray(data.customers)) {
        const batch = db.batch();
        let operationCount = 0;

        for (const customer of data.customers) {
          if (customer.userId) {
             const docRef = db.collection('customers').doc(customer.userId);
             // Use set with merge: true to update existing or create new
             batch.set(docRef, {
                 ...customer,
                 lastSynced: admin.firestore.FieldValue.serverTimestamp() // Good for tracking
             }, { merge: true });
             
             operationCount++;
             
             // Firestore batches have a limit of 500 operations
             if (operationCount >= 499) {
                 await batch.commit();
                 operationCount = 0; 
                 break; 
             }
          }
        }
        
        if (operationCount > 0) {
            await batch.commit();
        }
        console.log(`Synced ${operationCount} customers.`);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("CRM → Shopping API error:", err.message);
    return res.status(500).json({ message: "Failed to fetch customers", error: err.message });
  }
};