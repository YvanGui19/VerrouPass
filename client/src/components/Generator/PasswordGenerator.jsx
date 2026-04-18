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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Générateur de mot de passe</h2>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
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
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                mode === 'password'
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                  : 'bg-slate-100 text-slate-600 border-2 border-transparent'
              }`}
            >
              Mot de passe
            </button>
            <button
              onClick={() => setMode('passphrase')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                mode === 'passphrase'
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                  : 'bg-slate-100 text-slate-600 border-2 border-transparent'
              }`}
            >
              Phrase secrète
            </button>
          </div>

          {/* Generated password */}
          <div className="bg-slate-100 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between gap-2">
              <code className="text-lg font-mono text-slate-800 break-all flex-1">
                {password}
              </code>
              <div className="flex gap-1">
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-slate-500 hover:text-primary-600 rounded"
                  title="Copier"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="p-2 text-slate-500 hover:text-primary-600 rounded"
                  title="Régénérer"
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
                  <span className="text-slate-500">Force du mot de passe</span>
                  <span style={{ color: strength.color }} className="font-medium">
                    {strength.label}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${entropyPool.calculateEntropy(password) / 1.2}%`,
                      backgroundColor: strength.color
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
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
                  <span className="text-sm font-medium text-slate-700">Longueur: {length}</span>
                </label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>8</span>
                  <span>64</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'uppercase', label: 'Majuscules (A-Z)' },
                  { key: 'lowercase', label: 'Minuscules (a-z)' },
                  { key: 'numbers', label: 'Chiffres (0-9)' },
                  { key: 'symbols', label: 'Symboles (!@#...)' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options[key]}
                      onChange={() => handleOptionChange(key)}
                      className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={() => handleOptionChange('excludeAmbiguous')}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">Exclure les caractères ambigus (0, O, l, 1, I)</span>
              </label>
            </div>
          ) : (
            <div className="mb-6">
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Nombre de mots: {wordCount}</span>
              </label>
              <input
                type="range"
                min="3"
                max="8"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>3 mots</span>
                <span>8 mots</span>
              </div>
            </div>
          )}

          {/* Entropy indicator */}
          <div className="bg-slate-50 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                Entropie collectée : {Math.min(entropyLevel, 100)}%
                {entropyLevel < 20 && ' - Bougez la souris pour plus d\'entropie'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSelect}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
            >
              Utiliser ce mot de passe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
