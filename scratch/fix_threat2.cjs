const fs = require('fs');
let c = fs.readFileSync('scratch/patch_threat2.cjs', 'utf8');

// Find and fix the backtick conflict line
const bad = 'className={`text-[11px] font-mono font-bold ${threatLevel === \'CRITICAL\' ? \'text-red-400\' : threatLevel === \'ELEVATED\' ? \'text-amber-400\' : \'text-emerald-400\'}`}';
const good = 'className={[\'text-[11px]\', \'font-mono\', \'font-bold\', threatLevel === \'CRITICAL\' ? \'text-red-400\' : threatLevel === \'ELEVATED\' ? \'text-amber-400\' : \'text-emerald-400\'].join(\' \')}';
c = c.replace(bad, good);
fs.writeFileSync('scratch/patch_threat2.cjs', c);
console.log('Fixed:', c.includes(good));

