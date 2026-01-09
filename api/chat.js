export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const CLOUD_FUNCTION_URL = "https://analisareg2-770471336573.us-central1.run.app";

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        // Forward the status code from the cloud function
        return res.status(response.status).json(data);

    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: "Failed to fetch from Google Cloud" });
    }
}
