import { useState, useEffect, useCallback } from 'react';
import { generateTOTP, getTimeRemaining, validateTOTPSecret } from '../utils/totp';

/**
 * Hook for TOTP code generation with automatic refresh
 * @param {string} secret - Base32-encoded TOTP secret
 * @returns {Object} - { code, timeRemaining, error }
 */
export function useTOTP(secret) {
  const [code, setCode] = useState('------');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [error, setError] = useState(null);

  const generateCode = useCallback(async () => {
    if (!secret) {
      setCode('------');
      setError(null);
      return;
    }

    if (!validateTOTPSecret(secret)) {
      setError('Format du secret invalide');
      setCode('------');
      return;
    }

    try {
      const newCode = await generateTOTP(secret);
      setCode(newCode);
      setError(null);
    } catch (err) {
      setError('Erreur de generation du code');
      setCode('------');
    }
  }, [secret]);

  useEffect(() => {
    if (!secret) {
      setCode('------');
      setTimeRemaining(30);
      setError(null);
      return;
    }

    // Generate initial code
    generateCode();

    // Update every second
    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);

      // Regenerate code when timer resets to 30
      if (remaining === 30) {
        generateCode();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [secret, generateCode]);

  return { code, timeRemaining, error };
}

export default useTOTP;
