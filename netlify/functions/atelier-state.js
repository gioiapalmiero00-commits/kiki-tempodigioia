const { verifyTelegramInitData } = require("./_verifyTelegram");
const { getOrCreateUser, getIdeaVotes } = require("./_supabase");
const { rankFor, isBottegaUnlocked, IDEAS } = require("./_gameConfig");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const initData = event.headers["x-telegram-init-data"];
  const telegramUser = verifyTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN);
  if (!telegramUser) {
    return { statusCode: 401, body: JSON.stringify({ error: "Identita' Telegram non valida." }) };
  }

  try {
    const user = await getOrCreateUser(telegramUser);
    const ideaVotes = await getIdeaVotes();
    const votesById = {};
    ideaVotes.forEach((row) => {
      votesById[row.idea_id] = row.votes;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        gomitoli: user.gomitoli,
        badges: user.badges,
        libDone: user.lib_done,
        dreamSent: user.dream_sent,
        votedIdea: user.voted_idea,
        ideaProposed: user.idea_proposed,
        dailyDone: user.daily_done,
        spun: user.spun,
        rank: rankFor(user.gomitoli).name,
        bottegaUnlocked: isBottegaUnlocked(user.gomitoli),
        ideas: IDEAS.map((idea) => ({ ...idea, votes: votesById[idea.id] || 0 })),
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
