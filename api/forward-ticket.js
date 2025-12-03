// sm-crm-app/api/route-ticket.js

// ❌ REMOVED: const fetch = require('node-fetch'); (Native fetch is used)
// ❌ REMOVED: require('dotenv').config(); (Vercel injects these automatically)

// Configuration Constants
const POS_FUNCTION_URL = "https://spobwqqaskuhcmyeklgk.supabase.co/functions/v1/ticket";

/**
 * Helper function to securely call an external REST API using Native Fetch.
 */
const forwardRequest = async (url, payload, apiKey, useXApiKey = false) => {
  if (!url) throw new Error('Missing URL configuration for the target system.');

  const headers = { 'Content-Type': 'application/json' };

  if (apiKey) {
    if (useXApiKey) {
      headers['X-API-Key'] = apiKey; // Inventory System pattern
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`; // Online Shopping pattern
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Try to get text, if that fails, default to status text
    const errorDetails = await response.text().catch(() => response.statusText);
    throw new Error(`External API failed (${response.status} from ${url}): ${errorDetails}`);
  }

  return response.json();
};

// Main Serverless Handler
module.exports = async (req, res) => {
  // -------------------------------------------------------------------
  // 🔑 START CORS FIX
  // -------------------------------------------------------------------
  const allowedOrigins = [
    'http://localhost:5173',
    'https://304sm-crm-rho.vercel.app', 
    // 'https://your-custom-domain.com'
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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 🛡️ CRASH PROTECTION: Validate Environment Variables before processing
  const { 
    INV_API_URL, 
    INVENTORY_API_KEY, 
    ONLINESHOPPING_API_URL, 
    ONLINESHOPPING_API_KEY 
  } = process.env;

  if (!INV_API_URL || !INVENTORY_API_KEY || !ONLINESHOPPING_API_URL || !ONLINESHOPPING_API_KEY) {
    console.error("CRITICAL: Missing Environment Variables in Vercel.");
    return res.status(500).json({ message: "Server configuration error: Missing API Keys." });
  }

  const { ticketId, issueTitle, issueDescription, userEmail, issueCategory } = req.body;

  if (!ticketId || !issueCategory) {
    return res.status(400).json({ message: 'Missing required ticket ID or issueCategory.' });
  }

  const results = {};

  try {
    switch (issueCategory.toLowerCase()) {
      case 'billing':
        // ✅ Forward to POS Supabase Edge Function
        // Note: This API seems to not require a Bearer token in your original code, 
        // but if it does, add it to headers below.
        const posPayload = {
          ticketid: ticketId,
          subject: issueTitle ?? null,
          description: issueDescription ?? null,
          issue_category: 'billing',
          requesteremail: userEmail ?? null,
          severity: 'IMMEDIATE_ATTENTION',
          task: 'CUSTOMER_REFUND_ALERT'
        };

        const posResponse = await fetch(POS_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(posPayload)
        });

        if (!posResponse.ok) {
          const errorDetails = await posResponse.text();
          throw new Error(`POS function failed (${posResponse.status}): ${errorDetails}`);
        }

        results.pos = await posResponse.json();
        break;

      case 'access':
        // ✅ Forward to Online Shopping
        const osPayload = {
          ticketId,
          subject: issueTitle,
          description: issueDescription,
          requesterEmail: userEmail,
          issue_category: 'access',
          severity: 'IMMEDIATE_ATTENTION'
        };

        results.onlineshopping = await forwardRequest(
          ONLINESHOPPING_API_URL,
          osPayload,
          ONLINESHOPPING_API_KEY
        );
        break;

      case 'stock_issue':
        // ✅ Forward to Inventory
        const invPayload = {
          ticketId,
          subject: issueTitle,
          description: issueDescription,
          requesterEmail: userEmail,
          issue_category: 'itemnotfound',
          severity: 'IMMEDIATE_ATTENTION',
          task: 'VERIFY_STOCK'
        };

        // Note: Your original code appended ticketId to the URL for Inventory
        results.inventory = await forwardRequest(
          `${INV_API_URL}/${ticketId}`,
          invPayload,
          INVENTORY_API_KEY,
          true // Use X-API-Key header
        );
        break;

      default:
        return res.status(400).json({ message: `Unsupported issueCategory: ${issueCategory}.` });
    }

    return res.status(200).json({
      message: `Ticket successfully forwarded based on category: ${issueCategory}.`,
      results
    });

  } catch (e) {
    console.error('API Forwarding Execution Error:', e.message);
    return res.status(500).json({
      message: `Forwarding failed during API call for category: ${issueCategory}.`,
      error: e.message
    });
  }
};