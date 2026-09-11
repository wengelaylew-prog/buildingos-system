import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { tmaAuthSendEmailOtp, tmaAuthVerifyEmailOtp, tmaAuthSendPhoneOtp, tmaAuthVerifyPhoneOtp } from '../../lib/tma-client.ts';
import { Send, Mail, Phone, Loader2, ArrowLeft, Building } from 'lucide-react';

type Mode = 'menu' | 'email' | 'email-otp' | 'phone' | 'phone-otp';

interface TelegramLinkViewProps {
  initData: string | null;
  telegramError: string | null;
  telegramLoading?: boolean;
  onRetryTelegram: () => void;
  onAuthenticated: () => void;
}

export function TelegramLinkView({ initData, telegramError, telegramLoading = false, onRetryTelegram, onAuthenticated }: TelegramLinkViewProps) {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [mode, setMode] = useState<Mode>('menu');

  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  const inTelegram = !!initData || !!(window as any).Telegram?.WebApp;

  const startEmailCooldown = () => {
    setEmailCooldown(60);
    const interval = setInterval(() => {
      setEmailCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const startPhoneCooldown = () => {
    setPhoneCooldown(60);
    const interval = setInterval(() => {
      setPhoneCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);
    try {
      await tmaAuthSendEmailOtp(email);
      setMode('email-otp');
      startEmailCooldown();
    } catch (err: any) {
      setEmailError(err.message || (am ? 'ኮድ መላክ አልተቻለም' : 'Unable to send verification code'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (emailCooldown > 0) return;
    setEmailError('');
    try {
      await tmaAuthSendEmailOtp(email);
      startEmailCooldown();
    } catch (err: any) {
      setEmailError(err.message || (am ? 'ኮድ መላክ አልተቻለም' : 'Unable to send verification code'));
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);
    try {
      await tmaAuthVerifyEmailOtp(email, emailCode, initData);
      onAuthenticated();
    } catch (err: any) {
      setEmailError(err.message || (am ? 'የማረጋገጫ ኮድ ትክክል አይደለም' : 'Invalid or expired verification code'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneLoading(true);
    try {
      await tmaAuthSendPhoneOtp(phone);
      setMode('phone-otp');
      startPhoneCooldown();
    } catch (err: any) {
      setPhoneError(err.message || (am ? 'ኮድ መላክ አልተቻለም' : 'Unable to send verification code'));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleResendPhoneOtp = async () => {
    if (phoneCooldown > 0) return;
    setPhoneError('');
    try {
      await tmaAuthSendPhoneOtp(phone);
      startPhoneCooldown();
    } catch (err: any) {
      setPhoneError(err.message || (am ? 'ኮድ መላክ አልተቻለም' : 'Unable to send verification code'));
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneLoading(true);
    try {
      await tmaAuthVerifyPhoneOtp(phone, phoneCode, initData);
      onAuthenticated();
    } catch (err: any) {
      setPhoneError(err.message || (am ? 'የማረጋገጫ ኮድ ትክክል አይደለም' : 'Invalid or expired verification code'));
    } finally {
      setPhoneLoading(false);
    }
  };

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="mb-6 flex items-center gap-2 text-[#0f5132] font-medium active:opacity-70">
      <ArrowLeft size={18} />
      {am ? 'ተመለስ' : 'Back'}
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0f5132] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0f5132]/20">
            <Building size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">BuildingOS</h1>
          <p className="text-stone-500 mt-1">{am ? 'የተከራይ መግቢያ' : 'Tenant Portal'}</p>
        </div>

        {mode === 'menu' && (
          <>
            {telegramError && (
              <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <p className="text-sm text-amber-900 font-medium">
                  {am ? 'የቴሌግራም መለያዎ አልተያያዘም' : 'Telegram Account Not Linked'}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {am
                    ? 'የቴሌግራም መለያዎን እንዲያገናኙ የንብረት አስተዳዳሪዎን ያነጋግሩ፣ ወይም ከታች ባሉት ኢሜይል ወይም ስልክ OTP ይግቡ።'
                    : 'Ask your property manager to link this Telegram account, or sign in with email or phone OTP below.'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {inTelegram && (
                <button
                  type="button"
                  onClick={onRetryTelegram}
                  disabled={telegramLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f5132] text-white font-semibold py-3 active:opacity-90 disabled:opacity-60"
                >
                  {telegramLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {am ? 'Telegram ይግቡ' : 'Sign in with Telegram'}
                </button>
              )}
              {!inTelegram && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <p className="text-sm text-blue-900">
                    {am ? 'ይህንን አፕሊኬሽን በቴሌግራም ውስጥ ይክፈቱ' : 'Open this app inside Telegram for instant login'}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMode('email')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-300 text-stone-800 font-semibold py-3 active:bg-stone-50"
              >
                <Mail size={18} />
                {am ? 'በኢሜይል OTP ይግቡ' : 'Sign in with Email OTP'}
              </button>

              <button
                type="button"
                onClick={() => setMode('phone')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-300 text-stone-800 font-semibold py-3 active:bg-stone-50"
              >
                <Phone size={18} />
                {am ? 'በስልክ OTP ይግቡ' : 'Sign in with Phone OTP'}
              </button>
            </div>
          </>
        )}

        {mode === 'email' && (
          <>
            <BackButton onClick={() => setMode('menu')} />
            <h2 className="text-lg font-bold mb-4">{am ? 'በኢሜይል OTP ይግቡ' : 'Sign in with Email OTP'}</h2>
            <form onSubmit={handleSendEmailOtp} className="space-y-3">
              <input
                type="email"
                required
                placeholder={am ? 'ኢሜይል አድራሻ' : 'Email address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5132]"
              />
              {emailError && <p className="text-xs text-red-600">{emailError}</p>}
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f5132] text-white font-semibold py-3 disabled:opacity-60"
              >
                {emailLoading && <Loader2 size={16} className="animate-spin" />}
                {am ? 'ኮድ ላክ' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {mode === 'email-otp' && (
          <>
            <BackButton onClick={() => setMode('email')} />
            <h2 className="text-lg font-bold mb-2">{am ? 'ማረጋገጫ ኮድ ያስገቡ' : 'Enter Verification Code'}</h2>
            <p className="text-xs text-stone-500 mb-4">
              {am ? `ኮድ ወደ ${email} ተልኳል` : `A code was sent to ${email}`}
            </p>
            <form onSubmit={handleVerifyEmailOtp} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder={am ? 'ማረጋገጫ ኮድ' : 'Verification Code'}
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0f5132]"
              />
              {emailError && <p className="text-xs text-red-600">{emailError}</p>}
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f5132] text-white font-semibold py-3 disabled:opacity-60"
              >
                {emailLoading && <Loader2 size={16} className="animate-spin" />}
                {am ? 'አረጋግጥ' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={handleResendEmailOtp}
                disabled={emailCooldown > 0}
                className="w-full text-xs text-stone-500 disabled:opacity-50"
              >
                {emailCooldown > 0
                  ? (am ? `ዳግም ላክ (${emailCooldown}ሰ)` : `Resend code (${emailCooldown}s)`)
                  : (am ? 'ኮድ ዳግም ላክ' : 'Resend code')}
              </button>
            </form>
          </>
        )}

        {mode === 'phone' && (
          <>
            <BackButton onClick={() => setMode('menu')} />
            <h2 className="text-lg font-bold mb-4">{am ? 'በስልክ OTP ይግቡ' : 'Sign in with Phone OTP'}</h2>
            <form onSubmit={handleSendPhoneOtp} className="space-y-3">
              <input
                type="tel"
                required
                placeholder={am ? 'ስልክ ቁጥር' : 'Phone number'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5132]"
              />
              {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
              <button
                type="submit"
                disabled={phoneLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f5132] text-white font-semibold py-3 disabled:opacity-60"
              >
                {phoneLoading && <Loader2 size={16} className="animate-spin" />}
                {am ? 'ኮድ ላክ' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {mode === 'phone-otp' && (
          <>
            <BackButton onClick={() => setMode('phone')} />
            <h2 className="text-lg font-bold mb-2">{am ? 'ማረጋገጫ ኮድ ያስገቡ' : 'Enter Verification Code'}</h2>
            <p className="text-xs text-stone-500 mb-4">
              {am ? `ኮድ ወደ ${phone} ተልኳል` : `A code was sent to ${phone}`}
            </p>
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder={am ? 'ማረጋገጫ ኮድ' : 'Verification Code'}
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0f5132]"
              />
              {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
              <button
                type="submit"
                disabled={phoneLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f5132] text-white font-semibold py-3 disabled:opacity-60"
              >
                {phoneLoading && <Loader2 size={16} className="animate-spin" />}
                {am ? 'አረጋግጥ' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={handleResendPhoneOtp}
                disabled={phoneCooldown > 0}
                className="w-full text-xs text-stone-500 disabled:opacity-50"
              >
                {phoneCooldown > 0
                  ? (am ? `ዳግም ላክ (${phoneCooldown}ሰ)` : `Resend code (${phoneCooldown}s)`)
                  : (am ? 'ኮድ ዳግም ላክ' : 'Resend code')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
