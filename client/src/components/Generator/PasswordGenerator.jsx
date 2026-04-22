import { useState, useEffect, useCallback } from 'react';
import { entropyPool } from '../../utils/entropy';

export default function PasswordGenerator({ onSelect, onClose }) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(20);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true
  });
  const [mode, setMode] = useState('password'); // 'password' | 'passphrase'
  const [wordCount, setWordCount] = useState(4);
  const [strength, setStrength] = useState(null);
  const [copied, setCopied] = useState(false);
  const [entropyLevel, setEntropyLevel] = useState(0);

  // Collecter l'entropie du mouvement de souris
  useEffect(() => {
    const handleMouseMove = (e) => {
      entropyPool.addMouseEntropy(e.clientX, e.clientY);
      setEntropyLevel(prev => Math.min(prev + 1, 100));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Générer un mot de passe
  const generate = useCallback(() => {
    let newPassword;

    if (mode === 'password') {
      newPassword = entropyPool.generatePassword(length, options);
    } else {
      newPassword = entropyPool.generatePassphrase(wordCount);
    }

    setPassword(newPassword);
    setStrength(entropyPool.evaluateStrength(newPassword));
    setCopied(false);
  }, [mode, length, options, wordCount]);

  // Générer au chargement et quand les options changent
  useEffect(() => {
    generate();
  }, [generate]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  const handleOptionChange = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = () => {
    onSelect(password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-mid-navy border-2 border-lime/20 rounded-lg shadow-glow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl sm:text-2xl text-lime uppercase tracking-wider">[ Generateur ]</h2>
            <button
              onClick={onClose}
              className="p-2 sm:p-1 text-grey hover:text-red-400 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2 px-4 rounded font-heading uppercase tracking-wider transition ${
                mode === 'password'
                  ? 'bg-lime text-dark-navy border-2 border-lime'
                  : 'bg-dark-navy text-grey border-2 border-grey/30 hover:border-lime/30'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setMode('passphrase')}
              className={`flex-1 py-2 px-4 rounded font-heading uppercase tracking-wider transition ${
                mode === 'passphrase'
                  ? 'bg-lime text-dark-navy border-2 border-lime'
                  : 'bg-dark-navy text-grey border-2 border-grey/30 hover:border-lime/30'
              }`}
            >
              Passphrase
            </button>
          </div>

          {/* Generated password */}
          <div className="bg-dark-navy border-2 border-lime/50 rounded p-4 mb-4">
            <div className="flex items-center justify-between gap-2">
              <code className="text-lg font-mono text-lime break-all flex-1">
                {password}
              </code>
              <div className="flex gap-1">
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-cyan hover:text-lime rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Copier"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={generate}
                  className="p-2 text-cyan hover:text-lime rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Regenerer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Strength indicator */}
            {strength && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-grey font-mono">Force du mot de passe</span>
                  <span style={{ color: strength.color }} className="font-mono font-medium">
                    {strength.label}
                  </span>
                </div>
                <div className="h-2 bg-mid-navy rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${entropyPool.calculateEntropy(password) / 1.2}%`,
                      backgroundColor: strength.color
                    }}
                  />
                </div>
                <p className="text-xs text-grey font-mono mt-1">
                  {entropyPool.calculateEntropy(password)} bits d'entropie
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          {mode === 'password' ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-cyan uppercase tracking-wider">Longueur: {length}</span>
                </label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-dark-navy rounded-lg appearance-none cursor-pointer accent-lime"
                />
                <div className="flex justify-between text-xs text-grey font-mono mt-1">
                  <span>8</span>
                  <span>64</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { key: 'uppercase', label: 'Majuscules (A-Z)' },
                  { key: 'lowercase', label: 'Minuscules (a-z)' },
                  { key: 'numbers', label: 'Chiffres (0-9)' },
                  { key: 'symbols', label: 'Symboles (!@#...)' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer py-2 sm:py-0 min-h-[44px] sm:min-h-0">
                    <input
                      type="checkbox"
                      checked={options[key]}
                      onChange={() => handleOptionChange(key)}
                      className="w-5 h-5 sm:w-4 sm:h-4 accent-lime rounded border-cyan/30"
                    />
                    <span className="text-sm text-grey font-mono">{label}</span>
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer py-2 sm:py-0 min-h-[44px] sm:min-h-0">
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={() => handleOptionChange('excludeAmbiguous')}
                  className="w-5 h-5 sm:w-4 sm:h-4 accent-lime rounded border-cyan/30"
                />
                <span className="text-sm text-grey font-mono">Exclure caracteres ambigus (0, O, l, 1, I)</span>
              </label>
            </div>
          ) : (
            <div className="mb-6">
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-cyan uppercase tracking-wider">Nombre de mots: {wordCount}</span>
              </label>
              <input
                type="range"
                min="3"
                max="8"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
                className="w-full h-2 bg-dark-navy rounded-lg appearance-none cursor-pointer accent-lime"
              />
              <div className="flex justify-between text-xs text-grey font-mono mt-1">
                <span>3 mots</span>
                <span>8 mots</span>
              </div>
            </div>
          )}

          {/* Entropy indicator */}
          <div className="bg-dark-navy border border-lime/30 rounded p-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-grey font-mono">
              <svg className="w-4 h-4 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                Entropie collectée : <span className="text-lime">{Math.min(entropyLevel, 100)}%</span>
                {entropyLevel < 20 && <span className="text-cyan"> - Bougez la souris pour plus d\'entropie</span>}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-grey/20 hover:bg-grey/30 text-grey hover:text-white border-2 border-grey/30 font-heading uppercase tracking-wider rounded transition-all"
            >
              [ Annuler ]
            </button>
            <button
              onClick={handleSelect}
              className="flex-1 bg-lime hover:bg-lime-dim text-dark-navy font-heading uppercase tracking-wider py-3 px-4 rounded transition-all shadow-[0_0_15px_rgba(194,254,11,0.4)] hover:shadow-[0_0_25px_rgba(194,254,11,0.6)]"
            >
              [ Utiliser ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
