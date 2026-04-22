import { useState } from 'react';
import { useTOTP } from '../../hooks/useTOTP';
import { formatTOTPCode } from '../../utils/totp';

/**
 * Display TOTP code with countdown timer
 * @param {Object} props
 * @param {string} props.secret - Base32 TOTP secret
 * @param {Function} props.onCopy - Callback when code is copied
 */
export default function TOTPDisplay({ secret, onCopy }) {
  const { code, timeRemaining, error } = useTOTP(secret);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (code && code !== '------') {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onCopy?.();
      } catch (err) {
        console.error('Erreur de copie:', err);
      }
    }
  };

  // Calculate progress percentage (decreasing from 100 to 0)
  const progress = (timeRemaining / 30) * 100;
  const circumference = 2 * Math.PI * 10; // radius = 10
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const isLow = timeRemaining <= 5;

  if (error) {
    return (
      <div className="flex items-center gap-2 mt-2 text-sm text-red-400 font-mono">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      {/* TOTP Label */}
      <span className="text-xs text-cyan font-mono uppercase tracking-wider">2FA</span>

      {/* TOTP Code with countdown */}
      <div className="flex items-center gap-2 bg-dark-navy border border-lime/30 rounded px-3 py-1.5">
        {/* Code */}
        <span className="font-mono text-lg text-lime tracking-widest select-all">
          {formatTOTPCode(code)}
        </span>

        {/* Countdown circle */}
        <div className="relative w-6 h-6 flex-shrink-0">
          <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
            {/* Background circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-grey/30"
            />
            {/* Progress circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${isLow ? 'text-red-400' : 'text-cyan'}`}
            />
          </svg>
          {/* Time remaining */}
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold ${isLow ? 'text-red-400' : 'text-cyan'}`}>
            {timeRemaining}
          </span>
        </div>
      </div>

      {/* Copy button - touch friendly */}
      <button
        onClick={handleCopy}
        className="p-2 sm:p-1.5 text-cyan hover:text-lime rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
        title="Copier le code 2FA"
      >
        {copied ? (
          <svg className="w-4 h-4 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
