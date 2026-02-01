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

export const DICTATORS = [
  'Mussolini', 'Hitler', 'Napoleone', 'Cesare',
  'Gheddafi', 'Fidel', 'Gengis', 'Kim', 'Franco', 'Mao',
  'Trump', 'Putin', 'Berlusconi',
];

export const DIALOGUE_DB = {
  AGGRESSIVE: {
    names: ['Mussolini', 'Hitler', 'Gengis', 'Cesare', 'Napoleone'],
    WIN_TRICK: ['Tutto mio!', 'Conquisto anche questo!', 'Deboli!', 'È solo l\'inizio.'],
    LOSE_LIFE: ['Tradimento!', 'Impossibile...', 'Contrattacco!', 'Pagherete caro.'],
    ELIMINATED: ['La storia mi assolverà!', 'Non è finita qui!', 'Cadere in piedi!', 'Maledetti alleati!'],
    HIGH_BID: ['Vincerò tutto.', 'Nessuna pietà.', 'Dominio totale.'],
    LOW_BID: ['Strategia...', 'Attendo.', 'Meglio non rischiare.'],
  },
  PARANOID: {
    names: ['Mao', 'Fidel', 'Kim', 'Gheddafi', 'Franco'],
    WIN_TRICK: ['Proprietà dello Stato.', 'Confiscato.', 'Tutto secondo i piani.', 'Il popolo ringrazia.'],
    LOSE_LIFE: ['Sabotaggio!', 'Chi è la spia?', 'Ti mando in Siberia.', 'Complotto capitalista!'],
    ELIMINATED: ['Il sistema è corrotto!', 'Gulag per tutti!', 'La rivoluzione fallisce...', 'Mi ritiro nel bunker.'],
    HIGH_BID: ['Ho le carte giuste.', 'Il piano quinquennale.', 'Successo garantito.'],
    LOW_BID: ['Sospetto...', 'Troppi nemici.', 'Basso profilo.'],
  },
  SHOWMAN: {
    names: ['Trump', 'Berlusconi'],
    WIN_TRICK: ['Too easy!', 'Yuge!', 'Grandissimo!', 'Mi consenta!', 'So much winning!'],
    LOSE_LIFE: ['Fake news!', 'Rigged!', 'Comunisti!', 'Sad!', 'Witch hunt!'],
    ELIMINATED: ['I\'ll be back!', 'Perseguitato!', 'They stole it!', 'Menomale che Silvio c\'è...'],
    HIGH_BID: ['I have the best cards.', 'Tremendous.', 'Ghe pensi mi.'],
    LOW_BID: ['Let\'s see.', 'Wait and see.', 'Non ci credo.'],
  },
  ICEMAN: {
    names: ['Putin'],
    WIN_TRICK: ['Mine.', 'Special operation success.', 'Predictable.', 'Good.'],
    LOSE_LIFE: ['Mistake.', 'I will remember this.', 'Nyet.'],
    ELIMINATED: ['Impossible.', 'I disappear now.', 'You regret this.'],
    HIGH_BID: ['I take what I want.', 'No choice.', 'Power.'],
    LOW_BID: ['Observing.', 'Silence.', '...'],
  },
};

export const INITIAL_PLAYER_DATA = {
  name: 'Giocatore',
  coins: 100,
  gamesPlayed: 0,
  gamesWon: 0,
  highestLeague: 'bronze',
  avatar: '🎴',
  hasCompletedOnboarding: false,
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
