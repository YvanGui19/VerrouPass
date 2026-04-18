import { useState, useEffect, useRef } from "react";
import { entropyPool } from "../../utils/entropy/entropyPool";
import { generateChaosPassword } from "../../utils/entropy/chaosCapture";
import SymbolSnake from "./SymbolSnake";

function EntropyDemo({ onClose }) {
  const snakeRef = useRef(null);

  const [poolVisualization, setPoolVisualization] = useState([]);
  const [entropyLevel, setEntropyLevel] = useState(0);
  const intervalRef = useRef(null);

  // État pour le générateur de mot de passe
  const [password, setPassword] = useState({ value: '', entropy: 0, copied: false });
  const [passOptions, setPassOptions] = useState({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  // État pour la capture chaos
  const [chaosSnapshot, setChaosSnapshot] = useState(null);
  const [chaosLoading, setChaosLoading] = useState(false);

  // Toggle pour afficher/masquer les détails techniques
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Toggle pour afficher/masquer la section "Comment ça marche"
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Fermer avec Échap (seulement si utilisé en modal)
  useEffect(() => {
    if (!onClose) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Visualiser le pool d'entropie
  useEffect(() => {
    const updateVisualization = () => {
      const viz = [];
      for (let i = 0; i < 64; i++) {
        viz.push(entropyPool.pool[i]);
      }
      setPoolVisualization(viz);
      setEntropyLevel(entropyPool.getEntropyLevel());
    };

    intervalRef.current = setInterval(updateVisualization, 100);
    return () => clearInterval(intervalRef.current);
  }, []);

  const copyPassword = async () => {
    if (password.value) {
      await navigator.clipboard.writeText(password.value);
      setPassword(prev => ({ ...prev, copied: true }));
      setTimeout(() => setPassword(prev => ({ ...prev, copied: false })), 2000);
    }
  };

  // Générer un mot de passe niveau chaos (capture + génération)
  const generateChaosPass = async () => {
    if (!snakeRef.current) return;

    setChaosLoading(true);
    try {
      const segmentRefs = snakeRef.current.getSegmentRefs();
      const result = await generateChaosPassword(segmentRefs, passOptions.length);
      setPassword({
        value: result.password,
        entropy: 256,
        copied: false,
        source: result.source
      });
      setChaosSnapshot(result.snapshot);
    } catch (error) {
      console.error('Chaos password failed:', error);
    }
    setChaosLoading(false);
  };

  return (
    <div className={`${onClose ? 'fixed inset-0 z-50' : 'h-[calc(100vh-73px)]'} bg-dark-navy flex flex-col md:flex-row`}>
      {/* Section Serpents - En haut sur mobile, à gauche sur desktop */}
      <div className="h-[30vh] md:h-full w-full md:w-[40%] relative border-b md:border-b-0 md:border-r border-lime/20 shrink-0">
        <SymbolSnake ref={snakeRef} primaryColor="#C2FE0B" />
        <div className="absolute bottom-2 md:bottom-4 left-4 right-4 text-center">
          <p className="font-mono text-lime/50 text-[10px] md:text-xs uppercase tracking-wider">
            Source de chaos visuel
          </p>
        </div>
      </div>

      {/* Section Contenu - En bas sur mobile, à droite sur desktop */}
      <div className="flex-1 h-[70vh] md:h-full w-full md:w-[60%] overflow-y-auto p-4 md:p-6">
        {/* Bouton fermer - seulement si utilisé en modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 md:top-4 md:right-4 z-10 text-lime hover:text-white transition-colors font-mono text-xl md:text-2xl"
            aria-label="Fermer"
          >
            [X]
          </button>
        )}

        <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="font-heading text-2xl md:text-4xl text-lime mb-1 md:mb-2 tracking-wider">
              CHAOS ENGINE
            </h2>
            <p className="text-grey font-mono text-xs md:text-sm uppercase tracking-widest">
              Entropie niveau Cloudflare
            </p>
          </div>

          {/* Password Generator */}
          <div className="bg-dark-navy border-2 border-lime/50 p-3 md:p-4">
            <h3 className="font-mono text-lime text-xs md:text-sm mb-3 md:mb-4 uppercase tracking-wider">
              Générateur de mot de passe
            </h3>

            {/* Options */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-3 md:mb-4">
              <div>
                <label className="font-mono text-grey text-xs block mb-1">Longueur</label>
                <input
                  type="number"
                  min="8"
                  max="64"
                  value={passOptions.length}
                  onChange={(e) => setPassOptions(prev => ({ ...prev, length: parseInt(e.target.value) || 16 }))}
                  className="w-full bg-surface border border-lime/30 text-lime font-mono px-2 py-1 text-center focus:border-lime focus:outline-none"
                />
              </div>
              {[
                { key: 'uppercase', label: 'A-Z' },
                { key: 'lowercase', label: 'a-z' },
                { key: 'numbers', label: '0-9' },
                { key: 'symbols', label: '!@#' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passOptions[key]}
                    onChange={(e) => setPassOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-lime"
                  />
                  <span className="font-mono text-grey text-sm">{label}</span>
                </label>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateChaosPass}
              disabled={chaosLoading}
              className="w-full py-3 md:py-4 bg-lime border border-lime text-dark-navy font-mono hover:bg-lime-dim hover:shadow-glow transition-all text-xs md:text-sm disabled:opacity-50 uppercase tracking-wider"
            >
              {chaosLoading ? '[ Capture... ]' : '[ GÉNÉRER ]'}
            </button>

            {/* Password Display */}
            {password.value && (
              <div className="space-y-2 mt-3">
                <div
                  onClick={copyPassword}
                  className="bg-surface border border-lime/50 p-2 md:p-3 cursor-pointer hover:border-lime hover:shadow-glow transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-lime text-sm md:text-lg break-all select-all">
                      {password.value}
                    </code>
                    <span className="font-mono text-[10px] md:text-xs text-grey group-hover:text-lime shrink-0 transition-colors">
                      {password.copied ? '✓' : 'Copier'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] md:text-xs font-mono">
                  <span className="text-lime">256 bits</span>
                  <span className="text-grey">{password.source}</span>
                </div>
              </div>
            )}
          </div>

          {/* Widget Météo - Source d'entropie atmosphérique */}
          {chaosSnapshot?.weather && (
            <div className="bg-dark-navy border border-cyan/30 p-3 md:p-4">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div>
                  <h3 className="font-mono text-cyan text-xs md:text-sm uppercase tracking-wider">
                    Données Météo
                  </h3>
                  <p className="font-mono text-cyan/70 text-[10px] md:text-xs mt-1">
                    {chaosSnapshot.gps.city}, {chaosSnapshot.gps.country}
                  </p>
                </div>
                <span className="font-mono text-cyan/50 text-[10px] md:text-xs">
                  {chaosSnapshot.weather.source}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 md:gap-3">
                {/* Température */}
                <div className="text-center bg-surface/50 p-2 md:p-3 border border-cyan/20">
                  <p className="text-lg md:text-3xl font-display text-cyan">
                    {chaosSnapshot.weather.temperature?.toFixed(1)}°
                  </p>
                  <p className="text-[8px] md:text-xs text-grey font-mono mt-1">Temp.</p>
                </div>

                {/* Humidité */}
                <div className="text-center bg-surface/50 p-2 md:p-3 border border-cyan/20">
                  <p className="text-lg md:text-3xl font-display text-cyan">
                    {chaosSnapshot.weather.humidity?.toFixed(0)}%
                  </p>
                  <p className="text-[8px] md:text-xs text-grey font-mono mt-1">Humid.</p>
                </div>

                {/* Vent */}
                <div className="text-center bg-surface/50 p-2 md:p-3 border border-cyan/20">
                  <p className="text-lg md:text-3xl font-display text-cyan">
                    {chaosSnapshot.weather.windSpeed?.toFixed(0)}
                  </p>
                  <p className="text-[8px] md:text-xs text-grey font-mono mt-1">km/h</p>
                </div>

                {/* Pression */}
                <div className="text-center bg-surface/50 p-2 md:p-3 border border-cyan/20">
                  <p className="text-lg md:text-3xl font-display text-cyan">
                    {chaosSnapshot.weather.pressure?.toFixed(0)}
                  </p>
                  <p className="text-[8px] md:text-xs text-grey font-mono mt-1">hPa</p>
                </div>
              </div>

              {/* Description météo + Nuages */}
              <div className="mt-2 md:mt-3 flex items-center justify-between text-xs md:text-sm font-mono">
                <span className="text-cyan">{chaosSnapshot.weather.weatherMain}</span>
                <span className="text-cyan/50 text-[10px] md:text-xs">Nuages: {chaosSnapshot.weather.clouds}%</span>
              </div>
            </div>
          )}

          {/* Chaos Snapshot Details */}
          {chaosSnapshot && (
            <div className="bg-dark-navy border border-lime/30 p-3 md:p-4">
              <div className="flex justify-between items-center mb-2 md:mb-3">
                <h3 className="font-mono text-lime text-xs md:text-sm uppercase tracking-wider">
                  Snapshot capturé
                </h3>
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="font-mono text-[10px] md:text-xs text-grey hover:text-lime transition-colors"
                >
                  {showTechnicalDetails ? '[ Masquer ]' : '[ Détails ]'}
                </button>
              </div>

              {/* Version simplifiée (toujours visible) */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 text-[10px] md:text-xs font-mono">
                {/* GPS */}
                <div className="bg-surface border border-lime/30 p-1.5 md:p-2">
                  <p className="text-grey mb-0.5 md:mb-1">Lieu</p>
                  <p className="text-lime truncate">
                    {showTechnicalDetails
                      ? `${chaosSnapshot.gps.lat.toFixed(2)}, ${chaosSnapshot.gps.lon.toFixed(2)}`
                      : `${chaosSnapshot.gps.city}`
                    }
                  </p>
                </div>

                {/* Segments */}
                <div className="bg-surface border border-lime/30 p-1.5 md:p-2">
                  <p className="text-grey mb-0.5 md:mb-1">Segments</p>
                  <p className="text-lime">{chaosSnapshot.segments.length}</p>
                </div>

                {/* Timing */}
                <div className="bg-surface border border-lime/30 p-1.5 md:p-2">
                  <p className="text-grey mb-0.5 md:mb-1">Capture</p>
                  <p className="text-lime">{chaosSnapshot.timing.captureDuration.toFixed(1)}ms</p>
                </div>
              </div>

              {/* Hash - version tronquée ou complète */}
              <div className="mt-2 md:mt-3 bg-surface border border-lime/30 p-1.5 md:p-2">
                <p className="text-grey text-[10px] md:text-xs mb-0.5 md:mb-1">Hash SHA-256</p>
                <p className="text-lime text-[9px] md:text-xs break-all">
                  {showTechnicalDetails
                    ? chaosSnapshot.hash
                    : `${chaosSnapshot.hash.substring(0, 12)}...${chaosSnapshot.hash.substring(56)}`
                  }
                </p>
              </div>

              <p className="text-lime/50 text-xs mt-3 font-mono">
                {chaosSnapshot.entropyBits} bits d&apos;entropie
              </p>
            </div>
          )}

          {/* Pool Visualization */}
          <div className="bg-dark-navy border border-lime/30 p-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-mono text-grey text-xs uppercase tracking-wider">Pool d&apos;entropie</h3>
              <span className="font-mono text-lime text-xs">
                {Math.round(entropyLevel * 100)}% ({entropyPool.totalEntropy} bits)
              </span>
            </div>

            {showTechnicalDetails ? (
              /* Vue détaillée : grille des 64 octets */
              <div className="grid gap-[2px] overflow-x-auto" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
                {poolVisualization.map((byte, i) => (
                  <div
                    key={i}
                    className="text-[6px] font-mono flex items-center justify-center h-4"
                    style={{
                      backgroundColor: `rgba(194, 254, 11, ${byte / 255})`,
                      color: byte > 127 ? '#0A0E1A' : '#C2FE0B',
                    }}
                  >
                    {byte.toString(16).padStart(2, '0').toUpperCase()}
                  </div>
                ))}
              </div>
            ) : (
              /* Vue simplifiée : barre de progression */
              <div className="h-3 bg-surface border border-lime/20 overflow-hidden">
                <div
                  className="h-full bg-lime/70 transition-all duration-300"
                  style={{ width: `${Math.min(entropyLevel * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* How it works - Section détaillée */}
          <div className="bg-dark-navy border border-lime/30 p-3 md:p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-lime text-xs md:text-sm uppercase tracking-wider">
                {"// Comment ça marche"}
              </h3>
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="font-mono text-[10px] md:text-xs text-grey hover:text-lime transition-colors"
              >
                {showHowItWorks ? '[ Réduire ]' : '[ + ]'}
              </button>
            </div>

            {/* Concept - toujours visible */}
            <div className="border-l-2 border-lime/30 pl-2 md:pl-3 mt-3 md:mt-4">
              <p className="text-grey text-xs md:text-sm leading-relaxed">
                <span className="text-lime">Cloudflare</span> filme des lampes à lave pour générer du hasard.
                Ce Chaos Engine capture le <span className="text-lime">chaos visuel</span> + le{' '}
                <span className="text-cyan">chaos atmosphérique</span> pour créer des mots de passe
                impossibles à reproduire.
              </p>
            </div>

            {/* Contenu détaillé - toggle */}
            {showHowItWorks && (
            <div className="space-y-3 md:space-y-5 mt-3 md:mt-5">

            {/* Données capturées par segment */}
            <div>
              <p className="font-mono text-grey text-xs uppercase tracking-wider mb-2">
                Données capturées par symbole ({chaosSnapshot?.segments.length || '~200'} symboles)
              </p>
              <div className="bg-surface/30 border border-lime/20 p-3 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-grey">Position X</span>
                  <span className="text-lime">ex: 234.7183px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Position Y</span>
                  <span className="text-lime">ex: 156.2891px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Symbole affiché</span>
                  <span className="text-lime">ex: ⊹ ▣ ⦿ ✤</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Opacité</span>
                  <span className="text-lime">ex: 0.847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Transformation CSS</span>
                  <span className="text-lime">ex: scale(0.92)</span>
                </div>
                <div className="border-t border-lime/20 pt-1 mt-2 flex justify-between text-white">
                  <span>Total par snapshot</span>
                  <span className="text-lime">{chaosSnapshot ? chaosSnapshot.segments.length * 5 : '~1000'} valeurs</span>
                </div>
              </div>
            </div>

            {/* Données météo */}
            <div>
              <p className="font-mono text-grey text-xs uppercase tracking-wider mb-2">
                Données météo capturées (API Open-Meteo)
              </p>
              <div className="bg-surface/30 border border-cyan/20 p-3 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-grey">Température</span>
                  <span className="text-cyan">{chaosSnapshot?.weather.temperature?.toFixed(4) || 'ex: 12.4521'}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Humidité</span>
                  <span className="text-cyan">{chaosSnapshot?.weather.humidity?.toFixed(2) || 'ex: 67.42'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Pression atmosphérique</span>
                  <span className="text-cyan">{chaosSnapshot?.weather.pressure?.toFixed(2) || 'ex: 1013.25'} hPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Vitesse du vent</span>
                  <span className="text-cyan">{chaosSnapshot?.weather.windSpeed?.toFixed(2) || 'ex: 15.73'} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Direction du vent</span>
                  <span className="text-cyan">{chaosSnapshot?.weather.windDeg?.toFixed(1) || 'ex: 247.3'}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Couverture nuageuse</span>
                  <span className="text-cyan">{chaosSnapshot?.weather.clouds || 'ex: 45'}%</span>
                </div>
              </div>
            </div>

            {/* Timing */}
            <div>
              <p className="font-mono text-grey text-xs uppercase tracking-wider mb-2">
                Données temporelles
              </p>
              <div className="bg-surface/30 border border-lime/20 p-3 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-grey">Timestamp Unix</span>
                  <span className="text-lime">{chaosSnapshot?.timing.timestamp || 'ex: 1709847362847'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Microtime (performance.now)</span>
                  <span className="text-lime">{chaosSnapshot?.timing.microtime?.toFixed(4) || 'ex: 48273.4821'}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Durée de capture</span>
                  <span className="text-lime">{chaosSnapshot?.timing.captureDuration?.toFixed(4) || 'ex: 2.3847'}ms</span>
                </div>
              </div>
            </div>

            {/* Processus */}
            <div>
              <p className="font-mono text-grey text-xs uppercase tracking-wider mb-2">
                Processus de génération
              </p>
              <div className="flex flex-col gap-2 text-xs font-mono">
                <div className="bg-surface/30 border border-lime/20 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lime font-bold">1.</span>
                    <span className="text-white">Capture du snapshot visuel</span>
                  </div>
                  <p className="text-grey/70 pl-5">Position, symbole, opacité et transformation de chaque segment</p>
                </div>
                <div className="bg-surface/30 border border-lime/20 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lime font-bold">2.</span>
                    <span className="text-white">Conversion en coordonnées GPS</span>
                  </div>
                  <p className="text-grey/70 pl-5">Les positions des 12 premiers segments génèrent lat/lon</p>
                </div>
                <div className="bg-surface/30 border border-cyan/20 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-cyan font-bold">3.</span>
                    <span className="text-white">Récupération météo + géolocalisation</span>
                  </div>
                  <p className="text-grey/70 pl-5">API Open-Meteo (météo) + BigDataCloud (ville/pays)</p>
                </div>
                <div className="bg-surface/30 border border-lime/20 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lime font-bold">4.</span>
                    <span className="text-white">Hash SHA-256 du snapshot complet</span>
                  </div>
                  <p className="text-grey/70 pl-5">Toutes les données → empreinte unique de 256 bits (64 hex)</p>
                </div>
                <div className="bg-surface/30 border border-lime/20 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lime font-bold">5.</span>
                    <span className="text-white">XOR avec crypto.getRandomValues()</span>
                  </div>
                  <p className="text-grey/70 pl-5">Hash combiné avec l&apos;entropie matérielle du CPU</p>
                </div>
              </div>
            </div>

            {/* Formule finale */}
            <div className="bg-surface/50 border border-white/20 p-3">
              <p className="font-mono text-white text-xs mb-2">Formule de génération :</p>
              <code className="text-lime text-xs block bg-dark-navy p-2 border border-lime/30">
                password[i] = charset[ (SHA256(snapshot)[i] XOR crypto.getRandomValues()[i]) % charset.length ]
              </code>
            </div>

            {/* Sécurité */}
            <div className="bg-surface/30 border border-lime/20 p-3">
              <p className="font-mono text-lime text-xs uppercase tracking-wider mb-2">
                Garanties de sécurité
              </p>
              <ul className="text-xs text-grey space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-lime">→</span>
                  <span>
                    <span className="text-white">Irréproductible</span> : les ~1000 valeurs capturées changent
                    à chaque milliseconde. Même vous ne pouvez pas recréer le même snapshot.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime">→</span>
                  <span>
                    <span className="text-white">Multi-sources indépendantes</span> : chaos visuel (animations) +
                    chaos atmosphérique (météo réelle) + timing CPU + entropie matérielle.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime">→</span>
                  <span>
                    <span className="text-white">Effet avalanche SHA-256</span> : 1 pixel de différence dans
                    une position = hash complètement différent (256 bits changés).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime">→</span>
                  <span>
                    <span className="text-white">Double protection</span> : même si le hash était compromis,
                    le XOR avec crypto.getRandomValues() (entropie matérielle) protège le résultat.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime">→</span>
                  <span>
                    <span className="text-white">2²⁵⁶ combinaisons</span> : plus que le nombre d&apos;atomes
                    dans l&apos;univers observable (~10⁸⁰). Impossible à bruteforcer.
                  </span>
                </li>
              </ul>
            </div>

            {/* Comparaison */}
            <div className="bg-surface/30 border border-cyan/20 p-3">
              <p className="font-mono text-cyan text-xs uppercase tracking-wider mb-2">
                Comparaison avec d&apos;autres méthodes
              </p>
              <div className="text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-grey">Math.random()</span>
                  <span className="text-red-400">Prévisible (pseudo-aléatoire)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">crypto.getRandomValues() seul</span>
                  <span className="text-yellow-400">Sécurisé mais une seule source</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Lampes à lave Cloudflare</span>
                  <span className="text-lime">Chaos physique réel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Ce Chaos Engine</span>
                  <span className="text-lime">Chaos visuel + atmosphérique + crypto</span>
                </div>
              </div>
            </div>

            {/* Note technique */}
            <div className="border-t border-lime/10 pt-3">
              <p className="text-grey/70 text-xs">
                <span className="text-lime">Note :</span> Les symboles changent via{' '}
                <code className="text-lime/80">crypto.getRandomValues()</code> toutes les ~150ms,
                alimentant continuellement le pool d&apos;entropie même sans générer de mot de passe.
              </p>
            </div>
            </div>
            )}
          </div>

          {/* Close hint - seulement si utilisé en modal */}
          {onClose && (
            <p className="text-center font-mono text-grey/50 text-xs pb-6">
              Échap pour fermer
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EntropyDemo;
