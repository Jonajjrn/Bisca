# 🃏 Bisca: Dictator Edition

**Bisca: Dictator Edition** è un gioco di carte web-based (HTML/CSS/JS) che rivisita le meccaniche classiche dei giochi di presa (simili a *Oh Hell!* o *Whist*) in chiave satirica e strategica.

Il giocatore ("Il Capo") deve sopravvivere a un tavolo pieno di personalità storiche e politiche note per il loro... "carattere forte". Non vince chi ha le carte migliori, ma chi sa prevedere il futuro.

## ✨ Funzionalità Chiave

* **♦️ Gameplay Strategico:** All'inizio di ogni round devi scommettere ("Bid") esattamente quante mani vincerai. Ogni errore ti costa una vita.
* **🧠 IA con Personalità:** I bot (da Stalin a Trump, da Putin a Mao) hanno archetipi comportamentali unici (Aggressivo, Paranoico, Showman, Iceman) e reagiscono agli eventi con fumetti di dialogo procedurali.
* **👳 Modalità Indiana:** Nei round a 1 carta, vedi le carte di tutti sulla loro fronte tranne la tua. Devi scommettere alla cieca basandoti sulla probabilità.
* **⚔️ Sudden Death & Duello Finale:** Se rimani in 1vs1 con una sola vita, il gioco cambia atmosfera, la musica (immaginaria) cambia e si entra nella "Indiana Definitiva".
* **🎨 Grafica Curata:**
    * Interfaccia "Dark Room" con effetti CRT e neon.
    * Carte animate con effetto ventaglio e fisica realistica.
    * Cuori in Pixel Art stile Minecraft.
    * Avatar personalizzati per ogni dittatore.
* **🕹️ Configurazione Totale:** Scegli il numero di avversari (fino a 7), le vite iniziali e il tetto massimo di carte.

## 🚀 Come Giocare

Non serve installare nulla! Il gioco è **Client-Side** puro.

1.  Scarica il repository o clona il progetto.
2.  Assicurati che la cartella `img` contenga le carte e la sottocartella `img/portraits` contenga gli avatar.
3.  Apri il file `index.html` con un qualsiasi browser moderno (Chrome, Firefox, Edge).
4.  Inserisci il tuo Nickname e... **Estrai il Mazziere!**

### Regole in Breve
1.  **Gerarchia Assoluta:** I semi hanno un potere fisso: **Denari > Coppe > Spade > Bastoni**. Un 2 di Denari batte un Re di Bastoni.
2.  **Previsione:** Prima di giocare le carte, dichiara quante prese farai.
3.  **Regola dell'Ultimo:** L'ultimo giocatore a parlare (il mazziere) non può chiamare un numero che faccia tornare i conti esatti (Somma Call != Carte in mano). Qualcuno deve per forza sbagliare.
4.  **Jolly:** L'Asso di Denari può essere giocato come carta più alta (MAX) o più bassa (MIN) a scelta.

## 📂 Struttura del Progetto

```text
/
├── index.html       # Il cuore del gioco (Logica + UI)
├── tutorial.html    # Il manuale interattivo per i nuovi giocatori
├── img/             # Cartella assets (Carte da gioco)
│   ├── denari1.png
│   ├── ...
│   └── portraits/   # Avatar dei dittatori (es. stalin.png, trump.png)
└── README.md        # Questo file
