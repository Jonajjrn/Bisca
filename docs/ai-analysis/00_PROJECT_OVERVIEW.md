# 00 — Panoramica Generale del Progetto

## Riepilogo esecutivo

**BiscaWeb** (nome interno: "Bisca: Dictator Edition") è un gioco di carte single-page application basato sulla **Bisca** (variante italiana di trick-taking con bidding), sviluppato interamente come file HTML statico vanilla. Non esiste backend, database, autenticazione o build system. Il giocatore umano sfida bot controllati da una rudimentale IA con personalità da "dittatore" a tema satirico-politico.

---

## Stack tecnologico

| Layer | Tecnologia | Versione/Dettaglio |
|---|---|---|
| Frontend | HTML5 + CSS3 + JavaScript (ES6) | Vanilla, nessun framework |
| Styling | CSS custom properties, Grid Layout, Flexbox, Animazioni CSS | Tutto inline in `<style>` |
| Font | Google Fonts (Russo One, Share Tech Mono, Press Start 2P, Bangers) | Caricati via CDN |
| Icone | `logo.png` come favicon | PNG statico |
| Immagini carte | 40 PNG (4 semi × 10 valori) | Naming: `{seme}{valore}.png` |
| Immagini avatar | 12 PNG di dittatori/politici | Naming: `{nome}.png` |
| Backend | **Nessuno** | - |
| Database | **Nessuno** | - |
| Build tool | **Nessuno** | - |
| Package manager | **Nessuno** (no `package.json`) | - |
| Test | File HTML duplicati in `tests/` | Nessun framework di test |
| Version control | **Nessuno** (no `.git`) | - |

---

## Come si avvia il progetto

L'unico modo è aprire `index.html` direttamente in un browser:

```bash
# Modo 1: doppio click sul file
xdg-open index.html

# Modo 2: server HTTP statico (per evitare problemi CORS su fetch futuri)
python3 -m http.server 8080
# Poi aprire http://localhost:8080
```

Non esiste `npm start`, `docker-compose up`, o comandi equivalenti.

---

## Struttura cartelle commentata

```
BiscaWeb/
├── index.html              # Gioco principale (1265 righe) — CSS + JS embedded
├── tutorial.html           # Tutorial interattivo (310 righe, 6 slide)
├── logo.png                # Logo grande/favicon (979 KB)
├── LogoGran.png            # Logo grande per sfondo (6.6 MB)
├── LogoPiccolo.png         # Logo piccolo (90 KB)
│
├── img/
│   ├── {seme}{valore}.png  # 40 carte napoletane/piacentine (4 semi × 10 valori)
│   │                       # Semi: bastoni, spade, coppe, denari
│   │                       # Valori: 1(A)-10(Re), denominati via FILE_MAP
│   ├── portraits/          # 12 ritratti dittatori (PNG, 14KB-230KB)
│   │   ├── mussolini.png, hitler.png, stalin.png, napoleone.png, cesare.png
│   │   ├── gheddafi.png, fidel.png, lenin.png, kim.png, franco.png, mao.png
│   │   ├── trump.png, putin.png, berlusconi.png, biden.png, churchill.png
│   │   # NOTA: mancano i ritratti per Attila, Gengis (nomi in DICTATORS senza PNG)
│   └── *.xml               # 3 file XML residui Android (border_selected, button_gradient,
│                           #   ic_launcher_background, not_selected) — probabile legacy
│                           #   da una versione Android, INUTILI nel progetto web
│
└── tests/
    ├── indexvecchio.html           # Versione iniziale (694 righe)
    ├── index (copy).html           # Copia di backup (632 righe)
    ├── prova.html                  # Prototipo (831 righe)
    ├── prova_2.html                # Iterazione 2 (879 righe)
    ├── prova_3.html                # Iterazione 3 (906 righe)
    ├── prova_4.html                # Iterazione 4 (961 righe)
    ├── prova_5.html                # Iterazione 5 (965 righe)
    ├── prova_6.html                # Iterazione 6 (1042 righe)
    ├── prova_6.1.html              # Variante 6.1 (1085 righe)
    ├── prova_7.html                # Iterazione 7 (1217 righe)
    ├── prova_7.1.html              # Variante 7.1 (1231 righe)
    ├── prova_8.html                # Iterazione 8 (1302 righe) — ULTIMA prima della finale
    └── prova_8.1 (copy).html       # Copia di backup 8.1 (1253 righe)
```

### Note sulla struttura

- I file `tests/` mostrano una chiara evoluzione incrementale: da ~694 righe (indexvecchio) a ~1302 (prova_8), con `index.html` a 1265 righe come versione finale "compattata".
- Ci sono **13 file di test/prototipo**, quasi tutti varianti funzionanti con piccole differenze. Questo è un anti-pattern: nessun version control, sviluppo per duplicazione.
- I 3 file `.xml` in `img/` sono residui di un progetto Android (probabilmente un porting o un'origine diversa). Non hanno alcuna funzione nel progetto web attuale.
- Non esiste `node_modules/`, `.git/`, `dist/`, `build/` — il progetto è pre-framework.

---

## Cosa sembra già funzionare

1. **Setup iniziale** — schermata con input nome, selezione vite, carte iniziali, numero avversari
2. **Sorteggio mazziere animato** — ogni giocatore pesca una carta, la più bassa inizia
3. **Distribuzione carte** — mazzo creato e mescolato (Fisher-Yates), smazzate corrette
4. **Fase bidding (dichiarazione prese)** — tutti i giocatori dichiarano quante mani vinceranno
5. **Regola dell'ultimo (forbidden bid)** — l'ultimo giocatore non può pareggiare i conti
6. **Fase di gioco (trick-taking)** — i giocatori calano una carta a turno
7. **Risoluzione presa** — confronto per seme/valore, jolly gestito
8. **Asso di Denari come Jolly** — scelta MAX/MIN quando calato da umano
9. **Calcolo penalità** — differenza tra bid e prese effettive, perdita vite
10. **Eliminazione giocatori** — quando vite <= 0
11. **Modalità Indiana (1 carta)** — round speciale con carta sulla fronte (coperta)
12. **Modalità Duello** — transizione drammatica quando restano 2 giocatori con 1 vita
13. **Schermata vittoria** — con coriandoli animati
14. **Bot IA base** — calcolo forza mano, decisione bid, scelta carta da giocare
15. **Dialoghi bot** — sistema di "personalità" (Aggressive, Paranoid, Showman, Iceman) con frasi contestuali
16. **Speech bubble** — fumetti animati sopra i bot
17. **Avatar con fallback** — immagine portrait o iniziale
18. **Interfaccia responsive base** — CSS Grid, viewport height, flexbox
19. **Tutorial interattivo** — 6 slide con navigazione

---

## Cosa sembra incompleto o fragile

1. **Nessuna gestione errori** — se un'immagine non carica, fallback solo per avatar (non per carte)
2. **Mao parla solo cinese** — Mao Zedong ha frasi hardcodate in cinese, ma non esiste logica per caratteri non-latini nei font
3. **IA bot semplicistica** — non considera carte già giocate, non ha memoria del round, non bluffa
4. **Nessuna pausa/riprendi** — se chiudi il browser, perdi tutto
5. **Nessun salvataggio stato** — no localStorage, no sessionStorage, no cookie
6. **Nessuna impostazione audio/video** — non ci sono suoni né musica
7. **Nessuna accessibilità** — no ARIA labels, no keyboard navigation, solo click
8. **Manca regola del "taglio"** — nella vera Bisca, il mazziere taglia il mazzo
9. **Mancano i PNG per Attila e Gengis Khan** — DICTATORS contiene "Attila" e "Gengis" ma `img/portraits/` non ha i file corrispondenti. Il fallback mostrerà l'iniziale.
10. **Risorse pesanti** — `LogoGran.png` (6.6 MB) e `logo.png` (979 KB) sono troppo grandi
11. **Nessuna gesture mobile** — solo click, niente swipe o tap avanzati
12. **Bot non hanno logica specifica per semi** — non sanno qual è il seme di vantaggio (Denari > Coppe > Spade > Bastoni), si basano solo su `baseScore`
13. **`showFloatMsg` dichiarata ma vuota** — riga 859: funzione placeholder che non fa nulla
14. **Nessun test automatizzato** — verifiche solo manuali
15. **Tutorial non accessibile dal gioco** — devi tornare indietro manualmente

---

## Rischi principali

| Rischio | Gravità | Descrizione |
|---|---|---|
| Assenza version control | Alta | Sviluppo per duplicazione file, impossibile tracciare modifiche, rollback inesistente |
| Logica client-side totale | Critica | In ottica multiplayer: ogni aspetto del gioco è manipolabile da DevTools |
| Codice monolitico | Media | 1200+ righe in un unico file HTML, nessuna separazione delle responsabilità |
| Zero persistenza | Alta | Nessun dato sopravvive a un refresh della pagina |
| File spazzatura | Bassa | XML Android inutili, 13 file test duplicati, 3 logo diversi |
| Performance | Media | Immagini non ottimizzate, nessun lazy loading |
| Compatibilità browser | Bassa | CSS Grid e animazioni moderne, no test su browser vecchi |
| DIPENDENZA da Google Fonts CDN | Media | Se CDN down, i font degradano ma il gioco resta usabile |
| Nessuna licenza | Alta | Codice senza licenza esplicita, ambiguo per riuso/fork |

---

## Livello generale di maturità del progetto

**Prototipo funzionale avanzato** (TRL 4-5 su scala NASA).

È un proof-of-concept ben realizzato per il single-player locale. Il gameplay loop è completo (setup → sorteggio → distribuzione → bidding → gioco → penalità → prossimo round → vittoria). L'UI è curata esteticamente con attenzione al dettaglio (animazioni, transizioni, tema dark, fumetti, cuori pixelati).

Tuttavia, il progetto è **fondamentalmente inadatto a diventare multiplayer** senza una riscrittura architetturale quasi completa. Il codice attuale è utile come:
- Reference per le regole di gioco
- Base per l'UI del nuovo client
- Dataset di asset grafici (carte, ritratti)

Non è invece riutilizzabile come game engine o come server.

---

## Prossima lettura consigliata

1. `01_FEATURE_MAP.md` — ogni funzionalità analizzata nel dettaglio
2. `02_GAME_RULES_AND_LOGIC.md` — regole effettive e logica interna
3. `03_ARCHITECTURE_REVIEW.md` — qualità del codice e proposta nuova architettura
