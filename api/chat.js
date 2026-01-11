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

        // Initialize Gemini with the NEW user provided key
        const genAI = new GoogleGenerativeAI("AIzaSyAmtab7Qd3E3QEfr3CzB6uIioqBUq7LZ5Y");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ resposta: text });

    } catch (error) {
        console.error("Vercel AI Error:", error);
        return res.status(500).json({ error: error.message || "Erro interno na IA (Vercel)" });
    }
}
