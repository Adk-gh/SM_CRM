// backend/api/forward-ticket.js

// Ensure 'node-fetch' is installed if using Node < 18: npm install node-fetch
const fetch = require('node-fetch'); 
require('dotenv').config(); 

// 1. Load Secrets from Environment Variables
const POS_API_URL = process.env.POS_API_URL;
const POS_API_KEY = process.env.POS_API_KEY;
const INV_API_URL = process.env.INV_API_URL;
const INV_API_KEY = process.env.INV_API_KEY;
const ECOMM_API_URL = process.env.SHOPPING_API_URL;
const ECOMM_API_KEY = process.env.SHOPPING_API_KEY;

/**
 * Helper function to securely call an external REST API.
 * @param {string} url - The external system's API URL.
 * @param {object} payload - The data to send.
 * @param {string} apiKey - The authorization key.
 */
const forwardRequest = async (url, payload, apiKey) => {
    if (!url || !apiKey) {
        throw new Error('Missing URL or API Key configuration for the target system.');
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`, 
        },
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
    // Basic Request Validation
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    // 2. Destructure Data and the CRITICAL Routing Field
    const { ticketId, subject, description, requesterEmail, category, targetSystem } = req.body;
    
    if (!ticketId || !targetSystem) {
        return res.status(400).json({ message: 'Missing required ticket ID or targetSystem selection.' });
    }
    
    // Safety check: If agent chose 'none', terminate cleanly
    if (targetSystem === 'none') {
        return res.status(200).json({ message: 'Agent manually chose not to notify any system.', results: {} });
    }

    const basePayload = { ticketId, subject, description, requesterEmail, issue_category: category };
    const results = {};

    try {
        // 3. ROUTING LOGIC: Switch on the targetSystem code (pos, inventory, ecomm)
        switch (targetSystem) {
            case 'pos':
                // POS System Integration
                const posPayload = { ...basePayload, request_type: 'CUSTOMER_REFUND_ALERT' };
                results.pos = await forwardRequest(POS_API_URL, posPayload, POS_API_KEY);
                break;

            case 'inventory':
                // Inventory System Integration
                const invPayload = { ...basePayload, task: 'VERIFY_STOCK' };
                results.inventory = await forwardRequest(INV_API_URL, invPayload, INV_API_KEY);
                break;
                
            case 'ecomm':
                // E-commerce Platform Integration
                const ecommPayload = { ...basePayload, severity: 'IMMEDIATE_ATTENTION' };
                results.ecomm = await forwardRequest(ECOMM_API_URL, ecommPayload, ECOMM_API_KEY);
                break;

            default:
                // If the targetSystem value is invalid/unmapped
                return res.status(400).json({ message: `Invalid target system code provided: ${targetSystem}.` });
        }

        // 4. Success Response
        return res.status(200).json({ 
            message: `Ticket successfully forwarded to: ${targetSystem}.`,
            results: results
        });

    } catch (e) {
        // Log the specific failure details
        console.error('API Forwarding Execution Error:', e.message);
        
        // Return a 500 error indicating the external API call failed
        return res.status(500).json({ 
            message: `Forwarding failed during API call to ${targetSystem}.`,
            error: e.message
        });
    }
};