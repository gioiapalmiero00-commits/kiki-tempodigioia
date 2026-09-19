const { verifyTelegramInitData } = require("./_verifyTelegram");
const { getOrCreateUser, saveUser, getIdeaVotes, incrementIdeaVote } = require("./_supabase");
const { STAGES_COUNT, IDEAS, REWARDS, rankFor, isBottegaUnlocked, todayKey, spinReward } = require("./_gameConfig");

// Stesso canale di idee.html e delle vecchie schermate dell'Atelier:
// sostituire FORM_ID_IDEE_DA_SOSTITUIRE con un unico Form ID reale ovunque
// compare (idee.html, questo file) per ricevere davvero le idee.
const IDEA_FORM_ACTION = "https://formspree.io/f/FORM_ID_IDEE_DA_SOSTITUIRE";

async function sendIdeaToFormspree(text, fonte) {
  if (IDEA_FORM_ACTION.indexOf("FORM_ID_IDEE_DA_SOSTITUIRE") !== -1) return;
  try {
    await fetch(IDEA_FORM_ACTION, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ idea: text, fonte }),
    });
  } catch (err) {
    // invio non riuscito: i gomitoli restano comunque assegnati
  }
}

function addGomitoli(user, amount, badgeName) {
  const badges = Array.isArray(user.badges) ? [...user.badges] : [];
  if (badgeName && !badges.includes(badgeName)) badges.push(badgeName);
  return { gomitoli: user.gomitoli + amount, badges };
}

async function toResponseBody(user) {
  const ideaVotes = await getIdeaVotes();
  const votesById = {};
  ideaVotes.forEach((row) => {
    votesById[row.idea_id] = row.votes;
  });
  return {
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
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const initData = event.headers["x-telegram-init-data"];
  const telegramUser = verifyTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN);
  if (!telegramUser) {
    return { statusCode: 401, body: JSON.stringify({ error: "Identita' Telegram non valida." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Corpo della richiesta non valido." }) };
  }

  const { action } = payload;

  try {
    const user = await getOrCreateUser(telegramUser);
    let patch = null;
    let lastSpinReward = null;

    switch (action) {
      case "complete-stage": {
        const stageIndex = Number(payload.stageIndex);
        const libDone = Array.isArray(user.lib_done) ? user.lib_done : [];
        const alreadyDone = libDone.includes(stageIndex);
        const isValid = Number.isInteger(stageIndex) && stageIndex >= 0 && stageIndex < STAGES_COUNT;
        const isUnlocked = stageIndex === 0 || libDone.includes(stageIndex - 1);

        if (!isValid || !isUnlocked) {
          return { statusCode: 400, body: JSON.stringify({ error: "Tappa non valida o ancora bloccata." }) };
        }
        if (!alreadyDone) {
          const reward = addGomitoli(user, REWARDS.STAGE_COMPLETE, "Prima Trama");
          patch = { ...reward, lib_done: [...libDone, stageIndex] };
        }
        break;
      }

      case "dream-submit": {
        const text = String(payload.text || "").trim();
        if (!text) return { statusCode: 400, body: JSON.stringify({ error: "Il messaggio e' vuoto." }) };
        if (!user.dream_sent) {
          await sendIdeaToFormspree(text, "Capanna dei Sogni (Atelier)");
          const reward = addGomitoli(user, REWARDS.DREAM_SENT, "Cuore Aperto");
          patch = { ...reward, dream_sent: true };
        }
        break;
      }

      case "vote-idea": {
        const ideaId = Number(payload.ideaId);
        const isValidIdea = IDEAS.some((idea) => idea.id === ideaId);
        if (!isValidIdea) return { statusCode: 400, body: JSON.stringify({ error: "Idea non valida." }) };
        if (user.voted_idea !== null && user.voted_idea !== undefined) {
          return { statusCode: 409, body: JSON.stringify({ error: "Hai gia' votato." }) };
        }
        await incrementIdeaVote(ideaId);
        const reward = addGomitoli(user, REWARDS.VOTE_IDEA, "Voce della Community");
        patch = { ...reward, voted_idea: ideaId };
        break;
      }

      case "propose-idea": {
        const text = String(payload.text || "").trim();
        if (!text) return { statusCode: 400, body: JSON.stringify({ error: "Il messaggio e' vuoto." }) };
        if (!user.idea_proposed) {
          await sendIdeaToFormspree(text, "Sfida del Prossimo Pattern (Atelier)");
          const reward = addGomitoli(user, REWARDS.PROPOSE_IDEA, "Idea Proposta");
          patch = { ...reward, idea_proposed: true };
        }
        break;
      }

      case "daily-task": {
        if (user.daily_done !== todayKey()) {
          const reward = addGomitoli(user, REWARDS.DAILY_TASK, null);
          patch = { ...reward, daily_done: todayKey() };
        }
        break;
      }

      case "spin-wheel": {
        if (user.spun === todayKey()) {
          return { statusCode: 409, body: JSON.stringify({ error: "Hai gia' girato la ruota oggi." }) };
        }
        const reward = spinReward();
        const rewardPatch = addGomitoli(user, reward, null);
        patch = { ...rewardPatch, spun: todayKey() };
        lastSpinReward = reward;
        break;
      }

      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Azione sconosciuta." }) };
    }

    const updatedUser = patch ? await saveUser(telegramUser.id, patch) : user;
    const body = await toResponseBody(updatedUser);
    if (lastSpinReward !== null) body.lastSpinReward = lastSpinReward;

    return { statusCode: 200, body: JSON.stringify(body) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
