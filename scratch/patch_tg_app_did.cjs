const fs = require('fs');

let code = fs.readFileSync('src/components/telegram/TelegramApp.tsx', 'utf8');

const importTarget = `import { TenantMessagingView, ProfileView, MaintenanceView } from './TelegramViews.tsx';`;
const importReplacement = `import { TenantMessagingView, ProfileView, MaintenanceView, DigitalIdView } from './TelegramViews.tsx';`;

if (!code.includes('DigitalIdView')) {
  code = code.replace(importTarget, importReplacement);
}

const eventListenerTarget = `  const bootstrapAuth = async (currentInitData?: string) => {`;
const eventListenerReplacement = `  useEffect(() => {
    const handleNavDigitalId = () => setActiveTab('digitalid');
    window.addEventListener('nav-digital-id', handleNavDigitalId);
    return () => window.removeEventListener('nav-digital-id', handleNavDigitalId);
  }, []);

  const bootstrapAuth = async (currentInitData?: string) => {`;

if (!code.includes('nav-digital-id')) {
  code = code.replace(eventListenerTarget, eventListenerReplacement);
}

const headerTarget = `activeTab === 'maintenance' ? (am ? 'ጥገና' : 'Maintenance') : ''}`;
const headerReplacement = `activeTab === 'maintenance' ? (am ? 'ጥገና' : 'Maintenance') :
               activeTab === 'digitalid' ? (am ? 'ዲጂታል መታወቂያ' : 'Digital ID') : ''}`;

if (!code.includes('activeTab === \'digitalid\'')) {
  code = code.replace(headerTarget, headerReplacement);
}

const routesTarget = `          {activeTab === 'maintenance' && (
            <MaintenanceView initData={authHeader} />
          )}
        </div>`;
const routesReplacement = `          {activeTab === 'maintenance' && (
            <MaintenanceView initData={authHeader} />
          )}
          {activeTab === 'digitalid' && (
            <DigitalIdView initData={authHeader} />
          )}
        </div>`;

if (!code.includes('<DigitalIdView')) {
  code = code.replace(routesTarget, routesReplacement);
}

fs.writeFileSync('src/components/telegram/TelegramApp.tsx', code);
console.log('TelegramApp.tsx patched for Digital ID routing.');

