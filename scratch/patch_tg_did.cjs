const fs = require('fs');

let tg = fs.readFileSync('src/components/telegram/TelegramViews.tsx', 'utf8');

const digitalIdViewCode = `
export function DigitalIdView({ initData }: { initData: string | null }) {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    tmaFetch('/api/v1/telegram/tenant-home', initData)
      .then(setData)
      .catch(e => setError(e.message));
  }, [initData]);

  if (error) return <div className="p-4 text-red-500 text-center font-bold bg-red-50 m-4 rounded-xl border border-red-200">{error}</div>;
  if (!data) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Digital ID...</div>;

  const didToken = \`DID-\${data.tenant.id}\`;

  return (
    <div className="p-4 pb-20 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl shadow-xl overflow-hidden relative text-white">
        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite_linear]"></div>
        
        <div className="p-6 relative z-10 text-center">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-wider">{am ? 'ዲጂታል መታወቂያ' : 'DIGITAL ID'}</h2>
            <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-mono font-bold tracking-widest backdrop-blur-sm">
              MALL ACCESS
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl inline-block shadow-2xl mb-6 ring-4 ring-indigo-400/30">
            <QRCodeSVG value={didToken} size={200} level="H" includeMargin={false} fgColor="#1e1b4b" />
          </div>
          
          <div className="text-left bg-black/20 rounded-xl p-4 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 border border-white/20">
                 {data.tenant.profilePhoto ? (
                   <img src={data.tenant.profilePhoto} className="w-full h-full object-cover rounded-full" alt="Profile"/>
                 ) : (
                   data.tenant.fullName.charAt(0)
                 )}
               </div>
               <div>
                 <h3 className="font-bold text-lg leading-tight mb-1">{data.tenant.fullName}</h3>
                 <p className="text-indigo-200 text-sm">{data.tenant.phone}</p>
                 <div className="mt-1 flex gap-2">
                   <span className="text-[10px] bg-emerald-500/80 px-2 py-0.5 rounded font-mono font-bold">VERIFIED</span>
                   <span className="text-[10px] bg-indigo-500/80 px-2 py-0.5 rounded font-mono font-bold">SHOP {data.activeLeases?.[0]?.unitNumber || 'N/A'}</span>
                 </div>
               </div>
            </div>
          </div>
          
          <p className="text-[10px] text-indigo-300 mt-4 opacity-80">
            {am ? 'ይህን ኮድ ለጥበቃ በማሳየት ወደ ሞሉ ይግቡ' : 'Present this QR code to security for mall access'}
          </p>
        </div>
      </div>
      
      <style>{\`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      \`}</style>
    </div>
  );
}
`;

if (!tg.includes('export function DigitalIdView')) {
  tg = tg + '\\n' + digitalIdViewCode;
  
  // Also add a button on the TenantHomeView to open it
  const homeTarget = `<button onClick={onOpenGatePass} className="bg-emerald-50 text-emerald-700 p-3 rounded-xl font-medium shadow-sm hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 border border-emerald-100">
          <Ticket size={20} />
          {t('tenant_home.guest_pass')}
        </button>`;
        
  const homeReplacement = `<button onClick={onOpenGatePass} className="bg-emerald-50 text-emerald-700 p-3 rounded-xl font-medium shadow-sm hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 border border-emerald-100">
          <Ticket size={20} />
          {t('tenant_home.guest_pass')}
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('nav-digital-id'))} className="bg-indigo-50 text-indigo-700 p-3 rounded-xl font-medium shadow-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100 col-span-2">
          <QrCode size={20} />
          {am ? 'የኔ ዲጂታል መታወቂያ' : 'My Digital ID'}
        </button>`;
        
  tg = tg.replace(homeTarget, homeReplacement);
  
  // Ensure QrCode icon is imported
  if (!tg.includes('QrCode,')) {
    tg = tg.replace('Ticket,', 'Ticket, QrCode,');
  }

  fs.writeFileSync('src/components/telegram/TelegramViews.tsx', tg);
  console.log('TelegramViews patched with Digital ID.');
}

