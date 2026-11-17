#!/usr/bin/env python3
"""Aggiorna il contatore delle firme di index.html leggendo il numero
dalla pagina della petizione su Milano Partecipa.

Uso:  python3 strumenti/aggiorna_firme.py
Esce con errore, senza toccare nulla, se non riesce a leggere un numero credibile.
"""
import re
import sys
import urllib.request
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

PETIZIONE = "https://partecipazione.comune.milano.it/initiatives/i-768"
PAGINA = Path(__file__).resolve().parent.parent / "index.html"
MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio",
        "agosto", "settembre", "ottobre", "novembre", "dicembre"]
GIRO = 653.45  # circonferenza dell'anello (raggio 104)
APERTURA = "2026-11-11"  # giorno di apertura della petizione (in index.html: data-apertura)


def punti(n: int) -> str:
    """1000 -> '1.000'"""
    return f"{n:,}".replace(",", ".")


def leggi_firme() -> tuple[int, int]:
    richiesta = urllib.request.Request(PETIZIONE, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept-Language": "it-IT,it;q=0.9",
    })
    with urllib.request.urlopen(richiesta, timeout=40) as risposta:
        html = risposta.read().decode("utf-8", errors="ignore")
    testo = re.sub(r"<script.*?</script>|<style.*?</style>", " ", html, flags=re.S)
    testo = re.sub(r"<[^>]+>", " ", testo)
    trovato = re.search(r"(\d[\d.]*)\s*/\s*(\d[\d.]*)\s*FIRME", testo, flags=re.I)
    if not trovato:
        raise SystemExit("ERRORE: non trovo il numero delle firme nella pagina della petizione.")
    firme = int(trovato.group(1).replace(".", ""))
    obiettivo = int(trovato.group(2).replace(".", ""))
    return firme, obiettivo


def main() -> None:
    firme, obiettivo = leggi_firme()
    pagina = PAGINA.read_text(encoding="utf-8")

    prima = int(re.search(r'data-firme="(\d+)"', pagina).group(1))
    if obiettivo <= 0 or firme < 0 or firme > 5_000_000:
        raise SystemExit(f"ERRORE: numeri non credibili ({firme} su {obiettivo}).")
    if firme < prima:
        raise SystemExit(f"ERRORE: il portale indica {firme} firme, meno delle {prima} già pubblicate. Non aggiorno.")

    oggi = datetime.now(ZoneInfo("Europe/Rome"))
    data = f"{oggi.day} {MESI[oggi.month - 1]} {oggi.year}"
    mancano = max(obiettivo - firme, 0)
    inizio = re.search(r'data-apertura="(\d{4}-\d{2}-\d{2})"', pagina)
    anno, mese, giorno = (int(x) for x in (inizio.group(1) if inizio else APERTURA).split("-"))
    giorni = max((oggi.date() - date(anno, mese, giorno)).days, 1)
    media = int(firme / giorni + 0.5)  # come Math.round nella pagina
    scostamento = GIRO * (1 - min(firme / obiettivo, 1))

    sostituzioni = [
        (r'data-firme="\d+"', f'data-firme="{firme}"'),
        (r'data-obiettivo="\d+"', f'data-obiettivo="{obiettivo}"'),
        (r'data-aggiornato="[^"]*"', f'data-aggiornato="{data}"'),
        (r'(class="js-firme">)[^<]*(<)', rf"\g<1>{punti(firme)}\g<2>"),
        (r'(class="js-obiettivo">)[^<]*(<)', rf"\g<1>{punti(obiettivo)}\g<2>"),
        (r'(class="js-mancano">)[^<]*(<)', rf"\g<1>{punti(mancano)}\g<2>"),
        (r'(class="js-aggiornato">)[^<]*(<)', rf"\g<1>{data}\g<2>"),
        (r'(<title id="ring-t">)[^<]*(</title>)',
         rf"\g<1>{punti(firme)} firme raccolte su {punti(obiettivo)}\g<2>"),
        (r'stroke-dashoffset="[\d.]+"', f'stroke-dashoffset="{scostamento:.2f}"'),
        (r'(class="js-giorni">)[^<]*(<)', rf"\g<1>{giorni}\g<2>"),
        (r'(class="js-media">)[^<]*(<)', rf"\g<1>{punti(media)}\g<2>"),
    ]
    nuova = pagina
    for modello, valore in sostituzioni:
        nuova, quante = re.subn(modello, valore, nuova)
        if quante == 0:
            raise SystemExit(f"ERRORE: in index.html non trovo più il punto da aggiornare: {modello}")

    if nuova == pagina:
        print(f"Nessuna variazione: {punti(firme)} firme su {punti(obiettivo)}, dato del {data}.")
        return
    PAGINA.write_text(nuova, encoding="utf-8")
    print(f"Aggiornato: da {punti(prima)} a {punti(firme)} firme su {punti(obiettivo)}, dato del {data}.")
    if firme >= obiettivo:
        print("NOTA: obiettivo raggiunto. La pagina mostra da sola il messaggio di obiettivo raggiunto.")


if __name__ == "__main__":
    main()
