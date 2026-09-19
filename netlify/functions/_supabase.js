const { createClient } = require("@supabase/supabase-js");

let client = null;

function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    console.log("[debug supabase] SUPABASE_URL value:", JSON.stringify(url));
    console.log("[debug supabase] SUPABASE_SERVICE_KEY length:", key ? key.length : 0);
    if (!url || !key) {
      throw new Error("SUPABASE_URL o SUPABASE_SERVICE_KEY mancanti nelle variabili d'ambiente Netlify.");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

const DEFAULT_ROW = {
  gomitoli: 0,
  badges: [],
  lib_done: [],
  dream_sent: false,
  voted_idea: null,
  idea_proposed: false,
  daily_done: null,
  spun: null,
};

async function getOrCreateUser(telegramUser) {
  const supabase = getSupabase();
  const { data: existing, error: selectError } = await supabase
    .from("atelier_users")
    .select("*")
    .eq("telegram_user_id", telegramUser.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("atelier_users")
    .insert({
      telegram_user_id: telegramUser.id,
      telegram_first_name: telegramUser.first_name || null,
      ...DEFAULT_ROW,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created;
}

async function saveUser(telegramUserId, patch) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("atelier_users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("telegram_user_id", telegramUserId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function getIdeaVotes() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("idea_votes").select("*").order("idea_id", { ascending: true });
  if (error) throw error;
  return data;
}

async function incrementIdeaVote(ideaId) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("increment_idea_vote", { p_idea_id: ideaId });
  if (error) throw error;
}

module.exports = { getSupabase, getOrCreateUser, saveUser, getIdeaVotes, incrementIdeaVote };
