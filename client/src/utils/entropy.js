/**
 * Module d'entropie simplifié pour le générateur de mots de passe
 * Basé sur le Chaos Engine de entropy-system
 *
 * Utilise crypto.getRandomValues() comme source principale
 * Enrichi avec des données de timing et de mouvement de souris
 */

class EntropyPool {
  constructor(poolSize = 256) {
    this.pool = new Uint8Array(poolSize);
    // Initialiser avec crypto.getRandomValues
    crypto.getRandomValues(this.pool);
    this.position = 0;
    this.totalEntropy = 0;
  }

  /**
   * Ajoute de l'entropie au pool
   */
  addEntropy(data) {
    const bytes = typeof data === 'number' ? [data] : data;
    bytes.forEach((byte) => {
      const microTime = (performance.now() * 1000) % 256;
      this.pool[this.position] ^= (byte ^ microTime) & 0xFF;
      this.position = (this.position + 1) % this.pool.length;
      this.totalEntropy++;
    });
  }

  /**
   * Ajoute l'entropie depuis un mouvement de souris
   */
  addMouseEntropy(x, y) {
    const bytes = [
      x & 0xFF,
      (x >> 8) & 0xFF,
      y & 0xFF,
      (y >> 8) & 0xFF,
      (performance.now() * 100) & 0xFF
    ];
    this.addEntropy(bytes);
  }

  /**
   * Génère un mot de passe sécurisé
   * @param {number} length - Longueur du mot de passe
   * @param {object} options - Options de génération
   */
  generatePassword(length = 16, options = {}) {
    const {
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
      excludeAmbiguous = true
    } = options;

    let charset = '';
    if (lowercase) charset += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    if (uppercase) charset += excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers) charset += excludeAmbiguous ? '23456789' : '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';

    // Source cryptographique principale
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    let password = '';
    for (let i = 0; i < length; i++) {
      // XOR avec le pool d'entropie locale
      const poolByte = this.pool[(this.position + i) % this.pool.length];
      const mixed = (randomValues[i] ^ poolByte) >>> 0;
      password += charset.charAt(mixed % charset.length);
    }

    return password;
  }

  /**
   * Génère une passphrase
   * @param {number} wordCount - Nombre de mots
   */
  generatePassphrase(wordCount = 4) {
    const words = [
      'alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
      'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
      'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey',
      'xray', 'yankee', 'zulu', 'snake', 'pixel', 'cyber', 'neon', 'flux',
      'grid', 'node', 'sync', 'pulse', 'wave', 'core', 'link', 'data',
      'code', 'byte', 'hash', 'key', 'lock', 'safe', 'vault', 'shield',
      'storm', 'spark', 'drift', 'blaze', 'frost', 'ember', 'shade', 'prime'
    ];

    const randomValues = new Uint32Array(wordCount);
    crypto.getRandomValues(randomValues);

    const selected = [];
    for (let i = 0; i < wordCount; i++) {
      const poolByte = this.pool[(this.position + i * 3) % this.pool.length];
      const mixed = (randomValues[i] ^ poolByte) >>> 0;
      selected.push(words[mixed % words.length]);
    }

    return selected.join('-');
  }

  /**
   * Calcule l'entropie d'un mot de passe en bits
   */
  calculateEntropy(password) {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    return Math.round(password.length * Math.log2(charsetSize || 1));
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
