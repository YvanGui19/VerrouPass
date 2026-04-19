import { useState, useEffect } from 'react';
import Header from '../components/Header';

export function CliDownload() {
  const [cliInfo, setCliInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les infos du CLI depuis l'API
    fetch('/api/cli/version')
      .then(res => res.json())
      .then(data => {
        setCliInfo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  return (
    <div className="min-h-screen bg-dark-navy">
      <Header />
      <div className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-lime tracking-wider mb-3 drop-shadow-[0_0_20px_rgba(194,254,11,0.5)]">
              VERROUPASS CLI
            </h1>
            <p className="font-mono text-cyan text-sm sm:text-base tracking-wide uppercase">
              // Interface en ligne de commande pour gérer vos mots de passe
            </p>
          </div>

        {/* Download Card */}
        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-6 sm:p-8 mb-6 shadow-glow-lg">
          <h2 className="font-heading text-3xl text-lime uppercase tracking-wider mb-6 border-b border-lime/30 pb-3 mt-0">
            [ Téléchargement ]
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center p-4 bg-dark-navy border border-cyan/20 rounded">
              <span className="font-mono text-xs text-cyan uppercase tracking-wider">Version:</span>
              <span className="font-mono text-white font-bold">{cliInfo?.version || '2.0.0'}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-dark-navy border border-cyan/20 rounded">
              <span className="font-mono text-xs text-cyan uppercase tracking-wider">Date de sortie:</span>
              <span className="font-mono text-white">{cliInfo?.releaseDate || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-dark-navy border border-cyan/20 rounded">
              <span className="font-mono text-xs text-cyan uppercase tracking-wider">Taille:</span>
              <span className="font-mono text-white">~33 KB</span>
            </div>
          </div>

          <a
            href="/downloads/verroupass-cli.zip"
            download
            className="block w-full bg-lime hover:bg-lime-dim text-dark-navy font-heading text-xl uppercase tracking-wider py-4 rounded transition-all shadow-[0_0_20px_rgba(194,254,11,0.4)] hover:shadow-[0_0_30px_rgba(194,254,11,0.6)] text-center"
          >
            [ Télécharger verroupass-cli.zip ]
          </a>

          {cliInfo?.sha256 && (
            <div className="mt-8 pt-8 border-t-2 border-cyan/20">
              <h3 className="font-heading text-xl text-cyan uppercase tracking-wider mb-4 mt-0">
                Vérification d'intégrité (SHA-256)
              </h3>
              <code className="block bg-dark-navy border-2 border-lime/30 rounded p-4 font-mono text-lime text-xs sm:text-sm break-all mb-4">
                {cliInfo.sha256}
              </code>
              <p className="font-mono text-grey text-sm mb-4">
                <span className="text-cyan">▸</span> Pour vérifier l'intégrité du fichier téléchargé:
              </p>
              <div className="space-y-3">
                <div className="bg-dark-navy border-l-4 border-cyan rounded p-4">
                  <strong className="block font-mono text-cyan text-sm uppercase mb-2">Windows (PowerShell):</strong>
                  <code className="font-mono text-white text-sm">Get-FileHash verroupass-cli.zip -Algorithm SHA256</code>
                </div>
                <div className="bg-dark-navy border-l-4 border-lime rounded p-4">
                  <strong className="block font-mono text-lime text-sm uppercase mb-2">Linux/macOS:</strong>
                  <code className="font-mono text-white text-sm">sha256sum verroupass-cli.zip</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Changelog Card */}
        {cliInfo?.changelog && cliInfo.changelog.length > 0 && (
          <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-6 sm:p-8 mb-6 shadow-glow-lg">
            <h2 className="font-heading text-3xl text-lime uppercase tracking-wider mb-6 border-b border-lime/30 pb-3 mt-0">
              [ Nouveautés v{cliInfo.version} ]
            </h2>
            <ul className="space-y-2">
              {cliInfo.changelog.map((item, index) => (
                <li key={index} className="font-mono text-grey text-sm pl-6 relative">
                  <span className="absolute left-0 text-lime font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Installation Card */}
        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-6 sm:p-8 mb-6 shadow-glow-lg">
          <h2 className="font-heading text-3xl text-lime uppercase tracking-wider mb-6 border-b border-lime/30 pb-3 mt-0">
            [ Installation ]
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-lime text-dark-navy rounded-full flex items-center justify-center font-heading text-2xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-xl text-cyan uppercase tracking-wider mb-2 mt-0">
                  Extraire le fichier ZIP
                </h3>
                <p className="font-mono text-grey text-sm">
                  Décompressez verroupass-cli.zip dans un dossier de votre choix
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-lime text-dark-navy rounded-full flex items-center justify-center font-heading text-2xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-xl text-cyan uppercase tracking-wider mb-3 mt-0">
                  Exécuter le script d'installation
                </h3>
                <div className="space-y-2">
                  <div className="bg-dark-navy border-l-4 border-cyan rounded p-3">
                    <strong className="block font-mono text-cyan text-sm uppercase mb-1">Windows:</strong>
                    <code className="font-mono text-white text-sm">install.bat</code>
                  </div>
                  <div className="bg-dark-navy border-l-4 border-lime rounded p-3">
                    <strong className="block font-mono text-lime text-sm uppercase mb-1">Linux/macOS:</strong>
                    <code className="font-mono text-white text-sm">./install.sh</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-lime text-dark-navy rounded-full flex items-center justify-center font-heading text-2xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-xl text-cyan uppercase tracking-wider mb-3 mt-0">
                  Tester l'installation
                </h3>
                <div className="bg-dark-navy border-l-4 border-lime rounded p-3">
                  <code className="font-mono text-white text-sm">v-man</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Card */}
        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-6 sm:p-8 mb-8 shadow-glow-lg">
          <h2 className="font-heading text-3xl text-lime uppercase tracking-wider mb-6 border-b border-lime/30 pb-3 mt-0">
            [ Utilisation Rapide ]
          </h2>
          <div className="space-y-3">
            <div className="bg-dark-navy border-l-4 border-cyan rounded p-3">
              <code className="font-mono text-white text-sm">v-login</code>
              <span className="font-mono text-grey text-xs ml-4 italic"># Se connecter</span>
            </div>
            <div className="bg-dark-navy border-l-4 border-lime rounded p-3">
              <code className="font-mono text-white text-sm">v-ls</code>
              <span className="font-mono text-grey text-xs ml-4 italic"># Lister vos mots de passe</span>
            </div>
            <div className="bg-dark-navy border-l-4 border-cyan rounded p-3">
              <code className="font-mono text-white text-sm">v-cat &lt;nom&gt;</code>
              <span className="font-mono text-grey text-xs ml-4 italic"># Récupérer un mot de passe</span>
            </div>
            <div className="bg-dark-navy border-l-4 border-lime rounded p-3">
              <code className="font-mono text-white text-sm">v-touch</code>
              <span className="font-mono text-grey text-xs ml-4 italic"># Ajouter un nouveau mot de passe</span>
            </div>
            <div className="bg-dark-navy border-l-4 border-cyan rounded p-3">
              <code className="font-mono text-white text-sm">v-update</code>
              <span className="font-mono text-grey text-xs ml-4 italic"># Vérifier les mises à jour</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
