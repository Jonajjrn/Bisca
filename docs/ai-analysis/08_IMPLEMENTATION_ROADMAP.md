# 08 — Roadmap implementativa

## Premessa

Questa roadmap trasforma il prototipo single-player in un gioco multiplayer online completo. L'ordine è **forzato**: ogni milestone dipende dalla precedente. Saltare milestone crea debito tecnico che andrà ripagato con gli interessi.

**Tempo stimato totale**: 12-16 settimane (1 sviluppatore full-time)

---

## Milestone 1: Pulizia e init progetto

**Obiettivo**: Trasformare il progetto in un repository moderno con tooling.

**Azioni**:
1. Inizializzare repo git: `git init`
2. Creare `.gitignore` per node_modules, .env, dist, build
3. Rimuovere file spazzatura:
   - `tests/` (13 file) — spostare in branch archivio o cancellare
   - `img/*.xml` — 3 file XML Android inutili
   - `LogoGran.png` (6.6MB mai usato direttamente)
4. Rinominare asset coerentemente (le carte sono già ben nominate)
5. Creare `README.md` base
6. Inizializzare `package.json` nella root (o nella nuova struttura `client/` e `server/`)

**Rischi**: Nessuno. Operazioni sicure e reversibili.

**Criteri di completamento**:
- `git status` pulito
- Cartella `img/` contiene solo PNG rilevanti
- `tests/` svuotato o rimosso
- README.md spiega cos'è il progetto

**Non fare**: Non toccare `index.html` (serve come reference per le regole)

---

## Milestone 2: Estrazione game engine puro

**Obiettivo**: Separare la logica di gioco dalla UI in moduli TypeScript.

**Azioni**:
1. Creare `shared/types.ts` con interfacce: `Card`, `Player`, `GameState`, `TrickResult`, `RoundResult`
2. Creare `server/engine/` con:
   - `card.ts`: classe `Card` senza riferimenti a DOM
   - `deck.ts`: `createDeck()`, `shuffle()` (con seed per test deterministici)
   - `player.ts`: classe `Player` con `id` univoco
   - `game.ts`: classe `Game` — macchina a stati
   - `bidding.ts`: logica bidding (estratta da `doBidding`)
   - `trick.ts`: logica presa (estratta da `resolveTrick`)
   - `scoring.ts`: logica penalità (estratta da `endRound`)
3. **NON spostare la IA bot** — rimane per ora, verrà rifatta dopo

**Rischi**:
- Interpretare male la logica esistente e introdurre bug di regole
- Perdere edge case durante l'estrazione

**Criteri di completamento**:
- Tutto il game engine è importabile come moduli TypeScript
- I moduli non importano DOM, `document`, `window`
- Test unitari su ogni modulo (vedi Milestone 3)
- Il gioco originale (`index.html`) è stato eseguito e documentato (screenshot di ogni fase) per reference

**File coinvolti**: Nuova cartella `server/engine/`, `shared/types.ts`

---

## Milestone 3: Test della logica di gioco

**Obiettivo**: Garantire che il game engine estratto sia corretto.

**Azioni**:
1. Installare Vitest (o Jest) per unit test
2. Scrivere test per:
   - `deck.ts`: creazione mazzo (40 carte), shuffle deterministico, pesca
   - `card.ts`: `baseScore` corretto per semi/valori, `isJolly()`, `setJollyMode()`
   - `bidding.ts`: forbiddenBid calcolato correttamente, bid validazione
   - `trick.ts`: confronto carte, gerarchia semi, jolly MAX/MIN
   - `scoring.ts`: penalità calcolate, eliminazione a 0 vite
   - `game.ts`: flusso completo di una partita simulata (tutti bot)
3. Test di regressione: simulare 100 partite automatiche e verificare:
   - Nessun crash
   - Il gioco termina sempre con un vincitore
   - Nessun giocatore con vite negative
   - Il mazzo non si esaurisce mai completamente

**Rischi**: Test incompleti lasciano bug nascosti.

**Criteri di completamento**:
- Code coverage >90% su `server/engine/`
- 100 partite simulate senza errori
- Almeno 1 test per ogni edge case identificato nella Fase 2 dell'analisi

**Non fare**: Non scrivere test per il frontend vecchio.

---

## Milestone 4: Backend minimo + database

**Obiettivo**: Server HTTP funzionante con database.

**Azioni**:
1. Inizializzare progetto `server/` con TypeScript + Express/Fastify
2. Configurare Docker Compose con PostgreSQL + Redis
3. Eseguire migrazioni per schema DB (vedi `06_DATABASE_AND_ECONOMY_DESIGN.md`)
4. Implementare endpoint REST base:
   - `POST /api/register` — crea utente
   - `POST /api/login` — restituisce JWT
   - `GET /api/me` — profilo utente
5. Middleware: auth (JWT), rate limit, error handler, request logger
6. Connettere il game engine al server (senza WebSocket ancora)

**Rischi**: Sottovalutare la complessità di auth (password hashing, token refresh, errori).

**Criteri di completamento**:
- `docker-compose up` fa partire tutto
- Posso registrarmi e loggarmi via curl/Postman
- Token refresh funzionante
- Tabelle create correttamente

---

## Milestone 5: Game server WebSocket

**Obiettivo**: Partite giocabili via WebSocket (umano vs bot, single-player server-authoritative).

**Azioni**:
1. Integrare Socket.IO nel server
2. Implementare flusso di gioco completo via WebSocket:
   - Handler `PLAY_CARD`, `MAKE_BID`, `JOLLY_CHOICE`
   - Validazione server-side di ogni azione
   - Broadcast dello stato a tutti i giocatori
3. Implementare `game_state` serialization per recovery
4. Flusso: un umano si connette, riceve 3 bot, gioca una partita completa
5. Servire il frontend React (vedi Milestone 7) dalla stessa porta o CORS

**Rischi**:
- Socket.IO ha una curva di apprendimento
- Gestire disconnessioni mid-game è complesso

**Criteri di completamento**:
- Una partita umano-vs-3-bot giocabile interamente via WebSocket
- Il client non ha mai accesso alle carte dei bot (verificabile nel log)
- Disconnessione e riconnessione funzionanti

**Non fare**: Non implementare lobby, matchmaking, o multiplayer multi-umano.

---

## Milestone 6: Lobby system

**Obiettivo**: Lobby pubbliche e private con autofill bot.

**Azioni**:
1. Implementare CRUD lobby (crea, lista, join, leave)
2. Implementare ready check
3. Implementare timer autofill (45s)
4. Implementare bot autofill da `bot_profiles`
5. Implementare codici invito (6 caratteri)
6. Gestione transizioni di stato lobby (WAITING → STARTING → IN_GAME)

**Rischi**:
- Race condition su join/leave simultanei
- Stato inconsistente se il creatore lascia durante il countdown

**Criteri di completamento**:
- Creazione lobby pubblica visibile nella lista
- Join/leave funzionante
- Lobby privata con codice invito
- Timer autofill con aggiunta bot
- Transizione corretta a IN_GAME

---

## Milestone 7: Frontend React (nuovo client)

**Obiettivo**: Sostituire `index.html` con una SPA React + TypeScript.

**Azioni**:
1. Inizializzare progetto `client/` con Vite + React + TypeScript
2. Implementare componenti:
   - `App.tsx` — router
   - `LoginPage.tsx`, `RegisterPage.tsx` — form auth
   - `LobbyListPage.tsx` — lista lobby pubbliche
   - `LobbyPage.tsx` — dettaglio lobby, ready check, chat
   - `GamePage.tsx` — schermata di gioco
   - `GameBoard.tsx` — il tavolo (area centrale)
   - `PlayerHand.tsx` — carte del giocatore
   - `BotBox.tsx` — box avversario
   - `CardComponent.tsx` — singola carta
   - `BiddingPanel.tsx` — bottoni bid
   - `VictoryScreen.tsx` — schermata vittoria
3. Riutilizzare gli asset PNG dal progetto originale
4. Implementare `useGameSocket` hook per comunicazione WebSocket

**Rischi**:
- Perdita dell'estetica curata del gioco originale
- Molti componenti da implementare

**Criteri di completamento**:
- Login, register, lobby funzionanti da browser
- Partita giocabile completamente
- UI responsive su desktop e mobile
- Animazioni di base (carte giocate, trick vinto)

---

## Milestone 8: Wallet e moneta virtuale

**Obiettivo**: Implementare l'economia virtuale.

**Azioni**:
1. Implementare `POST /api/me/wallet` — GET saldo
2. Implementare transazioni con idempotency key
3. Implementare ricompense post-partita (con scaling in base al rapporto umani/bot)
4. Implementare bonus registrazione (+500)
5. Implementare bonus login giornaliero (+50)
6. Frontend: wallet nella navbar, storico transazioni

**Rischi**:
- Bug di doppia spesa
- Errore nel calcolo ricompense

**Criteri di completamento**:
- Transazione ACID testata (unit test tenta double-spend, fallisce)
- Ricompense calcolate correttamente in base ai parametri partita
- Wallet visibile nell'interfaccia

---

## Milestone 9: Storico partite e leaderboard

**Obiettivo**: Tracciabilità e persistenza.

**Azioni**:
1. Salvare ogni partita in `games` + `game_players` + `game_events` alla fine
2. Endpoint `GET /api/me/history` — storico partite utente
3. Endpoint `GET /api/leaderboard` — classifica per rating
4. Frontend: pagina storico, pagina classifica

**Rischi**: Query lente su leaderboard con molti utenti.

**Criteri di completamento**:
- Storico partite visualizzabile
- Leaderboard aggiornata dopo ogni partita

---

## Milestone 10: Bot avanzati

**Obiettivo**: Migliorare l'IA dei bot oltre l'attuale algoritmo.

**Azioni**:
1. Refactor `calculateBotMove` originale in moduli TypeScript
2. Implementare regola del seme per i bot
3. Implementare livelli di difficoltà:
   - Livello 1: scelte casuali (ma legali)
   - Livello 2: algoritmo attuale
   - Livello 3: algoritmo attuale + memoria carte uscite
   - Livello 4: livello 3 + bluff occasionale
   - Livello 5: livello 4 + adattamento in base al comportamento avversari
4. Popolare tabella `bot_profiles` con i 12+ bot esistenti

**Rischi**:
- Bot di livello 5 potrebbero essere troppo forti (frustrazione)
- Bot di livello 1 potrebbero fare mosse illegali

**Criteri di completamento**:
- Bot rispettano le regole (mai mosse illegali)
- Win rate bot livello 5 vs bot livello 1 >80%
- Win rate bot livello 3 vs umano medio ~50%

---

## Milestone 11: Multiplayer multi-umano

**Obiettivo**: Partite con più umani nella stessa lobby.

**Azioni**:
1. Rimuovere il vincolo "1 umano per lobby"
2. Gestire turni multipli con input umano (il server aspetta l'input di ogni umano)
3. Gestire timeout turno (30 secondi, poi gioca automaticamente carta casuale legale)
4. Broadcast corretti per ogni azione

**Rischi**:
- Latenza percepita (un giocatore lento blocca tutti)
- Disconnessioni più frequenti

**Criteri di completamento**:
- Una partita 4-umani giocabile senza lag eccessivo
- Timeout turno funzionante
- Disconnessione e riconnessione mid-game per tutti i giocatori

---

## Milestone 12: Deploy e hardening

**Obiettivo**: Rilasciare una versione giocabile pubblicamente.

**Azioni**:
1. Dockerfile per client e server
2. `docker-compose.prod.yml` con:
   - Nginx reverse proxy (terminazione TLS)
   - Server Node.js
   - PostgreSQL
   - Redis
3. CI/CD con GitHub Actions (test, build, deploy)
4. Configurare monitoring (healthcheck, logging strutturato)
5. Rate limiting aggressivo su endpoint sensibili
6. Audit log attivo
7. Backup automatico database (daily)

**Rischi**:
- Configurazione errata di sicurezza in produzione
- Performance non testate con carico reale

**Criteri di completamento**:
- Deploy raggiungibile via HTTPS
- Certificato SSL valido
- Login/registrazione funzionante
- Una partita completa giocabile
- Monitoraggio attivo

---

## Milestone 13 (post-lancio): Anti-cheat e moderazione

**Obiettivo**: Rilevare e prevenire cheating.

**Azioni**:
1. Implementare euristiche anti-cheat (vedi `04_SECURITY`)
2. Pannello admin base (lista utenti, flag, ban)
3. Sistema report giocatori
4. Review tool per partite sospette

---

## Diagramma dipendenze tra milestone

```
M1 (pulizia)
 │
M2 (game engine) ── M4 (backend + DB)
 │                    │
M3 (test)             │
                      │
                      M5 (WebSocket game server)
                       │
              ┌────────┴────────┐
              │                 │
         M6 (lobby)      M7 (frontend React)
              │                 │
              └────────┬────────┘
                       │
                  M8 (wallet)
                       │
                  M9 (storico)
                       │
                 M10 (bot avanzati)
                       │
                M11 (multi-umano)
                       │
                M12 (deploy)
                       │
                M13 (anti-cheat)
```

---

## Cosa NON fare in ogni milestone

| Milestone | Non fare |
|---|---|
| M1 | Non modificare `index.html` |
| M2 | Non toccare la UI |
| M3 | Non scrivere test di integrazione (solo unit) |
| M4 | Non implementare WebSocket |
| M5 | Non implementare lobby multi-umano |
| M6 | Non implementare wallet |
| M7 | Non modificare il backend |
| M8 | Non implementare acquisti reali |
| M9 | Non ottimizzare query premature |
| M10 | Non implementare machine learning |
| M11 | Non implementare spettatori |
| M12 | Non lanciare senza aver testato M1-M11 |
| M13 | Non bannare automaticamente (solo flag) |
