# 07 — Lobby e bot autofill

## Ciclo di vita di una lobby

```
                  CREATA
                    │
                    ▼
              ┌──────────┐
              │ WAITING  │ ◄── Giocatori entrano/escono
              └────┬─────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    tutti ready          timer scade
    (min 2 umani)        (30-60s)
         │                    │
         ▼                    ▼
   ┌──────────┐        ┌──────────────────┐
   │ STARTING │        │ FILLING_WITH_BOTS│
   │ (3..2..1)│        │ (aggiunge bot)   │
   └────┬─────┘        └────────┬─────────┘
        │                       │
        ▼                       ▼
   ┌──────────┐           ┌──────────┐
   │ IN_GAME  │◄──────────│ IN_GAME  │
   └────┬─────┘           └──────────┘
        │
        ▼
   ┌──────────┐
   │ COMPLETED│ / ABANDONED
   └──────────┘
```

## Dettaglio stati

### WAITING
- La lobby è creata e visibile (se pubblica)
- I giocatori possono entrare e uscire liberamente
- Il creatore può modificare impostazioni (max giocatori, privata/pubblica)
- **Timeout**: 5 minuti senza alcun giocatore → lobby cancellata
- **Massimo**: 7 giocatori totali (umani + bot)

### FILLING_WITH_BOTS
- Stato transitorio quando il timer di autofill scatta
- Durata: 3-5 secondi (il server aggiunge bot)
- Non visibile nella UI (la lobby passa direttamente a STARTING)

### STARTING
- Countdown: 3 secondi
- Nessun nuovo giocatore può entrare
- Se un giocatore lascia durante il countdown, si torna a WAITING
- Il server crea la partita e distribuisce le carte

### IN_GAME
- La lobby è "bloccata" — associata a un `game_id`
- Nessuna operazione di join/leave possibile
- Spettatori possono unirsi (se permesso)

### COMPLETED / ABANDONED
- La lobby si chiude
- COMPLETED: partita finita normalmente
- ABANDONED: tutti i giocatori hanno abbandonato o timeout

---

## Lobby pubbliche vs private

### Pubbliche

- Visibili nella lista lobby (endpoint `GET /api/lobbies?filter=public`)
- Chiunque può entrare (fino a max giocatori)
- **Rate limit creazione**: max 2 lobby pubbliche per utente
- Nome lobby filtrato (no parolacce)

### Private

- NON appaiono nella lista
- Accessibili solo tramite **codice invito** (6 caratteri alfanumerici)
- Il creatore condivide il codice fuori dal gioco (Discord, WhatsApp, ecc.)
- **Rate limit creazione**: max 1 lobby privata per utente

```typescript
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code; // Esempio: "XK9M2P"
  // Verifica unicità nel DB prima di assegnare
}
```

---

## Join e leave

### JOIN

1. Client invia `JOIN_LOBBY { lobbyId }` o `JOIN_BY_CODE { inviteCode }`
2. Server verifica:
   - La lobby esiste ed è in stato WAITING
   - Non è piena (`SELECT COUNT(*) FROM lobby_players WHERE lobby_id = X`)
   - L'utente non è già in un'altra lobby attiva
   - L'utente non è bannato
3. Inserisce riga in `lobby_players`
4. Broadcast `LOBBY_UPDATE` a tutti i membri della room

### LEAVE

1. Client invia `LEAVE_LOBBY` o si disconnette
2. Se era il creatore: promuovi un altro giocatore a creatore, o cancella la lobby
3. Broadcast `LOBBY_UPDATE`
4. Se la lobby diventa vuota, cancella dopo 5 minuti

---

## Ready check

- Ogni giocatore umano ha un toggle "Ready" / "Not Ready"
- Il creatore vede una lista con lo stato ready di ciascuno
- **Condizioni per l'avvio**:
  - Minimo 2 giocatori umani
  - Tutti i giocatori umani sono ready
- Quando le condizioni sono soddisfatte:
  - Se il numero di giocatori è sufficiente: countdown 3 secondi → IN_GAME
  - Se mancano giocatori: avvia timer autofill

---

## Timer autofill

**Decisione**: 45 secondi dopo che il creatore va "ready" e ci sono almeno 2 giocatori.

- Se la lobby è piena (umano): avvia subito
- Se mancano giocatori: countdown visibile a tutti
- Allo scadere: bot riempiono i posti vuoti fino al massimo della lobby (o al minimo giocabile)

**Pro di questa scelta**:
- Non blocca le partite in attesa infinita
- Dà tempo ragionevole per trovare giocatori umani
- Il timer è corto (45s) per non frustrare

**Contro**:
- In ore di basso traffico, molte partite saranno con bot
- 45 secondi potrebbero essere pochi per lobby molto grandi

**Alternative**:
- Timer più lungo (90s-120s) per priorità matchmaking umano
- Pulsante "Forza avvio" per il creatore (riempi con bot subito)
- Matchmaking automatico in background mentre aspetti

---

## Bot autofill

### Quando i bot entrano

1. Allo scadere del timer (45s)
2. Quando il creatore clicca "Forza avvio con bot"
3. Quando un giocatore umano si disconnette durante la partita (bot sostitutivo)

### Quali bot

Attinti dalla tabella `bot_profiles` in base a:
- **Nome**: dalla lista `DICTATORS` (o `ITALIAN_NAMES` per varietà)
- **Personalità**: scelta casuale tra i tipi disponibili
- **Difficoltà**: dipende dal contesto
  - Lobby pubblica: difficoltà media (3/5) per non frustrare i nuovi giocatori
  - Lobby privata: difficoltà selezionabile dal creatore
  - Sostituzione mid-game: difficoltà del giocatore sostituito (o media)

### Comportamento in partita

Il bot segue le stesse regole dell'attuale `calculateBotMove()` con miglioramenti:
- Rispetta la regola del seme (quando implementata)
- Adatta il bid in base alla difficoltà:
  - Livello 1: bid casuale (divertente ma scarso)
  - Livello 3: algoritmo attuale
  - Livello 5: algoritmo attuale + memoria delle carte uscite + bluff occasionale
- Delay artificiale per sembrare umano: 1-3 secondi random

---

## Anti-farming con i bot

### Problema

Un utente crea una lobby privata, aggiunge 5 bot di difficoltà 1, vince facile e accumula moneta.

### Mitigazioni

1. **Ricompense scalate in base al rapporto umani:bot**:
   ```
   100% umani  → 100% ricompense
   75%  umani  → 75%  ricompense
   50%  umani  → 50%  ricompense
   <50% umani  → 20%  ricompense
   0%   umani  → 0%   ricompense (solo umano vs bot)
   ```

2. **Limite partite giornaliere con bot**: max 10 partite con bot al giorno (dopo: 0 ricompense)

3. **Cooldown tra partite**: 2 minuti tra una partita e l'altra per prevenire farming veloce

4. **Rilevamento automatico**: se un utente ha un win rate >95% in lobby solo-bot, flag per review

5. **I bot non danno ricompense a sé stessi** (ovvio, ma importante: il bot non ha wallet)

---

## Gestione disconnessioni

### Durante la lobby
- Giocatore disconnesso → rimosso dopo 30s
- Se era l'unico pronto, si resetta il ready check
- Il timer autofill si mette in pausa se il creatore si disconnette

### Durante la partita

```
Giocatore si disconnette
        │
        ▼
Timer riconnessione: 60 secondi
        │
        ├── Si riconnette entro 60s:
        │     - Riceve snapshot completo dello stato partita
        │     - Riprende il controllo
        │     - Se era il suo turno, il timer turno è resettato
        │
        └── NON si riconnette entro 60s:
              - Un bot prende il suo posto (stesse carte in mano)
              - Il giocatore è marcato come "abandoned"
              - Penalità: sconfitta, perdita buy-in, cooldown 15 min
```

### Bot sostitutivo

- **Eredita** la mano di carte, le vite, i bid/taken del giocatore
- **Non eredita** la strategia (il bot gioca col proprio algoritmo)
- Il nome nella UI diventa: "Trump [BOT]" per chiarezza

### Ritorno del giocatore umano

Se il giocatore si riconnette DOPO che il bot ha iniziato a giocare:
- Il bot ha già fatto delle mosse
- Il giocatore riprende dalla situazione attuale (non può annullare le mosse del bot)
- Le mosse fatte dal bot vengono marcate come `played_by_bot = true` nel game_events
- **Non si può tornare indietro**: le carte giocate dal bot sono giocate

**Pro**: Evita exploit (disconnettersi per far giocare il bot e poi rientrare)
**Contro**: Il giocatore potrebbe ritrovarsi in una situazione peggiore
**Alternativa**: Opzione "affida al bot" nel menu di pausa (scelta esplicita vs automatica)

---

## Numero minimo/massimo giocatori

| Parametro | Valore | Motivazione |
|---|---|---|
| Minimo giocatori per partita | 2 | 1vs1 è giocabile (anzi, il duello è la parte più drammatica) |
| Massimo giocatori | 7 | Limite pratico: con 7 giocatori e 5 carte, servono 35 carte su 40. Oltre si esaurisce il mazzo |
| Default lobby | 4 | Il "tavolo da 4" è il più bilanciato |
| Massimo bot | 6 | Max giocatori - 1 umano |

---

## Tabella riassuntiva delle scelte

| Decisione | Scelta | Pro principale | Contro principale |
|---|---|---|---|
| Timer autofill | 45 secondi | Partenza rapida | Pochi umani in ore morte |
| Difficoltà bot default | 3/5 (media) | Bilanciata | Non sfidante per esperti |
| Ricompense con bot | 20% con <50% umani | Anti-farming efficace | Meno incentivo a giocare in orari vuoti |
| Riconnessione timeout | 60 secondi | Bilanciato tra recupero e fluidità | 60s di bot possono cambiare la partita |
| Codice invito | 6 caratteri | Facile da condividere | 2 miliardi di combinazioni, brute-force improbabile |
| Lobby per utente | Max 3 create | Previene spam | Restrittivo per power user |
| Partite con bot/giorno | Max 10 con ricompense | Previene farming | Limita gioco legittimo |
