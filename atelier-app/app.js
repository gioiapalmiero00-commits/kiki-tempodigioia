/* Logica dell'Atelier di Kiki dentro la Telegram Mini App.
   Stessa interfaccia/regole di assets/js/minigioco.js, ma lo stato non vive
   più nel browser: arriva e si salva tramite le Netlify Functions, usando
   l'identità Telegram (initData) per riconoscere la persona su ogni dispositivo. */

(function () {
  var PATTERN_NAME = "Borsa Girasole";

  var STAGES = [
    { title: "Il fondo rotondo", desc: "La base da cui parte tutta la borsa: un fondo rotondo stabile e pulito.", videoSrc: null },
    { title: "Il corpo della borsa", desc: "Costruiamo insieme il corpo, giro dopo giro, con la giusta tensione.", videoSrc: null },
    { title: "I manici", desc: "Impostiamo i manici, comodi da portare e proporzionati alla borsa.", videoSrc: null },
    { title: "La chiusura", desc: "La rifinitura del bordo superiore e il sistema di chiusura.", videoSrc: null },
    { title: "Il girasole applicato", desc: "Il tocco finale: il fiore che dà il nome alla borsa.", videoSrc: null }
  ];

  var STAGE_COLORS = [
    "var(--color-raspberry)",
    "var(--color-orange)",
    "var(--color-blue)",
    "var(--color-olive)",
    "var(--color-raspberry)"
  ];

  var RANKS = [
    { min: 0, name: "Apprendista del Filo" },
    { min: 40, name: "Amica dell'Uncinetto" },
    { min: 100, name: "Mano Esperta" },
    { min: 200, name: "Designer in Erba" }
  ];

  var tg = window.Telegram && window.Telegram.WebApp;
  var initData = tg && tg.initData;

  var loadingEl = document.getElementById("app-loading");
  var errorEl = document.getElementById("app-error");
  var rootEl = document.getElementById("app-root");
  var overlay = document.getElementById("game-overlay");
  var panel = document.getElementById("game-panel");

  var state = null; // popolato da apiGet() all'avvio

  function showToast(message) {
    var toast = document.querySelector(".app-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "app-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(function () {
      toast.classList.add("show");
    });
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  var CHALLENGE_TIPI = [
    "un accessorio rapido, pensato per essere un primo regalo fatto a mano",
    "un capo pensato per la vita di tutti i giorni, non per un'occasione speciale",
    "un progetto piccolo, ma con una tecnica che non hai mai provato prima",
    "qualcosa pensato per una serata o un'occasione precisa",
    "un oggetto per la casa, non per il corpo — un capo che non si indossa"
  ];

  var CHALLENGE_LIVELLI = [
    "pensato per chi muove i primi passi",
    "di livello intermedio",
    "pensato per chi vuole sperimentare qualcosa di più difficile del solito"
  ];

  var CHALLENGE_ELEMENTI = [
    "una silhouette che di solito non useresti",
    "una costruzione pensata per non avere cuciture",
    "un dettaglio a contrasto di colore, ben visibile",
    "una texture a rilievo, non solo punto liscio",
    "un aumento o una diminuzione trasformati in dettaglio decorativo, non solo in tecnica"
  ];

  var CHALLENGE_MOOD = [
    "ispirato a un ricordo d'infanzia",
    "ispirato ai colori di questa stagione",
    "pensato per reinventare un capo che indossi già spesso",
    "senza nessuna ispirazione precisa — lascia decidere alle mani, non alla testa"
  ];

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateChallenge() {
    return (
      "Prova a progettare " + pickRandom(CHALLENGE_TIPI) + ", " + pickRandom(CHALLENGE_LIVELLI) +
      ". Presta particolare attenzione a " + pickRandom(CHALLENGE_ELEMENTI) + ", " + pickRandom(CHALLENGE_MOOD) + "."
    );
  }

  var CONFETTI_COLORS = [
    "var(--color-raspberry)",
    "var(--color-orange)",
    "var(--color-blue)",
    "var(--color-olive)"
  ];

  function showConfetti() {
    var container = document.createElement("div");
    container.className = "confetti-burst";
    var pieceCount = 40;
    for (var i = 0; i < pieceCount; i++) {
      var piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      piece.style.animationDelay = Math.random() * 0.3 + "s";
      piece.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
      piece.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
      piece.style.setProperty("--spin", (Math.random() * 720 - 360) + "deg");
      container.appendChild(piece);
    }
    document.body.appendChild(container);
    setTimeout(function () {
      container.remove();
    }, 3000);
  }

  async function apiGet() {
    var res = await fetch("/api/atelier-state", {
      headers: { "X-Telegram-Init-Data": initData }
    });
    if (!res.ok) {
      var err = await res.json().catch(function () { return {}; });
      throw new Error(err.error || "Non riesco a caricare i tuoi dati.");
    }
    return res.json();
  }

  async function apiAction(action, payload) {
    var res = await fetch("/api/atelier-action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": initData
      },
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    });
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      throw new Error(body.error || "Qualcosa non ha funzionato, riprova.");
    }
    state = body;
    renderStatus();
    return body;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function rankFor(g) {
    var current = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) {
      if (g >= RANKS[i].min) current = RANKS[i];
    }
    return current;
  }

  function nextRank(g) {
    for (var i = 0; i < RANKS.length; i++) {
      if (RANKS[i].min > g) return RANKS[i];
    }
    return null;
  }

  function isStageDone(i) {
    return state.libDone.indexOf(i) !== -1;
  }

  function isStageUnlocked(i) {
    return i === 0 || isStageDone(i - 1);
  }

  function isPatternDone() {
    return state.libDone.length === STAGES.length;
  }

  function milestoneCount() {
    var n = 0;
    if (isPatternDone()) n++;
    if (state.dreamSent) n++;
    if (state.votedIdea !== null && state.votedIdea !== undefined) n++;
    if (state.dailyDone === todayKey()) n++;
    if (state.spun === todayKey()) n++;
    return n;
  }

  function isBottegaUnlocked() {
    return state.bottegaUnlocked;
  }

  function renderStatus() {
    var rank = rankFor(state.gomitoli);
    var next = nextRank(state.gomitoli);
    document.getElementById("stat-gomitoli").textContent = state.gomitoli;
    document.getElementById("stat-badge").textContent = state.badges.length;
    document.getElementById("stat-mastery").textContent = milestoneCount() + "/5";
    document.getElementById("rank-name").textContent = rank.name;
    var pct = next ? Math.min(100, Math.round(((state.gomitoli - rank.min) / (next.min - rank.min)) * 100)) : 100;
    document.getElementById("progress-fill").style.width = pct + "%";
    var hint;
    if (!next) {
      hint = "Rango massimo raggiunto per ora";
    } else {
      hint = "A " + (next.min - state.gomitoli) + " gomitoli da “" + next.name + "”";
      if (next.name === "Mano Esperta") hint += " — apre la Bottega delle Creazioni";
    }
    document.getElementById("rank-hint").textContent = hint;

    document.querySelectorAll(".thread-stop[data-stage]").forEach(function (stop) {
      var i = parseInt(stop.getAttribute("data-stage"), 10);
      var badgeEl = stop.querySelector(".badge");
      var done = isStageDone(i);
      var unlocked = isStageUnlocked(i);
      stop.classList.toggle("is-locked", !unlocked);
      if (!badgeEl) return;
      if (done) {
        badgeEl.textContent = "Fatta";
        badgeEl.className = "badge badge-done";
      } else if (unlocked) {
        badgeEl.textContent = "Parte " + (i + 1);
        badgeEl.className = "badge badge-new";
      } else {
        badgeEl.textContent = "Bloccata";
        badgeEl.className = "badge badge-locked";
      }
    });

    for (var i = 0; i < STAGES.length; i++) {
      var seg = document.getElementById("seg-" + i);
      if (seg) seg.classList.toggle("is-done", isStageDone(i));
    }

    document.querySelectorAll(".orbit-node[data-room]").forEach(function (node) {
      var room = node.getAttribute("data-room");
      var badgeEl = node.querySelector(".badge");
      if (!badgeEl) return;
      if (room === "capanna") {
        badgeEl.textContent = state.dreamSent ? "Inviata" : "Nuovo";
        badgeEl.className = "badge " + (state.dreamSent ? "badge-done" : "badge-new");
      }
      if (room === "sfida") {
        var voted = state.votedIdea !== null && state.votedIdea !== undefined;
        badgeEl.textContent = voted ? "Hai votato" : "Vota ora";
        badgeEl.className = "badge " + (voted ? "badge-done" : "badge-new");
      }
      if (room === "giorno") {
        var doneToday = state.dailyDone === todayKey();
        badgeEl.textContent = doneToday ? "Fatto oggi" : "Oggi";
        badgeEl.className = "badge " + (doneToday ? "badge-done" : "badge-new");
      }
      if (room === "ruota") {
        var spunToday = state.spun === todayKey();
        badgeEl.textContent = spunToday ? "Fatto oggi" : "Gira";
        badgeEl.className = "badge " + (spunToday ? "badge-done" : "badge-new");
      }
      if (room === "bottega") {
        var open = isBottegaUnlocked();
        badgeEl.textContent = open ? "Aperta" : "Bloccata";
        badgeEl.className = "badge " + (open ? "badge-new" : "badge-locked");
        node.classList.toggle("is-locked", !open);
      }
    });
  }

  function openPanel(html) {
    panel.innerHTML = html;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    var closeBtn = panel.querySelector(".panel-close");
    if (closeBtn) closeBtn.addEventListener("click", closePanel);
  }

  function closePanel() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closePanel();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePanel();
  });

  function flowerIcon(color) {
    return (
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor" style="color:' +
      color +
      '"><g><ellipse cx="50" cy="22" rx="17" ry="24"/><ellipse cx="50" cy="22" rx="17" ry="24" transform="rotate(72 50 50)"/><ellipse cx="50" cy="22" rx="17" ry="24" transform="rotate(144 50 50)"/><ellipse cx="50" cy="22" rx="17" ry="24" transform="rotate(216 50 50)"/><ellipse cx="50" cy="22" rx="17" ry="24" transform="rotate(288 50 50)"/></g></svg>'
    );
  }

  function panelHead(title, color) {
    return (
      '<div class="panel-top"><span class="flower-badge">' +
      flowerIcon(color) +
      '</span><h3>' +
      title +
      '</h3><button class="panel-close" aria-label="Chiudi">✕</button></div>'
    );
  }

  function videoBlock(i) {
    var src = STAGES[i].videoSrc;
    if (src) {
      return '<video class="video-embed" src="' + src + '" controls playsinline></video>';
    }
    return '<div class="video-slot">🎥 Video in arrivo — Gioia lo carica qui appena pronto</div>';
  }

  function renderStage(i) {
    var stage = STAGES[i];
    var done = isStageDone(i);
    var html = panelHead(PATTERN_NAME + " — Parte " + (i + 1), STAGE_COLORS[i % STAGE_COLORS.length]);
    html += '<p class="panel-intro">' + stage.desc + "</p>";
    html += videoBlock(i);
    html +=
      '<button class="btn btn-primary btn-small" id="stage-complete-btn" ' +
      (done ? "disabled" : "") +
      ">" +
      (done ? "Parte completata" : "Segna come completata (+15)") +
      "</button>";
    if (done && i === STAGES.length - 1) {
      html +=
        '<p class="thankyou-note">Hai completato tutta la ' +
        PATTERN_NAME +
        '! Hai sbloccato il badge “Prima Trama”.</p>';
    }
    return html;
  }

  function renderStageLocked(i) {
    var html = panelHead("Parte " + (i + 1) + " bloccata", "var(--color-ink)");
    html +=
      '<p class="panel-intro">Questa tappa si sblocca completando la Parte ' +
      i +
      " prima — un passo alla volta, senza fretta.</p>";
    return html;
  }

  function openStage(i) {
    if (!isStageUnlocked(i)) {
      openPanel(renderStageLocked(i));
      return;
    }
    openPanel(renderStage(i));
    var btn = document.getElementById("stage-complete-btn");
    if (btn) {
      btn.addEventListener("click", async function () {
        btn.disabled = true;
        try {
          await apiAction("complete-stage", { stageIndex: i });
          showConfetti();
          openPanel(renderStage(i));
        } catch (err) {
          showToast(err.message);
          btn.disabled = false;
        }
      });
    }
  }

  var renderers = {
    capanna: function () {
      var html = panelHead("La Capanna dei Sogni", "var(--color-orange)");
      html += '<p class="panel-intro">Cosa vorresti creare con le tue mani, ma non hai ancora osato provare?</p>';
      if (state.dreamSent) {
        html += '<p class="thankyou-note">Grazie per averlo condiviso — mi aiuta davvero a scegliere i prossimi pattern.</p>';
      } else {
        html += '<div class="game-field"><label for="dream-input">Il tuo sogno con ago o uncinetto</label><textarea id="dream-input" placeholder="Es. Un abito intero, ma ho paura di sbagliare la vestibilità..."></textarea></div>';
        html += '<div class="privacy-note">🔒 Resta tra noi: uso queste risposte solo per capire quali pattern progettare, non le pubblico mai.</div>';
        html += '<p class="form-note" id="dream-empty-note" style="display:none;color:var(--color-raspberry)">Scrivi qualcosa prima di inviare — anche solo una riga va benissimo.</p>';
        html += '<button class="btn btn-primary" id="dream-submit">Condividi con Gioia (+20)</button>';
      }
      return html;
    },

    sfida: function () {
      var html = panelHead("La Sfida del Prossimo Pattern", "var(--color-blue)");
      html += '<p class="panel-intro">Ogni tanto scelgo una piccola selezione tra le idee arrivate e la metto qui al voto — non tutte le idee ricevute finiscono in lista, solo quelle su cui vale la pena decidere insieme. Vota quella che ti convince di più.</p>';
      var votedIdea = state.votedIdea !== null && state.votedIdea !== undefined ? state.votedIdea : null;
      var order = state.ideas.slice().sort(function (a, b) {
        return b.votes - a.votes;
      });
      order.forEach(function (entry, rank) {
        var voted = votedIdea === entry.id;
        html += '<div class="idea-row"><span class="idea-rank">#' + (rank + 1) + "</span>";
        html += '<div class="idea-info"><b>' + entry.text + "</b><span>proposta da " + entry.author + " · " + entry.votes + " voti</span></div>";
        html +=
          '<button class="vote-btn ' +
          (voted ? "voted" : "") +
          '" data-idea="' +
          entry.id +
          '" ' +
          (votedIdea !== null ? "disabled" : "") +
          ">" +
          (voted ? "Votata" : "Vota") +
          "</button></div>";
      });
      html += '<p class="prize-note">L’idea più votata diventa uno dei prossimi pattern gratuiti; chi l’ha proposta lo riceve in anteprima.</p>';
      html += '<div class="idea-propose">';
      html += '<h4>Non vedi la tua idea qui?</h4>';
      if (state.ideaProposed) {
        html += '<p class="thankyou-note">Grazie, l’ho ricevuta — se in tanti proponete la stessa cosa, è un buon segno che entri nella prossima tornata di voto.</p>';
      } else {
        html += '<p class="panel-intro" style="margin-bottom:12px">Proponila qui: la leggo personalmente, e se convince anche altre persone potrebbe finire nella prossima selezione da votare.</p>';
        html += '<div class="game-field"><label for="idea-input">La tua proposta di pattern</label><textarea id="idea-input" placeholder="Es. Uno scaldacollo reversibile, facile ma non banale..."></textarea></div>';
        html += '<p class="form-note" id="idea-empty-note" style="display:none;color:var(--color-raspberry)">Scrivi la tua idea prima di inviare — anche solo una riga va benissimo.</p>';
        html += '<button class="btn btn-primary" id="idea-submit">Proponi la tua idea (+10)</button>';
      }
      html += '</div>';
      return html;
    },

    giorno: function () {
      var html = panelHead("Cosa creare oggi?", "var(--color-olive)");
      var doneToday = state.dailyDone === todayKey();
      html += '<p class="panel-intro">Non è un generatore di "fai una sciarpa". È un piccolo spunto di design: un punto di partenza — una forma, una costruzione, un dettaglio da esplorare — non un pattern già pronto.</p>';
      html += '<p class="stage-note" id="challenge-text">' + (doneToday ? "Hai già generato la tua sfida per oggi — torna domani per una nuova." : "Premi il bottone e scopri la tua sfida di oggi.") + "</p>";
      html +=
        '<button class="btn btn-primary" id="daily-btn" ' +
        (doneToday ? "disabled" : "") +
        ">" +
        (doneToday ? "Fatto per oggi" : "Genera una sfida (+10)") +
        "</button>";
      return html;
    },

    ruota: function () {
      var html = panelHead("La Ruota dei Gomitoli", "var(--color-raspberry)");
      var spunToday = state.spun === todayKey();
      html += '<p class="panel-intro">Un giro al giorno, per un piccolo bonus di gomitoli.</p>';
      html += '<div class="wheel-wrap"><div class="wheel" id="wheel-el"></div>';
      html += '<div class="wheel-result" id="wheel-result">' + (spunToday ? "Torna domani per un altro giro" : "") + "</div>";
      html += '<button class="btn btn-primary" id="wheel-btn" ' + (spunToday ? "disabled" : "") + ">" + (spunToday ? "Già girata oggi" : "Gira la ruota") + "</button></div>";
      return html;
    },

    bottega: function () {
      var html = panelHead("La Bottega delle Creazioni", "var(--color-blue)");
      if (!isBottegaUnlocked()) {
        html += '<div class="locked-panel"><span class="flower-badge">' + flowerIcon("var(--color-ink)") + "</span>";
        html += "<p>Questa stanza si apre quando arrivi a “Mano Esperta” (100 gomitoli). Continua a raccogliere gomitoli nelle altre stanze per sbloccarla.</p></div>";
        return html;
      }
      html += '<p class="panel-intro">Complimenti, sei arrivata a “' + rankFor(state.gomitoli).name + '”! Questo è quello che ti sei guadagnata.</p>';
      html += '<div class="stage-item"><span class="stage-num">🎁</span><div class="stage-body"><h4>Contenuto extra dell\'Atelier</h4><p>Sto preparando il primo contenuto esclusivo riservato a chi arriva qui (schema bonus o video in più) — arriva a breve.</p></div></div>';
      html += '<div class="stage-item"><span class="stage-num">🛍️</span><div class="stage-body"><h4>Un omaggio quando lo shop apre</h4><p>Il tuo rango resta salvato sul tuo account: quando la collezione di pattern sarà in vendita, ti scriverò per darti un piccolo omaggio di lancio.</p></div></div>';
      return html;
    }
  };

  function bindPanelEvents(room) {
    if (room === "capanna") {
      var submitBtn = document.getElementById("dream-submit");
      if (submitBtn) {
        submitBtn.addEventListener("click", async function () {
          var input = document.getElementById("dream-input");
          var text = input ? input.value.trim() : "";
          var emptyNote = document.getElementById("dream-empty-note");
          if (!text) {
            if (emptyNote) emptyNote.style.display = "block";
            if (input) input.focus();
            return;
          }
          submitBtn.disabled = true;
          try {
            await apiAction("dream-submit", { text: text });
            openPanel(renderers.capanna());
            bindPanelEvents("capanna");
          } catch (err) {
            showToast(err.message);
            submitBtn.disabled = false;
          }
        });
      }
    }
    if (room === "sfida") {
      panel.querySelectorAll("[data-idea]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          var i = parseInt(btn.getAttribute("data-idea"), 10);
          panel.querySelectorAll("[data-idea]").forEach(function (b) { b.disabled = true; });
          try {
            await apiAction("vote-idea", { ideaId: i });
            openPanel(renderers.sfida());
            bindPanelEvents("sfida");
          } catch (err) {
            showToast(err.message);
            openPanel(renderers.sfida());
            bindPanelEvents("sfida");
          }
        });
      });
      var ideaSubmitBtn = document.getElementById("idea-submit");
      if (ideaSubmitBtn) {
        ideaSubmitBtn.addEventListener("click", async function () {
          var input = document.getElementById("idea-input");
          var text = input ? input.value.trim() : "";
          var emptyNote = document.getElementById("idea-empty-note");
          if (!text) {
            if (emptyNote) emptyNote.style.display = "block";
            if (input) input.focus();
            return;
          }
          ideaSubmitBtn.disabled = true;
          try {
            await apiAction("propose-idea", { text: text });
            openPanel(renderers.sfida());
            bindPanelEvents("sfida");
          } catch (err) {
            showToast(err.message);
            ideaSubmitBtn.disabled = false;
          }
        });
      }
    }
    if (room === "giorno") {
      var dailyBtn = document.getElementById("daily-btn");
      if (dailyBtn) {
        dailyBtn.addEventListener("click", async function () {
          dailyBtn.disabled = true;
          var challengeEl = document.getElementById("challenge-text");
          if (challengeEl) challengeEl.textContent = generateChallenge();
          try {
            await apiAction("daily-task", {});
            dailyBtn.textContent = "Fatto per oggi";
          } catch (err) {
            showToast(err.message);
            dailyBtn.disabled = false;
          }
        });
      }
    }
    if (room === "ruota") {
      var wheelBtn = document.getElementById("wheel-btn");
      if (wheelBtn) {
        wheelBtn.addEventListener("click", async function () {
          wheelBtn.disabled = true;
          try {
            var body = await apiAction("spin-wheel", {});
            var wheelEl = document.getElementById("wheel-el");
            var spins = 4 + Math.random() * 2;
            wheelEl.style.transform = "rotate(" + (360 * spins) + "deg)";
            setTimeout(function () {
              var resultEl = document.getElementById("wheel-result");
              if (resultEl) resultEl.textContent = "+" + body.lastSpinReward + " gomitoli!";
            }, 2200);
          } catch (err) {
            showToast(err.message);
            openPanel(renderers.ruota());
            bindPanelEvents("ruota");
          }
        });
      }
    }
  }

  function openRoom(room) {
    openPanel(renderers[room]());
    bindPanelEvents(room);
  }

  document.querySelectorAll(".thread-stop[data-stage]").forEach(function (stop) {
    stop.addEventListener("click", function () {
      openStage(parseInt(stop.getAttribute("data-stage"), 10));
    });
  });

  document.querySelectorAll(".orbit-node[data-room]").forEach(function (node) {
    node.addEventListener("click", function () {
      if (node.classList.contains("is-locked") && node.getAttribute("data-room") !== "bottega") return;
      openRoom(node.getAttribute("data-room"));
    });
  });

  async function init() {
    if (!tg || !initData) {
      loadingEl.hidden = true;
      errorEl.hidden = false;
      return;
    }
    tg.ready();
    tg.expand();
    try {
      state = await apiGet();
      loadingEl.hidden = true;
      rootEl.hidden = false;
      renderStatus();
    } catch (err) {
      loadingEl.hidden = true;
      errorEl.hidden = false;
      errorEl.querySelector("p").textContent = err.message;
    }
  }

  init();
})();
