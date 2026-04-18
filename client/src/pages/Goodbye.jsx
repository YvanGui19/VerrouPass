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
    <div className="min-h-screen bg-dark-navy flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-8 sm:p-12 text-center shadow-glow-lg">
          {/* Icon */}
          <div className="mb-6 animate-[scaleIn_0.5s_ease-out]">
            <div className="w-24 h-24 bg-lime/10 border-2 border-lime rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-lime tracking-wider mb-6 drop-shadow-[0_0_15px_rgba(194,254,11,0.5)]">
            [ COMPTE SUPPRIMÉ ]
          </h1>

          {/* Message */}
          <p className="font-mono text-grey text-base sm:text-lg mb-4 leading-relaxed">
            <span className="text-cyan">▸</span> Votre compte et toutes vos données ont été définitivement supprimés.
          </p>

          <p className="font-mono text-grey/70 text-sm sm:text-base mb-8">
            Merci d'avoir utilisé <span className="text-lime font-bold">VerrouPass</span>.
          </p>

          {/* Redirect Message */}
          <p className="font-mono text-cyan text-sm mb-8 italic animate-pulse">
            // Redirection automatique vers la page d'accueil...
          </p>

          {/* Button */}
          <button
            onClick={() => navigate('/')}
            className="bg-lime hover:bg-lime-dim text-dark-navy font-heading text-xl uppercase tracking-wider px-8 py-3 rounded transition-all shadow-[0_0_20px_rgba(194,254,11,0.4)] hover:shadow-[0_0_30px_rgba(194,254,11,0.6)]"
          >
            [ Retour à l'accueil ]
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
