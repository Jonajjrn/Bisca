# 09 — Task atomici per Claude Code

Ogni task è formulato come prompt pronto all'uso con Claude Code. I task sono ordinati in modo sicuro, partendo da refactor e comprensione.

---

## Task 1: Inizializzazione Git e pulizia

**Titolo**: Inizializza repository Git e pulisci il progetto

**Obiettivo**: Portare il progetto sotto version control e rimuovere file inutili.

**Istruzioni precise**:
1. Esegui `git init` nella root del progetto
2. Crea un file `.gitignore` con dentro: `node_modules/`, `.env`, `dist/`, `build/`, `.cache/`, `*.log`, `.DS_Store`
3. Fai il commit iniziale con TUTTI i file attuali (messaggio: "Initial commit: BiscaWeb Dictator Edition prototype")
4. Crea un branch `cleanup` e spostati su quello
5. Rimuovi la cartella `tests/` (contiene 13 file prototipo duplicati)
6. Rimuovi i file XML inutili da `img/` (`border_selected.xml`, `button_gradient.xml`, `ic_launcher_background.xml`, `not_selected.xml`)
7. Rimuovi `LogoGran.png` (6.6 MB, mai referenziato da `index.html`)
8. Rinomina `LogoPiccolo.png` in `logo-small.png`
9. Crea un `README.md` minimo (titolo, descrizione, come avviare)
10. Fai il commit sul branch `cleanup`

**Vincoli**:
- NON modificare `index.html` o `tutorial.html`
- NON toccare le immagini delle carte in `img/`
- NON toccare i ritratti in `img/portraits/`
- NON fare merge su main

**Test da eseguire**:
- Apri `index.html` in un browser: il gioco deve funzionare come prima
- Verifica che tutte le carte e i ritratti siano ancora visualizzati
- `git log` deve mostrare 2 commit (iniziale + pulizia)

**Output atteso**: Branch `cleanup` con progetto pulito, `index.html` ancora perfettamente funzionante.

---

## Task 2: Documentazione e snapshot delle regole

**Titolo**: Documenta le regole esatte del gioco come implementate

**Obiettivo**: Creare un riferimento preciso delle regole prima di modificarle.

**Istruzioni precise**:
1. Gioca 3 partite complete su `index.html` con parametri diversi (1, 3, 5 vite, 3/4/6 avversari)
2. Per ogni partita, prendi screenshot di ogni fase: setup, sorteggio, distribuzione, bidding, gioco, risoluzione presa, fine round, eliminazione, duello, vittoria
3. Crea il file `docs/game-rules-reference.md` contenente:
   - Regole implementate (NON quelle ideali, quelle REALI nel codice)
   - Per ogni regola: riferimento alla riga di codice in `index.html`
   - Comportamento osservato vs comportamento atteso
   - Edge case trovati durante il gameplay
4. Includi nella documentazione la gerarchia esatta dei semi e valori come implementata

**Vincoli**:
- NON modificare codice
- Limitati a documentare, non proporre modifiche

**Test da eseguire**: Rileggi il documento e verifica che ogni affermazione sia supportata da un riferimento al codice.

**Output atteso**: `docs/game-rules-reference.md` completo e preciso.

---

## Task 3: Estrai tipi e costanti condivisi

**Titolo**: Crea modulo `shared/` con tipi TypeScript e costanti di gioco

**Obiettivo**: Definire le interfacce TypeScript che useranno sia client che server.

**Istruzioni precise**:
1. Crea la cartella `shared/` nella root del progetto
2. Dentro `shared/`, crea il file `types.ts` con le interfacce TypeScript:
   - `Suit = 'Bastoni' | 'Spade' | 'Coppe' | 'Denari'`
   - `Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | 'Fante' | 'Cavallo' | 'Re'`
   - `Card` (valName: Rank, semeName: Suit, valIdx: number, semeIdx: number, baseScore: number, effectiveScore: number)
   - `Player` (id: string, name: string, isHuman: boolean, lives: number, hand: Card[], bid: number, taken: number, eliminated: boolean)
   - `GamePhase` enum: SETUP | DEALER_DRAW | BIDDING | PLAYING | ROUND_END | GAME_OVER
   - `TableCard` (player: Player, card: Card)
   - `GameState` (players, deck, tableCards, cardsToDeal, currentBidsSum, phase, roundStarterCounter)
3. Crea `shared/constants.ts` con:
   - `SUITS` array ordinato per gerarchia (con commento che spiega perché)
   - `RANKS` array ordinato per valore
   - `RANK_TO_VALUE` mappa (A=1, 2=2, ..., Re=10)
   - `TOTAL_CARDS = 40`
   - `MIN_PLAYERS = 2`, `MAX_PLAYERS = 7`
4. Crea `shared/index.ts` che riesporta tutto
5. Inizializza `package.json` nella root con `{"name": "biscaweb", "private": true}`

**Vincoli**:
- NON creare `client/` o `server/` (solo `shared/`)
- Usa ES module syntax (`export type`, `export const`)
- I tipi devono corrispondere ESATTAMENTE alla logica in `index.html`

**Test da eseguire**:
- Verifica che i tipi siano consistenti: `SUITS[0]` deve essere Bastoni (il più debole), `SUITS[3]` Denari (il più forte)
- Conta: `SUITS.length * RANKS.length` deve essere 40

**Output atteso**: Cartella `shared/` con tipi TypeScript pronti per essere importati.

---

## Task 4: Estrai classe Card in TypeScript

**Titolo**: Implementa modulo Card TypeScript puro

**Obiettivo**: Reimplementare la classe `Card` di `index.html:574-585` in TypeScript puro.

**Istruzioni precise**:
1. Crea `server/engine/card.ts`
2. Implementa classe `Card` che:
   - Prende `rank: Rank` e `suit: Suit` nel costruttore
   - Calcola `baseScore = suitIndex * 100 + rankIndex` (stessa logica di `index.html:579`)
   - Ha `effectiveScore` inizialmente uguale a `baseScore`
   - `isJolly()`: true se rank === 'A' e suit === 'Denari'
   - `setJollyMode(isMax: boolean)`: effectiveScore = isMax ? 1000 : -1
   - `resetScore()`: effectiveScore = baseScore
   - `getImagePath()`: restituisce percorso immagine (es. `img/denari1.png`)
3. Scrivi test in `server/engine/card.test.ts`:
   - Test: `new Card('Re', 'Denari').baseScore` deve essere il massimo (399)
   - Test: `new Card('A', 'Bastoni').baseScore` deve essere il minimo (0)
   - Test: `new Card('A', 'Denari').isJolly()` deve essere true
   - Test: `new Card('Re', 'Spade').isJolly()` deve essere false
   - Test: dopo `setJollyMode(true)`, `effectiveScore` deve essere 1000
   - Test: dopo `setJollyMode(false)`, `effectiveScore` deve essere -1
   - Test: dopo `resetScore()`, `effectiveScore === baseScore`
   - Test: `getImagePath()` per ogni combinazione deve corrispondere al file system

**Vincoli**:
- NESSUNA dipendenza dal DOM o da `document`
- Usa `import type { Suit, Rank } from '../../shared/types.js'`
- NON implementare altre classi (solo Card)

**Test da eseguire**:
- `npx vitest server/engine/card.test.ts` (tutti verdi)

**Output atteso**: `card.ts` + `card.test.ts`, 8+ test tutti passanti.

---

## Task 5: Estrai classe Deck in TypeScript

**Titolo**: Implementa modulo Deck TypeScript puro

**Obiettivo**: Reimplementare `createDeck()` di `index.html:615-622` come classe TypeScript con seed per test.

**Istruzioni precise**:
1. Crea `server/engine/deck.ts`
2. Implementa classe `Deck`:
   - `constructor(seed?: number)`: se seed fornito, usa un PRNG deterministico (algoritmo mulberry32 o simile)
   - `create()`: genera 40 carte (4 semi × 10 valori) e le mescola
   - `shuffle()`: Fisher-Yates shuffle (usando PRNG o `Math.random`)
   - `draw()`: pop dall'array, lancia errore se vuoto
   - `drawMultiple(n: number)`: pop N carte
   - `remaining()`: numero carte rimaste
   - `isEmpty()`: boolean
3. Scrivi test in `server/engine/deck.test.ts`:
   - Test: deck creato ha 40 carte
   - Test: dopo shuffle, ordine diverso da creazione (con seed diverso)
   - Test: stesso seed produce stesso ordine (deterministico)
   - Test: `draw()` riduce il deck di 1
   - Test: `drawMultiple(5)` restituisce 5 carte e deck ha 35 carte
   - Test: `draw()` su deck vuoto lancia errore
   - Test: dopo 40 draw, `isEmpty()` è true
   - Test: nessuna carta duplicata nel mazzo

**Vincoli**: NESSUNA dipendenza da DOM.

**Test da eseguire**: `npx vitest server/engine/deck.test.ts` (tutti verdi)

**Output atteso**: `deck.ts` + `deck.test.ts`, 8+ test tutti passanti.

---

## Task 6: Estrai classe Player in TypeScript

**Titolo**: Implementa classe Player TypeScript puro

**Obiettivo**: Reimplementare `Player` di `index.html:587-592` con ID univoco e metodi.

**Istruzioni precise**:
1. Crea `server/engine/player.ts`
2. Implementa classe `Player`:
   - Campi: `id` (stringa UUID), `name`, `isHuman`, `lives`, `hand`, `bid`, `taken`, `eliminated`
   - `constructor(name, isHuman, lives, id?)` — se id non fornito, genera UUID
   - `isEliminated()`: getter, true se eliminated o lives <= 0
   - `resetForRound()`: hand = [], bid = -1, taken = 0
   - `receiveCards(cards: Card[])`: aggiunge alla mano e ordina (se >1 carta)
   - `playCard(index: number): Card`: rimuove e restituisce carta all'indice
   - `hasCard(index: number): boolean`: verifica che l'indice sia valido
   - `makeBid(value: number): void`: imposta il bid
3. Scrivi test:
   - Test: player creato con campi corretti
   - Test: `resetForRound()` pulisce mano, bid, taken
   - Test: `receiveCards` ordina la mano per baseScore crescente
   - Test: `playCard` rimuove la carta e riduce hand.length
   - Test: `playCard` con indice invalido lancia errore
   - Test: `isEliminated()` true se lives <= 0

**Vincoli**: NESSUNA dipendenza da DOM.

**Test da eseguire**: `npx vitest server/engine/player.test.ts`

**Output atteso**: `player.ts` + `player.test.ts`, 6+ test passanti.

---

## Task 7: Implementa Trick resolver

**Titolo**: Implementa risolutore di prese TypeScript puro

**Obiettivo**: Estrarre la logica di `resolveTrick()` in un modulo puro e testabile.

**Istruzioni precise**:
1. Crea `server/engine/trick.ts`
2. Implementa funzione `resolveTrick(tableCards: { playerId: string, card: Card }[]): { winnerPlayerId: string, winningCard: Card }`:
   - Confronta `card.effectiveScore` di ogni carta
   - Restituisce il giocatore con punteggio più alto
   - In caso di parità (possibile solo con jolly MIN a -1), il primo che ha giocato vince
3. Scrivi test:
   - Test: Re di Denari (baseScore=399) batte Re di Coppe (299)
   - Test: Asso di Bastoni (0) perde contro qualsiasi carta
   - Test: Jolly MAX (1000) batte qualsiasi carta
   - Test: Jolly MIN (-1) perde contro Asso di Bastoni (0)
   - Test: due carte stesso seme: valore più alto vince
   - Test: Denari 2 (302) batte Coppe Re (299): gerarchia semi rispettata
   - Test: tavolo con 4 carte, verifica vincitore corretto
   - Test: caso limite — tavolo vuoto lancia errore

**Vincoli**: NESSUNA dipendenza da DOM. Funzione pura (stesso input = stesso output).

**Test da eseguire**: `npx vitest server/engine/trick.test.ts`

**Output atteso**: `trick.ts` + `trick.test.ts`, 8+ test passanti.

---

## Task 8: Implementa Scoring (penalità)

**Titolo**: Implementa calcolo penalità TypeScript puro

**Obiettivo**: Estrarre la logica di `endRound()` in modulo puro.

**Istruzioni precise**:
1. Crea `server/engine/scoring.ts`
2. Implementa funzione `calculateRoundResults(players: Player[]): RoundResult[]`:
   - Per ogni giocatore attivo: `diff = abs(taken - bid)`
   - Se diff > 0: `lives -= diff`
   - Restituisce array di `RoundResult`: { playerId, bid, taken, diff, livesLost, eliminated }
3. Scrivi test:
   - Test: bid=2, taken=2 → diff=0, 0 vite perse
   - Test: bid=1, taken=3 → diff=2, 2 vite perse
   - Test: bid=3, taken=0 → diff=3, 3 vite perse
   - Test: giocatore con 1 vita, diff=2 → eliminato (lives=-1)
   - Test: giocatore già eliminato non viene processato
   - Test: tutti i giocatori OK, nessuno eliminato
   - Test: round da 1 carta: bid=0, taken=1 → diff=1, penalità corretta

**Vincoli**: Funzione pura, nessun side effect.

**Test da eseguire**: `npx vitest server/engine/scoring.test.ts`

**Output atteso**: `scoring.ts` + `scoring.test.ts`, 7+ test passanti.

---

## Task 9: Implementa Bidding logic

**Titolo**: Implementa logica bidding TypeScript puro

**Obiettivo**: Estrarre `doBidding()` e la regola dell'ultimo in modulo puro.

**Istruzioni precise**:
1. Crea `server/engine/bidding.ts`
2. Implementa:
   - `calculateForbiddenBid(cardsToDeal: number, currentBidsSum: number, isLastBidder: boolean): number | null`
     - Se non è l'ultimo: null (nessun vincolo)
     - Se è l'ultimo: `cardsToDeal - currentBidsSum` se >= 0, altrimenti null
   - `isValidBid(value: number, cardsToDeal: number, forbiddenBid: number | null): boolean`
     - value tra 0 e cardsToDeal
     - value != forbiddenBid
3. Scrivi test:
   - Test: 4 carte, somma bid=2, ultimo giocatore → forbidden = 2
   - Test: 4 carte, somma bid=2, NON ultimo → forbidden = null
   - Test: 4 carte, somma bid=5, ultimo → forbidden = null (overflow)
   - Test: bid valido: 2 <= 4, forbidden=3 → true
   - Test: bid invalido: 2 == forbidden → false
   - Test: bid invalido: 5 > 4 carte → false
   - Test: bid valido: 0 → true

**Vincoli**: Funzione pura.

**Test da eseguire**: `npx vitest server/engine/bidding.test.ts`

**Output atteso**: `bidding.ts` + `bidding.test.ts`, 7+ test passanti.

---

## Task 10: Implementa Game state machine

**Titolo**: Implementa macchina a stati del gioco

**Obiettivo**: Creare la classe `Game` che orchestra l'intero flusso di una partita.

**Istruzioni precise**:
1. Crea `server/engine/game.ts`
2. Implementa classe `Game`:
   - `constructor(config: GameConfig)` — inizializza stato, giocatori, deck
   - `start()`: distribuisce carte e inizia primo round
   - `makeBid(playerId: string, value: number): void` — valida e registra bid
   - `playCard(playerId: string, cardIndex: number, jollyChoice?: 'MAX' | 'MIN'): void` — valida e gioca carta
   - `getState(): GameState` — restituisce stato pubblico
   - `getPlayerView(playerId: string): PlayerView` — restituisce ciò che quel giocatore può vedere
   - Eventi: `on('stateChange', callback)`, `on('roundEnd', callback)`, `on('gameEnd', callback)`
3. Usa EventEmitter pattern (Node.js `EventEmitter` o custom)
4. La macchina a stati deve gestire le fasi: WAITING → BIDDING → PLAYING → ROUND_END → (next round o GAME_OVER)
5. `getPlayerView()` per l'Indiana (1 carta) deve mostrare le carte degli altri ma NON la propria

**Vincoli**:
- Nessun setTimeout dentro la classe Game (usa metodi sincroni)
- I timeout/ritardi sono responsabilità del chiamante (game server)
- Validazione robusta: se un player manda un bid invalido, la funzione lancia errore

**Test da eseguire**:
- Simula partita completa con 4 bot (usa seed deterministico)
- Verifica che la partita termini con un vincitore
- Esegui 100 partite simulate, verifica 0 crash

**Output atteso**: `game.ts` + `game.test.ts`, con simulazione partita completa funzionante.

---

## Task 11: Setup progetto server Node.js

**Titolo**: Inizializza backend Node.js con Express e Socket.IO

**Obiettivo**: Creare la struttura del server pronta per WebSocket.

**Istruzioni precise**:
1. Crea `server/package.json` con dipendenze:
   - `express`, `socket.io`, `pg` (PostgreSQL), `ioredis`
   - `jsonwebtoken`, `bcrypt` (auth)
   - `uuid`, `zod` (validazione)
   - Dev: `typescript`, `ts-node`, `vitest`, `@types/*`
2. Crea `server/tsconfig.json` (target ES2022, module NodeNext, strict)
3. Crea `server/src/index.ts`:
   - Server HTTP Express
   - Socket.IO inizializzato
   - Middleware base: CORS, JSON parser, error handler
   - Variabili d'ambiente: PORT, DATABASE_URL, REDIS_URL, JWT_SECRET
4. Crea `.env.example` con tutte le variabili
5. Crea `docker-compose.yml` con servizi: postgres, redis, server
6. Verifica che `npm run dev` avvii il server sulla porta 3000
7. Endpoint health: `GET /api/health` → `{ status: "ok" }`

**Vincoli**:
- NON implementare game logic nel server (importa da `server/engine/`)
- NON implementare auth (solo struttura)

**Test da eseguire**:
- `curl http://localhost:3000/api/health` → `{"status":"ok"}`
- `docker-compose up` → tutti i servizi partono

**Output atteso**: Server funzionante con health endpoint.

---

## Task 12-20+ (da definire dopo i primi 11)

I task successivi saranno:
- Setup database e migrazioni
- Auth (register, login, JWT)
- WebSocket handler per game
- Lobby system
- Frontend React
- Wallet
- Deploy

Questi verranno dettagliati dopo il completamento dei task 1-11, quando l'architettura sarà più chiara.

---

## Note per l'uso con Claude Code

Ogni task è progettato per essere eseguito in una sessione separata. Copia il task e incollalo come prompt. Ogni task:
- Non richiede contesto dei task precedenti (se non esplicitamente)
- Ha criteri di completamento verificabili
- Produce file che non confliggono con task paralleli (task 4-10 possono essere eseguiti in parallelo)
