import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function CliDownload() {
  const [cliInfo, setCli

Info] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les infos du CLI depuis l'API
    fetch('/api/cli/version')
      .then(res => res.json())
      .then(data => {
        setCli

Info(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="cli-download-page">
      <div className="cli-container">
        <h1>VerrouPass CLI</h1>
        <p className="subtitle">Interface en ligne de commande pour gérer vos mots de passe</p>

        <div className="download-card">
          <h2>Téléchargement</h2>
          <div className="download-info">
            <div className="info-row">
              <span className="label">Version:</span>
              <span className="value">{cliInfo?.version || '2.0.0'}</span>
            </div>
            <div className="info-row">
              <span className="label">Date de sortie:</span>
              <span className="value">{cliInfo?.releaseDate || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Taille:</span>
              <span className="value">~33 KB</span>
            </div>
          </div>

          <a
            href="/downloads/verroupass-cli.zip"
            download
            className="download-button"
          >
            📥 Télécharger verroupass-cli.zip
          </a>

          {cliInfo?.sha256 && (
            <div className="hash-section">
              <h3>Vérification d'intégrité (SHA-256)</h3>
              <code className="hash-code">{cliInfo.sha256}</code>
              <p className="hash-instructions">
                Pour vérifier l'intégrité du fichier téléchargé:
              </p>
              <div className="code-block">
                <strong>Windows (PowerShell):</strong>
                <code>Get-FileHash verroupass-cli.zip -Algorithm SHA256</code>
              </div>
              <div className="code-block">
                <strong>Linux/macOS:</strong>
                <code>sha256sum verroupass-cli.zip</code>
              </div>
            </div>
          )}
        </div>

        {cliInfo?.changelog && cliInfo.changelog.length > 0 && (
          <div className="changelog-card">
            <h2>Nouveautés de la version {cliInfo.version}</h2>
            <ul className="changelog-list">
              {cliInfo.changelog.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="installation-card">
          <h2>Installation</h2>
          <div className="install-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Extraire le fichier ZIP</h3>
                <p>Décompressez verroupass-cli.zip dans un dossier de votre choix</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Exécuter le script d'installation</h3>
                <div className="code-block">
                  <strong>Windows:</strong>
                  <code>install.bat</code>
                </div>
                <div className="code-block">
                  <strong>Linux/macOS:</strong>
                  <code>./install.sh</code>
                </div>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Tester l'installation</h3>
                <div className="code-block">
                  <code>vpass --version</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="usage-card">
          <h2>Utilisation rapide</h2>
          <div className="code-block">
            <code>vpass login</code>
            <span className="code-comment"># Se connecter</span>
          </div>
          <div className="code-block">
            <code>v-list</code>
            <span className="code-comment"># Lister vos mots de passe</span>
          </div>
          <div className="code-block">
            <code>v-get &lt;nom&gt;</code>
            <span className="code-comment"># Récupérer un mot de passe</span>
          </div>
          <div className="code-block">
            <code>v-add</code>
            <span className="code-comment"># Ajouter un nouveau mot de passe</span>
          </div>
          <div className="code-block">
            <code>v-update</code>
            <span className="code-comment"># Vérifier les mises à jour</span>
          </div>
        </div>

        <Link to="/vault" className="back-link">← Retour au Vault</Link>
      </div>

      <style jsx>{`
        .cli-download-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .cli-container {
          max-width: 900px;
          margin: 0 auto;
        }

        h1 {
          color: white;
          font-size: 3rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          font-size: 1.2rem;
          margin-bottom: 3rem;
        }

        .download-card,
        .changelog-card,
        .installation-card,
        .usage-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        h2 {
          color: #333;
          margin-top: 0;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #667eea;
        }

        h3 {
          color: #555;
          margin-top: 0;
          margin-bottom: 0.5rem;
        }

        .download-info {
          margin-bottom: 1.5rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e9ecef;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 600;
          color: #666;
        }

        .value {
          color: #333;
        }

        .download-button {
          display: block;
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          text-decoration: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .download-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }

        .hash-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px dashed #e9ecef;
        }

        .hash-code {
          display: block;
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          color: #e83e8c;
          word-break: break-all;
          margin: 1rem 0;
        }

        .hash-instructions {
          color: #666;
          margin: 1rem 0;
        }

        .code-block {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 6px;
          margin: 0.75rem 0;
          border-left: 3px solid #667eea;
        }

        .code-block strong {
          display: block;
          margin-bottom: 0.5rem;
          color: #667eea;
        }

        .code-block code {
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          color: #333;
        }

        .code-comment {
          color: #999;
          margin-left: 1rem;
          font-style: italic;
        }

        .changelog-list {
          list-style: none;
          padding: 0;
        }

        .changelog-list li {
          padding: 0.75rem 0;
          padding-left: 1.5rem;
          position: relative;
          color: #666;
        }

        .changelog-list li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
        }

        .install-steps {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .step {
          display: flex;
          gap: 1rem;
        }

        .step-number {
          flex-shrink: 0;
          width: 2.5rem;
          height: 2.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .step-content {
          flex: 1;
        }

        .step-content p {
          color: #666;
          margin: 0.5rem 0;
        }

        .back-link {
          display: inline-block;
          color: white;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          transition: background 0.3s;
        }

        .back-link:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: white;
          font-size: 1.2rem;
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 2rem;
          }

          .subtitle {
            font-size: 1rem;
          }

          .cli-container {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
