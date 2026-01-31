import { SEMI, VALORI, FILE_MAP, DIALOGUE_DB, DICTATORS } from './constants';

// Card class representation
export class Card {
  constructor(valName, semeName) {
    this.valName = valName;
    this.semeName = semeName;
    this.valIdx = VALORI.indexOf(valName);
    this.semeIdx = SEMI.indexOf(semeName);
    this.baseScore = this.semeIdx * 100 + this.valIdx;
    this.effectiveScore = this.baseScore;
  }

  isJolly() {
    return this.valName === 'A' && this.semeName === 'Denari';
  }

  setJollyMode(isMax) {
    this.effectiveScore = isMax ? 1000 : -1;
  }

  resetScore() {
    this.effectiveScore = this.baseScore;
  }

  getImageName() {
    return `${this.semeName.toLowerCase()}${FILE_MAP[this.valName]}`;
  }
}

// Player class representation
export class Player {
  constructor(name, isHuman, lives) {
    this.name = name;
    this.isHuman = isHuman;
    this.lives = lives;
    this.hand = [];
    this.bid = -1;
    this.taken = 0;
    this.eliminated = false;
  }

  reset(lives) {
    this.lives = lives;
    this.hand = [];
    this.bid = -1;
    this.taken = 0;
    this.eliminated = false;
  }
}

// Create and shuffle deck
export function createDeck() {
  const deck = [];
  for (const s of SEMI) {
    for (const v of VALORI) {
      deck.push(new Card(v, s));
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Get bot dialogue based on personality
export function getBotDialogue(name, eventType) {
  // Special case: Mao speaks only in Chinese
  if (name === 'Mao') {
    const maoPhrases = [
      '你好',     // Hello
      '太棒了',   // Great
      '我们要胜利', // We will win
      '快点',     // Hurry up
      '什么？',   // What?
      '哈哈',     // Haha
      '革命',     // Revolution
      '万岁',     // Long live
      '同志',     // Comrade
      '好！',     // Good!
    ];
    return maoPhrases[Math.floor(Math.random() * maoPhrases.length)];
  }

  let type = 'PARANOID';
  if (DIALOGUE_DB.AGGRESSIVE.names.includes(name)) type = 'AGGRESSIVE';
  if (DIALOGUE_DB.SHOWMAN.names.includes(name)) type = 'SHOWMAN';
  if (DIALOGUE_DB.ICEMAN.names.includes(name)) type = 'ICEMAN';

  const phrases = DIALOGUE_DB[type][eventType];
  if (!phrases) return '...';
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Calculate bot move
export function calculateBotMove(bot, tableCards) {
  if (bot.hand.length === 1) return 0;

  const wantToWin = bot.taken < bot.bid;
  let currentWinnerScore = -10;

  if (tableCards.length > 0) {
    let winner = tableCards[0];
    for (const t of tableCards) {
      if (t.card.effectiveScore > winner.card.effectiveScore) {
        winner = t;
      }
    }
    currentWinnerScore = winner.card.effectiveScore;
  }

  const handMapped = bot.hand
    .map((c, i) => ({ card: c, index: i }))
    .sort((a, b) => a.card.baseScore - b.card.baseScore);

  if (tableCards.length === 0) {
    return wantToWin ? handMapped[handMapped.length - 1].index : handMapped[0].index;
  }

  const winners = handMapped.filter((item) => {
    const score = item.card.isJolly() ? (wantToWin ? 1000 : -1) : item.card.baseScore;
    return score > currentWinnerScore;
  });

  const losers = handMapped.filter((item) => {
    const score = item.card.isJolly() ? (wantToWin ? 1000 : -1) : item.card.baseScore;
    return score < currentWinnerScore;
  });

  if (wantToWin) {
    return winners.length > 0 ? winners[0].index : handMapped[0].index;
  } else {
    return losers.length > 0 ? losers[losers.length - 1].index : handMapped[handMapped.length - 1].index;
  }
}

// Calculate bot bid
export function calculateBotBid(bot, cardsToDeal, activePlayers, isIndiana) {
  if (isIndiana) {
    let dangerDetected = false;
    activePlayers.forEach((op) => {
      if (op !== bot && op.hand.length > 0) {
        const score = op.hand[0].baseScore;
        if (score >= 280) dangerDetected = true;
      }
    });
    return dangerDetected ? 0 : 1;
  }

  let strength = 0;
  bot.hand.forEach((c) => {
    if (c.isJolly()) strength += 1;
    else if (c.baseScore >= 305) strength += 1;
    else if (c.baseScore >= 208) strength += 0.7;
  });
  return Math.min(Math.round(strength), cardsToDeal);
}

// Get random bot names
export function getRandomBotNames(count) {
  const shuffled = [...DICTATORS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
