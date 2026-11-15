# Salviamo la Bonetti – sito della campagna

Sito informativo per la petizione "Salviamo la scuola Bonetti di via Tajani" (Milano, Città Studi).
È una pagina sola, senza programmi da installare: bastano i file di questa cartella.

## Cosa c'è dentro

| File | A cosa serve |
| --- | --- |
| `index.html` | Tutti i testi della pagina |
| `assets/css/style.css` | Colori, caratteri, impaginazione |
| `assets/js/app.js` | Contatore delle firme, pulsanti di condivisione, barra "Firma ora" |
| `assets/img/` | Logo, volantino, immagine di anteprima per WhatsApp (`og.jpg`) |
| `assets/fonts/` | Caratteri (Bricolage Grotesque e DM Sans, licenza OFL), serviti dal sito stesso |

## Aggiornare il contatore delle firme

Il numero si aggiorna con un comando, che lo legge dalla pagina della petizione sul portale del Comune:

```
python3 strumenti/aggiorna_firme.py
```

Il comando modifica `index.html` (numero, "ne mancano", anello e data). Poi basta pubblicare la modifica.
Se il portale non risponde o il numero non è credibile, il comando si ferma senza toccare nulla.

## Pubblicare un aggiornamento

In `index.html`, nella sezione `AGGIORNAMENTI`, copiare un blocco come questo e incollarlo **in cima** alla lista:

```html
<article class="news">
  <time datetime="2026-11-20">20 novembre 2026</time>
  <div>
    <h3>Titolo dell'aggiornamento</h3>
    <p>Testo dell'aggiornamento.</p>
  </div>
</article>
```

Se gli aggiornamenti superano i cinque, i più vecchi finiscono dietro il pulsante "Mostra tutti".

## Indirizzo del sito

Il sito risponde su `https://salviamobonetti.it/`. Il dominio è collegato a GitHub Pages
tramite il file `CNAME` in questa cartella: non va cancellato né rinominato.

## Regole per i testi

- Solo fatti che risultano dagli atti pubblici o dalla petizione, con la fonte in fondo alla pagina.
- Nessun dato personale dei bambini o delle famiglie.
- Il sito non usa cookie né strumenti di tracciamento.

## Il video della campagna

In `assets/video/` ci sono tre file: `perche-la-bonetti.mp4` (versione leggera, quella che si vede nella sezione "Il video" della pagina) e le due parti a piena qualità da scaricare per le storie (`perche-la-bonetti-parte-1.mp4` e `perche-la-bonetti-parte-2.mp4`). L'immagine di anteprima è `assets/img/video-anteprima.jpg`. Per sostituire il video basta sovrascrivere i file con lo stesso nome.
