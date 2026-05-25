# 03 — Analisi architetturale

## Architettura attuale

L'architettura è **monolitica a singolo file HTML con embedded CSS e JS**. Non esiste alcuna separazione formale tra componenti.

```
index.html (1265 righe)
├── <style> (righe 10-342)
│   ├── Variabili CSS (:root)
│   ├── Layout (body, #game-area, grid)
│   ├── Componenti UI (.player-box, .card-placeholder, .speech-bubble, ...)
│   └── Animazioni (@keyframes)
│
├── <div id="setup-screen"> (setup pre-partita)
├── <div id="duel-transition-screen"> (schermata transizione)
├── <div id="victory-screen"> (schermata vittoria)
├── <div id="jolly-modal"> (modale jolly)
├── <div id="game-area"> (layout principale di gioco)
│
└── <script> (righe 450-1262)
    ├── Dati: DIALOGUE_DB, DICTATORS, ITALIAN_NAMES, SEMI, VALORI, FILE_MAP
    ├── Stato globale: deck, players, tableCards, cardsToDeal, delta, ...
    ├── Classi: Card, Player
    ├── Funzioni di setup: determineFirstDealer, createDeck
    ├── Funzioni di gioco: startRound, doBidding, playTurn, resolveTrick, endRound
    ├── IA bot: calculateBotMove, logica bidding bot
    ├── Dialoghi: triggerBotChat, showSpeechBubble, getBotDialogue
    ├── UI/render: updateUI, renderBotGroup, showBidButtons
    └── Event handler: enableCards, enableCardsInteraction
```

---

## Separazione delle responsabilità

| Preoccupazione | Dove si trova | Valutazione |
|---|---|---|
| Stato del gioco | 8 variabili globali + `players[]`, `deck[]`, `tableCards[]` | Pessimo — stato globale mutabile senza incapsulamento |
| Logica di gioco | Funzioni `startRound`, `playTurn`, `resolveTrick`, `endRound` | Discreto — funzioni con nomi chiari, ma mischiate a chiamate UI |
| Rendering | `updateUI()` — una funzione enorme (~300 righe) che fa tutto | Pessimo — nessuna separazione view/state |
| IA bot | `calculateBotMove()` + logica inline in `doBidding()` | Sufficiente — isolata ma con soglie magiche |
| Dialoghi | `DIALOGUE_DB` + funzioni helper | Buono — l'unica parte decentemente incapsulata |
| Animazioni | CSS `@keyframes` + manipolazione classi inline | Discreto — CSS per animazioni, JS per trigger |
| Persistenza | Assente | N/A |
| Networking | Assente | N/A |
| Error handling | Assente | Pessimo |

---

## Qualità dei componenti

### `Card` class
- **Buono**: Incapsula proprietà e metodi della carta
- **Carente**: `baseScore` calcolato con magia numerica, nessuna documentazione

### `Player` class
- **Buono**: Semplice, proprietà chiare
- **Carente**: Solo dati, nessun metodo. Manca `id` univoco.
- **Carente**: `eliminated` è una proprietà del giocatore, ma concettualmente dovrebbe essere una proprietà della partita

### Sistema dialoghi
- **Buono**: Data-driven (`DIALOGUE_DB`), estensibile, personalità chiare
- **Buono**: Separazione tra tipo personalità e nomi
- **Carente**: Le frasi sono poche (4-5 per tipo per evento)

---

## Naming

- **Buono**: `SEMI`, `VALORI`, `FILE_MAP` — chiari e descrittivi
- **Buono**: `ITALIAN_NAMES`, `DICTATORS` — autoesplicativi
- **Buono**: Funzioni con verbi: `createDeck`, `startRound`, `resolveTrick`
- **Carente**: `delta` — non è chiaro cosa sia (è la direzione di incremento carte per round)
- **Carente**: `enableCards` vs `enableCardsInteraction` — nomi troppo simili, il primo è pubblico, il secondo "privato"
- **Carente**: `proceedToBidding` e `doBidding` — non è chiaro il confine tra i due
- **Carente**: Variabili globali senza prefisso: `deck`, `players`, `tableCards`, `delta` — conflitto facile

---

## Duplicazioni

1. **13 file test in `tests/`**: tutte varianti quasi identiche. Dovrebbero essere commit git, non file separati.
2. **3 file logo** (`logo.png`, `LogoGran.png`, `LogoPiccolo.png`) — ridondanti, `LogoGran.png` è 6.6MB
3. **File XML Android in `img/`**: completamente inutili
4. **Card rendering duplicato**: la logica per mostrare carte sul tavolo (righe 1136-1162) è simile ma non uguale a quella per le carte del giocatore (righe 1070-1107)
5. **Hearts rendering duplicato**: cuori del giocatore (righe 1051-1057) e cuori dei bot (righe 1199-1203) hanno logica simile

---

## Complessità inutile

1. **`roundStarterCounter`**: è un contatore globale incrementato a ogni round. Ma l'offset del mazziere si calcola ogni volta come `activePlayers[roundStarterCounter % activePlayers.length]`. Se un giocatore viene eliminato, il contatore potrebbe "saltare" un giocatore. La logica funziona ma è fragile.

2. **`isDeterminingDealer`**: booleano globale usato per saltare il rendering normale durante il sorteggio. Sarebbe più pulito con uno state enum: `GAME_PHASE: SETUP | DEALER_DRAW | BIDDING | PLAYING | ROUND_END | GAME_OVER`.

3. **Bidding annidato con callback**: `doBidding()` è ricorsivo e alterna codice sync (umano) e async (bot con setTimeout). Il flusso di controllo è difficile da seguire.

4. **`cardClickCallback` variabile globale**: pattern fragile per passare il callback di click dalla logica di gioco alla UI.

---

## Accoppiamento

Il codice è **fortemente accoppiato**:

- `updateUI()` referenzia direttamente `document.getElementById(...)` per 10+ elementi
- `resolveDealerDraw()` manipola direttamente classi CSS e stili inline
- `endRound()` costruisce HTML via template string e manipola DOM
- `showBidButtons()` crea pulsanti con `onclick` inline
- Ogni funzione di gioco chiama `updateUI()` dopo ogni cambiamento di stato

**Per passare a multiplayer**, l'accoppiamento game-DOM va completamente spezzato.

---

## Scalabilità

- **Giocatori**: Il codice supporta fino a 7 giocatori (1 umano + 6 bot). L'UI a griglia diventa problematica sopra i 6.
- **Round**: Ciclo potenzialmente infinito (non scalabile per multiplayer)
- **Codice**: Monolitico, non scalabile per funzionalità (ogni nuova feature richiede modifiche al file principale)
- **Performance**: Nessun problema con 40 carte e max 7 giocatori. I bot rispondono in <1ms.

---

## Manutenibilità

- **Bassa**: Qualsiasi modifica richiede la comprensione dell'intero flusso
- **Bassa**: Nessun test, refactoring pericoloso
- **Bassa**: Variabili globali mutabili = difficile debug
- **Bassa**: 1265 righe in un file, senza tooling (linter, formatter)

---

## Testabilità

- **Molto bassa**: Nessuna funzione è esportabile/importabile
- **Molto bassa**: Le funzioni dipendono da variabili globali e DOM
- **Impossibile**: Non c'è un framework di test, non c'è `package.json`, non c'è `import/export`
- L'unico "test" possibile è aprire il file in un browser e giocare manualmente

---

## Architettura ideale futura

### Diagramma a componenti

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   UI     │  │  Game    │  │  Sound        │  │  Network    │ │
│  │  Render  │  │  State   │  │  Manager      │  │  Client     │ │
│  │  (View)  │  │ (Client) │  │               │  │ (WebSocket) │ │
│  └────┬─────┘  └────┬─────┘  └──────────────┘  └──────┬──────┘ │
│       │             │                                  │        │
│       └──────┬──────┘                                  │        │
│              │                                         │        │
│  ┌───────────┴───────────┐                             │        │
│  │   Game Controller     │◄────────────────────────────┘        │
│  │   (client-side)       │                                      │
│  └───────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                    WebSocket │ (wss://)
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                       GAME SERVER (authoritative)                │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Game    │  │  Match   │  │  Auth    │  │  Economy      │  │
│  │  Engine  │  │  Making  │  │  Service │  │  Service      │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │             │             │               │            │
│       └──────┬──────┘             │               │            │
│              │                    │               │            │
│  ┌───────────┴────────────────────┴───────────────┴──────────┐ │
│  │                     DATA LAYER                             │ │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  │ │
│  │  │ Game    │  │ User     │  │ Wallet    │  │ Audit    │  │ │
│  │  │ Store   │  │ Store    │  │ Store     │  │ Log      │  │ │
│  │  └─────────┘  └──────────┘  └───────────┘  └──────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Stack tecnologico proposto

| Layer | Tecnologia consigliata | Alternative valide |
|---|---|---|
| **Frontend framework** | React + TypeScript | Vue 3, SvelteKit |
| **State management** | Zustand o Jotai | Redux Toolkit, MobX |
| **UI Components** | Tailwind CSS + shadcn/ui | CSS Modules, Chakra UI |
| **WebSocket client** | `ws` o Socket.IO client | Native WebSocket |
| **Backend server** | Node.js + TypeScript | Go, Rust, Elixir |
| **WebSocket server** | Socket.IO o uWebSockets.js | ws, WebSocket bare |
| **Game engine (server)** | Modulo TypeScript puro (senza framework) | - |
| **Database** | PostgreSQL | SQLite (per MVP), MySQL |
| **ORM/Query builder** | Drizzle ORM o Prisma | Knex, Kysely |
| **Autenticazione** | JWT (access + refresh token) | Session-based con Redis |
| **Cache** | Redis | - |
| **Rate limiting** | express-rate-limit + Redis store | - |
| **Logging** | Pino + audit table SQL | Winston |
| **Deploy** | Docker + Docker Compose | Kubernetes per scale-out |
| **CI/CD** | GitHub Actions | - |
| **Test** | Vitest (unit), Playwright (e2e) | Jest, Cypress |

### Struttura cartelle proposta

```
biscaweb/
├── client/                       # Frontend React
│   ├── src/
│   │   ├── components/           # Componenti UI
│   │   │   ├── GameBoard.tsx
│   │   │   ├── PlayerHand.tsx
│   │   │   ├── BotBox.tsx
│   │   │   ├── CardComponent.tsx
│   │   │   ├── BiddingPanel.tsx
│   │   │   ├── SpeechBubble.tsx
│   │   │   ├── VictoryScreen.tsx
│   │   │   ├── LobbyScreen.tsx
│   │   │   └── SetupScreen.tsx
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useGameSocket.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useGameState.ts
│   │   ├── stores/              # State management
│   │   │   ├── gameStore.ts
│   │   │   ├── authStore.ts
│   │   │   └── lobbyStore.ts
│   │   ├── types/               # TypeScript interfaces
│   │   │   └── game.ts
│   │   ├── assets/              # Immagini, suoni
│   │   └── App.tsx
│   ├── public/
│   │   └── img/                 # Carte, avatar (dal progetto attuale)
│   ├── package.json
│   └── vite.config.ts
│
├── server/                       # Backend principale
│   ├── src/
│   │   ├── engine/              # Game engine PURO (senza I/O)
│   │   │   ├── card.ts
│   │   │   ├── deck.ts
│   │   │   ├── player.ts
│   │   │   ├── game.ts          # Macchina a stati del gioco
│   │   │   ├── bidding.ts
│   │   │   ├── trick.ts
│   │   │   ├── scoring.ts
│   │   │   └── bot.ts           # IA bot (ex calculateBotMove)
│   │   ├── ws/                  # WebSocket handlers
│   │   │   ├── server.ts
│   │   │   ├── handlers/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── lobby.ts
│   │   │   │   ├── game.ts
│   │   │   │   └── chat.ts
│   │   │   └── rooms.ts
│   │   ├── http/                # REST API
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── history.ts
│   │   │   │   └── leaderboard.ts
│   │   │   └── middleware/
│   │   │       ├── auth.ts
│   │   │       └── rate-limit.ts
│   │   ├── db/                  # Database
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── queries/
│   │   ├── services/            # Business logic
│   │   │   ├── auth.ts
│   │   │   ├── economy.ts
│   │   │   ├── matchmaking.ts
│   │   │   └── bot-manager.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── idempotency.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                       # Tipi e costanti condivisi
│   ├── types.ts
│   ├── constants.ts
│   └── validation.ts
│
├── docker-compose.yml
├── .github/workflows/
└── README.md
```

### Perché questa architettura

1. **Game engine separato (server/engine/)**: Moduli TypeScript puri, zero dipendenze da network o database. Testabili con unit test. Riutilizzabili anche per simulazioni o bot training.

2. **WebSocket come canale primario**: Per un gioco di carte a turni, il polling REST sarebbe accettabile, ma WebSocket permette: notifiche push, riconnessione, stato real-time della lobby.

3. **React + TypeScript al frontend**: TypeScript per type safety cross-stack (con `shared/`). React per componenti riutilizzabili (le carte, i bot box, il tavolo sono componenti naturali).

4. **PostgreSQL**: Transazioni ACID necessarie per l'economia virtuale. JSONB per game state flessibile.

5. **Redis**: Session store + cache + rate limiting + pub/sub per scaling orizzontale futuro.

6. **Docker**: Riproducibilità ambiente di sviluppo, deploy semplificato.
