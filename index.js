const express = require("express");
const fs = require("fs");
const path = require("path");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const P = require("pino");
const QRCode = require("qrcode");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Render persistent disk
const SESSION_BASE_PATH = path.join(__dirname, "sessions");

// créer dossier si pas existe
if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

let sessions = {};

async function startSession(number) {
    const sessionPath = path.join(SESSION_BASE_PATH, number);

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        auth: state,
        printQRInTerminal: false
    });

    sessions[number] = {
        sock,
        qr: null
    };

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            sessions[number].qr = await QRCode.toDataURL(qr);
            console.log("QR généré pour", number);
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                startSession(number);
            }
        }

        if (connection === "open") {
            console.log("Connecté :", number);
            sessions[number].qr = null;
        }
    });

    return sock;
}

app.get("/", (req, res) => {
    res.send(`
    <h2>CENTRAL HEX - Multi Session</h2>
    <form method="POST" action="/pair">
        <input name="number" placeholder="Numéro avec code pays" required/>
        <button type="submit">Générer Pair Code</button>
    </form>
    <br/>
    <form method="POST" action="/qr">
        <input name="number" placeholder="Numéro avec code pays" required/>
        <button type="submit">Afficher QR</button>
    </form>
    `);
});

app.post("/pair", async (req, res) => {
    const number = req.body.number;

    if (!number) return res.send("Numéro invalide");

    try {
        const sock = await startSession(number);

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(number);
                res.send(`<h3>Pair Code:</h3><h1>${code}</h1>`);
            } catch (err) {
                res.send("Erreur génération code");
            }
        }, 3000);
    } catch (err) {
        res.send("Erreur session");
    }
});

app.post("/qr", async (req, res) => {
    const number = req.body.number;

    if (!number) return res.send("Numéro invalide");

    await startSession(number);

    setTimeout(() => {
        const qr = sessions[number]?.qr;

        if (!qr) return res.send("QR non prêt, réessaye dans 5 secondes");

        res.send(`<img src="${qr}" width="300"/>`);
    }, 5000);
});

app.listen(PORT, () => {
    console.log("CENTRAL HEX lancé sur port", PORT);
});
