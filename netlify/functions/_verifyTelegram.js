// Verifica la firma di Telegram.WebApp.initData secondo l'algoritmo ufficiale:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// Senza questo controllo chiunque potrebbe chiamare le nostre funzioni
// dichiarando un telegram_user_id a piacere e leggere/modificare i gomitoli
// di un'altra persona: il token del bot (mai esposto al client) e' l'unico
// segreto che ci permette di fidarci dell'identita' dichiarata.

const crypto = require("crypto");

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60; // 24 ore

function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  botToken = botToken.trim();

  const params = new URLSearchParams(initData.trim());
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return null;

  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) return null;

  const userJson = params.get("user");
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson);
    if (!user || !user.id) return null;
    return user; // { id, first_name, last_name?, username?, ... }
  } catch (err) {
    return null;
  }
}

module.exports = { verifyTelegramInitData };
