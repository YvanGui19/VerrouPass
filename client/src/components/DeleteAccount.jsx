import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hashForServer } from '../utils/crypto';
import { deriveKeysForUser } from '../utils/deriveForUser';
import api from '../utils/api';

export function DeleteAccount({ user }) {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (confirmText !== 'SUPPRIMER') {
      setError('Vous devez taper exactement "SUPPRIMER" en majuscules');
      return;
    }

    if (!masterPassword) {
      setError('Mot de passe maître requis');
      return;
    }

    setLoading(true);

    try {
      // Dériver les clés avec le KDF actuel du user.
      const { authKey } = await deriveKeysForUser(masterPassword, user.email);
      const hashedPassword = await hashForServer(authKey);

      // Appeler l'API de suppression
      await api.delete('/auth/account', {
        data: { passwordHash: hashedPassword }
      });

      // Déconnexion locale
      localStorage.clear();
      sessionStorage.clear();

      // Redirection vers page de confirmation
      navigate('/goodbye');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Danger Zone */}
      <div className="border-2 border-red-500/50 rounded-lg p-6 bg-red-900/10">
        <h2 className="font-heading text-2xl text-red-400 uppercase tracking-wider mb-3 mt-0">
          [ Zone Dangereuse ]
        </h2>
        <p className="font-mono text-red-300 text-sm mb-6 leading-relaxed">
          <span className="text-red-500 font-bold">⚠ ATTENTION:</span><br />
          La suppression de votre compte est <strong className="text-red-400">définitive et irréversible</strong>.
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white font-heading text-lg uppercase tracking-wider px-6 py-3 rounded transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
        >
          [ Supprimer mon compte ]
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-mid-navy border-2 border-red-500/50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(239,68,68,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-red-500/30">
              <h3 className="font-display text-2xl text-red-400 tracking-wider m-0">
                ⚠️ SUPPRESSION DÉFINITIVE
              </h3>
              <button
                className="text-grey hover:text-red-400 text-4xl leading-none transition-colors w-8 h-8 flex items-center justify-center"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Warning Box */}
              <div className="bg-amber-900/20 border-2 border-amber-500/30 rounded-lg p-4 mb-6">
                <p className="font-mono text-amber-200 text-sm mb-2">
                  <strong className="text-amber-400">Cette action va supprimer définitivement:</strong>
                </p>
                <ul className="font-mono text-amber-300 text-sm list-disc list-inside space-y-1 mb-4">
                  <li>Tous vos mots de passe sauvegardés</li>
                  <li>Toutes vos notes</li>
                  <li>Votre compte utilisateur</li>
                </ul>
                <p className="font-mono text-grey text-xs">
                  Compte: <strong className="text-cyan">{user.email}</strong>
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 text-red-300 px-4 py-3 rounded mb-6 font-mono text-sm">
                  <span className="text-red-500 font-bold">ERROR:</span> {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleDeleteAccount} className="space-y-6">
                <div>
                  <label htmlFor="confirm-text" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                    Tapez <strong className="text-lime">"SUPPRIMER"</strong> en majuscules pour confirmer:
                  </label>
                  <input
                    id="confirm-text"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey disabled:opacity-50"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="master-password" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                    Mot de passe maître:
                  </label>
                  <input
                    id="master-password"
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Votre mot de passe maître"
                    className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey disabled:opacity-50"
                    disabled={loading}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-grey/20 hover:bg-grey/30 text-grey hover:text-white border-2 border-grey/30 font-heading text-lg uppercase tracking-wider px-6 py-3 rounded transition-all disabled:opacity-50"
                    disabled={loading}
                  >
                    [ Annuler ]
                  </button>
                  <button
                    type="submit"
                    disabled={loading || confirmText !== 'SUPPRIMER' || !masterPassword}
                    className="bg-red-500 hover:bg-red-600 text-white font-heading text-lg uppercase tracking-wider px-6 py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
                  >
                    {loading ? '[ SUPPRESSION... ]' : '[ Supprimer définitivement ]'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
