import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function Goodbye() {
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger vers la page d'accueil après 5 secondes
    const timeout = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="goodbye-page">
      <div className="goodbye-container">
        <div className="icon">✓</div>
        <h1>Compte supprimé</h1>
        <p className="message">
          Votre compte et toutes vos données ont été définitivement supprimés.
        </p>
        <p className="sub-message">
          Merci d'avoir utilisé VerrouPass.
        </p>
        <p className="redirect-message">
          Vous allez être redirigé vers la page d'accueil...
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Retour à l'accueil
        </button>
      </div>

      <style jsx>{`
        .goodbye-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .goodbye-container {
          background: white;
          border-radius: 12px;
          padding: 3rem;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .icon {
          font-size: 4rem;
          color: #28a745;
          margin-bottom: 1rem;
          animation: scaleIn 0.5s ease-out;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        h1 {
          color: #333;
          margin-bottom: 1rem;
          font-size: 2rem;
        }

        .message {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .sub-message {
          color: #999;
          margin-bottom: 2rem;
        }

        .redirect-message {
          color: #999;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .btn {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      `}</style>
    </div>
  );
}
