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

    const CLOUD_FUNCTION_URL = "https://analisareg2-770471336573.us-central1.run.app";

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        // Tente processar o JSON, se falhar, leia como texto para ver o erro
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Erro ao parsear JSON do Google Cloud:", text);
            return res.status(500).json({ error: `Backend retornou algo inválido: ${text.substring(0, 50)}...` });
        }

        return res.status(response.status).json(data);

    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: "Falha ao conectar com Google Cloud" });
    }
}
