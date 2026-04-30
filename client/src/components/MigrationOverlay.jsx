import { useAuth } from '../hooks/useAuth';

// Overlay plein écran affiché pendant la migration silencieuse PBKDF2 -> Argon2id.
// Bloque l'UI le temps que la dérivation Argon2id (~1-2s) + re-encryption +
// transaction serveur se terminent. Sans ce feedback, l'utilisateur pourrait
// croire que le login a planté.
export default function MigrationOverlay() {
  const { migrating } = useAuth();

  if (!migrating) return null;

  return (
    <div
      className="fixed inset-0 bg-dark-navy/95 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-mid-navy border-2 border-lime/40 rounded-lg shadow-glow-lg max-w-lg w-full p-8">
        <h2 className="font-heading text-xl sm:text-2xl text-lime uppercase tracking-wider mb-4 border-b border-lime/30 pb-2">
          Mise à jour du chiffrement
        </h2>
        <div className="flex items-start gap-3 mb-4">
          <span className="inline-block w-3 h-3 rounded-full bg-lime animate-pulse mt-1.5 flex-shrink-0" />
          <p className="font-mono text-sm text-grey leading-relaxed">
            Migration de votre coffre vers <span className="text-lime">Argon2id</span> (RFC 9106, 64 MiB).
            <br />
            Vos données sont re-chiffrées localement.
          </p>
        </div>
        <p className="font-mono text-xs text-grey/70 leading-relaxed">
          <span className="text-cyan">▸</span> Cette opération ne se produit qu'une fois.
          <br />
          <span className="text-cyan">▸</span> Ne fermez pas cette page.
        </p>
      </div>
    </div>
  );
}
