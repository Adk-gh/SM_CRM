// sm-crm-app/api/customer.js

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const targetEmail = req.query.email;
    if (!targetEmail) {
      return res.status(400).json({ message: "Missing required query parameter: email" });
    }

    const response = await fetch(
      `${process.env.SHOPPING_API_URL}?email=${encodeURIComponent(targetEmail)}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SHOPPING_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Shopping API failed (${response.status}): ${errorDetails}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("CRM → Shopping API error:", err.message);
    return res.status(500).json({ message: "Failed to fetch customers", error: err.message });
  }
};

console.log("Calling Shopping API:", process.env.SHOPPING_API_URL, targetEmail);

