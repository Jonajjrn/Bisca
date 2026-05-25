# 10 — Registro decisioni architetturali

## Decisione 1: Stack frontend

- **Problema**: Con quale tecnologia ricostruire il client?
- **Scelta consigliata**: React + TypeScript + Vite
- **Alternative considerate**:
  - Vue 3 + TypeScript: più semplice, ma meno ecosistema per giochi
  - SvelteKit: ottimo ma meno sviluppatori disponibili
  - Mantenere vanilla HTML: non scala per app complessa
  - Next.js: overkill per una SPA senza SEO
- **Pro**: Type safety end-to-end con `shared/`, ecosistema maturo, componenti riutilizzabili
- **Contro**: Bundle più pesante del vanilla, curva di apprendimento se lo sviluppatore non conosce React
- **Rischi**: Over-engineering per un gioco di carte relativamente semplice
- **Motivazione finale**: React è lo standard de facto per applicazioni web interattive. TypeScript previene intere classi di bug.
- **Impatto futuro**: Vincola lo sviluppo frontend a React, ma semplifica l'onboarding di nuovi sviluppatori.

---

## Decisione 2: Protocollo di comunicazione

- **Problema**: REST polling vs WebSocket?
- **Scelta consigliata**: WebSocket (Socket.IO)
- **Alternative considerate**:
  - REST + polling ogni 2s: più semplice ma lag percepito
  - Server-Sent Events (SSE): solo unidirezionale
  - WebSocket raw: più leggero ma senza auto-reconnect
- **Pro**: Realtime bidirezionale, auto-reconnect, rooms, battle-tested
- **Contro**: Stateful, più complesso da debuggare, richiede sticky session o adapter per scaling
- **Rischi**: Curva di apprendimento Socket.IO, problemi con alcuni proxy/CDN
- **Motivazione finale**: Per un gioco di carte a turni con bidding e chat, la reattività percepita è fondamentale. Socket.IO fornisce l'infrastruttura necessaria.
- **Impatto futuro**: Architettura stateful, scaling orizzontale richiede Redis adapter.

---

## Decisione 3: Game engine server-authoritative

- **Problema**: Quanto deve essere autorevole il server?
- **Scelta consigliata**: Server 100% autorevole
- **Alternative considerate**:
  - Server autorevole con client-side prediction: utile per giochi d'azione, overkill per carte
  - Peer-to-peer: senza server centrale, ogni client valida; richiede blockchain o consensus, complessità enorme
  - Server "fiducioso" (il client manda il risultato, il server registra): completamente insicuro
- **Pro**: Impossibile barare modificando il client, unica fonte di verità
- **Contro**: Latenza aggiuntiva (round-trip per ogni azione), server deve validare tutto
- **Rischi**: Performance server sotto carico (ma per un gioco di carte a turni, il carico è basso)
- **Motivazione finale**: Qualsiasi alternativa introduce vulnerabilità di cheating. Per un gioco con moneta virtuale, il server DEVE essere l'unica autorità.
- **Impatto futuro**: Il client è un "renderer stupido", facilitando porting a piattaforme diverse.

---

## Decisione 4: Database

- **Problema**: PostgreSQL vs alternativa?
- **Scelta consigliata**: PostgreSQL
- **Alternative considerate**:
  - SQLite: sufficiente per MVP, ma no constraint enforcement forte, problema scaling
  - MongoDB: flessibile per game state, ma Transazioni ACID più deboli (migliorate ma non native)
  - Redis come database primario: performante ma no garanzie di durabilità
- **Pro**: ACID, vincoli, JSONB per game state flessibile, maturo, gratuito
- **Contro**: Meno scalabile orizzontalmente di NoSQL (ma non necessario a questa scala)
- **Rischi**: Nessuno significativo per scala prevista (<10k utenti)
- **Motivazione finale**: Le transazioni ACID sono obbligatorie per l'economia virtuale. PostgreSQL è il gold standard.
- **Impatto futuro**: Facile da migrare a soluzioni managed (AWS RDS, Google Cloud SQL, Supabase).

---

## Decisione 5: Sistema di autenticazione

- **Problema**: JWT vs sessioni?
- **Scelta consigliata**: JWT (access + refresh token)
- **Alternative considerate**:
  - Sessioni server-side con Redis: più sicure ma stateful, scaling complesso
  - Solo access token JWT: semplice ma non revocabile
  - OAuth2 provider esterno (Google, GitHub): comodo per utenti ma riduce autonomia
- **Pro**: Stateless (access token), scalabile, refresh token per sicurezza
- **Contro**: Revoca complessa (richiede blacklist), token in memoria JS vulnerabili a XSS
- **Rischi**: XSS può rubare access token; mitigato con vita breve (15 min)
- **Motivazione finale**: Bilanciamento tra sicurezza e semplicità. Access token breve + refresh token in httpOnly cookie.
- **Impatto futuro**: Aggiungere OAuth2 (Google, Discord) in futuro è compatibile.

---

## Decisione 6: Bot sostitutivi mid-game

- **Problema**: Cosa fare quando un giocatore umano si disconnette durante la partita?
- **Scelta consigliata**: Bot sostitutivo dopo 60 secondi
- **Alternative considerate**:
  - Mettere in pausa la partita: frustrante per gli altri giocatori
  - Far saltare il turno: sleale, il giocatore perde automaticamente
  - Terminare la partita: gli altri giocatori perdono il loro tempo
- **Pro**: La partita continua fluidamente, gli altri giocatori non sono penalizzati
- **Contro**: Il bot può peggiorare la situazione del giocatore (gioca male le sue carte)
- **Rischi**: Giocatore si disconnette apposta per far giocare il bot
- **Motivazione finale**: La continuità della partita è prioritaria. Penalità per abbandono disincentivano l'abuso.
- **Impatto futuro**: Il bot deve essere sufficientemente competente da non rovinare l'esperienza degli altri.

---

## Decisione 7: Moneta virtuale

- **Problema**: Come implementare l'economia?
- **Scelta consigliata**: Moneta virtuale interna con wallet + ledger transazionale
- **Alternative considerate**:
  - Sistema a punti senza valore economico (Elo/MMR puro)
  - Token su blockchain (NFT): complessità, costo, inutile per gioco casual
  - Nessuna economia: meno engagement
- **Pro**: Engagement, progressione percepita, base per futuri acquisti in-app
- **Contro**: Rischio farming, complessità implementativa, rischio legale se male comunicata
- **Rischi**: Utenti potrebbero percepire la moneta come avente valore reale; disclaimer necessario
- **Motivazione finale**: Un sistema di progressione aumenta retention. La complessità è gestibile con le dovute precauzioni.
- **Impatto futuro**: Se si volessero vendere monete per denaro reale, serve conformità legale (non in MVP).

---

## Decisione 8: Struttura monorepo

- **Problema**: Come organizzare il codice?
- **Scelta consigliata**: Monorepo con `client/`, `server/`, `shared/`
- **Alternative considerate**:
  - Repository separati per client e server: overhead di coordinamento
  - Unico progetto senza separazione: il disastro attuale
- **Pro**: Tipi condivisi, unico CI/CD, unico repo da clonare
- **Contro**: Monorepo può diventare complesso con molti sviluppatori
- **Rischi**: Accoppiamento involontario client-server via shared
- **Motivazione finale**: Per un team piccolo (1-3 sviluppatori), il monorepo è la scelta più produttiva.
- **Impatto futuro**: Facile da separare in futuro se necessario.

---

## Decisione 9: Gestione del tempo nei turni

- **Problema**: Quanto tempo ha un giocatore per fare la propria mossa?
- **Scelta consigliata**: 30 secondi per mossa, poi carta casuale legale
- **Alternative considerate**:
  - Tempo illimitato: partite infinite, giocatori frustrati
  - 15 secondi: troppo stressante per un gioco casual
  - 60 secondi: troppo lungo, le partite si dilatano
- **Pro**: Le partite hanno un ritmo costante, previene AFK intenzionali
- **Contro**: Giocatori lenti o con connessione scarsa penalizzati
- **Rischi**: 30 secondi potrebbero non bastare in round da 5 carte nelle prime partite
- **Motivazione finale**: 30 secondi è lo standard per giochi di carte digitali (Hearthstone: 75s, ma Bisca ha molte meno opzioni).
- **Impatto futuro**: Timer configurabile per lobby "amichevole" vs "competitiva".

---

## Decisione 10: Scaling e deploy

- **Problema**: Come deployare?
- **Scelta consigliata**: Docker Compose su singolo VPS (MVP), poi Kubernetes se necessario
- **Alternative considerate**:
  - Serverless (Vercel + Cloudflare Workers): non adatto a WebSocket stateful
  - Kubernetes dall'inizio: overkill per <1000 utenti
  - Bare metal: manutenzione elevata
- **Pro**: Docker Compose è semplice, riproducibile, sufficiente per MVP
- **Contro**: Singolo punto di fallimento
- **Rischi**: Downtime durante aggiornamenti (accettabile per MVP)
- **Motivazione finale**: La priorità è lanciare e validare l'idea, non costruire un'infrastruttura enterprise.
- **Impatto futuro**: Migrare a Kubernetes è facilitato dall'uso di Docker.

---

## Decisione 11: Regola del seme (palo)

- **Problema**: Implementare o no l'obbligo di rispondere al seme?
- **Scelta consigliata**: **Implementarla** nel game engine server. Renderla configurabile (default: ON)
- **Alternative considerate**:
  - Non implementarla (come ora): gioco più accessibile ma meno profondo
  - Implementarla senza opzione: più fedele alla tradizione ma meno accessibile
- **Pro**: Rispetto delle regole ufficiali, profondità strategica, differenziazione del prodotto
- **Contro**: Maggiore complessità IA bot, curva di apprendimento per nuovi giocatori
- **Rischi**: I giocatori occasionali potrebbero trovarlo frustrante
- **Motivazione finale**: È la regola più importante della Bisca. Senza, non è veramente Bisca. La configurabilità permette di testare entrambe.
- **Impatto futuro**: IA bot va rifatta per supportare la regola del seme.

---

## Decisione 12: Nomi dittatori — rischio contenuti

- **Problema**: I nomi e ritratti di dittatori/politici reali sono appropriati per un gioco pubblico?
- **Scelta consigliata**: **Rivedere prima del deploy pubblico.** Offrire skin/avatar alternative non politiche.
- **Alternative considerate**:
  - Mantenere i dittatori come tema principale: controverso, può alienare utenti o piattaforme (Apple/Google Store)
  - Rimuovere completamente: perde l'identità del gioco originale
  - Aggiungere temi alternativi: tema "dittatori" come predefinito, con opzione "classico" (nomi neutri)
- **Pro di mantenere**: Tema memorabile, umoristico, differenziazione
- **Contro**: Potenzialmente offensivo, rischio rejection dagli App Store, problemi legali in alcuni paesi
- **Rischi**: Ban da piattaforme, controversie pubbliche, alienazione utenti
- **Motivazione finale**: Per MVP web, il rischio è basso. Prima di qualsiasi deploy su store mobile, il tema va reso opzionale.
- **Impatto futuro**: Sistema di "temi" per personalizzare l'esperienza (dittatori, fantasy, animali, ecc.)
