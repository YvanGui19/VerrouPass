# VerrouPass — Security Hardening WIP

État du chantier de durcissement sécurité, à utiliser pour reprendre la session.

Domaine prod : https://verroupass.yvangui.fr (derrière Cloudflare).
VPS : Ubuntu, nginx + PostgreSQL + Node 20 via PM2 (process `verroupass`).

---

## Statut global

| # | Sujet | Statut | Commit |
|---|---|---|---|
| 1 | `trust proxy: 1` (fix rate limiting) | ✅ déployé prod | `5e988bd` |
| 2 | Headers sécurité nginx (HSTS/CSP/COOP/CORP) | ✅ déployé prod | `bd006f1` + `cc032d4` |
| 3 | Anti-énumération sur `/register` | ✅ déployé prod, validé fonctionnellement | `5e988bd` |
| 4 | 2FA TOTP au login | 📋 plan prêt, en attente | — |
| 5 | Migration PBKDF2 → Argon2id | 📋 plan prêt, en attente | — |

Décision (2026-04-27) : **attendre 48h** après le déploiement des points 1-3 pour valider stabilité, puis enchaîner sur les points 4 et 5. Phase 2 HSTS à monter pendant cette attente.

---

## Pending entre maintenant et la reprise

### Phase 2 HSTS (à faire ~24-48h après le 2026-04-27)

État actuel : `max-age=300` (5 min) dans `/etc/nginx/snippets/verroupass-security-headers.conf`.

Avant de monter à phase 2, **vérifier que tous les sous-domaines de yvangui.fr supportent HTTPS** (sinon `includeSubDomains` les rend inaccessibles aux navigateurs ayant visité verroupass) :

```bash
# Lister les sous-domaines connus via les logs CT
curl -s "https://crt.sh/?q=%25.yvangui.fr&output=json" | jq -r '.[].name_value' | sort -u

# Pour chacun : vérifier https://...
```

Si tout est HTTPS, éditer le snippet sur le VPS :

```bash
sudo nano /etc/nginx/snippets/verroupass-security-headers.conf
```

Remplacer la ligne HSTS par :
```
add_header Strict-Transport-Security "max-age=86400; includeSubDomains" always;
```

Puis :
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://verroupass.yvangui.fr/ | grep -i strict-transport
```

Phase 3 (engagement long, optionnel) au bout d'une semaine de stabilité :
```
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```
Et seulement si voulu, soumission sur https://hstspreload.org/.

Penser à mettre à jour aussi `scripts/nginx-snippets/verroupass-security-headers.conf` dans le repo et pusher.

### Suivis annexes
- **Dépendabot** : 1 vuln moderate signalée à https://github.com/YvanGui19/VerrouPass/security/dependabot/2
- **Doublons helmet/nginx** : helmet ajoute ses propres CSP/HSTS/X-Frame-Options en plus de nginx. Pas dangereux mais à nettoyer via configuration helmet (`server/src/index.js`).
- **JWT_SECRET dans `server/.env`** local : la valeur a un retour à la ligne au milieu (ligne 4-5 de `server/.env`), dotenv ne lit que la première ligne. Le secret effectif est court (100 hex = 400 bits). Pas critique mais à nettoyer.
- **Self-host des polices Google Fonts** : référencées dans `client/index.html`. La CSP les autorise pour l'instant via `https://fonts.googleapis.com` et `https://fonts.gstatic.com`. À éliminer en self-hostant les polices.
- **CLI register cassé** : `cli/src/utils/api.js:50` envoie `password` au lieu de `passwordHash`. Code probablement mort (commande absente). À supprimer ou réparer si on remet la fonctionnalité.
- **Comptes test anti-énumération** à nettoyer en DB si l'utilisateur en a créé pendant les tests.

---

## Point 4 — 2FA TOTP au login (à implémenter)

### Modèle de menace
Mitigation : vol de mot de passe maître par phishing/keylogger, réutilisation de credentials d'un autre service compromis, fuite isolée de DB.
Ne mitige PAS : compromission root du VPS (l'attaquant peut désactiver le 2FA), MITM en temps réel.

### Schéma DB

```sql
ALTER TABLE users
  ADD COLUMN totp_secret_enc TEXT,                   -- secret TOTP chiffré au repos avec TOTP_ENCRYPTION_KEY
  ADD COLUMN totp_secret_iv TEXT,                    -- IV du chiffrement
  ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN totp_recovery_codes_hashed TEXT[];      -- 10 codes de secours, hashés bcrypt, single-use
```

### Variable d'env

`server/.env` : ajouter `TOTP_ENCRYPTION_KEY` (32 bytes hex, généré par `openssl rand -hex 32`). Chiffre les secrets TOTP au repos avec AES-256-GCM.

### Endpoints à créer (`server/src/routes/auth.js` et `totp.js` nouveau)

- `POST /api/auth/totp/setup` (auth requise) → génère un secret TOTP, retourne `otpauth://...` URI + 10 codes de secours en clair (à montrer une seule fois)
- `POST /api/auth/totp/enable` (auth requise) → vérifie un code TOTP fourni avant d'activer (preuve que l'utilisateur a bien scanné le QR)
- `POST /api/auth/totp/disable` (auth requise) → exige `passwordHash` ET `totpCode` valide
- `POST /api/auth/login/totp` → 2e étape du login

### Flow login modifié

1. `POST /api/auth/login` avec `{ email, passwordHash }` :
   - si user.totp_enabled = false → comportement actuel (cookies posés)
   - si user.totp_enabled = true → renvoie `200 { totpRequired: true, challenge: <JWT court 5min, contient userId, type:'totp_pending'> }`. **Aucun cookie posé.**
2. `POST /api/auth/login/totp` avec `{ challenge, totpCode }` :
   - vérifier le JWT challenge (valide 5min, type='totp_pending')
   - décrypter `totp_secret_enc` avec `TOTP_ENCRYPTION_KEY`
   - vérifier le code TOTP avec fenêtre ±1 (`otpauth.TOTP.validate({ ... window: 1 })`)
   - si OK → poser les cookies comme un login normal
   - rate limit : 5 tentatives par challenge (sinon brute-force du code à 6 chiffres)
   - alternative : recovery code → vérifier contre `totp_recovery_codes_hashed`, marquer comme utilisé

### Frontend

- Nouvel écran `TotpChallenge.jsx` activé après login si `totpRequired`. Champ 6 chiffres + lien "utiliser un code de secours".
- Page `/settings/totp` :
  - bouton "Activer 2FA" → appelle `/totp/setup`, affiche QR code (lib `qrcode` côté client) + codes de secours
  - champ pour confirmer un code → appelle `/totp/enable`
  - bouton "Désactiver" → demande mot de passe + code, appelle `/totp/disable`

### Lib serveur
`otpauth` (npm, ~50KB pur JS) — déjà présente côté client (`client/src/utils/totp.js`). À ajouter côté serveur (`cd server && npm install otpauth`).

### Estimation : 1-2 jours

---

## Point 5 — Migration PBKDF2 → Argon2id (à implémenter)

### Pourquoi
PBKDF2-SHA256 600k itérations résiste mal aux attaques GPU/ASIC. Argon2id (memory-hard, 19 MiB par tentative) est la recommandation OWASP 2024 / RFC 9106.

### Difficulté
Web Crypto API ne supporte pas Argon2 nativement. Lib WASM : `argon2-browser` (~100KB gzipped, audit communautaire). À lazy-loader uniquement sur les pages auth pour ne pas alourdir le bundle.

### Schéma DB

```sql
ALTER TABLE users
  ADD COLUMN kdf_algorithm TEXT NOT NULL DEFAULT 'pbkdf2-sha256-600k',
  ADD COLUMN kdf_params JSONB;                       -- { m: 19456, t: 2, p: 1 } pour argon2id
```

Pour les nouveaux comptes : `argon2id` direct. Pour les existants : `pbkdf2-sha256-600k` jusqu'à migration.

### Endpoint pré-login

`POST /api/auth/kdf-info` body `{ email }` → renvoie `{ kdfAlgorithm, kdfParams }`.

⚠️ Attention à l'énumération : si email inconnu, renvoyer des paramètres par défaut (les futurs `argon2id`) pour ne pas leak l'existence — cohérent avec point 3.

Le client appelle ça avant `deriveKeys` pour savoir quel KDF utiliser.

### Flow de migration transparent au login

1. Utilisateur PBKDF2 se connecte → succès via le flow actuel
2. Le client détecte `kdfAlgorithm === 'pbkdf2-sha256-600k'` et qu'une migration est dispo
3. Le client (en arrière-plan, après login) :
   1. Re-dérive les clés avec Argon2id depuis le mot de passe maître toujours en mémoire
   2. Calcule le nouveau `passwordHash` (à partir de la nouvelle authKey)
   3. Récupère tout le coffre via `/api/vault`
   4. Déchiffre chaque entrée avec l'ancienne `encKey`, rechiffre avec la nouvelle
   5. Envoie au serveur : `POST /api/auth/migrate-kdf` avec `{ newPasswordHash, kdfAlgorithm: 'argon2id', kdfParams, reencryptedItems: [{id, encryptedData, iv}, ...] }`
4. Endpoint serveur (auth requise) : transaction PostgreSQL unique qui :
   - Vérifie l'utilisateur, hash bcrypt le nouveau passwordHash, met à jour `users.password_hash`, `kdf_algorithm`, `kdf_params`
   - Met à jour tous les `vault_items` re-chiffrés
   - Révoque les anciens refresh tokens (force re-login partout)
   - Renvoie de nouveaux cookies

### Atomicité — point critique

Si le client crashe entre les étapes 3.4 et 3.5, ou si la transaction serveur échoue, l'utilisateur peut se retrouver dans un état incohérent. Mitigations :
- Le client garde **les deux** clés en mémoire jusqu'à confirmation 200 OK de l'endpoint
- Transaction PostgreSQL stricte côté serveur : `BEGIN; ... COMMIT;`. Si l'un des UPDATE échoue, ROLLBACK et tout reste sur PBKDF2.
- Coté client : flag `migrationInProgress` dans le state, ré-essai automatique au prochain login si interrompu

### Paramètres Argon2id recommandés

OWASP 2024 :
- `m = 19456` (19 MiB)
- `t = 2`
- `p = 1`
- Salt = email (cohérent avec PBKDF2 actuel)
- HashLen = 64 bytes (donne 512 bits → split en authKey 256 + encKey 256, comme actuellement)

Si performance trop lente sur mobile bas de gamme : repli OWASP `m=12288, t=3, p=1`.

### Phase de fin

- Quelques mois après déploiement : log un warning serveur pour les comptes encore en PBKDF2.
- Eventuellement, sur changement de mot de passe maître via `/auth/change-password`, forcer la migration.

### Estimation : 2-3 jours

---

## Repères techniques utiles à la reprise

### Architecture résumée
- **Crypto client** (`client/src/utils/crypto.js`) : PBKDF2 600k → split en authKey + encKey 256 bits, AES-256-GCM avec IV aléatoire 12 bytes
- **Auth serveur** (`server/src/middleware/auth.js`, `server/src/routes/auth.js`) : bcrypt 12 rounds sur le hash transmis, JWT 15min en cookie HttpOnly, refresh token 7j en cookie HttpOnly+sameSite=strict, hashé en DB
- **Stockage** (`server/src/models/`, `server/src/db.js`) : PostgreSQL, tables `users` + `vault_items` + `refresh_tokens`, parameterized queries, scope par user_id sur toutes les routes vault

### Chemins prod
- Code app : `/var/www/verroupass/`
- nginx config : `/etc/nginx/sites-available/verroupass` (édité par Certbot, **bloc `listen 443 ssl` est où vont les `include`**)
- Snippet headers : `/etc/nginx/snippets/verroupass-security-headers.conf`
- Logs Winston : `/var/www/verroupass/server/logs/{combined,error,security}-YYYY-MM-DD.log`
- Logs PM2 : `/var/www/verroupass/logs/{out,error}.log`
- DB : PostgreSQL local, db `verroupass`, user `verroupass_user`

### Reload typique après modif code
```bash
cd /var/www/verroupass
git pull
cd server && npm install --production
cd ../client && npm install && npm run build
pm2 restart verroupass
pm2 logs verroupass --lines 30 --nostream
```

### Reload typique après modif nginx
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://verroupass.yvangui.fr/ | grep -iE "strict|content-security|frame|cross-origin"
```

### Diagnostic CSP en cas de problème
```bash
# Vérifier les CSP servies
curl -sik -H "Host: verroupass.yvangui.fr" https://localhost/api/health | grep -i "content-security"

# Vérifier que nginx n'a qu'une seule directive CSP
sudo nginx -T 2>/dev/null | grep -c "Content-Security-Policy"
```

### Cloudflare réglages requis (vérifiés OK le 2026-04-27)
- Speed → Optimization → Rocket Loader : OFF
- Scrape Shield → Email Address Obfuscation : OFF
- SSL/TLS → Edge Certificates → HSTS Cloudflare : OFF (sinon doublon)
- Speed → Optimization → Auto Minify : OFF pour JS et HTML
- SSL/TLS mode : Full (strict)

### IP réelle utilisateur dans Express
Avec Cloudflare → nginx → Node, et `trust proxy: 1` côté Express, `req.ip` contient bien l'IPv4/IPv6 réelle de l'utilisateur (pas l'IP Cloudflare). Confirmé dans les logs Winston `combined-2026-04-27.log` (IP `2a01:cb19:...` = utilisateur réel).
