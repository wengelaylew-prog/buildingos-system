const fs = require('fs');

const file = 'C:/Users/zhg/Documents/GitHub/buildingos-system/src/components/telegram/TelegramViews.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    return (
    <div className="space-y-4 font-sans">
      {/* Header & Welcome */}
      <div className="flex justify-between items-start">`;

// Fix whitespace matching
const regex = /return \(\s*<div className="space-y-4 font-sans">\s*\{\/\* Header & Welcome \*\/\}\s*<div className="flex justify-between items-start">/m;

const match = content.match(regex);
if (match) {
  const replacement = `return (
    <div className="space-y-4 font-sans">
      {/* Header & Welcome */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xs font-semibold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider mb-1">
            BuildingOS Tenant
          </h2>
          <h1 className="text-2xl font-bold leading-tight">
            {getGreeting()},<br/>{data.tenantName?.split(' ')[0]} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenNotifications}
            className="w-10 h-10 rounded-full bg-blue-50 text-[var(--tg-theme-button-color,#3b82f6)] flex items-center justify-center relative"
          >
            <Bell size={20} />
            {data.unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
      </div>

      {data.announcements && data.announcements.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900">
          <h3 className="font-bold flex items-center gap-2 mb-2"><Megaphone size={16} /> Announcements</h3>
          <div className="space-y-2">
            {data.announcements.map((ann: any) => (
              <div key={ann.id} className="bg-white p-3 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm">{ann.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
`;
  // Just inject right after the Header & welcome match. Wait, the original code had the entire header block.
  // I will just replace the whole Header & Welcome block.
  
  const headerBlockRegex = /return \(\s*<div className="space-y-4 font-sans">\s*\{\/\* Header & Welcome \*\/\}\s*<div className="flex justify-between items-start">[\s\S]*?<\/div>\s*<\/div>/m;
  
  if (content.match(headerBlockRegex)) {
    content = content.replace(headerBlockRegex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Replaced successfully');
  } else {
    console.log('Could not find header block');
  }
} else {
  console.log('Could not find return match');
}
