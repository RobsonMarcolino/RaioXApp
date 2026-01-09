import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;

        // Using the user provided key securely on the server side
        const genAI = new GoogleGenerativeAI("AIzaSyBTZiUDC2INIspbdFm6R3dZX1A4ls7olSI");
        // Using 1.5-flash as it is the current standard. 
        // If this fails, we can fallback to gemini-pro later.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ resposta: text });

    } catch (error) {
        console.error("Vercel AI Error:", error);
        return res.status(500).json({ error: error.message || "Erro interno na IA" });
    }
}
