# Security Policy

## Signaler une vulnérabilité

Si vous découvrez une faille de sécurité, **ne créez pas d'Issue publique**.

Contactez-moi directement par email : **[votre-email@yvangui.fr]**

Je m'engage à :
- Répondre sous 48h
- Corriger les failles critiques en priorité
- Vous créditer (si vous le souhaitez) après correction

---

## Architecture de sécurité

VerrouPass est un gestionnaire de mots de passe **zero-knowledge**.

### Chiffrement

| Composant | Algorithme |
|-----------|------------|
| Chiffrement des données | AES-256-GCM |
| Dérivation de clé (comptes >= 2026-04-30) | Argon2id (libsodium, m=64 MiB, t=3, p=1, salt 16B random) |
| Dérivation de clé (comptes legacy) | PBKDF2-SHA256 (600 000 itérations, salt = email) — migrés silencieusement vers Argon2id au prochain login |
| Authentification | bcrypt (12 rounds) sur le hash transmis |
| TOTP | HMAC-SHA1 (RFC 6238) |

Le KDF d'un compte est résolu via `POST /api/auth/kdf-info` (interrogé avant
le login). Anti-énumération : pour un email inconnu, le serveur renvoie les
paramètres Argon2id par défaut + un salt déterministe HMAC-SHA256 (clé
serveur) pour que la réponse soit indistinguable d'un compte v2 existant et
stable entre appels.

### Flux de sécurité (compte Argon2id, le cas par défaut depuis 2026-04-30)

```
Mot de passe maître
        |
        v
    GET kdfInfo --> { kdfVersion: 2, kdfParams: {m:64MiB,t:3,p:1}, kdfSalt: <16B> }
        |
        v
    Argon2id (RFC 9106, salt 16B random per-user)
        |
        +--> Clé d'authentification --> Hash --> Serveur (stocke le hash bcrypt)
        |
        +--> Clé de chiffrement --> Reste dans le navigateur (jamais transmise)
                    |
                    v
              AES-256-GCM
                    |
                    v
        Données chiffrées --> Serveur (stocke le blob chiffré)
```

### Ce que le serveur stocke

- Hash bcrypt du hash d'authentification
- Données chiffrées (blob illisible sans la clé)
- IV (vecteur d'initialisation) pour chaque entrée
- Salt KDF Argon2id (16 bytes random par utilisateur, public par
  construction puisque le client doit l'obtenir pour dériver)
- Secret TOTP chiffré au repos (AES-256-GCM avec TOTP_ENCRYPTION_KEY
  côté serveur), uniquement si l'utilisateur a activé le 2FA

### Ce que le serveur ne voit JAMAIS

- Mot de passe maître
- Clé de chiffrement
- Mots de passe stockés dans le coffre
- Secrets TOTP

---

## Limites connues

| Limite | Explication |
|--------|-------------|
| Perte du mot de passe maître | Données **irrécupérables** (zero-knowledge) |
| Compromission du navigateur | Un keylogger ou extension malveillante peut capturer le mot de passe maître |
| Attaque côté client | Si le JavaScript est modifié (MITM), la sécurité est compromise |

### Mitigations recommandées

- Utiliser HTTPS avec HSTS (actif en prod : `max-age=86400; includeSubDomains`)
- CSP stricte côté nginx (`script-src 'self' 'wasm-unsafe-eval'`, pas de
  `unsafe-inline` script, pas de tiers extérieur autorisé sur connect-src
  ni script-src) — bloque l'injection de keylogger en cas de compromission
  d'une dépendance npm
- Polices auto-hébergées (pas de connexion sortante à fonts.gstatic.com)
- Activer le 2FA TOTP sur son compte (RFC 6238, secret AES-256-GCM au repos)
- Utiliser un navigateur à jour

---

## Dépendances

Le projet minimise les dépendances externes pour réduire la surface d'attaque.

**Côté client :**
- React (UI)
- Web Crypto API native (PBKDF2 legacy, AES-256-GCM, hashForServer)
- libsodium-wrappers-sumo 0.7.15 (Argon2id, lazy-loadé uniquement sur
  les pages auth, ~315 KB gzipped). Implémentation de référence de Frank
  Denis, audit Cure53. Compilé en WebAssembly côté navigateur, d'où la
  directive CSP `script-src 'self' 'wasm-unsafe-eval'`.
- @fontsource/* (polices Google Fonts repackagées pour npm, bundled
  localement par Vite : aucune connexion sortante à Google CDN)

**Côté serveur :**
- Express.js
- bcrypt (hachage)
- jsonwebtoken (JWT, HS256, secret 64 bytes hex en .env)
- helmet (avec CSP/HSTS/X-Frame-Options/COOP/CORP/Referrer-Policy
  désactivés car nginx les sert déjà)
- PostgreSQL (parameterized queries partout, scope par user_id sur
  toutes les routes vault)

---

## Audit

Ce projet n'a pas été audité par un tiers. Le code source est disponible pour inspection.

Si vous êtes chercheur en sécurité et souhaitez auditer ce projet, contactez-moi.
