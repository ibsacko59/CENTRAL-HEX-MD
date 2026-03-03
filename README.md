# CENTRAL-HEX-MD • Session Generator

Interface web (noir & blanc) pour générer des sessions **Baileys MD** via :
- **QR Code** : `/qr`
- **Pairing Code** : `/pair` (API : `/code?number=224XXXXXXXX`)

## Liens
- Repo bot : https://github.com/ibsacko59/CENTRAL-HEX
- Support WhatsApp (Channel) : https://whatsapp.com/channel/0029VbC8YkY7oQhiOiiSpy1z
- Créateur : **ibsacko** (WhatsApp : https://wa.me/224621963059)

## Déploiement sur Render.com
1) Fork ce projet (le session generator)
2) Render → **New** → **Web Service** → connecte ton repo
3) Runtimes : **Node**
4) Build Command : `npm install`
5) Start Command : `npm start`

### Variables d'environnement (Render)
Obligatoires :
- `MEGA_EMAIL` : email du compte MEGA
- `MEGA_PASSWORD` : mot de passe MEGA

Render fournit automatiquement `PORT`.

## Multi-utilisateurs
Le serveur **ne s'éteint pas** après une session, donc plusieurs personnes peuvent générer leurs sessions depuis ton groupe.

---

© ibsacko
