# 01 — Mappa completa delle funzionalità

## 1. Schermata iniziale (Setup Screen)

**File**: `index.html` righe 348-393 (HTML), 595-613 (JS)

**Descrizione**: Prima schermata che il giocatore vede. Contiene:
- Titolo "BISCA" con sottotitolo "DICTATOR EDITION"
- Input per nome giocatore (precompilato con nome italiano casuale)
- Select per numero di vite: 1 (Sudden Death), 3 (Standard, default), 5 (Maratona)
- Select per carte iniziali MAX: 3, 4, 5 (Standard, default), 6
- Select per numero avversari: da 1 (Duello) a 6 (Guerra Totale), default 3
- Bottone "TUTORIAL" che reindirizza a `tutorial.html`
- Bottone "ESTRAZIONE MAZZIERE" che avvia il gioco

**Flusso utente**: L'utente configura i parametri e clicca il pulsante per iniziare.

**Flusso tecnico**:
1. `window.onload` imposta un nome casuale da `ITALIAN_NAMES`
2. Click su `#btn-start` → `onclick` handler legge i valori dei select
3. Imposta `initialLives`, `initialMaxCards`, `cardsToDeal`
4. Nasconde `#setup-screen`, mostra `#game-area` in grid
5. Crea l'oggetto `Player` per l'umano e N bot con nomi da `DICTATORS`
6. Chiama `determineFirstDealer()`

**Stato**: Completa

**Bug probabili**:
- Nessuna validazione del nome (stringa vuota ammessa)
- Se nome è lunghissimo (>12 caratteri), l'input ha `maxlength="12"` ma il nome precompilato potrebbe essere modificato dopo

**Miglioramenti possibili**:
- Preview numero round totali in base ai parametri
- Salvare le preferenze in localStorage
- Modalità "partita veloce" con preset

---

## 2. Sorteggio mazziere animato

**File**: `index.html` righe 625-689

**Descrizione**: All'inizio della partita, ogni giocatore pesca una carta. Chi ha la carta col `baseScore` più basso diventa il primo "mazziere" (dealer) e inizierà il primo round.

**Flusso tecnico**:
1. `determineFirstDealer()` crea un mazzo, ogni giocatore pesca 1 carta
2. Le carte vengono mostrate una alla volta (600ms di delay ciascuna)
3. `resolveDealerDraw()` trova il giocatore con `baseScore` minimo
4. Evidenzia la carta vincente con scala 1.3 e bordo oro, opacizza le altre
5. Dopo 3 secondi, imposta `roundStarterCounter` e chiama `startRound()`

**Stato**: Completa

**Bug probabili**:
- In caso di pareggio (stesso baseScore), vince il primo giocatore nell'array — comportamento non documentato
- Le carte del sorteggio rimangono visibili durante la transizione, creando un effetto visivo confusionario

**Miglioramenti possibili**:
- Mostrare il nome del vincitore in modo più evidente
- Animazione di rimescolamento carte nel mazzo

---

## 3. Creazione e mescolamento mazzo

**File**: `index.html` righe 615-622

**Descrizione**: `createDeck()` genera un mazzo di 40 carte (4 semi × 10 valori) e lo mescola con algoritmo Fisher-Yates.

**Flusso tecnico**:
1. Itera su `SEMI` (`["Bastoni", "Spade", "Coppe", "Denari"]`) e `VALORI` (`["A","2","3","4","5","6","7","Fante","Cavallo","Re"]`)
2. Crea oggetti `Card` con `valName`, `semeName`, indici, `baseScore = semeIdx*100 + valIdx`
3. Mescola con Fisher-Yates

**Stato**: Completa

**Bug probabili**:
- Nessuno. Fisher-Yates è implementato correttamente.
- `Math.random()` non è crittograficamente sicuro, ma per gioco locale è irrilevante.

**Miglioramenti possibili**:
- Per multiplayer: il mescolamento DEVE avvenire lato server (vedi `04_SECURITY`)

---

## 4. Struttura Carta (Card class)

**File**: `index.html` righe 574-585

**Descrizione**: Oggetto che rappresenta una carta.

**Proprietà**:
- `valName`: nome valore ("A", "2", ..., "Re")
- `semeName`: nome seme ("Bastoni", "Spade", "Coppe", "Denari")
- `valIdx`, `semeIdx`: indici negli array
- `baseScore`: punteggio calcolato come `semeIdx * 100 + valIdx`
- `effectiveScore`: punteggio effettivo (modificabile dal jolly)

**Metodi**:
- `isJolly()`: true se Asso di Denari
- `setJollyMode(isMax)`: imposta effectiveScore a 1000 (MAX) o -1 (MIN)
- `resetScore()`: ripristina effectiveScore = baseScore
- `getImagePath()`: restituisce il percorso dell'immagine

**Stato**: Completa

**Criticità architetturale**: Il `baseScore` incorpora già la gerarchia dei semi (Denari > Coppe > Spade > Bastoni) perché `semeIdx` di Denari=3, Coppe=2, Spade=1, Bastoni=0. Questo significa che **qualsiasi carta di Denari batte qualsiasi carta di Bastoni**, che è corretto per la Bisca ma è una regola implicita nel calcolo numerico, non esplicita nel codice.

**Bug probabili**:
- `baseScore` usa `semeIdx * 100 + valIdx`. Con 10 valori, non ci sono collisioni. OK.
- MA: Fante(8), Cavallo(9), Re(10) hanno valIdx corretti rispetto all'ordine di forza (Asso=1 è il più basso). Questo è intenzionale e documentato nel tutorial.

---

## 5. Struttura Giocatore (Player class)

**File**: `index.html` righe 587-592

**Descrizione**: Oggetto che rappresenta un giocatore (umano o bot).

**Proprietà**:
- `name`: stringa
- `isHuman`: boolean
- `lives`: numero vite rimanenti
- `hand`: array di oggetti `Card`
- `bid`: dichiarazione prese per il round corrente (-1 = non ancora dichiarato)
- `taken`: prese effettive nel round corrente
- `eliminated`: boolean

**Stato**: Completa ma minimalista. Non ha metodi, solo dati.

**Miglioramenti possibili**:
- Aggiungere `id` univoco (necessario per multiplayer)
- Tracciare storico bid/prese per round passati
- Per i bot: campo `personalityType` invece di dedurlo dal nome ogni volta

---

## 6. Fase di Bidding (Dichiarazione)

**File**: `index.html` righe 761-857

**Descrizione**: All'inizio di ogni round, ogni giocatore dichiara quante prese prevede di fare.

**Flusso utente (umano)**:
1. Appaiono bottoni numerati (0, 1, 2, ..., N carte distribuite)
2. Se sei l'ultimo a parlare (mazziere), un numero è disabilitato (`forbiddenBid`)
3. L'utente clicca un bottone, il bid viene registrato

**Flusso tecnico**:
1. `proceedToBidding()` calcola l'ordine di dichiarazione partendo dallo `starterIndex`
2. `doBidding()` itera ricorsivamente
3. Per ogni giocatore: se umano → `showBidButtons()`, se bot → calcolo automatico dopo 800ms
4. L'ultimo giocatore ha `forbiddenBid = cardsToDeal - currentBidsSum` (la "regola dell'ultimo")
5. I bot calcolano il bid con un algoritmo di forza mano

**Stato**: Completa

**Bug probabili**:
- Se `cardsToDeal - currentBidsSum < 0`, `forbiddenBid` viene impostato a -1 (nessun divieto). Questo può succedere se i bot precedenti hanno sovrastimato. Tuttavia, con bot che dichiarano max `cardsToDeal`, non dovrebbe accadere.
- L'umano può cliccare rapidamente più bottoni se non c'è debounce (il callback imposta `innerHTML=""` ma non c'è lock)

**Miglioramenti possibili**:
- Lock UI durante il bidding per prevenire double-click
- Animazione di "pensiero" per i bot

---

## 7. IA Bot — Calcolo Bid

**File**: `index.html` righe 822-856

**Descrizione**: Algoritmo che decide quante prese dichiarare.

**Algoritmo**:
- **Round da 1 carta (Indiana)**: il bot guarda la mano degli altri. Se qualcuno ha una carta con `baseScore >= 280` (Denari 8+ o equivalente), dichiara 0 altrimenti 1.
- **Round normali**: somma "forza" della propria mano:
  - Jolly: +1
  - Carta >= 305: +1 (Denari 5+, Coppe alte)
  - Carta >= 208: +0.7 (Coppe 8+, Spade alte)
  - Arrotonda il totale e limita a `cardsToDeal`

**Stato**: Funzionante ma basilare

**Criticità**:
- Soglie hardcodate (280, 305, 208) senza documentazione sul perché
- Non considera il numero di giocatori né le carte già viste
- Non c'è adattamento in base allo stato della partita (es. se ha poche vite, potrebbe essere più conservativo)
- La regola dell'ultimo forza un aggiustamento se il bid coincide col forbidden

**Miglioramenti possibili**:
- Pesare le carte in base al seme dominante del round
- Memoria delle carte già giocate nei round precedenti
- Personalità che influenza il bid (Aggressive sovrastima, Paranoid sottostima)

---

## 8. IA Bot — Scelta carta da giocare

**File**: `index.html` righe 896-922

**Algoritmo `calculateBotMove(bot, table)`**:
1. Se ha una sola carta, la gioca.
2. Valuta `wantToWin = bot.taken < bot.bid` (vuole vincere la presa se è in difetto)
3. Ordina la mano per `baseScore` crescente
4. **Se il tavolo è vuoto** (primo a giocare): gioca la carta più alta se vuole vincere, la più bassa altrimenti
5. **Se ci sono già carte sul tavolo**: trova carte che possono vincere (`score > currentWinnerScore`) e carte che perderebbero
6. Se vuole vincere: gioca la vincitrice più bassa (o la più bassa in assoluto)
7. Se vuole perdere: gioca la perdente più alta (o la più alta in assoluto)

**Stato**: Funzionante ma con limiti

**Criticità**:
- Per il jolly: decide `setJollyMode(wantToWin)` — se vuole vincere lo setta MAX, altrimenti MIN. Questo è troppo binario.
- Non considera il seme: se il tavolo ha un seme, il bot dovrebbe preferire carte di quel seme (regola base della Bisca: si deve rispondere al seme se possibile)
- **MANCA LA REGOLA DEL SEME**: nella vera Bisca, se il primo giocatore cala Denari, tutti DEVONO giocare Denari se ne hanno. Qui il bot ignora completamente i semi.
- Il bot non sa "scaricare" una carta di un seme diverso quando non può vincere.

**Bug probabili**:
- Se il tavolo è vuoto e il bot vuole perdere, gioca la carta più bassa. Ma se è l'ultimo a giocare, potrebbe voler vincere una presa che nessuno contende.

---

## 9. Jolly (Asso di Denari)

**File**: `index.html` righe 574-585 (classe), 870-884 (giocata umano), 888-891 (giocata bot), 924-927 (risoluzione)

**Descrizione**: L'Asso di Denari può essere giocato come MAX (effectiveScore=1000, vince tutto) o MIN (effectiveScore=-1, perde sempre).

**Flusso utente**:
1. Il giocatore seleziona il jolly dalla mano
2. Appare un modale (`#jolly-modal`) con due pulsanti: MAX o MIN
3. Dopo la scelta, la carta viene giocata normalmente

**Flusso tecnico**:
- `isJolly()`: `this.valName === "A" && this.semeName === "Denari"`
- `setJollyMode(isMax)`: `this.effectiveScore = isMax ? 1000 : -1`
- Dopo la presa, `resetScore()` riporta effectiveScore a baseScore

**Stato**: Completa

**Bug probabili**:
- Il modale jolly non è chiudibile senza scegliere (nessun tasto X, nessun click fuori). Se l'utente apre DevTools e rimuove il modale, `jollyCallback` rimane appeso.
- Se due giocatori giocano entrambi il jolly (impossibile: c'è un solo Asso di Denari nel mazzo), ma il codice non ha controlli di unicità.

---

## 10. Fase di gioco (Trick-taking)

**File**: `index.html` righe 861-934

**Descrizione**: Ogni giocatore, a turno, cala una carta. Quando tutti hanno giocato, si risolve la presa.

**Flusso**:
1. `playTurn(currentIdx, active)` — se `tableCards.length === active.length`, risolve
2. Altrimenti, il giocatore corrente gioca:
   - Umano: `enableCards()` abilita il click sulle carte
   - Bot: `calculateBotMove()` dopo 800ms
3. La carta viene rimossa dalla mano e aggiunta a `tableCards`
4. `playTurn()` viene chiamato ricorsivamente per il prossimo giocatore

**Stato**: Completa

**Bug probabili**:
- Ricorsione invece di iterazione: con molti giocatori e molti round, tecnicamente si potrebbe andare in stack overflow (ma con max 7 giocatori e 6 carte, ~42 chiamate nidificate, improbabile)
- Nessuna validazione che il giocatore abbia davvero la carta che sta giocando (irrilevante in single-player, critico in multiplayer)

---

## 11. Risoluzione presa

**File**: `index.html` righe 936-976

**Descrizione**: Confronta le carte giocate e determina il vincitore della presa.

**Algoritmo**:
1. Itera `tableCards`, confrontando `c.effectiveScore`
2. Il giocatore col punteggio più alto vince
3. Incrementa `winner.p.taken`
4. Mostra messaggio "HA PRESO [NOME]" per 2 secondi
5. Se ci sono ancora carte in mano, continua con `playTurn()` partendo dal vincitore
6. Altrimenti chiama `endRound()`

**Stato**: Completa

**Bug probabili**:
- In caso di pareggio (impossibile con `effectiveScore` unici se non per jolly MIN=-1 che potrebbe pareggiare con... ma non ci sono carte con score=-1), vince il primo giocatore che ha giocato
- Se il jolly è MIN (-1) e un'altra carta ha effettivamente perso, il jolly perde — corretto

---

## 12. Fine round e penalità

**File**: `index.html` righe 979-1019

**Descrizione**: Calcola penalità per ogni giocatore.

**Algoritmo**:
1. Per ogni giocatore attivo: `diff = abs(taken - bid)`
2. Se `diff > 0`: `p.lives -= diff`
3. Se `p.lives <= 0`: il giocatore viene eliminato (`p.eliminated = true`)
4. Log nel `#system-log` con OK (verde) o -N (rosso)
5. Se ci sono morti, mostra `#elimination-msg` per 3.5 secondi
6. Mostra bottone "PROSSIMO ROUND"

**Stato**: Completa

**Bug probabili**:
- Penalità eccessiva: sbagliare di 1 costa 1 vita, sbagliare di 3 costa 3 vite. Con 3 vite iniziali, un errore grave in un round da 5 carte può eliminare un giocatore in un colpo solo. È una scelta di design, non un bug.
- Se un giocatore viene eliminato, `updateUI()` lo mostra ma il suo box rimane nel DOM

---

## 13. Gestione round successivi

**File**: `index.html` righe 1021-1044

**Descrizione**: Logica per passare al round successivo.

**Algoritmo `nextStep()`**:
- Usa variabile `delta` per alternare carte decrescenti e crescenti:
  - Fase 1 (`delta = -1`): `cardsToDeal` diminuisce fino a 1
  - Quando arriva a 1: `cardsToDeal = 2, delta = 1` (inversione)
  - Fase 2 (`delta = 1`): `cardsToDeal` aumenta fino a `initialMaxCards`
  - Quando arriva a max: `cardsToDeal = initialMaxCards - 1, delta = -1` (inversione)
- Pattern: 5,4,3,2,1,2,3,4,5,4,3,2,1,...

**Stato**: Completa

**Bug probabili**:
- Loop infinito: il gioco non ha una condizione di fine partita basata sul numero di round. Continua finché resta 1 giocatore.
- Se tutti sbagliano sempre e muoiono nello stesso round, `active.length` può diventare 0 e `showVictoryScreen("NESSUNO")` viene chiamato

**Miglioramenti possibili**:
- Opzione "numero round fissi" invece che a eliminazione
- Visualizzare il contatore dei round

---

## 14. Modalità Indiana (1 carta)

**File**: `index.html` righe 1080-1081 (render carta coperta per umano), 1208-1212 (render carta scoperta per bot)

**Descrizione**: Nel round da 1 carta, le regole cambiano:
- Il giocatore umano **non vede la propria carta** (renderizzata con dorso `card-visual back`)
- I bot **vedono le carte degli altri giocatori** (renderizzate scoperte)
- Tutti vedono le carte altrui

**Flusso tecnico**:
- `updateUI()` controlla `if(cardsToDeal === 1)` per decidere se mostrare dorso o fronte
- Per i bot: quando `cardsToDeal === 1`, le carte nella mano dei bot vengono mostrate scoperte a tutti
- La logica di gioco è identica, cambia solo il rendering

**Stato**: Completa

**Bug probabili**:
- L'umano può ancora cliccare sulla propria carta coperta e giocarla. Non sa cosa sta giocando, ma il gioco glielo permette. Questo è corretto per le regole dell'Indiana.
- Dopo che l'umano gioca la carta coperta, la carta appare scoperta sul tavolo — corretto

---

## 15. Modalità Duello

**File**: `index.html` righe 38-43 (CSS), 395-399 (HTML), 702-720 (JS)

**Descrizione**: Quando restano esattamente 2 giocatori attivi e almeno uno ha 1 vita, scatta la modalità duello.

**Effetti**:
- Sfondo rosso (`body.duel-mode`)
- Transizione drammatica ("INDIANA DEFINITIVA") per 3 secondi
- `cardsToDeal` forzato a 1
- Log di sistema in rosso

**Stato**: Completa

**Bug probabili**:
- La condizione `active.length === 2` con `anyoneDying = active.some(p => p.lives === 1)` significa che se entrambi hanno 3 vite, il duello NON scatta. Si gioca normalmente in 2.
- `duelModeActive` non viene mai resettato — se dopo il duello entrambi sopravvivono, rimane in modalità duello per i round successivi (corretto? Sì, perché restano in 2 e uno potrebbe morire dopo)

---

## 16. Schermata Vittoria

**File**: `index.html` righe 101-122 (CSS), 400-404 (HTML), 773-787 (JS)

**Descrizione**: Mostra il vincitore con titolo "VITTORIA", nome del vincitore, 50 coriandoli animati colorati, e pulsante "NUOVA PARTITA".

**Stato**: Completa

**Bug probabili**:
- I coriandoli vengono aggiunti al DOM ma mai rimossi. Se si clicca "NUOVA PARTITA" (`location.reload()`), si resetta tutto, quindi non è un problema.

---

## 17. Sistema dialoghi bot

**File**: `index.html` righe 452-572

**Descrizione**: Sistema che fa "parlare" i bot con fumetti in base alla loro personalità.

**Personalità**:
- **AGGRESSIVE**: Mussolini, Hitler, Attila, Gengis, Cesare, Napoleone
- **PARANOID**: Stalin, Lenin, Mao, Fidel, Kim, Gheddafi, Franco
- **SHOWMAN**: Trump, Berlusconi
- **ICEMAN**: Putin, Biden, Churchill

**Eventi trigger**:
- `WIN_TRICK`: quando vincono una presa
- `LOSE_LIFE`: quando perdono vite a fine round
- `ELIMINATED`: quando vengono eliminati
- `HIGH_BID` / `LOW_BID`: quando dichiarano bid alto/basso

**Probabilità**:
- Standard: 40%
- Mao: 95% (parla quasi sempre, ma solo in cinese)
- Eliminazione: 100% (parlano sempre quando muoiono)

**Stato**: Completa e divertente

**Bug probabili**:
- Mao parla in cinese (es. "你好", "太棒了") ma i font caricati (Russo One, Share Tech Mono, Press Start 2P, Bangers) potrebbero non supportare i caratteri cinesi. Su molti sistemi il fallback funziona, ma potrebbe mostrare quadratini.
- `triggerBotChat` referenzia `showFloatMsg` che è una funzione vuota (placeholder)

**Miglioramenti possibili**:
- Più varietà di frasi (ogni tipo ne ha solo 4-5)
- Frasi contestuali al nome (es. Mussolini dice frasi diverse da Hitler anche se stessa personalità)

---

## 18. Speech Bubble (fumetti)

**File**: `index.html` righe 146-188 (CSS), 551-572 (JS)

**Descrizione**: Fumetto animato che appare sopra il box del bot quando parla.

**Stato**: Completa

**Bug probabili**:
- Se due bot parlano contemporaneamente, il fumetto del primo viene rimosso da `old.remove()` a riga 557. Questo è intenzionale (un fumetto alla volta per bot) ma potrebbe causare perdita di messaggi se triggerati in rapida successione.

---

## 19. UI — Box giocatori bot

**File**: `index.html` righe 1164-1235

**Descrizione**: Render dei box bot con avatar, nome, cuori, statistiche (BID, TOT), mano di carte.

**Layout**:
- `area-left`: colonna sinistra
- `area-top`: riga superiore
- `area-right`: colonna destra
- I bot vengono distribuiti proporzionalmente tra le tre aree

**Stato**: Completa

**Bug probabili**:
- Con 6 bot, la distribuzione è: L=2, T=2, R=2 (3 gruppi da 2). Ma il codice `groupL = bots.slice(0, Math.ceil(total/3))` con `total=6` dà `Math.ceil(2)=2`, `groupT = bots.slice(2, 4)`, `groupR = bots.slice(4)`. OK.
- Con 1 bot: `groupT` contiene il bot. `area-left` e `area-right` rimangono vuote. OK.

---

## 20. UI — Carte del giocatore umano

**File**: `index.html` righe 1069-1107

**Descrizione**: Le carte in mano al giocatore sono posizionate a ventaglio nella parte bassa dello schermo.

**Layout**: Effetto ventaglio con rotazione e traslazione calcolate in base alla distanza dal centro.

**Stato**: Completa

**Bug probabili**:
- L'effetto ventaglio usa `distFromCenter` e `translateX` di 45px per carta. Con 6 carte, l'ultima carta potrebbe uscire dallo schermo su schermi stretti.

---

## 21. UI — Carte sul tavolo

**File**: `index.html` righe 1136-1162

**Descrizione**: Le carte giocate appaiono al centro con etichetta del giocatore.

**Stato**: Completa

**Bug probabili**:
- Rotazione casuale basata su `baseScore % 14 - 7` — puramente estetico

---

## 22. UI — Hearts (vite)

**File**: `index.html` righe 257-263 (CSS), 1051-1057 (JS)

**Descrizione**: Cuori pixelati SVG inline via data URI.

**Stato**: Completa

---

## 23. UI — System Log

**File**: `index.html` righe 45-54 (CSS), 514-517 (JS)

**Descrizione**: Barra superiore stile terminale con messaggi di gioco.

**Stato**: Completa. La funzione `sysLog()` sostituisce completamente il contenuto invece di accumulare. Per un flusso di gioco lineare va bene.

---

## 24. Tutorial

**File**: `tutorial.html`

**Descrizione**: 6 slide che spiegano le regole:
0. Benvenuto
1. Gerarchia semi (Denari > Coppe > Spade > Bastoni)
2. Valori carte (Asso=1 è il più basso)
3. Jolly (Asso di Denari)
4. Scommessa (bid) e penalità
5. Regola dell'ultimo e Indiana

**Stato**: Completa

**Bug probabili**:
- Il tutorial dice "Asso vale 1 (è la carta più bassa), tranne in un caso speciale" — il caso speciale è il jolly. Ma l'Asso di Denari come jolly in realtà ha una meccanica diversa (scegli MAX/MIN), non è semplicemente "più forte".
- `totalSlides = 6`: hardcodato, se si aggiunge una slide bisogna aggiornare manualmente.

---

## 25. Responsive Design

**File**: `index.html` (tutto CSS)

**Descrizione**: Il layout usa CSS Grid con viewport height e flexbox.

**Stato**: Parziale. Funziona su desktop. Su mobile:
- Le carte sono probabilmente troppo piccole
- I bottoni bid potrebbero essere molti (fino a 6+) e non andare a capo bene
- `user-select: none` blocca la selezione ma non ci sono media queries esplicite

**Miglioramenti possibili**:
- Media queries per mobile
- Layout alternativo per schermi verticali
- Touch target più grandi (minimo 44px)

---

## 26. Gestione errori

**File**: `index.html`

**Stato**: **Praticamente assente**

- Nessun `try/catch` in tutto il codice
- Nessuna validazione degli input
- Nessun fallback per immagini carte mancanti
- Fallback per gli avatar solo via `onerror` inline nell'HTML
- Se il mazzo finisce le carte (impossibile con le regole attuali), `deck.pop()` restituirebbe `undefined`

---

## 27. Bot già presenti

**File**: `index.html` righe 587-592 (Player class), 821-856 (bid bot), 896-922 (move bot)

**Descrizione**: Bot controllati da IA con due algoritmi separati (bid e gioco).

**Stato**: Funzionanti ma basilari (vedi sezioni 7 e 8).

---

## 28. Impostazioni

**File**: `index.html` righe 357-381 (HTML setup)

**Stato**: Solo impostazioni pre-partita. Nessuna impostazione in-game (audio, velocità animazioni, difficoltà bot, ecc.)

---

## 29. Salvataggio dati

**Stato**: **Assente**. Nessun localStorage, sessionStorage, cookie, IndexedDB.

---

## 30. Funzionalità audio

**Stato**: **Assente**. Nessun suono, nessuna musica.

---

## 31. Animazioni

**File**: `index.html` CSS sparso

**Tipi di animazioni presenti**:
- `pulseTitle`: pulsazione titolo setup (3s loop)
- `dramaZoom`: zoom drammatico transizione duello (3s)
- `cardDeal`: apparizione carte sul tavolo (0.3s)
- `floatUp`: messaggi flottanti (1.5s) — definita ma non usata (`showFloatMsg` è vuota)
- `zoomIn`: effetto vittoria
- `pulse`: pulsazione nome vincitore
- `fall`: coriandoli
- `fadeIn`: apparizione schermata vittoria
- `blinkRed`: lampeggio statistiche in pericolo
- `fadeIn` (tutorial): transizione slide

**Stato**: Presenti e funzionanti. Buon livello di dettaglio.
