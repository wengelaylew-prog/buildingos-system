const fs = require('fs');
let code = fs.readFileSync('src/components/views/TenantsView.tsx', 'utf8');

// 1. Add aiScanning state
const stateTarget = `  const [isCreateOpen, setIsCreateOpen] = useState(showCreateModalInitial || false);`;
const stateReplace = `  const [isCreateOpen, setIsCreateOpen] = useState(showCreateModalInitial || false);
  const [aiScanning, setAiScanning] = useState(false);`;

code = code.replace(stateTarget, stateReplace);

// 2. Add handleAiScan method
const handlerTarget = `  const handleCreateSubmit = async (e: React.FormEvent) => {`;
const handlerReplace = `  const handleAiScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiScanning(true);
    setFormError('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result?.toString() || '';
        
        const res = await fetch('/api/v1/ai/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${localStorage.getItem('token')}\`
          },
          body: JSON.stringify({ image: base64Image })
        });

        const json = await res.json();
        if (json.success) {
          setFormData(prev => ({
            ...prev,
            fullName: json.data.fullName || prev.fullName,
            phone: json.data.phone || prev.phone,
            idNumber: json.data.idNumber || prev.idNumber
          }));
        } else {
          setFormError(json.error?.message || 'Failed to scan ID');
        }
        setAiScanning(false);
      };
    } catch (err) {
      setFormError('Failed to process image');
      setAiScanning(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {`;

code = code.replace(handlerTarget, handlerReplace);

// 3. Add AI Scan Button UI to Modal
const uiTarget = `          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}`;
const uiReplace = `          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* AI Scanner Button */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-indigo-900">Magic Auto-fill (AI OCR) 🪄</p>
              <p className="text-xs text-indigo-700">Upload an ID card to automatically fill the name and details below.</p>
            </div>
            <label className="shrink-0">
              <input type="file" accept="image/*" className="hidden" onChange={handleAiScan} disabled={aiScanning} />
              <div className={\`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm cursor-pointer transition-colors \${aiScanning ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}\`}>
                {aiScanning ? 'Scanning...' : 'Upload ID Card'}
              </div>
            </label>
          </div>`;

code = code.replace(uiTarget, uiReplace);

fs.writeFileSync('src/components/views/TenantsView.tsx', code);
console.log('Patched TenantsView.tsx for AI OCR');

