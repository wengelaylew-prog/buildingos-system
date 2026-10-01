const fs = require('fs');

let code = fs.readFileSync('src/components/views/SecurityKioskView.tsx', 'utf8');

const catchTarget = `    } catch (err: any) {
      setVerifyStatus('error');
      setErrorMessage(err.message || 'Verification Failed');
      toast.error(err.message || 'Verification Failed');
    }`;

const catchReplacement = `    } catch (err: any) {
      setVerifyStatus('error');
      if (err.message === 'FAKE_ID_DETECTED') {
        setErrorMessage('🚨 FAKE OR FORGED ID DETECTED 🚨');
        toast.error('Fake ID detected! Security logged.', { style: { background: '#ef4444', color: '#fff' } });
      } else {
        setErrorMessage(err.message || 'Verification Failed');
        toast.error(err.message || 'Verification Failed');
      }
    }`;

if (!code.includes('FAKE OR FORGED ID DETECTED')) {
  code = code.replace(catchTarget, catchReplacement);
}

// Ensure the UI displays it very visibly
const errorUItarget = `          {verifyStatus === 'error' && (
            <p className="text-red-500 font-bold mb-4">{errorMessage}</p>
          )}`;

const errorUIReplacement = `          {verifyStatus === 'error' && (
            <div className={\`font-bold mb-4 p-4 rounded-lg \${errorMessage.includes('FAKE') ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]' : 'text-red-500'}\`}>
              {errorMessage}
              {errorMessage.includes('FAKE') && <p className="text-xs font-normal mt-2 opacity-90">This scan lacked a valid cryptographic signature and has been reported.</p>}
            </div>
          )}`;

if (!code.includes('animate-pulse shadow-')) {
  code = code.replace(errorUItarget, errorUIReplacement);
}

fs.writeFileSync('src/components/views/SecurityKioskView.tsx', code);
console.log('Frontend patched with Anti-Fake ID UI.');

