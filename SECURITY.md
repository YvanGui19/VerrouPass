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

- Utiliser HTTPS avec HSTS
- Verifier l'integrite du code (SRI pour les assets)
- Utiliser un navigateur a jour
- Activer le 2FA sur le compte serveur

---

## Dependances

Le projet minimise les dependances externes pour reduire la surface d'attaque.

**Cote client :**
- React (UI)
- Web Crypto API native (chiffrement)
- Aucune lib externe pour la crypto

**Cote serveur :**
- Express.js
- bcrypt (hachage)
- jsonwebtoken (JWT)
- PostgreSQL

---

## Audit

Ce projet n'a pas ete audite par un tiers. Le code source est disponible pour inspection.

Si vous etes chercheur en securite et souhaitez auditer ce projet, contactez-moi.
