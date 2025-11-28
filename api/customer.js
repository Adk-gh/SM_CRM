// crm-system/backend/api/customer.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Call the shopping system’s API
    const response = await fetch(process.env.SHOPPING_API_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.SHOPPING_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Shopping API failed (${response.status}): ${errorDetails}`);
    }

    const data = await response.json();

    // Pass the customer data directly to CRM clients
    return res.status(200).json(data);

  } catch (err) {
    console.error("CRM → Shopping API error:", err.message);
    return res.status(500).json({ message: "Failed to fetch customers", error: err.message });
  }
};
