const fetch = require('node-fetch');
require('dotenv').config();

// 1. Load Secrets from Environment Variables
const POS_API_URL = process.env.POS_API_URL;
const POS_API_KEY = process.env.POS_API_KEY;
const INV_API_URL = process.env.INV_API_URL; // e.g. https://access-token-main.vercel.app/api/firestore/invTicket
const INVENTORY_API_KEY = process.env.INVENTORY_API_KEY; // ✅ your Inventory API key
const ONLINESHOPPING_API_URL = process.env.ONLINESHOPPING_API_URL;
const ONLINESHOPPING_API_KEY = process.env.ONLINESHOPPING_API_KEY;

/**
 * Helper function to securely call an external REST API.
 */
const forwardRequest = async (url, payload, apiKey, useXApiKey = false) => {
  if (!url || !apiKey) {
    throw new Error('Missing URL or API Key configuration for the target system.');
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (useXApiKey) {
    headers['X-API-Key'] = apiKey; // ✅ Inventory requires this
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`; // POS / OnlineShopping
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

  const basePayload = {
    ticketId,
    subject: issueTitle,
    description: issueDescription,
    requesterEmail: userEmail,
    issue_category: issueCategory,
    severity: 'IMMEDIATE_ATTENTION'
  };

  const results = {};

  try {
    switch (issueCategory.toLowerCase()) {
      case 'billing':
        const posPayload = { ...basePayload, request_type: 'CUSTOMER_REFUND_ALERT' };
        results.pos = await forwardRequest(POS_API_URL, posPayload, POS_API_KEY);
        break;

      case 'access':
        results.onlineshopping = await forwardRequest(
          ONLINESHOPPING_API_URL,
          basePayload,
          ONLINESHOPPING_API_KEY
        );
        break;

      case 'itemnotfound':
        const invPayload = { ...basePayload, task: 'VERIFY_STOCK' };
        results.inventory = await forwardRequest(
          `${INV_API_URL}/${ticketId}`, // e.g. https://access-token-main.vercel.app/api/firestore/invTicket/INV123
          invPayload,
          INVENTORY_API_KEY,
          true // ✅ use X-API-Key header
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
