# 🃏 Bisca: Dictator Edition

**Bisca: Dictator Edition** è un gioco di carte Android (React Native/Expo) che rivisita le meccaniche classiche dei giochi di presa (simili a *Oh Hell!* o *Whist*) in chiave satirica e strategica.

Il giocatore ("Il Capo") deve sopravvivere a un tavolo pieno di personalità storiche e politiche note per il loro... "carattere forte". Non vince chi ha le carte migliori, ma chi sa prevedere il futuro.

## ✨ Funzionalità Chiave

* **♦️ Gameplay Strategico:** All'inizio di ogni round devi scommettere ("Bid") esattamente quante mani vincerai. Ogni errore ti costa una vita.
* **🧠 IA con Personalità:** I bot (da Stalin a Trump, da Putin a Mao) hanno archetipi comportamentali unici (Aggressivo, Paranoico, Showman, Iceman) e reagiscono agli eventi con fumetti di dialogo procedurali.
* **👳 Modalità Indiana:** Nei round a 1 carta, vedi le carte di tutti sulla loro fronte tranne la tua. Devi scommettere alla cieca basandoti sulla probabilità.
* **⚔️ Sudden Death & Duello Finale:** Se rimani in 1vs1 con una sola vita, il gioco cambia atmosfera.
* **🎲 Selezione Random Mazziere:** All'inizio della partita, il mazziere viene estratto casualmente con un'animazione.
* **🎨 Grafica Premium:** Interfaccia dark con effetti moderni e design minimalista.
* **🕹️ Configurazione Totale:** Scegli il numero di avversari (fino a 6), le vite iniziali e il tetto massimo di carte.

## 🚀 Come Giocare

### Requisiti
- Node.js 18+
- npm o yarn
- Expo CLI
- Android Studio (per emulatore) o dispositivo Android

### Installazione

```bash
cd BiscaApp
npm install
```

### Avvio in Sviluppo

```bash
npm start
# oppure
npm run android
```

### Build APK

```bash
npm run build:apk
```

### Regole in Breve

1. **Gerarchia Assoluta:** I semi hanno un potere fisso: **Denari > Coppe > Spade > Bastoni**. Un 2 di Denari batte un Re di Bastoni.
2. **Previsione:** Prima di giocare le carte, dichiara quante prese farai.
3. **Regola dell'Ultimo:** L'ultimo giocatore a parlare (il mazziere) non può chiamare un numero che faccia tornare i conti esatti (Somma Call != Carte in mano). Qualcuno deve per forza sbagliare.
4. **Jolly:** L'Asso di Denari può essere giocato come carta più alta (MAX) o più bassa (MIN) a scelta.

## 📂 Struttura del Progetto

```text
BiscaApp/
├── App.js              # Entry point dell'app
├── src/
│   ├── screens/        # Schermate (Home, Game, Tutorial, Settings)
│   ├── components/     # Componenti riutilizzabili (Card, PlayerBox)
│   ├── context/        # GameContext per stato globale
│   ├── utils/          # Logica di gioco, costanti, storage
│   └── assets/         # Immagini carte e ritratti
├── package.json
└── app.json
```
