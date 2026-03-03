const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const express = require("express");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");

const app = express();
app.use(express.json());
app.use(express.static("public"));

let sessions = {};
let qrStore = {};

async function createSession(number) {
    const sessionPath = path.join(__dirname, "sessions", number);

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            qrStore[number] = await QRCode.toDataURL(qr);
        }

        if (connection === "open") {
            console.log(`Connecté : ${number}`);
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) createSession(number);
        }
    });

    sessions[number] = sock;
    return sock;
}

app.post("/pair", async (req, res) => {
    const number = req.body.number;

    if (!number) return res.json({ error: "Numéro requis" });

    try {
        const sock = await createSession(number);
        const code = await sock.requestPairingCode(number);
        res.json({ code });
    } catch (err) {
        res.json({ error: "Erreur génération code" });
    }
});

app.post("/qr", async (req, res) => {
    const number = req.body.number;

    if (!number) return res.json({ error: "Numéro requis" });

    try {
        await createSession(number);
        setTimeout(() => {
            res.json({ qr: qrStore[number] || null });
        }, 4000);
    } catch (err) {
        res.json({ error: "Erreur QR" });
    }
});

app.listen(3000, () => {
    console.log("🔥 CENTRAL-HEX MULTI SESSION PRO lancé");
});
