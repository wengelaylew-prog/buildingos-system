const fs = require('fs');
let view = fs.readFileSync('src/components/telegram/TelegramViews.tsx', 'utf8');

view = view.replace(
  "{am ? 'የህንፃ አስተዳደር' : 'Building Admin'}",
  "{am ? 'የህንፃው አስተዳዳሪ (Admin)' : 'Building Admin'}"
);

view = view.replace(
  "text: am ? 'ሰላም! ይህ የህንፃ አስተዳደር ቀጥታ ውይይት ነው።",
  "text: am ? 'ሰላም! ይህ ከአስተዳዳሪዎ ጋር የሚያደርጉት ቀጥታ ውይይት ነው።"
);

fs.writeFileSync('src/components/telegram/TelegramViews.tsx', view, 'utf8');
console.log('Fixed hardcoded text');

