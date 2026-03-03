const mega = require('megajs');

// IMPORTANT:
// - Do NOT hardcode MEGA credentials in code.
// - Configure them on Render as environment variables.
//   MEGA_EMAIL=...
//   MEGA_PASSWORD=...

async function upload(readStream, filename) {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password) {
    throw new Error('MEGA_EMAIL/MEGA_PASSWORD are not set');
  }

  const storage = new mega.Storage({ email, password, keepalive: true });
  await storage.ready;

  const up = storage.upload({ name: filename }, readStream);
  const file = await up.complete;

  // Returns a public link (https://mega.nz/file/...) when available
  const link = await file.link();
  return link;
}

module.exports = { upload };
