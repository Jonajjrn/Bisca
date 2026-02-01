import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { getCardImage } from '../utils/images';
import { COLORS } from '../utils/constants';

const SLIDES = [
  {
    title: 'BENVENUTO, GENERALE',
    content: [
      'La tua missione è sopravvivere in un tavolo pieno di dittatori paranoici e megalomani.',
      'Non vince chi ha le carte migliori, ma chi sa PREVEDERE IL FUTURO.',
    ],
  },
  {
    title: 'LA LEGGE DEL PIÙ FORTE',
    content: [
      'In questo gioco vige una gerarchia assoluta tra i semi.',
      'Un seme superiore batte SEMPRE uno inferiore, indipendentemente dal valore.',
    ],
    suits: ['Denari', 'Coppe', 'Spade', 'Bastoni'],
    example: 'Un 2 di Denari straccia un Re di Bastoni.',
  },
  {
    title: 'VALORE DELLE CARTE',
    content: [
      'Se il seme è lo stesso, vince la carta con il valore più alto.',
      'Re (10) > Cavallo (9) > Fante (8) > ... > Asso (1)',
    ],
    warning: "L'Asso vale 1 (è la carta più bassa), tranne in un caso speciale...",
  },
  {
    title: "L'ARMA SEGRETA",
    content: [
      "L'ASSO DI DENARI è il JOLLY.",
      'Quando lo giochi, decidi il suo destino:',
    ],
    jollyOptions: [
      { label: 'MAX', desc: 'Diventa la carta più potente (vince tutto)', color: '#FFD700' },
      { label: 'MIN', desc: 'Diventa la carta più debole (perde apposta)', color: '#4ca1af' },
    ],
  },
  {
    title: 'LA SCOMMESSA (BID)',
    content: [
      "All'inizio di ogni round, devi dichiarare ESATTAMENTE quante mani vincerai.",
      'Se indovini, nessun danno. Se sbagli, perdi tante vite quanta la differenza.',
    ],
    examples: [
      { text: 'Dici 1 → Prendi 1', result: '✓ OK', color: '#0f0' },
      { text: 'Dici 1 → Prendi 3', result: '💀 -2 Vite', color: '#f00' },
    ],
  },
  {
    title: 'REGOLE SPECIALI',
    content: [],
    rules: [
      {
        name: "REGOLA DELL'ULTIMO",
        desc: "L'ultimo giocatore a parlare (il Mazziere) non può chiamare un numero che faccia tornare i conti esatti.",
      },
      {
        name: 'INDIANA (1 Carta)',
        desc: 'Nel round da 1 sola carta, vedi le carte di tutti gli altri sulla loro fronte, ma NON VEDI LA TUA.',
      },
    ],
  },
];

export default function TutorialScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const isFirst = currentSlide === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANUALE DEL DITTATORE</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.slideContainer}
        contentContainerStyle={styles.slideContent}
      >
        <Text style={styles.title}>{slide.title}</Text>
        
        {slide.content.map((text, i) => (
          <Text key={i} style={styles.paragraph}>{text}</Text>
        ))}
        
        {slide.suits && (
          <View style={styles.suitsContainer}>
            {slide.suits.map((suit, i) => (
              <View key={suit} style={styles.suitItem}>
                <Image 
                  source={getCardImage(`${suit.toLowerCase()}1`)}
                  style={styles.suitCard}
                  resizeMode="contain"
                />
                <Text style={[styles.suitName, { color: getSuitColor(suit) }]}>
                  {suit}
                </Text>
                {i < slide.suits.length - 1 && (
                  <Text style={styles.arrow}>›</Text>
                )}
              </View>
            ))}
          </View>
        )}
        
        {slide.example && (
          <Text style={styles.example}>{slide.example}</Text>
        )}
        
        {slide.warning && (
          <Text style={styles.warning}>⚠️ {slide.warning}</Text>
        )}
        
        {slide.jollyOptions && (
          <View style={styles.jollyContainer}>
            <View style={styles.jollyCardWrapper}>
              <Image 
                source={getCardImage('denari1')}
                style={styles.jollyCard}
                resizeMode="contain"
              />
            </View>
            {slide.jollyOptions.map((opt, i) => (
              <View key={i} style={[styles.jollyOption, { borderColor: opt.color }]}>
                <Text style={[styles.jollyLabel, { color: opt.color }]}>{opt.label}</Text>
                <Text style={styles.jollyDesc}>{opt.desc}</Text>
              </View>
            ))}
          </View>
        )}
        
        {slide.examples && (
          <View style={styles.examplesContainer}>
            {slide.examples.map((ex, i) => (
              <View key={i} style={[styles.exampleBox, { borderColor: ex.color }]}>
                <Text style={styles.exampleText}>{ex.text}</Text>
                <Text style={[styles.exampleResult, { color: ex.color }]}>{ex.result}</Text>
              </View>
            ))}
          </View>
        )}
        
        {slide.rules && slide.rules.map((rule, i) => (
          <View key={i} style={styles.ruleBox}>
            <Text style={styles.ruleName}>{rule.name}</Text>
            <Text style={styles.ruleDesc}>{rule.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, isFirst && styles.navButtonHidden]}
          onPress={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={isFirst}
        >
          <Text style={styles.navButtonText}>← INDIETRO</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentSlide && styles.dotActive]}
            />
          ))}
        </View>

        {isLast ? (
          <TouchableOpacity
            style={[styles.navButton, styles.playButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.playButtonText}>GIOCA ORA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={() => setCurrentSlide(Math.min(SLIDES.length - 1, currentSlide + 1))}
          >
            <Text style={styles.nextButtonText}>AVANTI →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getSuitColor(suit) {
  switch (suit) {
    case 'Denari': return COLORS.denari;
    case 'Coppe': return COLORS.coppe;
    case 'Spade': return COLORS.spade;
    case 'Bastoni': return COLORS.bastoni;
    default: return COLORS.textPrimary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  backButton: {
    width: 40,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 24,
  },
  headerTitle: {
    color: COLORS.denari,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  slideContainer: {
    flex: 1,
  },
  slideContent: {
    padding: 25,
    alignItems: 'center',
  },
  title: {
    color: '#4ca1af',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  paragraph: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 10,
  },
  suitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suitCard: {
    width: 40,
    height: 60,
    marginHorizontal: 5,
  },
  suitName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 5,
  },
  arrow: {
    color: '#666',
    fontSize: 24,
    marginHorizontal: 5,
  },
  example: {
    color: '#FFD700',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 15,
  },
  warning: {
    color: '#ff6666',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  jollyContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  jollyCardWrapper: {
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 8,
    padding: 5,
    marginBottom: 15,
    shadowColor: '#FFD700',
    shadowRadius: 15,
    shadowOpacity: 0.5,
  },
  jollyCard: {
    width: 80,
    height: 120,
  },
  jollyOption: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  jollyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  jollyDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 3,
  },
  examplesContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 15,
  },
  exampleBox: {
    flex: 1,
    padding: 15,
    backgroundColor: '#111',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  exampleText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 5,
  },
  exampleResult: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ruleBox: {
    width: '100%',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  ruleName: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ruleDesc: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  navButton: {
    padding: 12,
    minWidth: 100,
  },
  navButtonHidden: {
    opacity: 0,
  },
  navButtonText: {
    color: '#888',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#4ca1af',
    borderRadius: 6,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#FFD700',
    borderRadius: 6,
  },
  playButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#FFD700',
  },
});
