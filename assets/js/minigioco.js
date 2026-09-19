/* L'Atelier di Kiki — vetrina libera sul sito pubblico.
   Solo le 5 tappe di costruzione del pattern, sempre visibili e cliccabili,
   senza gomitoli/ranghi/progressi: quella parte vive nella Telegram Mini App. */

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

  var overlay = document.getElementById("game-overlay");
  var panel = document.getElementById("game-panel");
  if (!overlay || !panel) return;

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
      return '<video style="width:100%;border-radius:var(--radius-sm);margin-top:10px;background:#000" src="' + src + '" controls playsinline></video>';
    }
    return '<div class="video-slot">🎥 Video in arrivo — Gioia lo carica qui appena pronto</div>';
  }

  function renderStage(i) {
    var stage = STAGES[i];
    var html = panelHead(PATTERN_NAME + " — Parte " + (i + 1), STAGE_COLORS[i % STAGE_COLORS.length]);
    html += '<p class="panel-intro">' + stage.desc + "</p>";
    html += videoBlock(i);
    html += '<p class="stage-note">Vuoi anche salvare i tuoi progressi e sbloccare l’Atelier vero e proprio? <a href="minigioco.html#telegram-cta">Continua su Telegram</a>.</p>';
    return html;
  }

  document.querySelectorAll(".thread-stop[data-stage]").forEach(function (stop) {
    stop.addEventListener("click", function () {
      openPanel(renderStage(parseInt(stop.getAttribute("data-stage"), 10)));
    });
  });
})();
