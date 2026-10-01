const fs = require('fs');
let code = fs.readFileSync('src/modules/telegram/telegram.controller.ts', 'utf8');

const startHandler = `
      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        // Add explicit /start handler to launch Web App
        if (text.startsWith('/start')) {
          if (process.env.TELEGRAM_BOT_TOKEN) {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'https://buildingos-app.onrender.com';
            
            await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                chat_id: chatId, 
                text: "<b>👋 ወደ BuildingOS እንኳን በደህና መጡ!</b>\\n\\nየኪራይ ሂሳብዎን፣ የጥገና ጥያቄዎችን፣ የውሃ/መብራት እና መታወቂያዎን ለማየት ከታች ያለውን <b>'📱 አፑን ክፈት'</b> የሚለውን ቁልፍ ይጫኑ።", 
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [[
                    { text: "📱 አፑን ክፈት (Open App)", web_app: { url: appUrl } }
                  ]]
                }
              })
            }).catch(console.error);
            return res.json({ success: true });
          }
        }
`;

if (!code.includes('text.startsWith(\\'/start\\')')) {
  code = code.replace(
    'if (update.message && update.message.text) {\n        const chatId = update.message.chat.id;\n        const text = update.message.text;',
    startHandler
  );
  fs.writeFileSync('src/modules/telegram/telegram.controller.ts', code);
  console.log('Patched /start handler');
} else {
  console.log('Already patched');
}

