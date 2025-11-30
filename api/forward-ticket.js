// sm-crm-app/api/forward-ticket.js

const fetch = require('node-fetch'); 
require('dotenv').config(); 

// 1. Load Secrets from Environment Variables
const POS_API_URL = process.env.POS_API_URL;
const POS_API_KEY = process.env.POS_API_KEY;
const INV_API_URL = process.env.INV_API_URL;
const INV_API_KEY = process.env.INV_API_KEY;
const ONLINESHOPPING_API_URL = process.env.ONLINESHOPPING_API_URL;
const ONLINESHOPPING_API_KEY = process.env.ONLINESHOPPING_API_KEY;

/**
 * Helper function to securely call an external REST API.
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
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    const { ticketId, subject, description, requesterEmail, category, targetSystem } = req.body;
    
    if (!ticketId || !targetSystem) {
        return res.status(400).json({ message: 'Missing required ticket ID or targetSystem selection.' });
    }
    
    if (targetSystem === 'none') {
        return res.status(200).json({ message: 'Agent manually chose not to notify any system.', results: {} });
    }

    const basePayload = { ticketId, subject, description, requesterEmail, issue_category: category };
    const results = {};

    try {
        switch (targetSystem) {
            case 'pos':
                const posPayload = { ...basePayload, request_type: 'CUSTOMER_REFUND_ALERT' };
                results.pos = await forwardRequest(POS_API_URL, posPayload, POS_API_KEY);
                break;

            case 'inventory':
                const invPayload = { ...basePayload, task: 'VERIFY_STOCK' };
                results.inventory = await forwardRequest(INV_API_URL, invPayload, INV_API_KEY);
                break;
                
            case 'onlineshopping':
                const osPayload = { ...basePayload, severity: 'IMMEDIATE_ATTENTION' };
                results.onlineshopping = await forwardRequest(ONLINESHOPPING_API_URL, osPayload, ONLINESHOPPING_API_KEY);
                break;

            default:
                return res.status(400).json({ message: `Invalid target system code provided: ${targetSystem}.` });
        }

        return res.status(200).json({ 
            message: `Ticket successfully forwarded to: ${targetSystem}.`,
            results: results
        });

    } catch (e) {
        console.error('API Forwarding Execution Error:', e.message);
        return res.status(500).json({ 
            message: `Forwarding failed during API call to ${targetSystem}.`,
            error: e.message
        });
    }
};
