import React from 'react';
import { X, Phone, MessageSquare, Send, AlertCircle, Building2, Calendar, FileText } from 'lucide-react';

interface TenantQuickProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: any;
  unit: any;
  overdueAmount?: number;
  billContext?: any; // To populate quick messages
}

export const TenantQuickProfileModal: React.FC<TenantQuickProfileModalProps> = ({
  isOpen,
  onClose,
  tenant,
  unit,
  overdueAmount = 0,
  billContext
}) => {
  if (!isOpen || !tenant) return null;

  // Format phone for WhatsApp/Telegram (strip non-digits, add country code if missing)
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '251' + digits.substring(1);
    if (digits.length === 9) digits = '251' + digits; // Assuming Ethiopian numbers without 0 or +251
    return digits;
  };

  const formattedPhone = formatPhone(tenant.phone);

  const getAmharicMessage = () => {
    let msg = `ሰላም ${tenant.fullName || 'ተከራይ'}፣\n\n`;
    if (billContext) {
      msg += `የ${billContext.utilityType || 'ኪራይ'} ክፍያዎን (${parseFloat(billContext.amount).toLocaleString()} ETB) አላጠናቀቁም። እባክዎ ቀነ-ገደቡ ${billContext.dueDate} ስለሆነ በአፋጣኝ ክፍያዎን ይፈጽሙ።\n`;
    } else if (overdueAmount > 0) {
      msg += `ያለብዎት ያልተከፈለ ሂሳብ ${overdueAmount.toLocaleString()} ETB ደርሷል። እባክዎ በአፋጣኝ ክፍያዎን ይፈጽሙ።\n`;
    } else {
      msg += `ይህ ከህንፃ አስተዳደር የተላከ መልዕክት ነው።\n`;
    }
    msg += `\nእናመሰግናለን። (Building Admin)`;
    return encodeURIComponent(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-900/50 to-slate-900 p-6 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border-2 border-indigo-500 overflow-hidden">
              {tenant.profilePhoto ? (
                <img src={tenant.profilePhoto} alt={tenant.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-slate-300">{tenant.fullName?.charAt(0) || '?'}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{tenant.fullName}</h2>
              <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                <Building2 className="w-4 h-4" />
                <span>{unit ? `ክፍል (Unit) ${unit.unitNumber}` : 'No Unit Assigned'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800/50 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Status Alert if Overdue */}
          {overdueAmount > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-rose-400 font-bold text-sm">Action Recommended (እርምጃ ይመከራል)</h4>
                <p className="text-slate-300 text-sm mt-1">
                  ይህ ተከራይ <b>{overdueAmount.toLocaleString()} ETB</b> ያልተከፈለ ሂሳብ አለበት። አሁኑኑ ማሳሰቢያ ይላኩላቸው።
                </p>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">ስልክ ቁጥር (Phone)</p>
              <p className="text-sm font-medium text-slate-200">{tenant.phone || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">ኢሜይል (Email)</p>
              <p className="text-sm font-medium text-slate-200 truncate">{tenant.email || 'N/A'}</p>
            </div>
          </div>

          {/* Smart Messaging Integration */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">ፈጣን መልክት መላኪያ (Quick Message)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`https://wa.me/${formattedPhone}?text=${getAmharicMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 p-3 rounded-xl transition-colors group"
              >
                <div className="p-2 bg-emerald-600/20 rounded-lg group-hover:bg-emerald-600/40 transition-colors">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-400">WhatsApp</p>
                  <p className="text-xs text-slate-400">ዋትስአፕ ላክ</p>
                </div>
              </a>

              <a
                href={`https://t.me/+${formattedPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 p-3 rounded-xl transition-colors group"
              >
                <div className="p-2 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/40 transition-colors">
                  <Send className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-blue-400">Telegram</p>
                  <p className="text-xs text-slate-400">ቴሌግራም ላክ</p>
                </div>
              </a>

              <a
                href={`tel:${tenant.phone}`}
                className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl transition-colors group"
              >
                <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
                  <Phone className="w-5 h-5 text-slate-300" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-300">Call Phone</p>
                  <p className="text-xs text-slate-500">ስልክ ደውል</p>
                </div>
              </a>
              
              <a
                href={`sms:${tenant.phone}?body=${getAmharicMessage()}`}
                className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl transition-colors group"
              >
                <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
                  <FileText className="w-5 h-5 text-slate-300" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-300">SMS</p>
                  <p className="text-xs text-slate-500">አጭር የፅሁፍ መልክት</p>
                </div>
              </a>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

