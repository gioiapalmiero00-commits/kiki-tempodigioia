// Regole di gioco dell'Atelier: stessi valori gia' usati in assets/js/minigioco.js,
// ma applicati qui lato server cosi' un utente non puo' assegnarsi gomitoli a piacere
// modificando le chiamate dal browser.

const STAGES_COUNT = 5;

const RANKS = [
  { min: 0, name: "Apprendista del Filo" },
  { min: 40, name: "Amica dell'Uncinetto" },
  { min: 100, name: "Mano Esperta" },
  { min: 200, name: "Designer in Erba" },
];

const IDEAS = [
  { id: 0, author: "Marta", text: "Un gilet corto da abbinare a tutto, per la mezza stagione." },
  { id: 1, author: "Elisa", text: "Una borsa a rete per la spiaggia, veloce da fare in un weekend." },
  { id: 2, author: "Noemi", text: "Calzini fatti ai ferri per chi non li ha mai provati." },
  { id: 3, author: "Vale", text: "Un top estivo in cotone, taglia unica regolabile." },
];

const REWARDS = {
  STAGE_COMPLETE: 15,
  DREAM_SENT: 20,
  VOTE_IDEA: 5,
  PROPOSE_IDEA: 10,
  DAILY_TASK: 10,
  WHEEL_MIN: 8,
  WHEEL_MAX: 25,
};

function rankFor(gomitoli) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (gomitoli >= rank.min) current = rank;
  }
  return current;
}

function isBottegaUnlocked(gomitoli) {
  const name = rankFor(gomitoli).name;
  return name === "Mano Esperta" || name === "Designer in Erba";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function spinReward() {
  return REWARDS.WHEEL_MIN + Math.floor(Math.random() * (REWARDS.WHEEL_MAX - REWARDS.WHEEL_MIN + 1));
}

module.exports = {
  STAGES_COUNT,
  RANKS,
  IDEAS,
  REWARDS,
  rankFor,
  isBottegaUnlocked,
  todayKey,
  spinReward,
};
