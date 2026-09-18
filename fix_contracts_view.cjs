const fs = require('fs');

let cv = fs.readFileSync('src/components/views/ContractsView.tsx', 'utf8');

const signatureBadge = `
                          <Badge status={status} size="sm" />
                          {contract.signatureUrl ? (
                             <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 mt-1">
                               Signed <span className="group relative cursor-pointer underline">View<div className="hidden group-hover:block absolute z-50 bg-white border shadow-xl p-2 rounded -left-10 top-5"><img src={contract.signatureUrl} className="h-16 bg-slate-50 border rounded"/></div></span>
                             </span>
                          ) : (
                             <span className="text-[10px] text-slate-400 mt-1">Unsigned</span>
                          )}
`;

cv = cv.replace(
  "<Badge status={status} size=\"sm\" />",
  signatureBadge
);

fs.writeFileSync('src/components/components/views/ContractsView.tsx', cv, 'utf8'); // Wait, src/components/views/ContractsView.tsx
// It's src/components/views/ContractsView.tsx

