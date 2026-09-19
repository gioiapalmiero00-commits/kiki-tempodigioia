// Kiki, Tempo di Gioia — interazioni base del sito

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initNewsletterForms();
  initIdeaForms();
  initPatternQuiz();
});

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => links.classList.remove("open"));
  });
}

// Quiz "Trova il pattern giusto per te".
// Ogni scheda .pattern-card ha data-level / data-type / data-fit: quando
// aggiungi un pattern reale, basta impostare questi attributi coerenti con
// le opzioni del quiz (vedi i value dei radio in pattern.html) e il
// suggerimento funziona da solo, senza toccare il codice.
function initPatternQuiz() {
  const quiz = document.getElementById("pattern-quiz");
  if (!quiz) return;

  const steps = Array.from(quiz.querySelectorAll(".quiz-step"));
  const progressFill = document.querySelector("[data-quiz-progress-fill]");
  const stepCurrentLabel = document.querySelector("[data-quiz-step-current]");
  const nextBtn = quiz.querySelector("[data-quiz-next]");
  const backBtn = quiz.querySelector("[data-quiz-back]");
  const submitBtn = quiz.querySelector("[data-quiz-submit]");
  const resultPanel = document.querySelector(".quiz-result");
  const resultText = document.querySelector(".quiz-result-text");
  const restartBtn = document.querySelector("[data-quiz-restart]");
  const cards = Array.from(document.querySelectorAll(".pattern-card"));
  let current = 1;

  function currentStepValid() {
    return !!steps[current - 1].querySelector("input:checked");
  }

  function updateProgress() {
    if (stepCurrentLabel) stepCurrentLabel.textContent = String(current);
    if (progressFill) progressFill.style.width = `${(current / steps.length) * 100}%`;
  }

  function refreshNav() {
    backBtn.hidden = current === 1;
    nextBtn.hidden = current === steps.length;
    submitBtn.hidden = current !== steps.length;
    const valid = currentStepValid();
    nextBtn.disabled = !valid;
    submitBtn.disabled = !valid;
  }

  function goToStep(n) {
    steps[current - 1].hidden = true;
    current = n;
    steps[current - 1].hidden = false;
    updateProgress();
    refreshNav();
  }

  steps.forEach((step, i) => {
    step.hidden = i !== 0;
    step.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", refreshNav);
    });
  });

  nextBtn.addEventListener("click", () => {
    if (currentStepValid() && current < steps.length) goToStep(current + 1);
  });

  backBtn.addEventListener("click", () => {
    if (current > 1) goToStep(current - 1);
  });

  restartBtn.addEventListener("click", () => {
    quiz.reset();
    quiz.hidden = false;
    resultPanel.hidden = true;
    cards.forEach((card) => card.classList.remove("quiz-match", "quiz-dim"));
    goToStep(1);
  });

  quiz.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(quiz);
    showMatches({
      level: data.get("level"),
      type: data.get("type"),
      fit: data.get("fit"),
    });
  });

  function showMatches(answers) {
    let best = 0;
    const scored = cards.map((card) => {
      let score = 0;
      if (card.dataset.level === answers.level) score += 1;
      if (answers.type !== "indifferente" && card.dataset.type === answers.type) score += 1;
      if (card.dataset.fit === answers.fit) score += 1;
      best = Math.max(best, score);
      return { card, score };
    });

    const matches = scored.filter((s) => s.score === best && best > 0).map((s) => s.card);

    cards.forEach((card) => card.classList.remove("quiz-match", "quiz-dim"));

    if (matches.length && matches.length < cards.length) {
      const names = matches.map((c) => c.querySelector("h3").textContent).join(", ");
      matches.forEach((card) => card.classList.add("quiz-match"));
      cards.forEach((card) => {
        if (!matches.includes(card)) card.classList.add("quiz-dim");
      });
      resultText.innerHTML = `In base alle tue risposte, il pattern più adatto a te è <strong>${names}</strong>. Lo trovi evidenziato qui sotto.`;
    } else {
      resultText.innerHTML =
        'Nessun pattern corrisponde perfettamente ancora, ma la collezione si amplia presto: iscriviti per essere avvisata quando arriva quello giusto per te, oppure <a href="idee.html" style="color:var(--color-raspberry);font-weight:700">raccontami cosa vorresti trovare</a>.';
    }

    quiz.hidden = true;
    resultPanel.hidden = false;

    const grid = document.getElementById("pattern-grid");
    if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  updateProgress();
  refreshNav();
}

// Le newsletter form puntano a un endpoint Formspree placeholder.
// Per attivarle: crea un form gratuito su https://formspree.io,
// copia il tuo Form ID e sostituisci FORM_ID_DA_SOSTITUIRE nell'HTML.
function initNewsletterForms() {
  document.querySelectorAll("form[data-newsletter]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const button = form.querySelector("button[type='submit']");
      const success = form.querySelector(".form-success");
      const action = form.getAttribute("action") || "";

      if (action.includes("FORM_ID_DA_SOSTITUIRE")) {
        if (success) {
          success.textContent =
            "Form di prova: collega il tuo account Formspree per ricevere davvero le iscrizioni (vedi istruzioni nel README).";
          success.style.display = "block";
        }
        return;
      }

      if (button) button.disabled = true;

      try {
        const response = await fetch(action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });

        if (response.ok) {
          form.reset();
          if (success) {
            success.textContent = "Fatto! Controlla la tua casella email nei prossimi giorni.";
            success.style.display = "block";
          }
        } else if (success) {
          success.textContent = "Qualcosa non ha funzionato, riprova più tardi.";
          success.style.display = "block";
        }
      } catch (err) {
        if (success) {
          success.textContent = "Connessione assente: riprova più tardi.";
          success.style.display = "block";
        }
      } finally {
        if (button) button.disabled = false;
      }
    });
  });
}

// Le form "lascia un'idea" (pagina idee.html, pattern.html, ecc.) puntano tutte
// allo stesso endpoint Formspree placeholder: sostituisci FORM_ID_IDEE_DA_SOSTITUIRE
// con un unico Form ID reale ovunque compare (vedi README) per ricevere le idee.
function initIdeaForms() {
  document.querySelectorAll("form[data-idea-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const button = form.querySelector("button[type='submit']");
      const success = form.querySelector(".form-success");
      const action = form.getAttribute("action") || "";

      if (action.includes("FORM_ID_IDEE_DA_SOSTITUIRE")) {
        if (success) {
          success.textContent =
            "Form di prova: collega un Form ID Formspree dedicato alle idee (vedi istruzioni nel README) per riceverle davvero.";
          success.style.display = "block";
        }
        return;
      }

      if (button) button.disabled = true;

      try {
        const response = await fetch(action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });

        if (response.ok) {
          form.reset();
          if (success) {
            success.textContent = "Grazie! Ho ricevuto la tua idea.";
            success.style.display = "block";
          }
        } else if (success) {
          success.textContent = "Qualcosa non ha funzionato, riprova più tardi.";
          success.style.display = "block";
        }
      } catch (err) {
        if (success) {
          success.textContent = "Connessione assente: riprova più tardi.";
          success.style.display = "block";
        }
      } finally {
        if (button) button.disabled = false;
      }
    });
  });
}
