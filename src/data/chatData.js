export const QUICK_REPLIES = [
    {
        id: 'analise',
        text: '📊 Analisar EG',
        prompt: 'Quero analisar uma loja',
        type: 'action'
    },
    {
        id: 'identity',
        text: '🤖 Quem é você?',
        prompt: 'Quem é você?',
        type: 'query'
    },
    {
        id: 'solicitacao',
        text: '📝 Abrir uma solicitação',
        prompt: 'Abrir solicitação',
        type: 'link',
        url: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=GUvwznZ3lEq4mzdcd6j5Nhknc28u6bVBruON6FWBAnlUQTdINFpHSjA3R1NERkVPUzdPVTNLQ09TQS4u'
    },
    {
        id: 'dicas',
        text: '💡 Dicas de Uso',
        prompt: 'Me dê dicas de uso',
        type: 'query'
    }
];

export const BOT_KNOWLEDGE = {
    'me dê dicas de uso': `Aqui estão algumas dicas para aproveitar ao máximo: 💡\n\n1. **Digite o Código EG** da loja para uma análise completa.\n2. Digite **"Menu"** a qualquer momento para voltar ao início.\n3. Use as opções rápidas para agilidade.\n4. Se precisar de algo externo, use **Abrir solicitação**.`,

    'quero analisar uma loja': 'Claro! Por favor, **digite o Código EG** da loja que você deseja analisar. 🔢',

    'preciso de suporte': `Para suporte técnico, você pode:\n\n1. Entrar em contato com o coordenador regional.\n2. Abrir um chamado no portal de chamados.\n3. Se for dúvida de uso, eu posso tentar te explicar! O que está acontecendo?`,

    'ola': 'Olá! 👋 Tudo pronto para analisar seus resultados hoje?',
    'oi': 'Oi! 👋 Como posso ajudar na sua rota hoje?',
    'bom dia': 'Bom dia! ☀️ Vamos buscar o Score 5 hoje?',
    'boa tarde': 'Boa tarde! 🕑 Hora de acelerar a execução!',
    'boa noite': 'Boa noite! 🌙 Ainda dá tempo de planejar o dia de amanhã.',
    'quem é você': `Sou o **Assistente Virtual do Raio-X Score 5**. 🤖\n\nFui criado para te ajudar a analisar a performance das lojas, identificar gaps de execução e fornecer insights rápidos para melhorar seus resultados.`
};
