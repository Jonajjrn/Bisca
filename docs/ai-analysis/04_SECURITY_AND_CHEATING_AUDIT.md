# 04 — Audit di sicurezza e anti-cheat

## Premessa

Questo audit valuta il progetto **in ottica di trasformazione in gioco online multiplayer**. Molte vulnerabilità descritte sono irrilevanti per l'attuale versione single-player locale, ma diventano critiche nel momento in cui si introducono: autenticazione, moneta virtuale, multiplayer competitivo, classifiche.

---

## Riepilogo rischi

| Categoria | Numero vulnerabilità | Severità massima |
|---|---|---|
| Game logic client-side | 5 | Critica |
| Economia virtuale | 4 | Critica |
| Autenticazione | 4 | Alta |
| WebSocket / Networking | 3 | Alta |
| Input validation | 3 | Media |
| Race condition | 2 | Alta |
| Privacy / Dati | 2 | Media |
| Infrastruttura | 3 | Bassa |

---

## 1. Logica di gioco eseguita solo lato client

- **Severità**: CRITICA
- **Area coinvolta**: Tutto `index.html` (creazione mazzo, mescolamento, distribuzione, confronto carte, calcolo penalità)
- **Descrizione**: L'intero game engine risiede nel browser. Un utente malevolo può:
  - Vedere tutto il mazzo (`deck` array accessibile da console)
  - Conoscere le carte di tutti i bot (`players[i].hand` accessibile)
  - Conoscere le dichiarazioni dei bot prima di fare la propria
  - Modificare il proprio `bid` dopo aver visto le carte giocate
  - Modificare `lives`, `taken`, `eliminated` a piacimento
- **Impatto concreto**: In un contesto multiplayer, il cheating sarebbe totale e immediato. Chiunque con DevTools aperto vincerebbe sempre.
- **Come sfruttarla teoricamente**: `players[0].hand = [new Card("Re","Denari"), ...]` — Sostituzione completa della mano.
- **Mitigazione**: 
  - **TUTTA la logica di gioco deve migrare su server autorevole**
  - Il client manda solo azioni (`PLAY_CARD`, `MAKE_BID`) e riceve stato
  - Il server valida ogni azione contro lo stato corrente
  - Il client non deve mai ricevere informazioni che non dovrebbe vedere (es. carte degli avversari)
- **Priorità**: Immediata — è il primo task di qualsiasi roadmap multiplayer

---

## 2. Manipolazione carte dal browser

- **Severità**: CRITICA
- **Area coinvolta**: `index.html` righe 574-585 (Card class), righe 861-934 (playTurn)
- **Descrizione**: Il client ha accesso diretto agli oggetti `Card`. Può creare carte inesistenti, modificare `effectiveScore`, cambiare `baseScore`.
- **Mitigazione**: Il server deve essere l'unica fonte di verità per le carte. Il client riceve solo ID opachi delle carte, non i loro dati completi (quando non visibili).

---

## 3. Manipolazione moneta virtuale

- **Severità**: CRITICA (futura)
- **Area coinvolta**: Non ancora implementata
- **Descrizione**: Se la moneta virtuale viene gestita anche solo parzialmente lato client (es. `localStorage.setItem('coins', 99999)`), è completamente insicura.
- **Mitigazione**:
  - Balance SOLO su database server-side
  - Ogni transazione in una transazione DB ACID
  - Ledger immutabile (doppia contabilità)
  - Idempotency key per ogni operazione economica
  - Il client non invia MAI "nuovo saldo", invia solo "richiedo X"
  - Rate limiting sulle operazioni economiche

---

## 4. localStorage / sessionStorage insicuri

- **Severità**: ALTA (futura)
- **Area coinvolta**: Attualmente non usati, ma probabile tentazione per MVP
- **Descrizione**: Storage client-side è completamente manipolabile. Non usarli mai per token di accesso (meglio cookie httpOnly), wallet, progresso, o statistiche.
- **Mitigazione**: Tutti i dati persistenti vanno su database server. Token JWT in cookie httpOnly + Secure + SameSite.

---

## 5. Assenza di validazione server-side (attuale e futura)

- **Severità**: CRITICA
- **Area coinvolta**: Tutto il progetto attuale
- **Descrizione**: Non esiste server, quindi zero validazione. In futuro, il server DEVE validare:
  - Che la carta giocata sia effettivamente in mano al giocatore
  - Che sia il turno del giocatore
  - Che il bid sia nel range valido (0..cardsToDeal)
  - Che l'ultimo giocatore non violi la regola del forbiddenBid
  - Che il giocatore non abbia già giocato/rilanciato
- **Mitigazione**: Validazione lato server in ogni handler, prima di qualsiasi modifica di stato.

---

## 6. XSS (Cross-Site Scripting)

- **Severità**: MEDIA
- **Area coinvolta**: `index.html` righe 516-517 (`sysLog`), righe 547-548 (`showSpeechBubble`)
- **Descrizione**: `sysLog` usa `el.innerHTML = "> " + msg` — se `msg` contiene HTML, viene eseguito. Anche `showSpeechBubble` con `bubble.innerText` è sicuro, ma altri punti no.
- **Impatto**: Moderato — input controllati (nomi da liste predefinite, frasi da DB). Ma se in futuro i nomi diventano user-generated, diventa critico.
- **Mitigazione**:
  - Usare `textContent` invece di `innerHTML` per dati dinamici
  - Validare e sanitizzare input utente (nomgiocatore, messaggi chat)
  - Content-Security-Policy header

---

## 7. CSRF (Cross-Site Request Forgery)

- **Severità**: MEDIA (futura)
- **Descrizione**: Se il backend usa cookie di sessione, un sito malevolo potrebbe forzare richieste autenticate.
- **Mitigazione**:
  - SameSite=Strict o Lax sui cookie
  - CSRF token per endpoint state-changing
  - Oppure: usare solo JWT in header Authorization (no cookie), che è immune a CSRF

---

## 8. Problemi di autenticazione

### 8a. Password non hashate
- **Severità**: ALTA
- **Descrizione**: Se implementate in futuro senza hashing.
- **Mitigazione**: bcrypt o argon2 con salt. MAI SHA-256 semplice o, peggio, plaintext.

### 8b. JWT gestiti male
- **Severità**: ALTA
- **Descrizione**: Errori comuni: secret debole, nessuna scadenza, token in localStorage, no refresh token.
- **Mitigazione**:
  - Access token: 15-30 minuti, in memoria JS (non localStorage)
  - Refresh token: 7-30 giorni, in cookie httpOnly Secure SameSite
  - Secret di 256+ bit, ruotato periodicamente
  - Token invalidation su logout (blacklist in Redis)

### 8c. Sessioni troppo lunghe
- **Severità**: MEDIA
- **Descrizione**: Token senza scadenza permettono accesso perpetuo.
- **Mitigazione**: Access token a vita breve + refresh token con rotazione.

---

## 9. Race condition nelle partite

- **Severità**: ALTA (futura)
- **Area coinvolta**: Game engine server
- **Descrizione**: Con WebSocket, due messaggi potrebbero arrivare quasi simultaneamente (es. due giocatori cliccano carte nello stesso istante). Senza lock o queue, lo stato potrebbe corrompersi.
- **Mitigazione**:
  - Coda di azioni per ogni partita (una alla volta)
  - Lock ottimistico con numero di sequenza
  - Il server processa le azioni in ordine di arrivo
  - Validazione dello stato prima di ogni azione

---

## 10. Doppia spesa moneta virtuale

- **Severità**: CRITICA (futura)
- **Descrizione**: Se l'utente invia due richieste di acquisto simultaneously, entrambe potrebbero essere processate.
- **Mitigazione**:
  - Idempotency key (UUID generato dal client, unique constraint sul DB)
  - Transazione DB con SELECT ... FOR UPDATE sul wallet
  - Rate limiting per utente

---

## 11. Reconnect abusabile

- **Severità**: MEDIA (futura)
- **Descrizione**: Un giocatore potrebbe disconnettersi e riconnettersi per:
  - Evitare una penalità
  - Resettare il timer del turno
  - Ottenere informazioni extra
  - Giocare più partite contemporaneamente
- **Mitigazione**:
  - Timeout di riconnessione breve (30-60 secondi)
  - Il gioco continua col bot sostitutivo durante la disconnessione
  - Dopo N disconnessioni in una partita, penalità
  - Una sola partita attiva per utente

---

## 12. Bot farming

- **Severità**: MEDIA (futura)
- **Descrizione**: Con ricompense in moneta virtuale, gli utenti potrebbero:
  - Creare lobby private con solo bot
  - Vincere facilmente contro bot di difficoltà bassa
  - Accumulare moneta senza rischio
- **Mitigazione**:
  - Ricompense ridotte in partite con bot (>50% bot = 0 ricompense)
  - Ricompense piene solo in partite fully human o ranked
  - Cooldown tra una partita e l'altra
  - Limite partite al giorno
  - Rilevamento pattern di farming

---

## 13. Abuso lobby

- **Severità**: BASSA
- **Descrizione**: 
  - Creare infinite lobby vuote
  - Nomi lobby offensivi
  - Spam di join/leave
- **Mitigazione**:
  - Rate limit creazione lobby (max 3 per utente)
  - Filtro nomi lobby
  - Timeout lobby vuote (5 minuti → cancellazione automatica)
  - Massimo 1 lobby attiva creata per utente

---

## 14. Assenza di rate limiting

- **Severità**: MEDIA
- **Descrizione**: Senza rate limit, endpoint REST e WebSocket sono vulnerabili a brute force, spam, DoS.
- **Mitigazione**:
  - Rate limiting su TUTTI gli endpoint (REST: 100 req/min, WebSocket: 10 msg/sec)
  - Rate limit più stretti su login (5 tentativi/min), register (3 account/IP/ora)
  - Implementare con Redis + sliding window

---

## 15. Assenza di audit log

- **Severità**: ALTA
- **Descrizione**: Senza log immutabili, impossibile:
  - Investigare dispute tra giocatori
  - Rilevare cheating
  - Ricostruire incidenti economici
  - Conformità legale minima
- **Mitigazione**:
  - Tabella `audit_logs` per eventi sensibili
  - Log struttura JSON, append-only
  - Campi: timestamp, userId, azione, dettagli, IP, userAgent
  - Eventi da loggare: login/logout, transazioni wallet, inizio/fine partita, azioni di gioco sospette

---

## 16. Assenza controlli anti-cheat

- **Severità**: ALTA
- **Descrizione**: Nessuna euristica per rilevare comportamenti anomali.
- **Mitigazione**:
  - Server-side check di coerenza:
    - Tempo di risposta medio per mossa (se <100ms costanti, probabile bot)
    - Percentuale di vittoria anomala (>95% su 50+ partite)
    - Bid sempre esatti (umano reale sbaglia ogni tanto)
    - Pattern di gioco identici tra account diversi (multi-account)
  - Shadow ban per sospetti, ban manuale previa review
  - Rateo di report da altri giocatori

---

## 17. WebSocket — problematiche specifiche

### 17a. Connection flooding
- **Severità**: MEDIA
- **Descrizione**: Aprire migliaia di connessioni WebSocket per saturare il server.
- **Mitigazione**: Max connessioni per IP, autenticazione prima dell'upgrade WebSocket, timeout connessioni inattive.

### 17b. Messaggi malformati
- **Severità**: MEDIA
- **Descrizione**: Inviare JSON malformato o enormemente grande per crashare il parser.
- **Mitigazione**: Size limit sui messaggi (max 10KB), validazione schema JSON (Zod o ajv), drop connessione su messaggi invalidi ripetuti.

### 17c. Replay attack
- **Severità**: BASSA
- **Descrizione**: Ricatturare e reinviare un messaggio WebSocket valido.
- **Mitigazione**: Ogni messaggio contiene un `sequenceNumber` incrementale. Il server rifiuta numeri già visti o fuori ordine.

---

## 18. Dipendenze e supply chain

- **Severità**: BASSA
- **Descrizione**: Il progetto attuale non ha dipendenze. In futuro, col nuovo stack, il rischio supply chain diventa rilevante.
- **Mitigazione**:
  - `package-lock.json` / `pnpm-lock.yaml` commitati
  - `npm audit` / Dependabot
  - Aggiornamenti regolari
  - Minime dipendenze possibili

---

## Priorità di mitigazione

1. **Game engine server-side autorevole** (critica) — senza questa, tutto il resto è inutile
2. **Economia solo server-side con ledger** (critica) — anche per MVP con moneta virtuale
3. **Autenticazione robusta** (alta) — JWT con refresh token, password hashate
4. **Rate limiting + audit log** (alta) — prima del deploy pubblico
5. **Anti-cheat euristico** (media) — può essere aggiunto dopo il lancio
6. **WebSocket hardening** (media) — prima del deploy pubblico
7. **CSRF/XSS hardening** (media) — prima di permettere user-generated content
