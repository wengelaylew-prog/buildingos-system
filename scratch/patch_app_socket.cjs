const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `function MainLayout() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');`;

const replace1 = `function MainLayout() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Phase 7: Real-Time WebSockets
  React.useEffect(() => {
    const socket = io('/', { path: '/socket.io' }); // Connects to same origin
    
    socket.on('connect', () => {
      console.log('Connected to BuildingOS Live Notifications');
    });

    socket.on('new_notification', (data: any) => {
      toast(data.message, {
        icon: data.icon || '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
        duration: 5000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);
`;

const target2 = `    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-900 antialiased selection:bg-indigo-600 selection:text-white font-sans">
      {/* Structural Sidebar */}`;

const replace2 = `    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-900 antialiased selection:bg-indigo-600 selection:text-white font-sans">
      <Toaster position="top-right" />
      {/* Structural Sidebar */}`;

code = code.replace(target1.replace(/\r\n/g, '\n'), replace1);
code = code.replace(target1.replace(/\n/g, '\r\n'), replace1);

code = code.replace(target2.replace(/\r\n/g, '\n'), replace2);
code = code.replace(target2.replace(/\n/g, '\r\n'), replace2);

fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx');

