# Kiki, Tempo di Gioia — sito v1

Sito statico (HTML/CSS/JS puro, nessun framework) con 3 pagine: Home, Chi sono, Pattern (shop pronto per il lancio).

## Cosa fare per renderlo davvero funzionante

1. **Logo reale**
   Salva i file del logo (PNG o, meglio, SVG) in `assets/img/logo/` e poi sostituisci il testo "Kiki" nell'header/footer con `<img src="assets/img/logo/kiki-logo.svg" alt="Kiki, Tempo di Gioia">`. Fammelo sapere quando i file sono nella cartella e li collego io.

2. **Raccolta email (newsletter/avviso lancio)**
   I form puntano a un endpoint placeholder (Formspree). Per attivarli:
   - crea un account gratuito su https://formspree.io
   - crea un nuovo form e copia il Form ID
   - in `index.html`, `chi-sono.html` e `pattern.html` sostituisci `FORM_ID_DA_SOSTITUIRE` nell'attributo `action` dei form con il tuo ID
   In alternativa puoi usare Mailchimp, Brevo o ConvertKit: basta sostituire l'intero blocco `<form>` con quello che questi servizi ti forniscono.

3. **Vendita dei pattern (Payhip o Gumroad)**
   Quando il primo pattern è pronto:
   - crea il prodotto su Payhip o Gumroad (gestiscono pagamento, IVA UE e consegna sicura del PDF)
   - in `pattern.html`, nella scheda del pattern corrispondente: cambia il badge in "Disponibile", il prezzo, e il bottone `disabled` con un link al prodotto (es. `<a class="btn btn-primary" href="https://payhip.com/b/xxxxx">Acquista ora</a>`)

4. **Foto reali**
   I riquadri a righe diagonali con scritta "Foto da aggiungere" sono placeholder. Sostituiscili con `<img>` reali quando hai le foto (idealmente quadrate/verticali, alta risoluzione).

## Come vederlo in locale

Apri semplicemente `index.html` nel browser, oppure con un piccolo server locale:

```bash
npx serve .
```

## Come pubblicarlo online (gratis)

Il modo più semplice è **Netlify**: vai su https://app.netlify.com/drop e trascina l'intera cartella del progetto. In pochi secondi ottieni un link pubblico (poi puoi collegare un dominio tuo, es. kikitempodigioia.it).
