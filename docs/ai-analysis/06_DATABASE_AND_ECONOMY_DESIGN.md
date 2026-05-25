# 06 — Database e moneta virtuale

## Schema database

### `users`

Tabella principale autenticazione.

| Campo | Tipo | Note |
|---|---|---|
| `id` | `UUID` PK | Generato lato server |
| `username` | `VARCHAR(30)` UNIQUE NOT NULL | Alfanumerico + underscore |
| `email` | `VARCHAR(255)` UNIQUE | Opzionale ma consigliato per recovery |
| `password_hash` | `VARCHAR(255)` NOT NULL | bcrypt, 12 round |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | |
| `last_login_at` | `TIMESTAMPTZ` | |
| `is_banned` | `BOOLEAN` DEFAULT FALSE | |
| `ban_reason` | `TEXT` | |
| `role` | `ENUM('user','moderator','admin')` DEFAULT 'user' | |

**Indici**:
- UNIQUE su `username`
- UNIQUE su `email`
- INDEX su `is_banned`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','moderator','admin'))
);
```

---

### `user_profiles`

Dati pubblici / di gioco del profilo (separati da `users` per sicurezza).

| Campo | Tipo | Note |
|---|---|---|
| `user_id` | `UUID` PK FK → users.id | 1:1 |
| `display_name` | `VARCHAR(30)` | Può differire da username |
| `avatar_seed` | `VARCHAR(10)` | Seed per avatar generato (DiceBear) |
| `games_played` | `INTEGER` DEFAULT 0 | |
| `games_won` | `INTEGER` DEFAULT 0 | |
| `total_rounds_played` | `INTEGER` DEFAULT 0 | |
| `best_bid_accuracy` | `DECIMAL(5,2)` | Percentuale bid esatti |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(30),
    avatar_seed VARCHAR(10),
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_rounds_played INTEGER DEFAULT 0,
    best_bid_accuracy DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `refresh_tokens`

Refresh token per JWT.

| Campo | Tipo | Note |
|---|---|---|
| `id` | `UUID` PK | |
| `user_id` | `UUID` FK → users.id | |
| `token_hash` | `VARCHAR(255)` UNIQUE NOT NULL | SHA-256 del token |
| `device_info` | `VARCHAR(255)` | User agent / fingerprint |
| `expires_at` | `TIMESTAMPTZ` NOT NULL | 30 giorni |
| `revoked_at` | `TIMESTAMPTZ` | NULL se attivo |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_info VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

---

### `wallets`

Saldo attuale della moneta virtuale. Una riga per utente.

**IMPORTANTE**: Questo è il solo "saldo" visibile. Non va MAI aggiornato direttamente senza una corrispondente riga in `wallet_transactions`.

| Campo | Tipo | Note |
|---|---|---|
| `user_id` | `UUID` PK FK → users.id | 1:1 |
| `balance` | `INTEGER` DEFAULT 0 NOT NULL CHECK (balance >= 0) | In centesimi (o unità atomiche) |
| `version` | `INTEGER` DEFAULT 1 | Lock ottimistico |
| `updated_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

```sql
CREATE TABLE wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `wallet_transactions`

Ledger immutabile di tutte le transazioni economiche.

| Campo | Tipo | Note |
|---|---|---|
| `id` | `UUID` PK | |
| `user_id` | `UUID` FK → users.id | |
| `amount` | `INTEGER` NOT NULL | Positivo = accredito, negativo = addebito |
| `balance_after` | `INTEGER` NOT NULL | Saldo dopo la transazione |
| `type` | `ENUM('game_reward','game_buyin','bonus_daily','refund','admin_adjustment','signup_bonus')` | |
| `reference_type` | `VARCHAR(50)` | 'game', 'admin', 'signup' |
| `reference_id` | `UUID` | ID della partita o null |
| `idempotency_key` | `VARCHAR(64)` UNIQUE NOT NULL | UUID generato dal client |
| `metadata` | `JSONB` | Dati aggiuntivi |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

```sql
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('game_reward','game_buyin','bonus_daily','refund','admin_adjustment','signup_bonus')),
    reference_type VARCHAR(50),
    reference_id UUID,
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at);
```

---

### `lobbies`

Stanze di attesa prima della partita.

| Campo | Tipo | Note |
|---|---|---|
| `id` | `UUID` PK | |
| `name` | `VARCHAR(50)` | |
| `created_by` | `UUID` FK → users.id | |
| `is_private` | `BOOLEAN` DEFAULT FALSE | |
| `invite_code` | `VARCHAR(10)` UNIQUE | Per lobby private, generato casuale |
| `max_players` | `INTEGER` DEFAULT 4 CHECK (max_players BETWEEN 2 AND 7) | |
| `status` | `ENUM('waiting','filling_with_bots','starting','in_game','completed','abandoned')` | |
| `game_id` | `UUID` FK → games.id | NULL finché la partita non inizia |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `expires_at` | `TIMESTAMPTZ` | Timeout lobby vuota |

```sql
CREATE TABLE lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50),
    created_by UUID REFERENCES users(id),
    is_private BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(10) UNIQUE,
    max_players INTEGER DEFAULT 4 CHECK (max_players BETWEEN 2 AND 7),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting','filling_with_bots','starting','in_game','completed','abandoned')),
    game_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX idx_lobbies_status ON lobbies(status);
```

---

### `lobby_players`

Giocatori in una lobby.

| Campo | Tipo | Note |
|---|---|---|
| `lobby_id` | `UUID` FK → lobbies.id | |
| `user_id` | `UUID` FK → users.id | NULL per bot |
| `is_bot` | `BOOLEAN` DEFAULT FALSE | |
| `is_ready` | `BOOLEAN` DEFAULT FALSE | |
| `joined_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

```sql
CREATE TABLE lobby_players (
    lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    is_bot BOOLEAN DEFAULT FALSE,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (lobby_id, user_id)
);
```

---

### `games`

Stato della partita.

| Campo | Tipo | Note |
|---|---|---|
| `id` | `UUID` PK | |
| `lobby_id` | `UUID` FK → lobbies.id | |
| `status` | `ENUM('active','completed','abandoned')` | |
| `winner_id` | `UUID` FK → users.id | NULL finché non finisce |
| `total_rounds` | `INTEGER` | |
| `initial_lives` | `INTEGER` | |
| `initial_cards_max` | `INTEGER` | |
| `game_state` | `JSONB` | Stato completo serializzato per recovery |
| `started_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `ended_at` | `TIMESTAMPTZ` | |

```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID REFERENCES lobbies(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
    winner_id UUID REFERENCES users(id),
    total_rounds INTEGER,
    initial_lives INTEGER,
    initial_cards_max INTEGER,
    game_state JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);
```

---

### `game_players`

Partecipazione a una partita e statistiche.

| Campo | Tipo | Note |
|---|---|---|
| `game_id` | `UUID` FK → games.id | |
| `user_id` | `UUID` FK → users.id | NULL per bot |
| `seat_position` | `INTEGER` | 0-based |
| `is_bot` | `BOOLEAN` DEFAULT FALSE | |
| `final_bid_accuracy` | `DECIMAL(5,2)` | Percentuale di bid esatti |
| `final_lives_remaining` | `INTEGER` | |
| `total_tricks_won` | `INTEGER` | |
| `placement` | `INTEGER` | 1 = primo eliminato, N = vincitore |
| `reward_coins` | `INTEGER` | Monete guadagnate |
| `abandoned` | `BOOLEAN` DEFAULT FALSE | |

```sql
CREATE TABLE game_players (
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    seat_position INTEGER NOT NULL,
    is_bot BOOLEAN DEFAULT FALSE,
    final_bid_accuracy DECIMAL(5,2),
    final_lives_remaining INTEGER,
    total_tricks_won INTEGER,
    placement INTEGER,
    reward_coins INTEGER DEFAULT 0,
    abandoned BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (game_id, seat_position)
);
CREATE INDEX idx_game_players_user ON game_players(user_id);
```

---

### `game_events`

Log di ogni azione di gioco (per replay, debugging, dispute).

| Campo | Tipo | Note |
|---|---|---|
| `id` | `BIGSERIAL` PK | |
| `game_id` | `UUID` FK → games.id | |
| `round_number` | `INTEGER` | |
| `trick_number` | `INTEGER` | |
| `player_seat` | `INTEGER` | |
| `event_type` | `VARCHAR(30)` | 'bid','play_card','trick_result','round_end','elimination','game_end' |
| `event_data` | `JSONB` | Dettagli azione |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

```sql
CREATE TABLE game_events (
    id BIGSERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER,
    trick_number INTEGER,
    player_seat INTEGER,
    event_type VARCHAR(30) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_game_events_game ON game_events(game_id);
```

---

### `bot_profiles`

Bot predefiniti per autofill.

| Campo | Tipo | Note |
|---|---|---|
| `id` | `SERIAL` PK | |
| `name` | `VARCHAR(30)` UNIQUE | |
| `personality` | `VARCHAR(20)` | 'aggressive','paranoid','showman','iceman' |
| `difficulty` | `INTEGER` CHECK (1-5) | 1=principiante, 5=esperto |
| `avatar_path` | `VARCHAR(255)` | Percorso immagine |
| `catchphrase` | `TEXT[]` | Array PostgreSQL di frasi |

```sql
CREATE TABLE bot_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,
    personality VARCHAR(20) NOT NULL,
    difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
    avatar_path VARCHAR(255),
    catchphrase TEXT[]
);
```

---

### `audit_logs`

Log di sicurezza e operazioni sensibili.

| Campo | Tipo | Note |
|---|---|---|
| `id` | `BIGSERIAL` PK | |
| `user_id` | `UUID` | Nullable (azioni anonime) |
| `action` | `VARCHAR(50)` NOT NULL | 'login','logout','wallet_change','game_start','admin_action' |
| `details` | `JSONB` | |
| `ip_address` | `INET` | |
| `user_agent` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

### `leaderboard`

Classifica opzionale (materializzata o calcolata).

```sql
CREATE TABLE leaderboard (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER DEFAULT 1000,  -- Elo-like rating
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,    -- positivo = win streak, negativo = loss streak
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_leaderboard_rating ON leaderboard(rating DESC);
```

---

## Moneta virtuale — Regole tassative

### Principi

1. **La moneta è puramente virtuale, interna al gioco, non convertibile in denaro reale**, salvo diversa e specifica progettazione legale futura con licenze e compliance.

2. **Separazione bilancio/ledger**:
   - `wallets.balance` è la cache del saldo attuale (denormalizzato per performance)
   - `wallet_transactions` è la fonte di verità (immutabile, append-only)
   - Ogni modifica al balance DEVE avere una corrispondente transazione
   - Riconciliazione periodica: `SUM(amount) WHERE user_id = X` deve eguagliare `balance`

3. **Idempotency key obbligatoria**: ogni operazione economica include una chiave di idempotenza (UUID). Il server verifica che non sia già stata processata prima di eseguire la transazione.

4. **Transazioni ACID obbligatorie**: ogni modifica a `wallets` + `wallet_transactions` avviene in una transazione PostgreSQL.

```typescript
// Pseudocodice per transazione sicura
async function addCoins(userId: string, amount: number, type: string, idempotencyKey: string) {
  return await db.transaction(async (tx) => {
    // 1. Check idempotenza
    const existing = await tx.query(
      'SELECT 1 FROM wallet_transactions WHERE idempotency_key = $1', 
      [idempotencyKey]
    );
    if (existing.rows.length > 0) {
      return { status: 'duplicate' }; // Idempotente: ritorna ok senza fare nulla
    }
    
    // 2. Lock pessimistico
    const wallet = await tx.query(
      'SELECT balance, version FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    
    // 3. Calcola nuovo saldo
    const newBalance = wallet.rows[0].balance + amount;
    if (newBalance < 0) {
      throw new Error('Insufficient funds');
    }
    
    // 4. Aggiorna wallet
    await tx.query(
      'UPDATE wallets SET balance = $1, version = version + 1, updated_at = NOW() WHERE user_id = $2',
      [newBalance, userId]
    );
    
    // 5. Inserisci transazione
    await tx.query(
      `INSERT INTO wallet_transactions (user_id, amount, balance_after, type, idempotency_key) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, amount, newBalance, type, idempotencyKey]
    );
    
    return { status: 'ok', newBalance };
  });
}
```

### Fonti di moneta

| Evento | Importo | Note |
|---|---|---|
| Bonus registrazione | +500 | Una tantum |
| Vittoria partita PvP | +100 | Tutti umani |
| Vittoria partita PvE | +20 | Almeno 1 bot |
| Partita completata (non vittoria) | +25 | Partita PvP |
| Bonus giornaliero | +50 | Login giornaliero, 1 al giorno |
| Buy-in partita ranked | -50 | Opzionale, per modalità competitiva |

**Regola anti-farming**: Partite con ≥50% bot danno ricompense ridotte del 80%. Partite 100% bot (private) = 0 ricompense.

### Cosa NON fare con la moneta

- NESSUNA conversione in denaro reale (senza licenza)
- NESSUNA promessa di valore
- NESSUN acquisto con denaro reale (in MVP; eventualmente IAP futuro)
- NESSUN "earn to play" (paywall mascherato)
- NESSUN trasferimento tra giocatori (in MVP) — prevenire secondary market e farming
