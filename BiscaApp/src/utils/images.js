// Card images mapping for React Native require
const cardImages = {
  bastoni1: require('../assets/cards/bastoni1.png'),
  bastoni2: require('../assets/cards/bastoni2.png'),
  bastoni3: require('../assets/cards/bastoni3.png'),
  bastoni4: require('../assets/cards/bastoni4.png'),
  bastoni5: require('../assets/cards/bastoni5.png'),
  bastoni6: require('../assets/cards/bastoni6.png'),
  bastoni7: require('../assets/cards/bastoni7.png'),
  bastoni8: require('../assets/cards/bastoni8.png'),
  bastoni9: require('../assets/cards/bastoni9.png'),
  bastoni10: require('../assets/cards/bastoni10.png'),
  spade1: require('../assets/cards/spade1.png'),
  spade2: require('../assets/cards/spade2.png'),
  spade3: require('../assets/cards/spade3.png'),
  spade4: require('../assets/cards/spade4.png'),
  spade5: require('../assets/cards/spade5.png'),
  spade6: require('../assets/cards/spade6.png'),
  spade7: require('../assets/cards/spade7.png'),
  spade8: require('../assets/cards/spade8.png'),
  spade9: require('../assets/cards/spade9.png'),
  spade10: require('../assets/cards/spade10.png'),
  coppe1: require('../assets/cards/coppe1.png'),
  coppe2: require('../assets/cards/coppe2.png'),
  coppe3: require('../assets/cards/coppe3.png'),
  coppe4: require('../assets/cards/coppe4.png'),
  coppe5: require('../assets/cards/coppe5.png'),
  coppe6: require('../assets/cards/coppe6.png'),
  coppe7: require('../assets/cards/coppe7.png'),
  coppe8: require('../assets/cards/coppe8.png'),
  coppe9: require('../assets/cards/coppe9.png'),
  coppe10: require('../assets/cards/coppe10.png'),
  denari1: require('../assets/cards/denari1.png'),
  denari2: require('../assets/cards/denari2.png'),
  denari3: require('../assets/cards/denari3.png'),
  denari4: require('../assets/cards/denari4.png'),
  denari5: require('../assets/cards/denari5.png'),
  denari6: require('../assets/cards/denari6.png'),
  denari7: require('../assets/cards/denari7.png'),
  denari8: require('../assets/cards/denari8.png'),
  denari9: require('../assets/cards/denari9.png'),
  denari10: require('../assets/cards/denari10.png'),
};

// Only include portraits that exist in the assets folder
const portraitImages = {
  mussolini: require('../assets/portraits/mussolini.png'),
  hitler: require('../assets/portraits/hitler.png'),
  napoleone: require('../assets/portraits/napoleone.png'),
  cesare: require('../assets/portraits/cesare.png'),
  gheddafi: require('../assets/portraits/gheddafi.png'),
  fidel: require('../assets/portraits/fidel.png'),
  gengis: require('../assets/portraits/gengis.png'),
  kim: require('../assets/portraits/kim.png'),
  franco: require('../assets/portraits/franco.png'),
  mao: require('../assets/portraits/mao.png'),
  trump: require('../assets/portraits/trump.png'),
  putin: require('../assets/portraits/putin.png'),
  berlusconi: require('../assets/portraits/berlusconi.png'),
};

export function getCardImage(imageName) {
  return cardImages[imageName] || cardImages.bastoni1;
}

export function getPortraitImage(name) {
  const key = name.toLowerCase().replace(/\s/g, '_');
  return portraitImages[key] || null;
}
