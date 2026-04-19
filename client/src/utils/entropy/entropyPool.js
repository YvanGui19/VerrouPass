/**
 * Pool d'entropie généré par les changements de symboles des serpents
 * Inspiré des lampes à lave de Cloudflare
 *
 * Système autonome - peut être utilisé indépendamment
 */

class EntropyPool {
  constructor(poolSize = 256) {
    this.pool = new Uint8Array(poolSize);
    // Initialiser le pool avec des valeurs aléatoires de base
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(this.pool);
    } else {
      for (let i = 0; i < poolSize; i++) {
        this.pool[i] = Math.floor(Math.random() * 256);
      }
    }
    this.position = 0;      // Position d'écriture
    this.readPosition = 0;  // Position de lecture (avance à chaque random())
    this.totalEntropy = 0;
    this.listeners = [];
  }

  /**
   * Ajoute de l'entropie au pool
   * @param {number} index - Index du segment qui a changé
   * @param {number} symbolIndex - Index du nouveau symbole
   * @param {number} timestamp - Timestamp haute précision (performance.now())
   */
  addEntropy(index, symbolIndex, timestamp) {
    // Mixer les valeurs pour créer de l'entropie
    const microTime = (timestamp * 1000) % 256;
    const mixed = (index ^ symbolIndex ^ microTime) & 0xFF;

    // XOR avec la valeur existante pour accumuler
    this.pool[this.position] ^= mixed;
    this.position = (this.position + 1) % this.pool.length;

    // Ajouter aussi le timestamp fractionnel
    const fraction = ((timestamp % 1) * 256) | 0;
    this.pool[this.position] ^= fraction;
    this.position = (this.position + 1) % this.pool.length;

    this.totalEntropy++;

    // Notifier les listeners
    this.listeners.forEach(fn => fn(this.totalEntropy));
  }

  /**
   * Génère un nombre aléatoire entre 0 et 1
   */
  random() {
    if (this.totalEntropy < 12) {
      // Pas assez d'entropie, fallback
      return Math.random();
    }

    // Prendre 4 bytes du pool pour créer un float
    const bytes = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      const idx = (this.readPosition + i * 7) % this.pool.length;
      bytes[i] = this.pool[idx];
    }

    // Avancer la position de lecture pour le prochain appel
    this.readPosition = (this.readPosition + 4) % this.pool.length;

    // Convertir en nombre entre 0 et 1
    const view = new DataView(bytes.buffer);
    return (view.getUint32(0) >>> 0) / 0xFFFFFFFF;
  }

  /**
   * Génère un entier aléatoire entre min et max (inclus)
   */
  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Génère un hash hexadécimal du pool actuel
   */
  getHash(length = 16) {
    let hash = '';
    for (let i = 0; i < length; i++) {
      const idx = (this.readPosition + i * 3) % this.pool.length;
      hash += this.pool[idx].toString(16).padStart(2, '0');
    }
    // Avancer la position de lecture
    this.readPosition = (this.readPosition + length) % this.pool.length;
    return hash;
  }

  /**
   * Génère une couleur aléatoire
   */
  randomColor() {
    const r = this.randomInt(0, 255);
    const g = this.randomInt(0, 255);
    const b = this.randomInt(0, 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Génère un seed pour d'autres générateurs
   */
  getSeed() {
    let seed = 0;
    for (let i = 0; i < 8; i++) {
      const idx = (this.readPosition + i * 5) % this.pool.length;
      seed = (seed << 8) | this.pool[idx];
    }
    // Avancer la position de lecture
    this.readPosition = (this.readPosition + 8) % this.pool.length;
    return seed >>> 0;
  }

  /**
   * S'abonner aux mises à jour d'entropie
   */
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  /**
   * Obtenir le niveau d'entropie accumulée
   */
  getEntropyLevel() {
    return Math.min(this.totalEntropy / 100, 1); // 0 à 1
  }

  /**
   * Génère un mot de passe cryptographiquement sécurisé
   * Utilise crypto.getRandomValues() + entropie du pool comme sel
   * @param {number} length - Longueur du mot de passe
   * @param {object} options - Options de génération
   */
  generatePassword(length = 16, options = {}) {
    const {
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
      excludeAmbiguous = true, // Exclure 0, O, l, 1, I
    } = options;

    let charset = '';
    if (lowercase) charset += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    if (uppercase) charset += excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers) charset += excludeAmbiguous ? '23456789' : '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';

    // Utiliser crypto.getRandomValues pour la sécurité
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    // Mixer avec notre pool d'entropie pour le fun (n'affaiblit pas la sécurité)
    let password = '';
    for (let i = 0; i < length; i++) {
      // XOR avec le pool pour le "sel visuel" (crypto reste la source principale)
      const poolByte = this.pool[(this.position + i) % this.pool.length] || 0;
      const mixed = (randomValues[i] ^ poolByte) >>> 0; // Force unsigned
      const index = mixed % charset.length;
      password += charset.charAt(index); // charAt ne retourne jamais undefined
    }

    return password;
  }

  /**
   * Génère une passphrase (mots séparés)
   * @param {number} wordCount - Nombre de mots
   */
  generatePassphrase(wordCount = 4) {
    // Liste de mots simples (peut être étendue)
    const words = [
      'alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
      'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
      'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey',
      'xray', 'yankee', 'zulu', 'snake', 'pixel', 'cyber', 'neon', 'flux',
      'grid', 'node', 'sync', 'pulse', 'wave', 'core', 'link', 'data',
      'code', 'byte', 'hash', 'key', 'lock', 'safe', 'vault', 'shield'
    ];

    const randomValues = new Uint32Array(wordCount);
    crypto.getRandomValues(randomValues);

    const selected = [];
    for (let i = 0; i < wordCount; i++) {
      const poolByte = this.pool[(this.position + i * 3) % this.pool.length] || 0;
      const mixed = (randomValues[i] ^ poolByte) >>> 0;
      selected.push(words[mixed % words.length]);
    }

    return selected.join('-');
  }

  /**
   * Calcule l'entropie d'un mot de passe en bits
   */
  calculatePasswordEntropy(password) {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    const entropy = password.length * Math.log2(charsetSize || 1);
    return Math.round(entropy);
  }

  /**
   * Alias pour compatibilité avec l'ancienne API
   */
  calculateEntropy(password) {
    return this.calculatePasswordEntropy(password);
  }

  /**
   * Ajoute l'entropie depuis un mouvement de souris
   */
  addMouseEntropy(x, y) {
    const timestamp = performance.now();
    // Utiliser les coordonnées comme source d'entropie
    this.addEntropy(x & 0xFF, (x >> 8) & 0xFF, timestamp);
    this.addEntropy(y & 0xFF, (y >> 8) & 0xFF, timestamp + 0.1);
  }

  /**
   * Évalue la force d'un mot de passe
   */
  evaluateStrength(password) {
    const entropy = this.calculateEntropy(password);

    if (entropy >= 80) return { level: 'excellent', label: 'Excellent', color: '#22c55e' };
    if (entropy >= 60) return { level: 'strong', label: 'Fort', color: '#84cc16' };
    if (entropy >= 40) return { level: 'medium', label: 'Moyen', color: '#eab308' };
    if (entropy >= 20) return { level: 'weak', label: 'Faible', color: '#f97316' };
    return { level: 'very-weak', label: 'Très faible', color: '#ef4444' };
  }
}

// Instance globale
export const entropyPool = new EntropyPool();

export default entropyPool;
