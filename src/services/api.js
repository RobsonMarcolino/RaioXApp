// ATUALIZAÇÃO NO FRONT-END
export const callGoogleAI = async (mensagemDoUsuario, codigoEG) => { // <--- Recebe EG agora
    // URL do seu Cloud Run que apareceu no log
    const API_URL = "https://analisareg2-770471336573.us-central1.run.app"; 

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // O Backend novo espera EXATAMENTE estes nomes:
                message: mensagemDoUsuario, 
                eg: codigoEG 
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro do Servidor: ${errorText}`);
        }

        const data = await response.json();
        return data.resposta;

    } catch (error) {
        console.error("Erro:", error);
        return "❌ Erro ao conectar com a inteligência.";
    }
};