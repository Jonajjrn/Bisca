// Game Constants

// Premium Dark Theme Colors
export const COLORS = {
  // Background
  background: '#000000',
  backgroundSecondary: '#111111',
  backgroundTertiary: '#1a1a1a',
  
  // Suit colors (neon/vibrant)
  denari: '#FFD700',      // Oro caldo / Giallo sole
  coppe: '#FF6B6B',       // Rosso corallo
  spade: '#00D4FF',       // Ciano elettrico
  bastoni: '#4ECDC4',     // Verde menta
  
  // UI Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  accent: '#FFD700',
  accentSecondary: '#4ca1af',
  danger: '#FF4757',
  success: '#2ECC71',
  
  // Gradients
  gradientPurple: ['#667eea', '#764ba2'],
  gradientOrange: ['#f093fb', '#f5576c'],
  gradientBlue: ['#4facfe', '#00f2fe'],
  gradientGreen: ['#11998e', '#38ef7d'],
  gradientDark: ['#0f0c29', '#302b63', '#24243e'],
  
  // Glass effect
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
};

export const LEAGUES = [
  { id: 'bronze', name: 'Bronzo', minCoins: 0, maxCoins: 500, entryFee: 10, reward: 25, color: '#CD7F32' },
  { id: 'silver', name: 'Argento', minCoins: 500, maxCoins: 2000, entryFee: 50, reward: 125, color: '#C0C0C0' },
  { id: 'gold', name: 'Oro', minCoins: 2000, maxCoins: 5000, entryFee: 200, reward: 500, color: '#FFD700' },
  { id: 'platinum', name: 'Platino', minCoins: 5000, maxCoins: 15000, entryFee: 500, reward: 1250, color: '#E5E4E2' },
  { id: 'diamond', name: 'Diamante', minCoins: 15000, maxCoins: Infinity, entryFee: 1000, reward: 2500, color: '#B9F2FF' },
];

export const SEMI = ['Bastoni', 'Spade', 'Coppe', 'Denari'];
export const VALORI = ['A', '2', '3', '4', '5', '6', '7', 'Fante', 'Cavallo', 'Re'];
export const FILE_MAP = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'Fante': 8, 'Cavallo': 9, 'Re': 10 };

// Job-based opponents with emojis
export const OPPONENTS = [
  { name: 'Chef', emoji: '👨‍🍳', personality: 'PASSIONATE' },
  { name: 'Medico', emoji: '👨‍⚕️', personality: 'CAREFUL' },
  { name: 'Pilota', emoji: '👨‍✈️', personality: 'CONFIDENT' },
  { name: 'Scienziato', emoji: '👨‍🔬', personality: 'ANALYTICAL' },
  { name: 'Artista', emoji: '👨‍🎨', personality: 'CREATIVE' },
  { name: 'Pompiere', emoji: '👨‍🚒', personality: 'BRAVE' },
  { name: 'Contadino', emoji: '👨‍🌾', personality: 'PATIENT' },
  { name: 'Meccanico', emoji: '👨‍🔧', personality: 'PRACTICAL' },
  { name: 'Insegnante', emoji: '👩‍🏫', personality: 'WISE' },
  { name: 'Detective', emoji: '🕵️', personality: 'CLEVER' },
  { name: 'Astronauta', emoji: '👨‍🚀', personality: 'ADVENTUROUS' },
  { name: 'Giudice', emoji: '👨‍⚖️', personality: 'FAIR' },
  { name: 'Cantante', emoji: '🧑‍🎤', personality: 'SHOWMAN' },
];

export const DIALOGUE_DB = {
  PASSIONATE: {
    WIN_TRICK: ['Perfetto!', 'Ottima mossa!', 'Delizioso!', 'Che soddisfazione!'],
    LOSE_LIFE: ['Bruciato!', 'No no no...', 'Devo riprovarci!', 'Che disastro!'],
    ELIMINATED: ['La cucina chiude...', 'Meglio tornare ai fornelli!', 'Ho perso l\'appetito!'],
    HIGH_BID: ['Punto tutto!', 'Sono sicuro!', 'Ci metto la firma!'],
    LOW_BID: ['Un pizzico solo...', 'Piano piano...', 'Con moderazione.'],
  },
  CAREFUL: {
    WIN_TRICK: ['Ben calcolato.', 'Come previsto.', 'Ottima diagnosi.', 'Precisione.'],
    LOSE_LIFE: ['Errore di valutazione.', 'Devo ricalcolare.', 'Non previsto.'],
    ELIMINATED: ['Paziente perso...', 'Fallimento.', 'Serve una pausa.'],
    HIGH_BID: ['Analisi completa.', 'I numeri dicono sì.', 'Rischio calcolato.'],
    LOW_BID: ['Meglio essere cauti.', 'Non rischiare.', 'Attendere e vedere.'],
  },
  CONFIDENT: {
    WIN_TRICK: ['Atterraggio perfetto!', 'In volo!', 'Destinazione raggiunta!', 'Roger!'],
    LOSE_LIFE: ['Turbolenze!', 'Mayday...', 'Rotta sbagliata!'],
    ELIMINATED: ['Volo cancellato.', 'Atterraggio di emergenza.', 'Ritorno alla base.'],
    HIGH_BID: ['Decollo immediato!', 'Obiettivo in vista!', 'Tutti a bordo!'],
    LOW_BID: ['In attesa...', 'Controllo meteo.', 'Prudenza.'],
  },
  ANALYTICAL: {
    WIN_TRICK: ['Ipotesi confermata!', 'Dati corretti.', 'Eureka!', 'Logico.'],
    LOSE_LIFE: ['Variabile imprevista.', 'Errore nel calcolo.', 'Dati insufficienti.'],
    ELIMINATED: ['Esperimento fallito.', 'Torno al laboratorio.', 'Serve più ricerca.'],
    HIGH_BID: ['Probabilità favorevole.', 'I dati sono chiari.', 'Matematicamente probabile.'],
    LOW_BID: ['Incertezza elevata.', 'Margine di errore.', 'Campione limitato.'],
  },
  CREATIVE: {
    WIN_TRICK: ['Capolavoro!', 'Arte pura!', 'Bellissimo!', 'Ispirazione!'],
    LOSE_LIFE: ['Critica severa...', 'Non apprezzato.', 'Blocco creativo!'],
    ELIMINATED: ['Fine dell\'esposizione.', 'Torno a creare.', 'L\'arte è sofferenza!'],
    HIGH_BID: ['Visione artistica!', 'Oso tutto!', 'Creatività al massimo!'],
    LOW_BID: ['Minimalismo.', 'Meno è più.', 'Semplicità.'],
  },
  BRAVE: {
    WIN_TRICK: ['Fuoco spento!', 'Missione compiuta!', 'Eroe!', 'Salvi!'],
    LOSE_LIFE: ['Fiamme troppo alte!', 'Ritirata tattica!', 'Bruciato!'],
    ELIMINATED: ['Sirene spente...', 'Emergenza finita male.', 'Torno in caserma.'],
    HIGH_BID: ['All\'attacco!', 'Nessuna paura!', 'Coraggio!'],
    LOW_BID: ['Prudenza.', 'Valuto i rischi.', 'Piano B.'],
  },
  PATIENT: {
    WIN_TRICK: ['Buon raccolto!', 'Pazienza ripagata.', 'Stagione buona.', 'Naturale.'],
    LOSE_LIFE: ['Grandine!', 'Siccità...', 'Raccolto perso.'],
    ELIMINATED: ['Campo abbandonato.', 'Torno alla terra.', 'Riproverò.'],
    HIGH_BID: ['Terreno fertile.', 'Buone previsioni.', 'Semina abbondante.'],
    LOW_BID: ['Con calma...', 'Aspettiamo.', 'Tempo al tempo.'],
  },
  PRACTICAL: {
    WIN_TRICK: ['Riparato!', 'Funziona!', 'Sistemato!', 'Perfetto!'],
    LOSE_LIFE: ['Si è rotto!', 'Serve un ricambio.', 'Guasto imprevisto!'],
    ELIMINATED: ['Officina chiusa.', 'Attrezzi a posto.', 'Torno domani.'],
    HIGH_BID: ['Ho gli attrezzi giusti.', 'Progetto solido.', 'Ci penso io.'],
    LOW_BID: ['Meglio controllare.', 'Manutenzione.', 'Un passo alla volta.'],
  },
  WISE: {
    WIN_TRICK: ['Lezione imparata!', 'Eccellente!', 'Bravo!', 'Voto alto!'],
    LOSE_LIFE: ['Bocciato!', 'Serve più studio.', 'Errore da matita rossa.'],
    ELIMINATED: ['Campanella finale.', 'Fine lezione.', 'A ripetizione!'],
    HIGH_BID: ['Ho studiato bene.', 'Preparato!', 'Conoscenza solida.'],
    LOW_BID: ['Dubbi...', 'Serve ripasso.', 'Umiltà.'],
  },
  CLEVER: {
    WIN_TRICK: ['Caso risolto!', 'Elementare!', 'Indizio giusto!', 'Trovato!'],
    LOSE_LIFE: ['Pista falsa...', 'Mi hanno fregato!', 'Devo ricominciare.'],
    ELIMINATED: ['Caso irrisolto.', 'Torno all\'ufficio.', 'Mistero.'],
    HIGH_BID: ['Ho le prove.', 'Intuizione.', 'Tutto torna.'],
    LOW_BID: ['Mancano indizi.', 'Troppi sospetti.', 'Osservo.'],
  },
  ADVENTUROUS: {
    WIN_TRICK: ['Spaziale!', 'Orbita perfetta!', 'Stelle allineate!', 'Houston, ce l\'ho fatta!'],
    LOSE_LIFE: ['Buco nero!', 'Ossigeno finito!', 'Meteora in arrivo!'],
    ELIMINATED: ['Missione abortita.', 'Ritorno sulla Terra.', 'Lo spazio è infinito...'],
    HIGH_BID: ['Lancio imminente!', 'Conto alla rovescia!', 'Verso le stelle!'],
    LOW_BID: ['Controlli in corso.', 'Orbita stabile.', 'Attesa.'],
  },
  FAIR: {
    WIN_TRICK: ['Sentenza!', 'Giustizia!', 'Verdetto chiaro!', 'Caso chiuso!'],
    LOSE_LIFE: ['Obiezione!', 'Appello!', 'Ingiustizia!'],
    ELIMINATED: ['Corte aggiornata.', 'Fine del processo.', 'Ritiro la toga.'],
    HIGH_BID: ['Prove schiaccianti.', 'Testimonianza solida.', 'Giuro.'],
    LOW_BID: ['Dubbio ragionevole.', 'Prove insufficienti.', 'Attendo.'],
  },
  SHOWMAN: {
    WIN_TRICK: ['Bravo!', 'Applausi!', 'Bis!', 'Standing ovation!'],
    LOSE_LIFE: ['Stecca!', 'Fischi!', 'Palco sbagliato!'],
    ELIMINATED: ['Cala il sipario.', 'Ultimo atto.', 'Esco di scena.'],
    HIGH_BID: ['Lo show deve continuare!', 'Pubblico mio!', 'Grande finale!'],
    LOW_BID: ['Riscaldamento.', 'Prima prova.', 'Piano.'],
  },
};

/**
 * Initial player data structure for new users
 * @property {string} name - Display name of the player
 * @property {number} coins - Currency balance for entering leagues
 * @property {number} gamesPlayed - Total games played
 * @property {number} gamesWon - Total games won
 * @property {string} highestLeague - ID of the highest league achieved
 * @property {string} avatar - Emoji avatar for the player profile
 * @property {boolean} hasCompletedOnboarding - Whether the user has completed the intro tutorial
 */
export const INITIAL_PLAYER_DATA = {
  name: 'Giocatore',
  coins: 50,
  gamesPlayed: 0,
  gamesWon: 0,
  highestLeague: 'bronze',
  avatar: '🎴',
  hasCompletedOnboarding: false,
  hasCompletedTutorial: false,
};

// Avatar options for profile creation
export const AVATAR_OPTIONS = [
  { id: 'card', emoji: '🎴', name: 'Cartaio' },
  { id: 'crown', emoji: '👑', name: 'Re' },
  { id: 'devil', emoji: '😈', name: 'Diavolo' },
  { id: 'cool', emoji: '😎', name: 'Cool' },
  { id: 'nerd', emoji: '🤓', name: 'Professore' },
  { id: 'elder', emoji: '👴', name: 'Nonno' },
  { id: 'lady', emoji: '👵', name: 'Nonna Rosa' },
  { id: 'wizard', emoji: '🧙', name: 'Mago' },
  { id: 'clown', emoji: '🤡', name: 'Jolly' },
  { id: 'skull', emoji: '💀', name: 'Morte' },
  { id: 'alien', emoji: '👽', name: 'Alieno' },
  { id: 'robot', emoji: '🤖', name: 'Robot' },
];
