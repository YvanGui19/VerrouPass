import { memo, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { entropyPool } from "../../utils/entropy/entropyPool";

// Symboles Marathon
const SYMBOLS = ["⁜", "⊡", "⊹", "▣", "□", "✖", "⦿", "⦾", "✤", "×", "+", "·"];

// Configuration des serpents à 3 rangées (tête au centre, épaules en haut/bas)
const SNAKE_CONFIGS_3ROW = [
  {
    centerLength: 35,
    outerLength: 25,
    speed: 0.25,
    fontSize: 24,
    outerFontSize: 20,
    baseOpacity: 0.9,
    phaseOffset: 0,
    xOffset: 0,
    yOffset: 0,
    trail: 0.12,
    rowSpacing: 22,
    shoulderLag: 6,
  },
  {
    centerLength: 22,
    outerLength: 14,
    speed: 0.32,
    fontSize: 20,
    outerFontSize: 18,
    baseOpacity: 0.7,
    phaseOffset: 2.5,
    xOffset: 0.1,
    yOffset: 0.1,
    trail: 0.1,
    rowSpacing: 18,
    shoulderLag: 4,
  },
  {
    centerLength: 14,
    outerLength: 8,
    speed: 0.45,
    fontSize: 18,
    outerFontSize: 16,
    baseOpacity: 0.5,
    phaseOffset: 4.5,
    xOffset: -0.15,
    yOffset: -0.12,
    trail: 0.08,
    rowSpacing: 14,
    shoulderLag: 3,
  },
];

// Configuration des serpents à 1 ligne
const SNAKE_CONFIGS_1ROW = [
  {
    length: 18,
    speed: 0.55,
    fontSize: 16,
    baseOpacity: 0.4,
    phaseOffset: 1.2,
    xOffset: -0.2,
    yOffset: -0.25,
    trail: 0.06,
  },
  {
    length: 25,
    speed: 0.2,
    fontSize: 18,
    baseOpacity: 0.35,
    phaseOffset: 3.8,
    xOffset: 0.15,
    yOffset: 0.2,
    trail: 0.09,
  },
  {
    length: 12,
    speed: 0.7,
    fontSize: 14,
    baseOpacity: 0.3,
    phaseOffset: 5.5,
    xOffset: -0.08,
    yOffset: 0.08,
    trail: 0.05,
  },
];

// Calculer le nombre total de segments
const TOTAL_3ROW = SNAKE_CONFIGS_3ROW.reduce(
  (sum, c) => sum + c.centerLength + c.outerLength * 2,
  0
);
const TOTAL_1ROW = SNAKE_CONFIGS_1ROW.reduce((sum, c) => sum + c.length, 0);
const TOTAL_SEGMENTS = TOTAL_3ROW + TOTAL_1ROW;

const SymbolSnake = forwardRef(function SymbolSnake({ className = "", primaryColor = "#C2FE0B" }, ref) {
  const containerRef = useRef(null);
  const segmentRefs = useRef([]);
  const animationRef = useRef(null);
  const lastSymbolChange = useRef(0);

  // Exposer les segmentRefs pour la capture d'entropie
  useImperativeHandle(ref, () => ({
    getSegmentRefs: () => segmentRefs.current,
    getSegmentCount: () => segmentRefs.current.length
  }), []);

  // Pré-générer tous les symboles et métadonnées des segments
  const segmentsData = useMemo(() => {
    const data = [];

    // Serpents à 3 rangées
    SNAKE_CONFIGS_3ROW.forEach((config, snakeIdx) => {
      const shoulderFadeIn = Math.ceil(config.outerLength * 0.3);

      // Rangée centrale
      for (let i = 0; i < config.centerLength; i++) {
        data.push({
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          snakeIdx,
          rowType: "center",
          index: i,
          config,
          fontSize: config.fontSize,
          timeLag: 0,
          fadeInCount: 0,
          opacityMult: 1,
          yOffsetPx: 0,
        });
      }
      // Rangée haute
      for (let i = 0; i < config.outerLength; i++) {
        data.push({
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          snakeIdx,
          rowType: "top",
          index: i,
          config,
          fontSize: config.outerFontSize,
          timeLag: config.shoulderLag,
          fadeInCount: shoulderFadeIn,
          opacityMult: 0.7,
          yOffsetPx: -config.rowSpacing,
        });
      }
      // Rangée basse
      for (let i = 0; i < config.outerLength; i++) {
        data.push({
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          snakeIdx,
          rowType: "bottom",
          index: i,
          config,
          fontSize: config.outerFontSize,
          timeLag: config.shoulderLag,
          fadeInCount: shoulderFadeIn,
          opacityMult: 0.7,
          yOffsetPx: config.rowSpacing,
        });
      }
    });

    // Serpents à 1 ligne
    SNAKE_CONFIGS_1ROW.forEach((config, snakeIdx) => {
      for (let i = 0; i < config.length; i++) {
        data.push({
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          snakeIdx: snakeIdx + SNAKE_CONFIGS_3ROW.length,
          rowType: "single",
          index: i,
          config,
          fontSize: config.fontSize,
          length: config.length,
        });
      }
    });

    return data;
  }, []);

  // Animation avec manipulation directe du DOM
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    let startTime = Date.now();
    let frameCount = 0;

    const animate = () => {
      frameCount++;
      // Mise à jour toutes les 2 frames
      if (frameCount % 2 !== 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const rect = container.getBoundingClientRect();
      const totalWidth = rect.width;
      const height = rect.height;

      // Zone: espace utilisable avec marges de sécurité
      const margin = 30;
      const zoneLeft = margin;
      const zoneRight = totalWidth - margin;
      const zoneWidth = zoneRight - zoneLeft;
      const zoneCenterX = totalWidth / 2;

      const zoneTop = margin;
      const zoneBottom = height - 50;
      const zoneHeight = zoneBottom - zoneTop;
      const zoneCenterY = zoneTop + zoneHeight / 2;

      // Mettre à jour chaque segment directement
      segmentsData.forEach((seg, idx) => {
        const el = segmentRefs.current[idx];
        if (!el) return;

        const { config, index, rowType } = seg;
        let x, y, opacity, glow, scale;

        if (rowType === "single") {
          // Serpent à 1 ligne
          const sizeMultiplier = 0.6 + (config.length / 25) * 0.4;
          const xAmplitude = (zoneWidth / 2 - 25) * sizeMultiplier;
          const yAmplitude = (zoneHeight / 2 - 25) * sizeMultiplier;

          const segmentTime = elapsed - index * config.trail;
          const t = segmentTime * config.speed + config.phaseOffset;

          // Calculer position avec offset
          const offsetX = config.xOffset * zoneWidth * 0.15;
          const offsetY = config.yOffset * zoneHeight * 0.15;
          x = zoneCenterX + offsetX + Math.sin(t) * xAmplitude;
          y = zoneCenterY + offsetY + Math.sin(t * 2) * yAmplitude;

          // Limiter aux bords
          x = Math.max(zoneLeft + 15, Math.min(zoneRight - 15, x));
          y = Math.max(zoneTop + 15, Math.min(zoneBottom - 15, y));

          const distFromHead = index / config.length;
          opacity = config.baseOpacity * (1 - distFromHead * 0.8);
          glow = (Math.sin(segmentTime * 1.8 - index * 0.15) + 1) * 4 + 2;
          scale = 1 - distFromHead * 0.5;
        } else {
          // Serpent à 3 rangées
          const sizeMultiplier = 0.55 + (config.centerLength / 35) * 0.45;
          const xAmplitude = (zoneWidth / 2 - 30) * sizeMultiplier;
          const yAmplitude = (zoneHeight / 2 - 40) * sizeMultiplier;

          const length = rowType === "center" ? config.centerLength : config.outerLength;
          const segmentTime = elapsed - (index + seg.timeLag) * config.trail;
          const t = segmentTime * config.speed + config.phaseOffset;

          // Calculer position avec offset
          const offsetX = config.xOffset * zoneWidth * 0.2;
          const offsetY = config.yOffset * zoneHeight * 0.2;
          x = zoneCenterX + offsetX + Math.sin(t) * xAmplitude;
          const baseY = zoneCenterY + offsetY + Math.sin(t * 2) * yAmplitude;
          y = baseY + seg.yOffsetPx;

          // Limiter aux bords
          x = Math.max(zoneLeft + 15, Math.min(zoneRight - 15, x));
          y = Math.max(zoneTop + 15, Math.min(zoneBottom - 15, y));

          const distFromHead = index / length;
          opacity = config.baseOpacity * seg.opacityMult * (1 - distFromHead * 0.7);

          // Fade-in pour les épaules
          if (seg.fadeInCount > 0 && index < seg.fadeInCount) {
            const fadeProgress = index / seg.fadeInCount;
            opacity *= fadeProgress * fadeProgress;
          }

          const glowMult = seg.fadeInCount > 0 && index < seg.fadeInCount ? index / seg.fadeInCount : 1;
          glow = ((Math.sin(segmentTime * 1.5 - index * 0.2) + 1) * 6 + 3) * glowMult;
          scale = (1 - distFromHead * 0.4) * (seg.opacityMult === 1 ? 1 : 0.85);
        }

        // Appliquer les styles directement
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.opacity = opacity;
        el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        el.style.textShadow = `0 0 ${glow}px ${primaryColor}cc`;
      });

      // Changer quelques symboles aléatoirement (~toutes les 150ms)
      if (elapsed - lastSymbolChange.current > 0.15) {
        lastSymbolChange.current = elapsed;
        const timestamp = performance.now();

        // Utiliser crypto.getRandomValues() pour une vraie entropie
        const randomBytes = new Uint8Array(16);
        crypto.getRandomValues(randomBytes);

        // Changer 3-5 symboles (déterminé cryptographiquement)
        const numChanges = 3 + (randomBytes[0] % 3);
        for (let i = 0; i < numChanges; i++) {
          const idx = randomBytes[i * 2 + 1] % segmentsData.length;
          const symbolIdx = randomBytes[i * 2 + 2] % SYMBOLS.length;
          const el = segmentRefs.current[idx];
          if (el) {
            el.textContent = SYMBOLS[symbolIdx];
            // Alimenter le pool d'entropie avec des valeurs crypto
            entropyPool.addEntropy(idx, symbolIdx, timestamp + randomBytes[i + 8]);
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [segmentsData, primaryColor]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {segmentsData.map((seg, idx) => (
        <span
          key={idx}
          ref={(el) => (segmentRefs.current[idx] = el)}
          className="absolute font-mono select-none"
          style={{
            fontSize: seg.fontSize,
            color: primaryColor,
            willChange: "transform, opacity, left, top",
          }}
        >
          {seg.symbol}
        </span>
      ))}
    </div>
  );
});

export default memo(SymbolSnake);
export { SYMBOLS, TOTAL_SEGMENTS };
