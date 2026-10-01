const fs = require('fs');

let tg = fs.readFileSync('src/components/telegram/TelegramViews.tsx', 'utf8');

const quickActionsTarget = `<div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPayModalOpen(true)}
                className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                <Wallet size={20} className="mb-1" />
                <span className="text-[11px] font-bold text-center leading-tight">
                  {am ? 'ክፍያ (Pay Rent)' : 'Pay Rent'}
                </span>
              </button>

            <button 
              onClick={onOpenGatePass}
              className="flex flex-col items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              <Package size={20} className="mb-1" />
              <span className="text-[11px] font-bold text-center leading-tight">
                {am ? 'የእቃ ማውጫ (Gate Pass)' : 'Gate Pass'}
              </span>
            </button>
            <button 
              onClick={onOpenMaintenance}
              className="flex flex-col items-center justify-center p-3 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <Wrench size={20} className="mb-1" />
              <span className="text-[11px] font-bold text-center leading-tight">
                {am ? 'ጥገና መጠየቂያ (Maintenance)' : 'Maintenance'}
              </span>
            </button>
          </div>`;

const quickActionsReplacement = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('nav-digital-id'))}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm"
              >
                <QrCode size={20} className="mb-1" />
                <span className="text-[11px] font-bold text-center leading-tight">
                  {am ? 'ዲጂታል መታወቂያ' : 'Digital ID'}
                </span>
              </button>

              <button 
                onClick={() => setPayModalOpen(true)}
                className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <Wallet size={20} className="mb-1" />
                <span className="text-[11px] font-bold text-center leading-tight">
                  {am ? 'ክፍያ (Pay Rent)' : 'Pay Rent'}
                </span>
              </button>

            <button 
              onClick={onOpenGatePass}
              className="flex flex-col items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm"
            >
              <Package size={20} className="mb-1" />
              <span className="text-[11px] font-bold text-center leading-tight">
                {am ? 'የእቃ ማውጫ' : 'Gate Pass'}
              </span>
            </button>
            
            <button 
              onClick={onOpenMaintenance}
              className="flex flex-col items-center justify-center p-3 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors shadow-sm"
            >
              <Wrench size={20} className="mb-1" />
              <span className="text-[11px] font-bold text-center leading-tight">
                {am ? 'ጥገና (Fix)' : 'Maintenance'}
              </span>
            </button>
          </div>`;

if (tg.includes('grid-cols-3')) {
  tg = tg.replace(quickActionsTarget, quickActionsReplacement);
  fs.writeFileSync('src/components/telegram/TelegramViews.tsx', tg);
  console.log('TelegramViews Quick Actions patched.');
} else {
  console.log('Quick Actions target not found.');
}

