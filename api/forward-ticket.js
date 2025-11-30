const fetch = require('node-fetch');
require('dotenv').config();

// Environment Variables
const POS_FUNCTION_URL = process.env.POS_SUPABASE_URL; // Supabase Edge Function URL
const INV_API_URL = process.env.INV_API_URL;           // Inventory API base
const INVENTORY_API_KEY = process.env.INVENTORY_API_KEY;
const ONLINESHOPPING_API_URL = process.env.ONLINESHOPPING_API_URL;
const ONLINESHOPPING_API_KEY = process.env.ONLINESHOPPING_API_KEY;

/**
 * Helper function to securely call an external REST API.
 */
const forwardRequest = async (url, payload, apiKey, useXApiKey = false) => {
  if (!url) throw new Error('Missing URL configuration for the target system.');

  const headers = { 'Content-Type': 'application/json' };

  if (apiKey) {
    if (useXApiKey) {
      headers['X-API-Key'] = apiKey; // Inventory
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`; // Online Shopping
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`External API failed (${response.status} from ${url}): ${errorDetails}`);
  }

  return response.json();
};

// Main Serverless Handler
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { ticketId, issueTitle, issueDescription, userEmail, issueCategory } = req.body;

  if (!ticketId || !issueCategory) {
    return res.status(400).json({ message: 'Missing required ticket ID or issueCategory.' });
  }

  const results = {};

  try {
    switch (issueCategory.toLowerCase()) {
      case 'billing':
        // ✅ Forward to POS Supabase Edge Function with exact DB schema
        const posPayload = {
          ticketid: ticketId,                        // ✅ exact field name
          subject: issueTitle ?? null,               // ✅ exact field name
          description: issueDescription ?? null,     // ✅ exact field name
          issue_category: 'billing',                 // ✅ exact field name
          requesteremail: userEmail ?? null,         // ✅ exact field name
          severity: 'IMMEDIATE_ATTENTION',           // ✅ exact field name
          task: 'CUSTOMER_REFUND_ALERT'              // ✅ exact field name
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
        // ✅ Forward to Inventory (invTicket collection)
        const invPayload = {
          ticketId,
          subject: issueTitle,
          description: issueDescription,
          requesterEmail: userEmail,
          issue_category: 'itemnotfound', // DB expects this string
          severity: 'IMMEDIATE_ATTENTION',
          task: 'VERIFY_STOCK'
        };

        results.inventory = await forwardRequest(
          `${INV_API_URL}/${ticketId}`,
          invPayload,
          INVENTORY_API_KEY,
          true // use X-API-Key header
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
