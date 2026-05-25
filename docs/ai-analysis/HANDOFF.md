# HANDOFF — Stato del progetto al 2026-05-25

Ultimo commit: `d5c873e` sul branch `WebApp`

---

## Cosa ho capito del progetto

**BiscaWeb** è un gioco di carte "Bisca: Dictator Edition", prototipo single-player vanilla HTML/CSS/JS (1265 righe, `index.html`). Il giocatore umano sfida 1-6 bot con personalità da dittatore (Mussolini, Trump, Stalin, Putin, ecc.) in partite a eliminazione.

Regole implementate (NON esattamente la Bisca tradizionale):
- Mazzo 40 carte napoletane (4 semi, 10 valori)
- Gerarchia semi: Denari > Coppe > Spade > Bastoni
- Gerarchia valori: Re(10) > Cavallo(9) > ... > Asso(1)
- Bidding sequenziale con "regola dell'ultimo" (il mazziere non può pareggiare)
- Asso di Denari = Jolly (MAX vince tutto, MIN perde sempre)
- Sistema a vite: errore di N prese = -N vite
- Round a fisarmonica: 5→4→3→2→1→2→3→4→5→...
- Indiana (1 carta): non vedi la tua carta, vedi quelle degli altri
- Modalità Duello: 2 giocatori, 1 vita, round da 1 carta

Deviazioni dalla Bisca ufficiale:
- **NON c'è obbligo di rispondere al seme (palo)** — la mancanza più grave
- Bidding sequenziale anziché simultaneo
- Sistema a vite invece che a punti cumulativi
- Nessun "cappotto", "taglio", "bisca e mezzo"

Il progetto NON ha backend, database, autenticazione, build system. È puro HTML statico.

---

## File importanti

### Da non toccare (reference intatta)
| File | Ruolo |
|---|---|
| `index.html` | Gioco originale funzionante — riferimento per regole e UI |
| `tutorial.html` | Tutorial 6 slide |
| `img/` | 40 carte PNG + 12 ritratti dittatori |

### Nuovi (da preservare e sviluppare)
| File | Ruolo |
|---|---|
| `shared/types.ts` | Interfacce TypeScript (CardData, PlayerData, GameState, WS messages) |
| `shared/constants.ts` | Costanti (suits, ranks, soglie, timing) |
| `server/engine/card.ts` | Classe Card — baseScore, jolly, imagePath |
| `server/engine/deck.ts` | Classe Deck — Fisher-Yates, seed deterministico |
| `server/engine/player.ts` | Classe Player — UUID, resetForRound, playCard |
| `server/engine/trick.ts` | Risolutore prese — confronto effectiveScore |
| `server/engine/scoring.ts` | Calcolo penalità, game-over detection |
| `server/engine/bidding.ts` | Forbidden bid, validazione, hand strength |
| `server/engine/game.ts` | Macchina a stati completa (EventEmitter) |
| `server/src/index.ts` | Express + Socket.IO server (porta 3000) |
| `server/engine/*.test.ts` | 7 file di test, 77 test, **tutti passanti** |
| `docs/ai-analysis/*.md` | 13 documenti di analisi (3693 righe) |
| `docs/game-rules-reference.md` | Reference regole con riferimenti a righe di codice |

### Rimossi (pulizia già fatta)
- `tests/` (13 file prototipo duplicati)
- `img/*.xml` (4 residui Android)
- `LogoGran.png` (6.6 MB, mai usato)
- `LogoPiccolo.png` (90 KB, mai usato)

---

## Decisioni prese

1. **Game engine 100% server-authoritative** — il client sarà un renderer stupido
2. **WebSocket (Socket.IO)** come protocollo, non REST polling
3. **React + TypeScript + Vite** per il nuovo frontend
4. **PostgreSQL** per dati persistenti (ACID obbligatorio per wallet)
5. **Redis** per session store, rate limiting, pub/sub
6. **JWT** (access 15min + refresh 30d httpOnly) per auth
7. **Monorepo** con `client/`, `server/`, `shared/`
8. **Moduli engine auto-contenuti** — zero dipendenze da DOM, database o network
9. **Regola del palo (seme)** da implementare come opzione configurabile
10. **Moneta virtuale** con ledger transazionale e idempotency key
11. **Bot autofill dopo 45s** in lobby per non bloccare le partite
12. **Tema dittatori** da rendere opzionale prima di store mobile

Vedi `docs/ai-analysis/10_DECISIONS_LOG.md` per il registro completo (12 decisioni con pro/contro).

---

## Task completati

| # | Task | Stato |
|---|---|---|
| 1 | Inizializzazione Git, pulizia file spazzatura, .gitignore hardened | ✅ Commit `ddca624` |
| 2 | Documento reference regole implementate (407 righe) | ✅ Commit `6d0a1a4` |
| 3 | Modulo `shared/` con tipi e costanti TypeScript | ✅ |
| 4 | Classe Card TypeScript + 14 test | ✅ |
| 5 | Classe Deck (seed deterministico) + 10 test | ✅ |
| 6 | Classe Player (UUID) + 10 test | ✅ |
| 7 | Risolutore prese (trick.ts) + 9 test | ✅ |
| 8 | Calcolo penalità (scoring.ts) + 8 test | ✅ |
| 9 | Logica bidding (bidding.ts) + 10 test | ✅ |
| 10 | Macchina a stati Game + 7 test (incl. 100 partite simulate) | ✅ |
| 11 | Server Express + Socket.IO, health endpoint | ✅ |

**Totale**: 77 test, 0 failure, 100 partite simulate 0 crash.

---

## Task ancora da fare

Da `docs/ai-analysis/09_ATOMIC_TASKS_FOR_CLAUDE.md`:

| # | Task | Priorità |
|---|---|---|
| 12 | Setup database PostgreSQL e migrazioni | Alta |
| 13 | Auth: register, login, JWT, refresh token | Alta |
| 14 | WebSocket handler per game (collega engine a Socket.IO) | Alta |
| 15 | Lobby system (crea, join, leave, ready, autofill) | Alta |
| 16 | Frontend React + TypeScript (nuovo client) | Alta |
| 17 | Wallet e moneta virtuale | Media |
| 18 | Storico partite e leaderboard | Media |
| 19 | Bot avanzati (regola del seme, livelli difficoltà, memoria) | Media |
| 20 | Multiplayer multi-umano reale | Media |
| 21 | Deploy (Docker Compose, HTTPS, CI/CD) | Bassa |
| 22 | Anti-cheat e moderazione | Bassa |

Vedi `docs/ai-analysis/08_IMPLEMENTATION_ROADMAP.md` per il piano completo con dipendenze, rischi e criteri di ogni milestone.

---

## Problemi aperti

1. **Regola del palo (seme) non implementata** — Il game engine attuale non forza l'obbligo di rispondere al seme. È la feature più importante da aggiungere. Il modulo `trick.ts` ha un parametro `_strictSuitRule` già predisposto.

2. **IA bot da rifare** — L'attuale `calculateBotMove` (ora in `game.test.ts` come helper) non considera i semi. Quando si implementa la regola del palo, la IA va completamente ridisegnata.

3. **Nessuna gestione disconnessioni nel server** — Il server ha solo placeholder. Manca la logica di reconnect, timeout turno, bot sostitutivo.

4. **Nessuna validazione anti-cheat** — Il server non ha euristiche per rilevare bot client, bid perfetti, pattern sospetti.

5. **Tema dittatori potenzialmente controverso** — Da rivedere prima del deploy pubblico. Considerare sistema di temi multipli.

6. **Database non ancora inizializzato** — Le migrazioni non sono state scritte. Lo schema è documentato in `06_DATABASE_AND_ECONOMY_DESIGN.md`.

7. **Il gioco originale `index.html` NON è più la fonte di verità** — Ora la logica autorevole è in `server/engine/`. Il vecchio index.html è solo reference visiva e set di asset.

---

## Prossimo step consigliato

**Task 12: Setup database + migrazioni**

```bash
# 1. Avvia PostgreSQL con Docker
docker run -d --name bisca-db -e POSTGRES_USER=bisca -e POSTGRES_PASSWORD=bisca -e POSTGRES_DB=biscaweb -p 5432:5432 postgres:17

# 2. Implementa le migrazioni SQL (schema in docs/ai-analysis/06_DATABASE_AND_ECONOMY_DESIGN.md)
# 3. Connetti il server a PostgreSQL
# 4. Scrivi test di integrazione
```

Il prompt per Claude Code è già pronto: apri `docs/ai-analysis/09_ATOMIC_TASKS_FOR_CLAUDE.md` e usa il Task 12 come base.

### Avvio rapido per testare ciò che esiste

```bash
cd /home/blackbird/Documents/BiscaWeb

# Gioco originale
xdg-open index.html

# Test game engine (77 test)
cd server && npx vitest run

# Server backend
npx tsx src/index.ts
# Poi: curl http://localhost:3000/api/health
```

### Commit history sul branch `WebApp`

```
d5c873e Add game engine and server foundation (Tasks 3-11)
6d0a1a4 Add game rules reference document with exact code line mapping
ddca624 Cleanup: remove junk files and harden .gitignore
d160c8d Update project (initial)
```

---

*Handoff generato da Claude Code il 2026-05-25.*
*Branch: `WebApp` — Remote: `origin/WebApp` su `github.com/Jonajjrn/Bisca.git`*
