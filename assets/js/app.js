/* Salviamo la Bonetti – piccoli comportamenti della pagina.
   La pagina funziona anche senza questo file: qui si aggiornano solo
   il contatore, i pulsanti di condivisione, la barra in basso e le piccole animazioni. */
(function () {
  "use strict";

  var radice = document.documentElement;
  radice.classList.add("js");

  var cfg = (document.getElementById("campagna") || document.body).dataset;
  var firme = parseInt(cfg.firme, 10) || 0;
  var obiettivo = parseInt(cfg.obiettivo, 10) || 1000;
  var aggiornato = cfg.aggiornato || "";
  var mancano = Math.max(obiettivo - firme, 0);
  var quota = Math.min(firme / obiettivo, 1);
  var fermo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 1000 -> "1.000"
  var numero = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };

  // ---- contatore delle firme ----
  var scrivi = function (selettore, testo) {
    document.querySelectorAll(selettore).forEach(function (el) { el.textContent = testo; });
  };
  scrivi(".js-firme", numero(firme));
  scrivi(".js-obiettivo", numero(obiettivo));
  scrivi(".js-mancano", numero(mancano));
  if (aggiornato) scrivi(".js-aggiornato", aggiornato);

  // obiettivo raggiunto: le frasi "ne mancano" lasciano il posto a un invito a continuare
  if (firme >= 1000) radice.classList.add("mille");   // quattro cifre nell'anello: un filo più piccole
  if (mancano === 0) {
    radice.classList.add("raggiunto");
    scrivi(".js-frase-contatore", "Obiettivo raggiunto!");
    scrivi(".js-frase-finale", "Abbiamo superato le " + numero(obiettivo) + " firme. Più siamo, più contiamo: firma anche tu.");
    scrivi(".js-frase-record", "L'obiettivo delle " + numero(obiettivo) + " firme è raggiunto: più siamo, più contiamo.");
  }

  // l'ultimo centinaio superato diventa un'etichetta al posto di "Obiettivo 1.000 firme"
  var occhiello = document.querySelector(".meter__eyebrow");
  var centinaio = Math.floor(firme / 100) * 100;
  if (occhiello && centinaio >= 100) {
    occhiello.textContent = "Superate le " + numero(centinaio) + " firme";
    occhiello.classList.add("meter__eyebrow--festa");
  }

  // La quota (firme / obiettivo) serve anche alle altre figure dell'avanzamento:
  // la punta dell'anello, l'anellino della barra in basso, la barra della chiusura.
  radice.style.setProperty("--quota", quota.toFixed(4));
  document.querySelectorAll(".js-arco").forEach(function (arco) {
    arco.setAttribute("stroke-dasharray", (quota * 100).toFixed(1) + " 100");
  });

  var barra = document.querySelector(".ring__bar");
  if (barra) {
    var giro = 2 * Math.PI * 104;
    var arrivo = giro * (1 - quota);
    barra.setAttribute("stroke-dasharray", giro.toFixed(2));
    barra.setAttribute("stroke-dashoffset", arrivo.toFixed(2));
    var titolo = document.getElementById("ring-t");
    if (titolo) titolo.textContent = numero(firme) + " firme raccolte su " + numero(obiettivo);

    // L'anello si riempie con un'animazione del foglio di stile (parte subito, anche senza questo file).
    // Qui i numeri ("firme" che sale, "ne mancano" che scende) e la punta seguono l'anello passo passo,
    // così restano sempre allineati.
    var cifra = document.querySelector(".ring__num .js-firme");
    var resto = document.querySelector(".meter .js-mancano");
    var punta = document.querySelector(".ring__tip");
    if (!fermo && window.requestAnimationFrame && window.getComputedStyle) {
      var partenza = null;
      var tetto = Math.pow(10, String(mancano).length) - 1;
      var segui = function (ora) {
        if (partenza === null) partenza = ora;
        var scarto = parseFloat(getComputedStyle(barra).strokeDashoffset);
        var q = isNaN(scarto) ? quota : Math.max(0, Math.min(1 - scarto / giro, 1));
        if (Math.abs(q - quota) < 0.0008 || ora - partenza > 3500) {
          if (cifra) cifra.textContent = numero(firme);
          if (resto) resto.textContent = numero(mancano);
          if (punta) punta.style.transform = "";
          return;
        }
        if (cifra) cifra.textContent = numero(Math.round(q * obiettivo));
        // il conto alla rovescia non usa mai più cifre del numero finale: la riga non cambia lunghezza
        if (resto) resto.textContent = numero(Math.min(Math.max(obiettivo - Math.round(q * obiettivo), 0), tetto));
        if (punta) punta.style.transform = "rotate(" + (q * 360).toFixed(2) + "deg)";
        requestAnimationFrame(segui);
      };
      requestAnimationFrame(segui);
    }
  }

  // ---- giorni che restano per firmare ----
  var scadenza = (cfg.scadenza || "").split("-").map(Number);
  if (scadenza.length === 3) {
    var oggi = new Date();
    var giorni = Math.round((Date.UTC(scadenza[0], scadenza[1] - 1, scadenza[2]) -
      Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate())) / 86400000);
    if (giorni > 1) {
      scrivi(".js-giorni-frase", "Restano " + giorni + " giorni: la raccolta chiude l'11 marzo 2027.");
    }
  }

  // ---- indirizzo da condividere ----
  // Sul sito pubblico si condivide l'indirizzo della pagina stessa, così il link
  // resta giusto anche quando cambia il dominio.
  var sito = cfg.sito || "";
  var host = location.hostname || "";
  if (/^https?:$/.test(location.protocol) && host && !/claude|localhost|127\.0\.0\.1/.test(host)) {
    sito = location.origin + location.pathname;
  }

  var wa = document.querySelector(".js-whatsapp");
  if (wa && sito) {
    var messaggio = "Salviamo la Bonetti: la scuola primaria di via Tajani 12 rischia di chiudere. " +
      "Servono 1.000 firme, bastano pochi minuti con SPID o CIE. " + sito;
    wa.href = "https://wa.me/?text=" + encodeURIComponent(messaggio);
  }

  // ---- copia negli appunti ----
  var copia = function (testo) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(testo);
    }
    return Promise.reject(new Error("appunti non disponibili"));
  };
  var seleziona = function (el) {
    if (!el) return;
    var r = document.createRange();
    r.selectNodeContents(el);
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  };

  document.querySelectorAll(".js-copy").forEach(function (btn) {
    var spegni = null;
    btn.addEventListener("click", function () {
      var cosa = btn.dataset.copy;
      var testo = cosa === "mail" ? "salviamobonetti@gmail.com" : sito;
      var esito = document.getElementById(cosa === "mail" ? "copia-mail-esito" : "copia-esito");
      copia(testo).then(function () {
        if (esito) esito.textContent = cosa === "mail" ? "Indirizzo copiato." : "Link copiato: incollalo dove vuoi.";
        // il pulsante si accende per un paio di secondi: conferma visibile sotto il dito
        btn.classList.add("is-done");
        clearTimeout(spegni);
        spegni = setTimeout(function () { btn.classList.remove("is-done"); }, 2200);
      }).catch(function () {
        if (cosa === "mail") seleziona(document.getElementById("indirizzo-mail"));
        if (esito) esito.textContent = cosa === "mail" ? "Seleziona e copia l'indirizzo qui sopra." : "Copia questo indirizzo: " + testo;
      });
    });
  });

  // ---- menu su telefono (quello in alto e quello nella barra in basso):
  //      si chiudono scegliendo una voce, toccando fuori o con Esc ----
  var menuBasso = document.getElementById("menu-basso");
  [document.getElementById("menu"), menuBasso].forEach(function (menu) {
    if (!menu) return;
    menu.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) menu.open = false;
    });
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
    // se si riprende a scorrere la pagina, il menu si richiude da solo
    var doveAperto = 0;
    menu.addEventListener("toggle", function () { doveAperto = window.pageYOffset; });
    window.addEventListener("scroll", function () {
      if (menu.open && Math.abs(window.pageYOffset - doveAperto) > 90) menu.open = false;
    }, { passive: true });
  });

  // ---- barra "Firma ora": compare quando il pulsante dell'apertura esce dallo schermo,
  //      e si fa da parte quando è visibile il pulsante della chiusura ----
  var dock = document.getElementById("dock");
  var cta = document.querySelector(".hero__cta");
  if (dock && cta && "IntersectionObserver" in window) {
    var link = dock.querySelector("a");
    var vede = { apertura: true, chiusura: false };
    var aggiornaBarra = function () {
      var nascosta = vede.apertura || vede.chiusura;
      dock.classList.toggle("is-on", !nascosta);
      dock.setAttribute("aria-hidden", nascosta ? "true" : "false");
      if (link) link.tabIndex = nascosta ? -1 : 0;
      if (nascosta && menuBasso) menuBasso.open = false;
    };
    new IntersectionObserver(function (voci) {
      vede.apertura = voci[0].isIntersecting;
      aggiornaBarra();
    }, { threshold: 0 }).observe(cta);
    var ultimo = document.querySelector(".final .btn");
    if (ultimo) {
      new IntersectionObserver(function (voci) {
        vede.chiusura = voci[0].isIntersecting;
        aggiornaBarra();
      }, { threshold: 0.6 }).observe(ultimo);
    }
  }

  // ---- i numeri del risultato salgono quando entrano nello schermo ----
  var conti = document.querySelectorAll("[data-conta]");
  if (conti.length && !fermo && "IntersectionObserver" in window && window.requestAnimationFrame) {
    var vedetta = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        vedetta.unobserve(v.target);
        var el = v.target, arrivoN = parseInt(el.getAttribute("data-conta"), 10) || 0, t0 = null;
        var sali = function (ora) {
          if (t0 === null) t0 = ora;
          var k = Math.min((ora - t0) / 1300, 1);
          el.textContent = numero(Math.round(arrivoN * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(sali);
        };
        requestAnimationFrame(sali);
      });
    }, { threshold: 0.6 });
    conti.forEach(function (el) { vedetta.observe(el); });
  }

  // ---- comparsa morbida allo scorrimento ----
  if (!fermo && "IntersectionObserver" in window) {
    var pezzi = Array.prototype.slice.call(document.querySelectorAll(
      ".sheet, .timeline li, .zeros__grid li, .story li, .spent, .reasons li, .quote blockquote, .asks li, " +
      ".steps li, .signbox, .share__btns, .flyer, .news, .faq details, .goal, .record__numeri li"));
    var mostra = function (el) {
      if (el.classList.contains("in")) return;
      el.addEventListener("transitionend", function fine(e) {
        if (e.target !== el || e.propertyName !== "transform") return;
        el.removeEventListener("transitionend", fine);
        // lascia il tempo alle animazioni interne (barre, numeri) e poi toglie le classi
        setTimeout(function () {
          el.classList.remove("rv", "in");
          el.style.transitionDelay = "";
        }, 1400);
      });
      el.classList.add("in");
    };
    var occhio = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        occhio.unobserve(v.target);
        mostra(v.target);
      });
    }, { rootMargin: "0px 0px -7% 0px" });
    // quello che è già sullo schermo quando arriva questo file resta com'è: niente sfarfallii
    var soglia = window.innerHeight;
    pezzi = pezzi.filter(function (el) { return el.getBoundingClientRect().top >= soglia; });
    pezzi.forEach(function (el) {
      // gli elementi vicini compaiono uno dopo l'altro
      var fratelli = el.parentNode ? el.parentNode.children : [];
      var posto = Array.prototype.indexOf.call(fratelli, el);
      el.classList.add("rv");
      el.style.transitionDelay = (Math.max(posto, 0) % 3) * 80 + "ms";
      occhio.observe(el);
    });
    radice.classList.add("anim");
    // rete di sicurezza: quello che è già stato superato scorrendo (o saltando con un link) non resta mai nascosto
    var inAttesa = false;
    var recupera = function () {
      inAttesa = false;
      var fondo = window.innerHeight * 0.96;
      var fine = window.innerHeight + window.pageYOffset >= radice.scrollHeight - 4;
      pezzi = pezzi.filter(function (el) {
        if (el.classList.contains("in") || !el.classList.contains("rv")) return false;
        if (fine || el.getBoundingClientRect().top < fondo) { occhio.unobserve(el); mostra(el); return false; }
        return true;
      });
      if (!pezzi.length) window.removeEventListener("scroll", suScorri);
    };
    var suScorri = function () {
      if (inAttesa) return;
      inAttesa = true;
      requestAnimationFrame(recupera);
    };
    window.addEventListener("scroll", suScorri, { passive: true });
  }

  // ---- domande: apertura e chiusura morbide ----
  if (!fermo && "animate" in document.documentElement) {
    document.querySelectorAll(".faq details").forEach(function (d) {
      var s = d.querySelector("summary");
      var inCorso = null;
      if (!s) return;
      s.addEventListener("click", function (e) {
        e.preventDefault();
        var apre = !d.open || (inCorso && d.dataset.verso === "chiude");
        var da = d.offsetHeight;
        if (inCorso) inCorso.cancel();
        if (apre) d.open = true;
        d.dataset.verso = apre ? "apre" : "chiude";
        var a = apre ? d.scrollHeight : s.offsetHeight;
        d.style.overflow = "hidden";
        var questa = d.animate({ height: [da + "px", a + "px"] }, { duration: apre ? 320 : 240, easing: "cubic-bezier(.2,.7,.2,1)" });
        inCorso = questa;
        if (apre) {
          var testo = d.querySelector("p");
          if (testo) testo.animate({ opacity: [0, 1], transform: ["translateY(-6px)", "none"] }, { duration: 320, easing: "ease-out" });
        }
        questa.onfinish = function () {
          if (inCorso !== questa) return;
          if (!apre) d.open = false;
          d.style.overflow = "";
          inCorso = null;
        };
      });
    });
  }

  // ---- le animazioni continue (disegni, nastro, frecce) si fermano quando non si vedono: risparmia batteria ----
  if ("IntersectionObserver" in window) {
    document.querySelectorAll(".hero, .ticker, .notte").forEach(function (scena) {
      new IntersectionObserver(function (voci) {
        scena.classList.toggle("is-off", !voci[0].isIntersecting);
      }, { threshold: 0 }).observe(scena);
    });
  }

  // ---- i menu segnano la sezione in cui ci si trova; su computer la testata segue la pagina ----
  var testata = document.querySelector(".top");
  var voci = document.querySelectorAll(".top__nav a, .menu__panel a, .dock__panel a");
  if (testata && voci.length) {
    var sezioni = [];
    voci.forEach(function (a) {
      var s = document.getElementById((a.getAttribute("href") || "").slice(1));
      if (s) sezioni.push({ el: s, link: a });
    });
    var segna = function () {
      testata.classList.toggle("is-stuck", window.pageYOffset > 8);
      var riga = window.innerHeight * 0.35;
      sezioni.forEach(function (x) {
        var b = x.el.getBoundingClientRect();
        x.link.classList.toggle("is-here", b.top <= riga && b.bottom > riga);
      });
    };
    var segnaInAttesa = false;
    window.addEventListener("scroll", function () {
      if (segnaInAttesa) return;
      segnaInAttesa = true;
      requestAnimationFrame(function () { segnaInAttesa = false; segna(); });
    }, { passive: true });
    segna();
  }

  // ---- su telefono: lo stato "premuto" dei pulsanti risponde subito al tocco ----
  document.addEventListener("touchstart", function () {}, { passive: true });

  // ---- aggiornamenti: se sono tanti, mostra i primi cinque ----
  var lista = document.getElementById("lista-aggiornamenti");
  var tutti = document.getElementById("mostra-tutti");
  if (lista && tutti) {
    var notizie = lista.querySelectorAll(".news");
    var LIMITE = 5;
    if (notizie.length > LIMITE) {
      notizie.forEach(function (v, i) { if (i >= LIMITE) v.hidden = true; });
      tutti.hidden = false;
      tutti.addEventListener("click", function () {
        notizie.forEach(function (v) { v.hidden = false; });
        tutti.hidden = true;
      });
    }
  }
})();
