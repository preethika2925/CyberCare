import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, RefreshCw, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

interface OtpInputProps {
  onComplete: (code: string) => void;
  onResend: () => void;
  demoOtpCode?: string;
  error?: string | null;
  isSubmitting?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  onComplete,
  onResend,
  demoOtpCode,
  error,
  isSubmitting
}) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState<number>(300); // 5 minutes
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      onComplete(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      digits.forEach((digit, i) => {
        if (inputsRef.current[i]) {
          inputsRef.current[i]!.value = digit;
        }
      });
      inputsRef.current[5]?.focus();
      onComplete(pastedData);
    }
  };

  const fillDemoOtp = () => {
    if (!demoOtpCode) return;
    const digits = demoOtpCode.split('');
    setOtp(digits);
    onComplete(demoOtpCode);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Demo Code Helper */}
      {demoOtpCode && (
        <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Development 2FA OTP: <strong className="font-mono font-bold text-indigo-700 text-sm tracking-wider">{demoOtpCode}</strong></span>
          </div>
          <button
            type="button"
            onClick={fillDemoOtp}
            className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg transition-all"
          >
            Auto-Fill
          </button>
        </div>
      )}

      {/* 6 OTP Boxes */}
      <div className="flex items-center justify-between gap-1 xs:gap-2 sm:gap-3 max-w-full overflow-x-auto py-1">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            disabled={isSubmitting || timer === 0}
            className={`w-9 h-12 xs:w-11 xs:h-14 sm:w-14 sm:h-16 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all ${
              error
                ? 'border-rose-400 bg-rose-50 text-rose-700 focus:ring-2 focus:ring-rose-500'
                : digit
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm focus:ring-2 focus:ring-blue-500'
                : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Timer & Resend */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Code expires in: <strong className="font-mono text-slate-700 font-bold">{formatTimer(timer)}</strong></span>
        </div>

        <button
          type="button"
          onClick={() => {
            setTimer(300);
            setOtp(Array(6).fill(''));
            onResend();
          }}
          disabled={isSubmitting}
          className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
        >
          <RefreshCw className="w-3 h-3" />
          Resend OTP
        </button>
      </div>
    </div>
  );
};
