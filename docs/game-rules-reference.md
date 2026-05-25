# Game Rules Reference — Bisca: Dictator Edition

Questo documento descrive le regole **esattamente come implementate** nel codice di `index.html`, con riferimenti precisi alle righe.

NON descrive la Bisca "ideale" ma ciò che il codice ESEGUE realmente.

---

## 1. Configurazione partita

### Parametri configurabili

| Parametro | Opzioni | Default | Riga |
|---|---|---|---|
| Nome giocatore | Input testo (max 12 caratteri) | Nome italiano casuale | 355, 509-512 |
| Numero vite | 1, 3, 5 | 3 | 358-362 |
| Carte iniziali MAX | 3, 4, 5, 6 | 5 | 365-370 |
| Numero avversari bot | 1, 2, 3, 4, 5, 6 | 3 | 373-380 |

**Riga codice setup**: 595-613 (`onclick="..."` su `#btn-start`)

### Nomi predefiniti

- **Pool nomi umano** (`ITALIAN_NAMES`, riga 493): Gianni, Mario, Luigi, Pasquale, Gennaro, Salvatore, Francesco, Antonio, Giuseppe, Vincenzo, Carmine, Roberto, Davide, Andrea
- **Pool nomi bot** (`DICTATORS`, righe 488-492): 18 nomi tra cui Mussolini, Hitler, Stalin, Trump, Putin, Berlusconi, ecc.
- I nomi bot sono pescati in ordine casuale: `[...DICTATORS].sort(() => 0.5 - Math.random())` (riga 608)
- **IMPORTANTE**: Attila e Gengis sono nella lista `DICTATORS` ma non hanno un file ritratto in `img/portraits/`. Il fallback mostra l'iniziale.

---

## 2. Mazzo di carte

### Composizione

- **4 semi** (`SEMI`, riga 494): `["Bastoni", "Spade", "Coppe", "Denari"]`
- **10 valori** (`VALORI`, riga 495): `["A", "2", "3", "4", "5", "6", "7", "Fante", "Cavallo", "Re"]`
- **Totale**: 40 carte
- **Mappatura file**: `FILE_MAP` (riga 496) mappa ogni valore al suo numero per il nome file (`"A": 1`, `"Re": 10`)

### Gerarchia semi (implementata implicitamente)

L'ordine nell'array `SEMI` determina la gerarchia:

```
Denari (semeIdx=3) > Coppe (semeIdx=2) > Spade (semeIdx=1) > Bastoni (semeIdx=0)
```

**Meccanismo** (riga 579): `baseScore = (semeIdx * 100) + valIdx`

| Carta | calcolo baseScore | baseScore |
|---|---|---|
| Asso di Bastoni | 0*100 + 0 | 0 (minimo assoluto) |
| Re di Bastoni | 0*100 + 9 | 9 |
| Asso di Spade | 1*100 + 0 | 100 |
| Re di Spade | 1*100 + 9 | 109 |
| Asso di Coppe | 2*100 + 0 | 200 |
| Re di Coppe | 2*100 + 9 | 209 |
| Asso di Denari | 3*100 + 0 | 300 |
| Re di Denari | 3*100 + 9 | 399 (massimo, escluso jolly) |

**Conseguenza critica**: Qualsiasi carta di Denari (baseScore >= 300) batte qualsiasi carta di qualsiasi altro seme. Es: un Asso di Denari (300) batte un Re di Coppe (209).

### Gerarchia valori dentro lo stesso seme

L'ordine nell'array `VALORI` determina la gerarchia:

```
Re(10) > Cavallo(9) > Fante(8) > 7 > 6 > 5 > 4 > 3 > 2 > Asso(1)
```

L'Asso è la carta più bassa (valIdx=0), il Re è la più alta (valIdx=9).

Questo è documentato nel tutorial (`tutorial.html` slide 2, righe 171-194).

---

## 3. Sorteggio del mazziere iniziale

**Funzione**: `determineFirstDealer()` (righe 625-689)

**Flusso**:
1. Crea un mazzo nuovo e mescolato (`createDeck()`, riga 628)
2. Ogni giocatore pesca 1 carta dal mazzo (riga 631)
3. Le carte vengono rivelate una alla volta con delay di 600ms (riga 637-643)
4. Vince chi ha il `baseScore` PIÙ BASSO (righe 647-657)
5. Il vincitore viene evidenziato (scala 1.3, bordo oro), gli altri opacizzati (righe 667-677)
6. Dopo 3.5 secondi, `roundStarterCounter = indexOf(vincitore)` (riga 681)
7. Si passa a `startRound()` (riga 685)

**Edge case — pareggio**: Se due giocatori pescano lo stesso baseScore, vince il primo trovato nell'array `drawDeck` (per come è scritto il confronto `if(item.c.baseScore < lowestScore)` — lo strict `<` fa sì che il secondo pareggio NON sostituisca il primo). Comportamento non documentato.

---

## 4. Distribuzione carte

**Funzione**: `startRound()` (righe 692-759)

**Flusso**:
1. Controlla giocatori attivi (`players.filter(p => !p.eliminated)`, riga 693)
2. Se <= 1 giocatore attivo, fine partita (righe 695-699)
3. Controlla condizione duello (righe 702-706): 2 giocatori attivi E almeno uno con 1 vita
4. In duello: `cardsToDeal = 1` (riga 709)
5. In non-duello: verifica limite fisico `floor(40 / active.length)` (riga 716)
6. Crea mazzo, distribuisce `cardsToDeal` carte a ogni giocatore (righe 738-747)
7. Se `cardsToDeal > 1`, ordina la mano per `baseScore` crescente (riga 746)
8. Passa alla fase bidding (riga 757-758)

**Edge case**: Se il limite fisico scende sotto 1, `cardsToDeal` può diventare 1 o meno. Il codice forza `cardsToDeal = 1` nel duello ma non ha un floor esplicito per il caso normale.

---

## 5. Fase Bidding (Dichiarazione)

**Funzioni**: `proceedToBidding()` (righe 761-766), `doBidding()` (righe 789-857)

### Ordine di dichiarazione

- **Sequenziale** (non simultaneo). NON è la regola ufficiale della Bisca (che prevede bidding simultaneo).
- Si parte dal giocatore con `roundStarterCounter % active.length` e si procede in senso orario (righe 762-764)

### Regola dell'ultimo (forbidden bid)

- **Chi**: L'ultimo giocatore a dichiarare (il "mazziere")
- **Cosa**: Non può dichiarare `cardsToDeal - currentBidsSum` (righe 805-809)
- **Perché**: Per forzare almeno un errore — "qualcuno deve sbagliare"
- **Caso overflow**: Se `cardsToDeal - currentBidsSum < 0`, `forbiddenBid = -1` (nessun vincolo, riga 808)
- **Per il bot**: Se il bot è l'ultimo e il suo calcolo coincide col forbidden, aggiusta: se ha dichiarato 0, passa a 1; altrimenti sottrae 1 (righe 844-846)
- **Per l'umano**: Il bottone corrispondente al forbidden è disabilitato nella UI (righe 1244-1247)

### Bidding bot (righe 822-856)

**Round normale** (cardsToDeal > 1):
1. Calcola "forza" mano:
   - Jolly: +1 (riga 836)
   - Carta con baseScore >= 305 (Denari 5+, Coppe alte): +1 (riga 837)
   - Carta con baseScore >= 208 (Coppe 8+, Spade alte): +0.7 (riga 838)
2. Somma, arrotonda con `Math.round()`, limita a `cardsToDeal` (riga 840)

**Round Indiana** (cardsToDeal === 1):
1. Guarda le carte degli ALTRI giocatori (righe 826-830)
2. Se qualcuno ha baseScore >= 280 (Denari 8+, Coppe alte, Spade alte): dichiara 0 (troppo pericoloso)
3. Altrimenti: dichiara 1

**Soglie hardcodate**: 280, 305, 208, 0.7 — nessuna documentazione sul perché di questi valori.

---

## 6. Asso di Denari — Jolly

**Definizione** (riga 580): `valName === "A" && semeName === "Denari"`

**Meccanica**:
- Quando giocato dall'umano: appare un modale (`#jolly-modal`, righe 406-413 HTML, righe 870-884 JS)
- Due scelte:
  - **MAX**: `effectiveScore = 1000` (vince contro qualsiasi altra carta, riga 582)
  - **MIN**: `effectiveScore = -1` (perde contro qualsiasi altra carta, riga 582)
- Quando giocato dal bot: `setJollyMode(bot.taken < bot.bid)` — se il bot è in difetto, MAX; altrimenti MIN (riga 889)
- Dopo la presa: `resetScore()` riporta `effectiveScore` a `baseScore` (riga 583)

**Nota**: Se due giocatori giocassero entrambi il jolly (impossibile — c'è un solo Asso di Denari), vincerebbe il primo per come è scritto il confronto. Non c'è controllo di unicità.

---

## 7. Fase di gioco (Trick-taking)

**Funzioni**: `playTurn()` (righe 861-934), `resolveTrick()` (righe 936-976)

### Turno

1. Giocatori giocano in ordine attorno al tavolo, partendo dal round starter (o dal vincitore della presa precedente)
2. Loop ricorsivo: `playTurn(currentIdx, active)` chiama se stessa per il prossimo giocatore (riga 933)
3. Quando `tableCards.length === active.length`, risolve la presa (riga 862-865)

### Mossa umano

1. `enableCards()` imposta `cardClickCallback` (riga 1254)
2. Al click, se la carta è jolly → modale scelta MAX/MIN
3. Altrimenti → `finalizePlayCard()` direttamente

### Mossa bot

`calculateBotMove(bot, table)` (righe 896-922):

```
Se 1 carta in mano → gioca quella

wantToWin = bot.taken < bot.bid  (è in difetto)

Se tavolo vuoto:
  wantToWin → gioca carta più alta
  !wantToWin → gioca carta più bassa

Se tavolo ha carte:
  Trova il currentWinnerScore attuale
  wantToWin:
    Cerca carte che possono vincere → gioca la vincente più bassa
    Se nessuna → gioca la più bassa in assoluto
  !wantToWin:
    Cerca carte che perderebbero → gioca la perdente più alta
    Se nessuna → gioca la più alta in assoluto (e vince involontariamente)
```

**ASSENZA CRITICA**: Il bot NON rispetta la regola del seme. Non sa cosa sia il "palo". Gioca in base al punteggio numerico.

### Risoluzione presa

1. Trova la carta con `effectiveScore` più alto (righe 937-939)
2. Se parità (possibile solo se jolly MIN=-1): vince il primo giocatore nell'array
3. `winner.p.taken++` (riga 941)
4. Mostra "HA PRESO [NOME]" per 2 secondi (righe 946-977)
5. Se i giocatori hanno ancora carte in mano, prossimo turno col vincitore come primo (righe 970-973)
6. Altrimenti → `endRound()` (riga 974)

---

## 8. Fine round e penalità

**Funzione**: `endRound(active)` (righe 979-1019)

### Calcolo penalità

```
diff = Math.abs(p.taken - p.bid)
```

Se `diff > 0`:
- `p.lives -= diff` (riga 985)
- Se `p.lives <= 0` → `p.eliminated = true`

### Messaggi

- Log system bar: `NOME:OK` (verde) o `NOME:-N` (rosso), righe 995-997
- Se ci sono eliminati: messaggio "CADUTI: [nomi]" per 3.5 secondi, righe 1001-1015
- Poi: bottone "PROSSIMO ROUND >>" (riga 1021-1028)

### A fine partita

Se `active.length <= 1` → `showVictoryScreen(winnerName)` (righe 695-699)

---

## 9. Ciclo dei round (fisarmonica)

**Funzione**: `nextStep()` (righe 1030-1044)

**Pattern**: Le carte distribuite seguono un ciclo a fisarmonica:

```
5 → 4 → 3 → 2 → 1 → 2 → 3 → 4 → 5 → 4 → 3 → 2 → 1 → ...
```

**Implementazione**:
- `delta = -1`: fase discendente (5,4,3,2,1)
- Arrivato a 1: `cardsToDeal = 2, delta = 1` (inversione, riga 1035)
- `delta = 1`: fase ascendente (2,3,4,5)
- Arrivato a `initialMaxCards`: `cardsToDeal = initialMaxCards - 1, delta = -1` (inversione, righe 1039-1040)

**NON c'è limite al numero di round**. La partita continua finché resta 1 giocatore.

**NOTA**: Se tutti i giocatori tranne uno muoiono nello stesso round, `active.length` può essere 0 e `showVictoryScreen("NESSUNO")` viene chiamato con la stringa "NESSUNO" (riga 696). Non c'è stato osservato in pratica.

---

## 10. Modalità Indiana (1 carta)

**Quando**: `cardsToDeal === 1`

**Regola implementata**:
- Il giocatore umano vede il DORSO della propria carta (righe 1095-1096: `card-visual back`)
- Vede le carte degli altri giocatori SCOPERTE
- I bot vedono le carte di TUTTI (anche dell'umano) scoperte (righe 1207-1212)
- Può cliccare sulla propria carta e giocarla pur non sapendo cosa sia
- Dopo averla giocata, la carta appare scoperta sul tavolo

**Differenza dalla tradizione**: Nella Bisca tradizionale, in Indiana si mette la carta sulla fronte (la vedono tutti tranne te). Qui per il bot è uguale, ma la UI mostra il dorso all'umano.

---

## 11. Modalità Duello

**Condizione di attivazione** (righe 702-706):
- `active.length === 2` (esattamente 2 giocatori rimasti)
- Almeno uno dei due ha `lives === 1`

**Effetti**:
1. Transizione drammatica con overlay rosso e scritta "INDIANA DEFINITIVA" per 3s (riga 750-753, 769-771)
2. `cardsToDeal` forzato a 1 (riga 709)
3. Sfondo della pagina cambia in rosso: `body.duel-mode` (riga 713)
4. `duelModeActive = true` — usato per condizionare messaggi (riga 712)
5. **`duelModeActive` non viene mai resettato a false.** Anche dopo il duello, se entrambi sopravvivono, rimane true per i round successivi. È intenzionale: restano in 2 finché uno muore.

---

## 12. Schermata vittoria

**Funzione**: `showVictoryScreen(winnerName)` (righe 773-787)

- Overlay fullscreen con sfondo rosso radiale
- Titolo "VITTORIA" in oro
- Nome del vincitore in font pixel
- 50 coriandoli animati di colori casuali (righe 779-786)
- Bottone "NUOVA PARTITA" → `location.reload()` (riga 403)

---

## 13. Sistema dialoghi bot

### Personalità (righe 452-485)

| Tipo | Nomi associati |
|---|---|
| AGGRESSIVE | Mussolini, Hitler, Attila, Gengis, Cesare, Napoleone |
| PARANOID | Stalin, Lenin, Mao, Fidel, Kim, Gheddafi, Franco |
| SHOWMAN | Trump, Berlusconi |
| ICEMAN | Putin, Biden, Churchill |

### Eventi che triggerano dialoghi (riga 537-549)

| Evento | Quando scatta | Probabilità |
|---|---|---|
| WIN_TRICK | Il bot vince una presa (riga 944) | 40% |
| LOSE_LIFE | Il bot perde vite a fine round (riga 987) | 40% |
| ELIMINATED | Il bot viene eliminato (riga 991) | **100%** |
| HIGH_BID | Il bot dichiara >= 2 prese (riga 851) | 40% |
| LOW_BID | Il bot dichiara 0 prese (riga 850) | 40% |

**Eccezione Mao** (riga 542-543): Mao parla con probabilità 95% (frasi in cinese hardcodate a righe 523-524), e 100% quando eliminato.

### Frasi in cinese di Mao (riga 523)

```
["你好", "太棒了", "我们要胜利", "快点", "什么？", "哈哈", "革命", "万岁", "同志", "好！"]
```

**Rischio UI**: I font `Russo One`, `Share Tech Mono`, `Press Start 2P`, `Bangers` potrebbero non supportare i caratteri cinesi. Su molti browser il fallback funziona, ma su alcuni potrebbero apparire □□□ (quadratini).

---

## 14. Edge case e comportamenti non ovvi

### BaseScore minimo e massimo
- **Minimo**: Asso di Bastoni = 0
- **Massimo**: Re di Denari = 399
- **Jolly MAX**: 1000 (vince sempre)
- **Jolly MIN**: -1 (perde sempre, anche contro Asso di Bastoni=0)

### Bot — limiti noti
1. **Nessuna memoria tra round**: Ogni round, il bot ricalcola da zero. Non sa quali carte sono già uscite.
2. **Nessuna strategia di squadra**: Ogni bot gioca per sé.
3. **Nessuna considerazione del seme**: Ignora completamente quale seme è stato giocato per primo.
4. **Scelta jolly binaria**: MAX se in difetto, MIN se in eccesso. Mai una via di mezzo.
5. **Nessun bluff**: Il bid è puramente matematico, mai strategico.

### Giocatore umano — vincoli UI
1. **Nessun "annulla mossa"**: Una volta cliccata una carta, è giocata.
2. **Jolly modale non chiudibile**: Non c'è tasto X sul modale jolly. Se l'utente apre DevTools e rimuove il modale, `jollyCallback` rimane appeso.
3. **Bid button senza debounce**: Si può cliccare velocemente più bottoni bid (anche se il callback pulisce `innerHTML`, non c'è lock).

### Casi estremi di partita
1. **Mazzo quasi esaurito**: Con 7 giocatori e 6 carte, servono 42 carte. Ma il mazzo ne ha 40. Il codice ha un limite fisico: `Math.floor(40 / active.length)` (riga 716) che previene la distribuzione di più carte di quante disponibili. Con 7 giocatori: floor(40/7) = 5. Quindi max 5 carte a testa.
2. **Tutti eliminati stesso round**: Se tutti i giocatori sbagliano e muoiono nello stesso round, `active.length = 0`, `showVictoryScreen("NESSUNO")` (riga 696).
3. **Round infiniti**: Il ciclo a fisarmonica non ha condizione di stop temporale. La partita dura finché resta 1 giocatore.

---

## 15. Riepilogo differenze dalla Bisca tradizionale

| Regola | Bisca tradizionale | Questa implementazione |
|---|---|---|
| Bidding | Simultaneo (tutti assieme) | Sequenziale (a turno) |
| Palo (seme) | Obbligo di rispondere al seme | **NON implementato** — qualsiasi carta sempre giocabile |
| Taglio mazzo | Il giocatore prima del mazziere taglia | Non implementato |
| Punteggio | Punti cumulativi (penalità) | Sistema a vite (eliminazione) |
| Fine partita | Dopo N round o a punteggio | Quando resta 1 giocatore |
| Asso di Denari | Jolly, carta più forte | Jolly, scelta MAX/MIN |
| "Cappotto" | Bonus per vincere tutte le prese | Non implementato |
| "Andare a buio" | Dichiarare senza guardare | Non implementato |
| Gioco a squadre | 2vs2 per 4 giocatori | Tutti contro tutti |

---

## 16. Mappa rapida funzioni → righe

| Funzione | Righe | Scopo |
|---|---|---|
| `createDeck()` | 615-622 | Crea e mescola 40 carte |
| `determineFirstDealer()` | 625-643 | Sorteggio mazziere iniziale |
| `resolveDealerDraw()` | 646-689 | Risoluzione sorteggio |
| `startRound()` | 692-759 | Setup nuovo round |
| `proceedToBidding()` | 761-766 | Avvia fase dichiarazioni |
| `doBidding()` | 789-857 | Loop ricorsivo bidding |
| `playTurn()` | 861-934 | Loop ricorsivo turni gioco |
| `calculateBotMove()` | 896-922 | IA scelta carta bot |
| `finalizePlayCard()` | 929-934 | Registra carta giocata |
| `resolveTrick()` | 936-976 | Determina vincitore presa |
| `endRound()` | 979-1019 | Penalità, eliminazioni |
| `nextStep()` | 1030-1044 | Calcolo prossimo round |
| `updateUI()` | 1047-1162 | Render completo UI |
| `renderBotGroup()` | 1164-1235 | Render box bot |
| `showBidButtons()` | 1237-1251 | UI bottoni dichiarazione |
| `enableCards()` | 1254 | Abilita click carte umano |
| `enableCardsInteraction()` | 1255-1261 | Handler click carta |
| `triggerBotChat()` | 537-549 | Trigger dialogo bot |
| `showSpeechBubble()` | 551-572 | Mostra fumetto |
| `showVictoryScreen()` | 773-787 | Schermata vittoria |
| `triggerDuelTransition()` | 769-771 | Schermata duello |
| `sysLog()` | 514-517 | Log nella barra superiore |
