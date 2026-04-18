import { DeleteAccount } from '../components/DeleteAccount';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';

export function Settings() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-navy">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-73px)]">
          <div className="inline-block animate-pulse">
            <p className="font-mono text-cyan text-lg">[ CHARGEMENT... ]</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-navy">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-73px)]">
          <div className="bg-red-900/30 border-2 border-red-500/50 text-red-300 px-6 py-4 rounded font-mono text-sm">
            <span className="text-red-500 font-bold">ERROR:</span> Vous devez être connecté pour accéder aux paramètres.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-navy">
      <Header />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-lime tracking-wider drop-shadow-[0_0_15px_rgba(194,254,11,0.5)] m-0">
              [ PARAMÈTRES ]
            </h1>
          </div>

        {/* Main container */}
        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-6 sm:p-8 shadow-glow-lg">

          {/* Informations du compte */}
          <section className="mb-8">
            <h2 className="font-heading text-2xl text-lime uppercase tracking-wider mb-4 border-b border-lime/30 pb-2">
              Informations du compte
            </h2>
            <div className="space-y-4">
              <div className="bg-dark-navy border border-cyan/20 rounded p-4">
                <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                  Email:
                </label>
                <p className="font-mono text-white text-sm break-all">{user.email}</p>
              </div>
              <div className="bg-dark-navy border border-cyan/20 rounded p-4">
                <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                  Compte créé le:
                </label>
                <p className="font-mono text-white text-sm">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </section>

          {/* Sécurité */}
          <section className="mb-8">
            <h2 className="font-heading text-2xl text-lime uppercase tracking-wider mb-4 border-b border-lime/30 pb-2">
              Sécurité
            </h2>
            <div className="bg-dark-navy border border-cyan/20 rounded p-4">
              <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-3">
                Mot de passe maître:
              </label>
              <p className="font-mono text-grey text-sm leading-relaxed">
                <span className="text-lime">▸</span> Votre mot de passe maître n'est jamais stocké et ne peut pas être récupéré.<br />
                <span className="text-cyan">▸</span> Si vous l'oubliez, vous devrez créer un nouveau compte.
              </p>
            </div>
          </section>

          {/* Données */}
          <section className="mb-8">
            <h2 className="font-heading text-2xl text-lime uppercase tracking-wider mb-4 border-b border-lime/30 pb-2">
              Chiffrement des données
            </h2>
            <div className="bg-dark-navy border border-cyan/20 rounded p-4">
              <p className="font-mono text-grey text-sm leading-relaxed">
                <span className="text-lime">▸</span> Toutes vos données sont chiffrées localement avant d'être envoyées au serveur.<br />
                <span className="text-cyan">▸</span> Chiffrement AES-256 avec PBKDF2 (600,000 itérations).<br />
                <span className="text-lime">▸</span> Le serveur ne peut jamais déchiffrer vos mots de passe (zero-knowledge).
              </p>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t-2 border-red-500/20 my-8"></div>

          {/* Delete Account */}
          <DeleteAccount user={user} />
        </div>
      </div>
    </div>
    </div>
  );
}
