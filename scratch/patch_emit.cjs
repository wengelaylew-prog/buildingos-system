const fs = require('fs');

// 1. Patch telegram.service.ts
let tCode = fs.readFileSync('src/modules/telegram/telegram.service.ts', 'utf8');
const tTarget = `    }).returning();

    return newRequest;`;
const tReplace = `    }).returning();

    // Emit live socket notification to Admins
    if ((global as any).io) {
      (global as any).io.emit('new_notification', {
        icon: '🛠️',
        message: \`New Maintenance Request from \${unit.unitNumber}: \${data.title}\`
      });
    }

    return newRequest;`;

tCode = tCode.replace(tTarget.replace(/\r\n/g, '\n'), tReplace);
tCode = tCode.replace(tTarget.replace(/\n/g, '\r\n'), tReplace);
fs.writeFileSync('src/modules/telegram/telegram.service.ts', tCode);


// 2. Patch payment.service.ts
let pCode = fs.readFileSync('src/modules/billing/payment.service.ts', 'utf8');
const pTarget = `      receiptUrl: \`\${process.env.APP_URL}/receipts/\${receiptNumber}\` // In future, generate actual PDF URL
    });

    return { status: 'success', payment };`;
const pReplace = `      receiptUrl: \`\${process.env.APP_URL}/receipts/\${receiptNumber}\` // In future, generate actual PDF URL
    });

    // Emit live socket notification to Admins
    if ((global as any).io) {
      (global as any).io.emit('new_notification', {
        icon: '💰',
        message: \`Payment of \${payment.amount} ETB received via \${payment.paymentMethod}!\`
      });
    }

    return { status: 'success', payment };`;

pCode = pCode.replace(pTarget.replace(/\r\n/g, '\n'), pReplace);
pCode = pCode.replace(pTarget.replace(/\n/g, '\r\n'), pReplace);
fs.writeFileSync('src/modules/billing/payment.service.ts', pCode);

console.log('Patched services for socket emit');

