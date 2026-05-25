# 02 — Regole del gioco e logica interna

## La Bisca originale vs. questa implementazione

La **Bisca** (o "Bisca e Mezzo", "Briscola a chiamata") è un gioco di carte italiano per 3-5 giocatori con mazzo da 40 carte piacentine/napoletane. Le regole base:

1. Si distribuiscono N carte a testa (solitamente 5, poi a scalare)
2. Ogni giocatore dichiara quante prese farà (bidding simultaneo)
3. Il mazziere NON può fare una dichiarazione che faccia tornare i conti esatti (regola dell'ultimo)
4. Si giocano le prese. Chi vince la presa apre la successiva.
5. Gerarchia semi: Denari > Coppe > Spade > Bastoni
6. Dentro lo stesso seme: Re(10) > Cavallo(9) > Fante(8) > 7 > 6 > 5 > 4 > 3 > 2 > Asso(1)
7. **Regola del seme (o "palo")**: si deve rispondere al seme di chi apre la presa. Se non si ha quel seme, si può giocare qualsiasi carta.
8. Penalità: `|prese - bid|` in punti penalità o vite
9. L'Asso di Denari è un Jolly speciale

---

## Cosa è stato implementato

### Regola 1: Gerarchia semi
- **Implementata**: SÌ, ma in modo implicito nel calcolo `baseScore = semeIdx * 100 + valIdx` (riga 579)
- L'array `SEMI = ["Bastoni", "Spade", "Coppe", "Denari"]` significa che `semeIdx` codifica la gerarchia: Denari=3, Coppe=2, Spade=1, Bastoni=0
- **Pro**: Molto efficiente computazionalmente — un solo confronto numerico per determinare il vincitore
- **Contro**: Totalmente opaco. Un nuovo sviluppatore non capirebbe mai che la gerarchia è codificata nell'ordine dell'array senza documentazione.
- **Rischio**: Se qualcuno riordina l'array `SEMI` "per ordine alfabetico", il gioco si rompe in modo silenzioso.

### Regola 2: Gerarchia valori
- **Implementata**: SÌ, via `valIdx` nell'array `VALORI = ["A", "2", "3", "4", "5", "6", "7", "Fante", "Cavallo", "Re"]`
- Asso=0 (valIdx=0, il più basso), Re=9 (valIdx=9, il più alto)
- **Pro**: Semplice e corretto per la Bisca tradizionale

### Regola 3: Risposta al seme (palo)
- **Implementata**: **NO** — Questa è la deviazione più significativa dalle regole ufficiali
- In questa implementazione, NON c'è obbligo di rispondere al seme. Ogni giocatore può calare qualsiasi carta.
- **Conseguenze**: 
  - Il gioco è più caotico e imprevedibile
  - La strategia di "contare i semi" non esiste
  - I bot non possono pianificare in base ai semi mancanti
- **Perché è stato fatto**: Probabilmente lo sviluppatore ha semplificato per ridurre la complessità della IA
- **Rischio**: Se in futuro si aggiunge la regola del seme, tutta la IA bot va riscritta

### Regola 4: Bidding (dichiarazione)
- **Implementata**: SÌ, con bidding sequenziale (non simultaneo)
- Nella vera Bisca il bidding è simultaneo (tutti scelgono contemporaneamente).
- Qui è sequenziale: i giocatori dichiarano in ordine attorno al tavolo.
- **Pro dell'implementazione attuale**: Più semplice da implementare, permette la "regola dell'ultimo"
- **Contro**: Non è la vera Bisca. Il giocatore che parla dopo ha più informazioni.
- **Alternative**:
  - Bidding simultaneo (tutti dichiarano contemporaneamente)
  - Bidding a busta chiusa (più fedele all'originale)

### Regola 5: Regola dell'ultimo (mazziere non può pareggiare)
- **Implementata**: SÌ, variabile `forbiddenBid` (righe 804-809)
- `forbiddenBid = cardsToDeal - currentBidsSum`
- Se l'ultimo giocatore prova a dichiarare `forbiddenBid`, il bottone è disabilitato (per umani) o il bot aggiusta (riga 844-846)

### Regola 6: Asso di Denari come Jolly
- **Implementata**: SÌ, con possibilità di scegliere MAX o MIN
- Nella Bisca tradizionale, l'Asso di Denari è semplicemente la carta più forte del jolly, senza scelta. Qui la meccanica è più ricca.

### Regola 7: Indiana (1 carta)
- **Implementata**: SÌ
- Nella Bisca tradizionale, il round da 1 carta si gioca "alla cieca": ognuno vede le carte degli altri ma non la propria.
- **Implementazione corretta**

### Regola 8: Penalità
- **Implementata**: SÌ, con `diff = abs(taken - bid)` e `lives -= diff`
- Nella Bisca tradizionale, si gioca spesso a punti (chi totalizza più penalty perde), non a vite.
- **Variante**: Qui è un sistema a eliminazione con vite, non a punteggio cumulativo.
- **Pro**: Più drammatico e adatto al tema "dictator edition"
- **Contro**: Meno fedele alla tradizione

### Regola 9: Ciclo dei round
- **Implementata**: Pattern 5→4→3→2→1→2→3→4→5→4→3→... (a fisarmonica)
- Nella Bisca tradizionale, si scende fino a 1 e poi si risale, una volta sola. Qui è un ciclo infinito.
- **Pro**: Partite potenzialmente infinite (fino all'eliminazione)
- **Contro**: Può durare troppo a lungo

---

## Regole mancanti

1. **Obbligo di rispondere al seme** (la più grave assenza)
2. **Taglio del mazzo** da parte del giocatore prima del mazziere
3. **Bidding simultaneo** invece che sequenziale
4. **Punteggio cumulativo** invece di sistema a vite
5. **Carte "di carico"** — nella vera Bisca, alcune carte valgono punti speciali
6. **"Bisca e Mezzo"** — la variante con 5 carte + 1 sul tavolo
7. **"Andare a buio"** — dichiarare senza guardare le carte (variante avanzata)
8. **"Cappotto"** — vincere tutte le prese in un round (bonus)
9. **"Chiamare il Re" o "chiamare il compagno"** — variante per numero pari di giocatori
10. **Variante "a squadre"** per 4 giocatori (2vs2)

---

## Logica hardcoded

Le seguenti soglie e valori sono hardcoded e dovrebbero essere estratti in costanti documentate o configurabili:

| Valore | File:Riga | Significato |
|---|---|---|
| `semeIdx * 100 + valIdx` | index.html:579 | Sistema punteggio carte |
| `1000` | index.html:582 | Punteggio jolly MAX |
| `-1` | index.html:582 | Punteggio jolly MIN |
| `280` | index.html:829 | Soglia pericolo in Indiana |
| `305` | index.html:837 | Soglia forza carta alta |
| `208` | index.html:838 | Soglia forza carta media |
| `0.7` | index.html:838 | Peso forza carta media |
| `0.4` | index.html:541 | Probabilità standard dialogo bot |
| `0.95` | index.html:542 | Probabilità dialogo Mao |
| `1.0` | index.html:543 | Probabilità dialogo eliminazione |
| `800` (ms) | index.html:855,892 | Delay artificiale bot |
| `3000` (ms) | index.html:571 | Durata fumetto speech bubble |
| `3500` (ms) | index.html:1012 | Durata messaggio eliminazione |
| `2000` (ms) | index.html:732,977 | Durata altri messaggi |
| `600` (ms) | index.html:643 | Delay animazione sorteggio |
| `50` | index.html:779 | Numero coriandoli |
| `45` (px) | index.html:1086 | Spaziatura orizzontale carte ventaglio |
| `5` (deg) | index.html:1084 | Rotazione per carta nel ventaglio |

---

## Parti della logica mischiate alla UI

Il problema più grave di questo codice è l'accoppiamento totale tra game engine e rendering:

1. **`updateUI()`** (righe 1047-1162) fa TUTTO: renderizza carte, bot, cuori, statistiche, tavolo. Non c'è separazione tra "lo stato del gioco è cambiato" e "disegna lo stato".

2. **`playTurn()`** (righe 861-934) alterna logica di gioco (`tableCards.push`) e rendering (`updateUI()`).

3. **Timeout sparsi ovunque**: `setTimeout` usato sia per animazioni (legittimo) sia per "aspettare che l'umano clicchi" (illegittimo per un game engine). Il flusso di controllo è guidato da callback e timeout, non da una macchina a stati.

4. **`enableCards()`** (riga 1254) usa una variabile globale `cardClickCallback` per comunicare tra UI e logica di gioco. Pattern fragile.

5. **Il game state è sparso in variabili globali**: `deck`, `players`, `tableCards`, `cardsToDeal`, `delta`, `currentBidsSum`, `roundStarterCounter`, `isDeterminingDealer`, `duelModeActive`. Nessuna incapsulazione.

6. **DOM query dentro funzioni di logica**: `sysLog()` modifica direttamente il DOM. `resolveDealerDraw()` manipola classi CSS. `endRound()` costruisce HTML.

---

## Funzioni critiche

| Funzione | Ruolo | Criticità |
|---|---|---|
| `createDeck()` | Crea e mescola mazzo | Alta — è la fonte della casualità |
| `startRound()` | Inizia un nuovo round | Alta — distribuisce carte, inizializza stato |
| `resolveTrick()` | Determina vincitore presa | Critica — è il core del gioco |
| `endRound()` | Calcola penalità, elimina giocatori | Critica — determina chi sopravvive |
| `calculateBotMove()` | IA bot per scelta carta | Alta — determina comportamento bot |
| `updateUI()` | Render dell'intero gioco | Alta — acoppiata a tutta la logica |
| `doBidding()` | Fase di dichiarazione | Media — ricorsiva, con stato condiviso |
| `playTurn()` | Loop principale del turno | Media — ricorsiva, con race condition |

---

## Proposta: separazione engine UI

La trasformazione più importante prima di qualsiasi feature multiplayer è separare il game engine dalla UI:

```
[GAME ENGINE]          [RENDERER]            [UI CONTROLLER]
    |                      |                      |
  GameState  <------->  GameRenderer  <------->  DOM
    |                      |
  GameLogic            EventEmitter
    - createDeck()       - onStateChange()
    - startRound()       - render(state)
    - playCard()
    - resolveTrick()
    - endRound()
```

**Game Engine puro**: 
- Nessun riferimento al DOM
- Nessun setTimeout per controllo di flusso
- Stato immutabile o comunque incapsulato in una classe `Game`
- Event emitter per notificare cambiamenti di stato
- Input esterno via metodi espliciti: `playCard(playerId, cardIndex)`, `makeBid(playerId, value)`

**Renderer**:
- Riceve lo stato e lo disegna
- Gestisce animazioni (puramente visive)
- Non modifica mai lo stato del gioco

**UI Controller**:
- Gestisce input utente (click, tap)
- Traduce eventi DOM in chiamate al game engine
- Non contiene logica di gioco

---

## Valutazione per ogni scelta di logica

### Scelta: `baseScore = semeIdx * 100 + valIdx`
- **Pro**: Un solo numero, confronto O(1), corretto per gerarchia semi + valori
- **Contro**: Magia numerica, no documentazione, fragile se l'ordine array cambia
- **Rischi**: Modifiche involontarie all'array `SEMI` rompono il gioco
- **Alternativa migliore**: Enum esplicito per valori (`CARD_RANK`) con comparatore dedicato

### Scelta: Nessuna regola del seme
- **Pro**: Più semplice, gameplay più accessibile, IA più facile
- **Contro**: Non è la vera Bisca, profondità strategica ridotta
- **Rischi**: Se si implementa dopo, la IA va riscritta
- **Alternativa migliore**: Flag configurabile `strictSuitRule: boolean`

### Scelta: Sistema a vite invece che a punti
- **Pro**: Più drammatico, adatto al tema, fine partita chiara
- **Contro**: Un round sfortunato può eliminare ingiustamente
- **Rischi**: Con IA attuale, bot forti possono dominare
- **Alternativa migliore**: Modalità selezionabile (vite / punti / misto)

### Scelta: Bidding sequenziale
- **Pro**: Permette la regola dell'ultimo in modo elegante
- **Contro**: Vantaggio informativo per chi parla dopo
- **Alternativa migliore**: Opzione per bidding simultaneo in multiplayer (tutti scelgono, poi si rivela)
