// Riceve gli aggiornamenti del bot Telegram (impostati con setWebhook) e risponde
// al comando /start con un messaggio di benvenuto + il pulsante per aprire la Mini App.

const MINI_APP_URL = "https://kiki-tempodigioia.netlify.app/atelier-app/index.html";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const secret = event.headers["x-telegram-bot-api-secret-token"];
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let update;
  try {
    update = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 200, body: "ok" };
  }

  const message = update.message;
  if (message && typeof message.text === "string" && message.text.indexOf("/start") === 0) {
    const chatId = message.chat.id;
    const firstName = (message.from && message.from.first_name) || "";
    const text =
      "Ciao" + (firstName ? " " + firstName : "") + "! 🌻\n\n" +
      "Benvenuta nell'Atelier di Kiki: qui puoi seguire passo dopo passo la creazione della Borsa Girasole, raccogliere gomitoli e sbloccare sorprese lungo il percorso.\n\n" +
      "Quando sei pronta, apri l'Atelier qui sotto 👇";

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        reply_markup: {
          inline_keyboard: [[{ text: "Apri l'Atelier 🌻", web_app: { url: MINI_APP_URL } }]]
        }
      })
    });
  }

  return { statusCode: 200, body: "ok" };
};
