# 🃏 Bisca: Dictator Edition - Android App

**Bisca: Dictator Edition** è un gioco di carte mobile (React Native/Expo) che rivisita le meccaniche classiche dei giochi di presa in chiave satirica e strategica.

Questa è la versione Android del gioco originale web-based, con l'aggiunta di un sistema di **monete**, **leghe** e **progressione** simile ai tavoli da poker!

## 🎮 Funzionalità

### Sistema di Leghe (Poker-Style)
Il gioco include 5 leghe progressive, ognuna con entry fee e premi diversi:

| Lega | Entry Fee | Premio Vittoria | Monete Minime |
|------|-----------|-----------------|---------------|
| 🥉 Bronzo | 10 | 25 | 0 |
| 🥈 Argento | 50 | 125 | 500 |
| 🥇 Oro | 200 | 500 | 2.000 |
| 💎 Platino | 500 | 1.250 | 5.000 |
| 💠 Diamante | 1.000 | 2.500 | 15.000 |

### ♦️ Gameplay Strategico
- Scommetti (BID) quante mani vincerai prima di ogni round
- Gerarchia dei semi: **Denari > Coppe > Spade > Bastoni**
- L'Asso di Denari è il JOLLY - scegli se giocare MAX o MIN!

### 🧠 IA con Personalità
I bot (Mussolini, Trump, Putin, Mao, ecc.) hanno archetipi comportamentali unici e reagiscono agli eventi con fumetti di dialogo.

### 📱 Schermate
- **Home**: Statistiche giocatore, monete, vittorie, win rate
- **Selezione Tavolo**: Scegli la lega in base alle tue monete
- **Gioco**: Gameplay completo con carte animate
- **Tutorial**: Manuale interattivo per imparare le regole
- **Impostazioni**: Personalizza nome, numero avversari, vite e carte

## 🚀 Come Eseguire

### Prerequisiti
- Node.js 18+
- npm o yarn
- Expo CLI
- Android Studio (per emulatore) o dispositivo Android

### Installazione

```bash
# Entra nella cartella dell'app
cd BiscaApp

# Installa le dipendenze
npm install

# Avvia Expo
npx expo start

# Per Android (con emulatore o dispositivo connesso)
npx expo start --android

# Per Web (anteprima)
npx expo start --web
```

### Build per Android (APK)

Per creare un file APK installabile direttamente su dispositivi Android:

```bash
# 1. Assicurati di avere EAS CLI installato
npm install -g eas-cli

# 2. Se non l'hai già fatto, effettua il login su Expo
eas login

# 3. Build APK in cloud (consigliato)
npm run build:apk

# Oppure build locale (richiede Android SDK)
npm run build:apk:local
```

Il file APK verrà generato e potrai scaricarlo/installarlo direttamente sul tuo telefono Android.

## 📂 Struttura del Progetto

```
BiscaApp/
├── App.js                 # Entry point con navigazione
├── app.json               # Configurazione Expo
├── package.json           # Dipendenze
├── src/
│   ├── screens/           # Schermate dell'app
│   │   ├── HomeScreen.js      # Menu principale
│   │   ├── LeagueSelectScreen.js  # Selezione lega
│   │   ├── GameScreen.js      # Schermata di gioco
│   │   ├── TutorialScreen.js  # Tutorial
│   │   └── SettingsScreen.js  # Impostazioni
│   ├── components/        # Componenti riutilizzabili
│   │   ├── Card.js            # Componente carta
│   │   ├── PlayerBox.js       # Box info giocatore
│   │   └── LeagueCard.js      # Card selezione lega
│   ├── context/           # State management
│   │   └── GameContext.js     # Context del gioco
│   ├── utils/             # Utilities
│   │   ├── constants.js       # Costanti (leghe, dizionari)
│   │   ├── gameLogic.js       # Logica di gioco
│   │   ├── storage.js         # AsyncStorage per salvataggio
│   │   └── images.js          # Mapping immagini
│   └── assets/            # Assets
│       ├── cards/             # Immagini carte
│       └── portraits/         # Avatar dittatori
```

## 🎯 Regole del Gioco

1. **Gerarchia Assoluta**: I semi hanno un potere fisso. Un 2 di Denari batte un Re di Bastoni.
2. **Previsione (BID)**: Prima di giocare, dichiara quante prese farai.
3. **Regola dell'Ultimo**: Il mazziere non può chiamare un numero che pareggi i conti.
4. **Jolly**: L'Asso di Denari può essere MAX (vince tutto) o MIN (perde apposta).
5. **Indiana**: Nel round a 1 carta, vedi le carte degli altri ma NON la tua!

## 💰 Sistema di Progressione

- Inizi con **100 monete**
- Ogni vittoria ti premia in base alla lega
- Scala le leghe accumulando monete
- Più rischi, più guadagni!

## 🛠️ Tecnologie

- **React Native** con **Expo SDK 54**
- **React Navigation** per la navigazione
- **AsyncStorage** per il salvataggio locale
- **expo-linear-gradient** per gli sfondi

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT.
