import { DeleteAccount } from '../components/DeleteAccount';
import { useState, useEffect } from 'react';

export function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le localStorage ou API
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!user) {
    return <div className="error">Vous devez être connecté pour accéder aux paramètres.</div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Paramètres</h1>

        <section className="settings-section">
          <h2>Informations du compte</h2>
          <div className="info-group">
            <label>Email:</label>
            <p>{user.email}</p>
          </div>
          <div className="info-group">
            <label>Compte créé le:</label>
            <p>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </section>

        <section className="settings-section">
          <h2>Sécurité</h2>
          <div className="info-group">
            <label>Mot de passe maître:</label>
            <p className="text-muted">
              Votre mot de passe maître n'est jamais stocké et ne peut pas être récupéré.
              Si vous l'oubliez, vous devrez créer un nouveau compte.
            </p>
          </div>
        </section>

        <section className="settings-section">
          <h2>Données</h2>
          <div className="info-group">
            <p className="text-muted">
              Toutes vos données sont chiffrées localement avant d'être envoyées au serveur.
              Le serveur ne peut jamais déchiffrer vos mots de passe (zero-knowledge).
            </p>
          </div>
        </section>

        <hr className="section-divider" />

        <DeleteAccount user={user} />
      </div>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          background: #f5f7fa;
          padding: 2rem;
        }

        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h1 {
          color: #333;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #667eea;
        }

        .settings-section {
          margin-bottom: 2rem;
        }

        .settings-section h2 {
          color: #555;
          font-size: 1.3rem;
          margin-bottom: 1rem;
        }

        .info-group {
          margin-bottom: 1rem;
        }

        .info-group label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .info-group p {
          color: #666;
          margin: 0;
        }

        .text-muted {
          color: #999 !important;
          font-size: 0.9rem;
        }

        .section-divider {
          border: none;
          border-top: 2px solid #e9ecef;
          margin: 3rem 0;
        }

        .loading,
        .error {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .error {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
}
