import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deriveKeys, hashForServer } from '../utils/crypto';
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
      // Dériver les clés
      const { authKey } = await deriveKeys(masterPassword, user.email);
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
    <div className="delete-account-section">
      <div className="danger-zone">
        <h2>Zone dangereuse</h2>
        <p className="warning-text">
          La suppression de votre compte est <strong>définitive et irréversible</strong>.
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-danger"
        >
          Supprimer mon compte
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ ATTENTION: Suppression définitive</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-box">
                <p><strong>Cette action va supprimer définitivement:</strong></p>
                <ul>
                  <li>Tous vos mots de passe sauvegardés</li>
                  <li>Toutes vos notes</li>
                  <li>Votre compte utilisateur</li>
                </ul>
                <p className="text-muted">
                  Compte: <strong>{user.email}</strong>
                </p>
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleDeleteAccount}>
                <div className="form-group">
                  <label htmlFor="confirm-text">
                    Tapez <strong>"SUPPRIMER"</strong> en majuscules pour confirmer:
                  </label>
                  <input
                    id="confirm-text"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="form-control"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="master-password">
                    Mot de passe maître:
                  </label>
                  <input
                    id="master-password"
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Votre mot de passe maître"
                    className="form-control"
                    disabled={loading}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || confirmText !== 'SUPPRIMER' || !masterPassword}
                    className="btn btn-danger"
                  >
                    {loading ? 'Suppression en cours...' : 'Supprimer définitivement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .delete-account-section {
          margin-top: 3rem;
        }

        .danger-zone {
          border: 2px solid #dc3545;
          border-radius: 8px;
          padding: 1.5rem;
          background: #fff5f5;
        }

        .danger-zone h2 {
          color: #dc3545;
          margin-top: 0;
        }

        .warning-text {
          color: #721c24;
          margin-bottom: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #dee2e6;
        }

        .modal-header h3 {
          margin: 0;
          color: #dc3545;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #dc3545;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .warning-box {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .warning-box ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .text-muted {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .alert {
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-control:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}
