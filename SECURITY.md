# Security Policy

## Signaler une vulnerabilite

Si vous decouvrez une faille de securite, **ne creez pas d'Issue publique**.

Contactez-moi directement par email : **[votre-email@yvangui.fr]**

Je m'engage a :
- Repondre sous 48h
- Corriger les failles critiques en priorite
- Vous crediter (si vous le souhaitez) apres correction

---

## Architecture de securite

VerrouPass est un gestionnaire de mots de passe **zero-knowledge**.

### Chiffrement

| Composant | Algorithme |
|-----------|------------|
| Chiffrement des donnees | AES-256-GCM |
| Derivation de cle (comptes >= 2026-04-30) | Argon2id (libsodium, m=64 MiB, t=3, p=1, salt 16B random) |
| Derivation de cle (comptes legacy) | PBKDF2-SHA256 (600 000 iterations, salt = email) -- migres silencieusement vers Argon2id au prochain login |
| Authentification | bcrypt (12 rounds) sur le hash transmis |
| TOTP | HMAC-SHA1 (RFC 6238) |

Le KDF d'un compte est resolu via `POST /api/auth/kdf-info` (interroge avant
le login). Anti-enumeration : pour un email inconnu, le serveur renvoie les
parametres Argon2id par defaut + un salt deterministe HMAC-SHA256 (cle
serveur) pour que la reponse soit indistinguable d'un compte v2 existant et
stable entre appels.

### Flux de securite (compte Argon2id, le cas par defaut depuis 2026-04-30)

```
Mot de passe maitre
        |
        v
    GET kdfInfo --> { kdfVersion: 2, kdfParams: {m:64MiB,t:3,p:1}, kdfSalt: <16B> }
        |
        v
    Argon2id (RFC 9106, salt 16B random per-user)
        |
        +--> Cle d'authentification --> Hash --> Serveur (stocke le hash bcrypt)
        |
        +--> Cle de chiffrement --> Reste dans le navigateur (jamais transmise)
                    |
                    v
              AES-256-GCM
                    |
                    v
        Donnees chiffrees --> Serveur (stocke le blob chiffre)
```

### Ce que le serveur stocke

- Hash bcrypt du hash d'authentification
- Donnees chiffrees (blob illisible sans la cle)
- IV (vecteur d'initialisation) pour chaque entree
- Salt KDF Argon2id (16 bytes random par utilisateur, public par
  construction puisque le client doit l'obtenir pour deriver)
- Secret TOTP chiffre au repos (AES-256-GCM avec TOTP_ENCRYPTION_KEY
  cote serveur), uniquement si l'utilisateur a active le 2FA

### Ce que le serveur ne voit JAMAIS

- Mot de passe maitre
- Cle de chiffrement
- Mots de passe stockes dans le coffre
- Secrets TOTP

---

## Limites connues

| Limite | Explication |
|--------|-------------|
| Perte du mot de passe maitre | Donnees **irrecuperables** (zero-knowledge) |
| Compromission du navigateur | Un keylogger ou extension malveillante peut capturer le mot de passe maitre |
| Attaque cote client | Si le JavaScript est modifie (MITM), la securite est compromise |

### Mitigations recommandees

- Utiliser HTTPS avec HSTS (actif en prod : `max-age=86400; includeSubDomains`)
- CSP stricte cote nginx (`script-src 'self' 'wasm-unsafe-eval'`, pas de
  `unsafe-inline` script, pas de tiers exterieur autorise sur connect-src
  ni script-src) -- bloque l'injection de keylogger en cas de compromission
  d'une dependance npm
- Polices auto-hebergees (pas de connexion sortante a fonts.gstatic.com)
- Activer le 2FA TOTP sur son compte (RFC 6238, secret AES-256-GCM au repos)
- Utiliser un navigateur a jour

---

## Dependances

Le projet minimise les dependances externes pour reduire la surface d'attaque.

**Cote client :**
- React (UI)
- Web Crypto API native (PBKDF2 legacy, AES-256-GCM, hashForServer)
- libsodium-wrappers-sumo 0.7.15 (Argon2id, lazy-loade uniquement sur
  les pages auth, ~315KB gzipped). Implementation de reference de Frank
  Denis, audit Cure53. Compile en WebAssembly cote navigateur, d'ou la
  directive CSP `script-src 'self' 'wasm-unsafe-eval'`.
- @fontsource/* (polices Google Fonts repackagees pour npm, bundled
  localement par Vite : aucune connexion sortante a Google CDN)

**Cote serveur :**
- Express.js
- bcrypt (hachage)
- jsonwebtoken (JWT, HS256, secret 64 bytes hex en .env)
- helmet (avec CSP/HSTS/X-Frame-Options/COOP/CORP/Referrer-Policy
  desactives car nginx les sert deja)
- PostgreSQL (parameterized queries partout, scope par user_id sur
  toutes les routes vault)

---

## Audit

Ce projet n'a pas ete audite par un tiers. Le code source est disponible pour inspection.

Si vous etes chercheur en securite et souhaitez auditer ce projet, contactez-moi.
