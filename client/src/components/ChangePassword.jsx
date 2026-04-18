import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deriveKeys, hashForServer, decrypt, encrypt } from '../utils/crypto';
import api from '../utils/api';

export function ChangePassword({ user, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (oldPassword === newPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // 1. Vérifier l'ancien mot de passe et dériver les anciennes clés
      setProgress(10);
      const { authKey: oldAuthKey, encKey: oldEncKey } = await deriveKeys(oldPassword, user.email);
      const oldPasswordHash = await hashForServer(oldAuthKey);

      // 2. Récupérer toutes les entrées du vault
      setProgress(20);
      const response = await api.get('/vault', {
        headers: { 'x-password-hash': oldPasswordHash }
      });
      const items = response.data;

      if (!items || items.length === 0) {
        // Aucune entrée, on peut changer directement le mot de passe
        setProgress(60);
      } else {
        // 3. Déchiffrer toutes les entrées avec l'ancien mot de passe
        setProgress(30);
        const decryptedItems = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            const decrypted = await decrypt(item.encryptedData, item.iv, oldEncKey);
            decryptedItems.push({ id: item.id, data: decrypted });
          } catch (err) {
            throw new Error(`Erreur lors du déchiffrement de l'entrée ${item.id}: ${err.message}`);
          }
          setProgress(30 + (i / items.length) * 20);
        }

        // 4. Dériver les nouvelles clés
        setProgress(50);
        const { authKey: newAuthKey, encKey: newEncKey } = await deriveKeys(newPassword, user.email);
        const newPasswordHash = await hashForServer(newAuthKey);

        // 5. Re-chiffrer toutes les entrées avec le nouveau mot de passe
        setProgress(55);
        const reencryptedItems = [];
        for (let i = 0; i < decryptedItems.length; i++) {
          const { id, data } = decryptedItems[i];
          const { encryptedData, iv } = await encrypt(data, newEncKey);
          reencryptedItems.push({ id, encryptedData, iv });
          setProgress(55 + (i / decryptedItems.length) * 30);
        }

        // 6. Envoyer les nouvelles entrées chiffrées au serveur
        setProgress(85);
        await api.put('/auth/change-password', {
          oldPasswordHash,
          newPasswordHash,
          reencryptedItems
        });
      }

      // Si pas d'entrées, juste changer le mot de passe
      if (!items || items.length === 0) {
        const { authKey: newAuthKey } = await deriveKeys(newPassword, user.email);
        const newPasswordHash = await hashForServer(newAuthKey);

        await api.put('/auth/change-password', {
          oldPasswordHash,
          newPasswordHash,
          reencryptedItems: []
        });
      }

      setProgress(100);

      // 7. Déconnecter l'utilisateur et rediriger vers login
      localStorage.clear();
      sessionStorage.clear();

      alert('Mot de passe maître changé avec succès ! Veuillez vous reconnecter avec votre nouveau mot de passe.');
      navigate('/login');

    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      if (err.response?.status === 401) {
        setError('Ancien mot de passe incorrect');
      } else {
        setError(err.response?.data?.error || err.message || 'Erreur lors du changement de mot de passe');
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-mid-navy border-2 border-lime/20 rounded-lg shadow-glow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl text-lime uppercase tracking-wider">
              [ Changer le mot de passe maître ]
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 text-grey hover:text-red-400 rounded transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Warning */}
          <div className="bg-amber-900/20 border-2 border-amber-500/30 rounded-lg p-4 mb-6">
            <p className="text-amber-200 font-mono text-sm leading-relaxed">
              <span className="text-amber-500 font-bold">⚠ ATTENTION:</span><br />
              Cette opération va re-chiffrer toutes vos entrées.<br />
              <span className="text-amber-400">Ne fermez pas cette page pendant le processus.</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border-2 border-red-500/50 text-red-300 px-4 py-3 rounded mb-6 font-mono text-sm">
              <span className="text-red-500 font-bold">ERROR:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="oldPassword" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                Ancien mot de passe maître
              </label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey disabled:opacity-50"
                placeholder="••••••••••••"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                Nouveau mot de passe maître
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey disabled:opacity-50"
                placeholder="••••••••••••"
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-grey/70 font-mono text-xs mt-2">
                <span className="text-lime">▸</span> Minimum 8 caractères
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey disabled:opacity-50"
                placeholder="••••••••••••"
                required
                disabled={loading}
              />
            </div>

            {/* Progress bar */}
            {loading && (
              <div className="bg-dark-navy border border-lime/30 rounded p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-grey font-mono">Re-chiffrement en cours...</span>
                  <span className="text-lime font-mono">{progress}%</span>
                </div>
                <div className="h-2 bg-mid-navy rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-grey/20 hover:bg-grey/30 text-grey hover:text-white border-2 border-grey/30 font-heading uppercase tracking-wider rounded transition-all disabled:opacity-50"
              >
                [ Annuler ]
              </button>
              <button
                type="submit"
                disabled={loading || !oldPassword || !newPassword || !confirmPassword}
                className="flex-1 bg-lime hover:bg-lime-dim text-dark-navy font-heading uppercase tracking-wider py-3 px-4 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(194,254,11,0.4)] hover:shadow-[0_0_25px_rgba(194,254,11,0.6)]"
              >
                {loading ? `[ ${progress}% ]` : '[ Changer le mot de passe ]'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
