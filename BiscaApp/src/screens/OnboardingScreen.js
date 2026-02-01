import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { COLORS, AVATAR_OPTIONS } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tutorial content from Nonna Rosa
const NONNA_TIPS = [
  {
    title: 'Benvenuto, caro! 👵',
    text: 'Sono Nonna Rosa e ti insegnerò a giocare a Bisca! È il mio gioco preferito da quando ero giovane.',
  },
  {
    title: 'La Gerarchia dei Semi 🃏',
    text: 'Ricorda sempre: Denari > Coppe > Spade > Bastoni. Un 2 di Denari batte anche un Re di Bastoni!',
  },
  {
    title: 'La Scommessa 🎯',
    text: 'Prima di giocare, devi dire quante mani vincerai. Se sbagli, perdi vite! Meglio essere prudenti all\'inizio.',
  },
  {
    title: 'L\'Asso di Denari ⭐',
    text: 'È la carta jolly! Puoi usarla come la più forte (MAX) o la più debole (MIN). Usala con saggezza!',
  },
  {
    title: 'Regola dell\'Ultimo 🎲',
    text: 'L\'ultimo a parlare non può far tornare i conti. Qualcuno DEVE sbagliare. Ricordalo!',
  },
  {
    title: 'Modalità Indiana 🙈',
    text: 'Quando c\'è una sola carta, vedrai le carte degli altri ma NON la tua. Dovrai indovinare!',
  },
  {
    title: 'Sei Pronto! 🏆',
    text: 'Vai e vinci! E ricorda: non è fortuna, è strategia. Nonna Rosa crede in te! 💪',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { updatePlayerData } = useGame();
  const [step, setStep] = useState(0); // 0: intro card, 1: profile, 2: tutorial
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const backgroundGlow = useRef(new Animated.Value(0)).current;
  const profileSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const tutorialSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start intro animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCardSwipe = () => {
    // Animate card flying away and background glow
    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: -SCREEN_HEIGHT,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundGlow, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(1);
      Animated.spring(profileSlide, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleProfileComplete = () => {
    if (name.trim().length < 2) {
      return;
    }
    
    // Move to tutorial
    Animated.timing(profileSlide, {
      toValue: -SCREEN_HEIGHT,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setStep(2);
      Animated.parallel([
        Animated.spring(tutorialSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNextTip = () => {
    if (tutorialIndex < NONNA_TIPS.length - 1) {
      // Animate bubble out and in
      Animated.sequence([
        Animated.timing(bubbleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setTutorialIndex(tutorialIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkipTutorial = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await updatePlayerData({
      name: name.trim().toUpperCase(),
      avatar: selectedAvatar.emoji,
      hasCompletedOnboarding: true,
      hasCompletedTutorial: true,
    });
    
    navigation.replace('Home');
  };

  const renderIntroCard = () => (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: cardScale },
            { translateY: cardAnim },
          ],
        },
      ]}
    >
      <Text style={styles.gameTitle}>BISCA</Text>
      <TouchableOpacity
        onPress={handleCardSwipe}
        activeOpacity={0.9}
        style={styles.card}
      >
        <LinearGradient
          colors={[COLORS.denari, '#FF8C00']}
          style={styles.cardGradient}
        >
          <Text style={styles.cardSymbol}>🃏</Text>
          <View style={styles.cardCenter}>
            <Text style={styles.aceText}>A</Text>
            <Text style={styles.suitText}>♦</Text>
          </View>
          <Text style={[styles.cardSymbol, styles.cardSymbolBottom]}>🃏</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <Animated.Text style={[styles.swipeText, { opacity: fadeAnim }]}>
        Tocca la carta per iniziare
      </Animated.Text>
    </Animated.View>
  );

  const renderProfileCreation = () => (
    <Animated.View
      style={[
        styles.profileContainer,
        { transform: [{ translateY: profileSlide }] },
      ]}
    >
      <View style={styles.glassCard}>
        <Text style={styles.profileTitle}>Chi sei?</Text>
        
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Il tuo nome"
          placeholderTextColor={COLORS.textMuted}
          maxLength={12}
          autoCapitalize="characters"
        />

        <Text style={styles.avatarLabel}>Scegli il tuo Avatar</Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarScroll}
        >
          {AVATAR_OPTIONS.map((avatar) => (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarOption,
                selectedAvatar.id === avatar.id && styles.avatarOptionSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar)}
            >
              <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
              <Text style={styles.avatarName}>{avatar.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.enterButton,
            name.trim().length < 2 && styles.enterButtonDisabled,
          ]}
          onPress={handleProfileComplete}
          disabled={name.trim().length < 2}
        >
          <LinearGradient
            colors={name.trim().length >= 2 ? COLORS.gradientPurple : ['#333', '#222']}
            style={styles.enterButtonGradient}
          >
            <Text style={styles.enterButtonText}>Continua</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderTutorial = () => {
    const tip = NONNA_TIPS[tutorialIndex];
    const isLastTip = tutorialIndex === NONNA_TIPS.length - 1;
    
    return (
      <Animated.View
        style={[
          styles.tutorialContainer,
          { transform: [{ translateY: tutorialSlide }] },
        ]}
      >
        {/* Nonna Rosa Avatar */}
        <View style={styles.nonnaContainer}>
          <View style={styles.nonnaAvatar}>
            <Text style={styles.nonnaEmoji}>👵</Text>
          </View>
          <Text style={styles.nonnaName}>Nonna Rosa</Text>
        </View>

        {/* Speech Bubble */}
        <Animated.View 
          style={[
            styles.speechBubble,
            {
              transform: [{ scale: bubbleAnim }],
              opacity: bubbleAnim,
            },
          ]}
        >
          <View style={styles.bubbleArrow} />
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <Text style={styles.tipText}>{tip.text}</Text>
        </Animated.View>

        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {NONNA_TIPS.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot,
                i === tutorialIndex && styles.dotActive,
                i < tutorialIndex && styles.dotCompleted,
              ]} 
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.tutorialButtons}>
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkipTutorial}
          >
            <Text style={styles.skipButtonText}>Salta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNextTip}
          >
            <LinearGradient
              colors={COLORS.gradientPurple}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {isLastTip ? 'Inizia a Giocare!' : 'Avanti'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background with animated glow */}
      <Animated.View
        style={[
          styles.backgroundGlow,
          {
            opacity: backgroundGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.6],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {step === 0 && renderIntroCard()}
      {step === 1 && renderProfileCreation()}
      {step === 2 && renderTutorial()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  gameTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.denari,
    marginBottom: 30,
    letterSpacing: 8,
    textShadowColor: COLORS.denari,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  cardContainer: {
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.denari,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  cardGradient: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardSymbol: {
    fontSize: 30,
    color: '#fff',
  },
  cardSymbolBottom: {
    alignSelf: 'flex-end',
    transform: [{ rotate: '180deg' }],
  },
  cardCenter: {
    alignItems: 'center',
  },
  aceText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
  },
  suitText: {
    fontSize: 60,
    color: '#fff',
  },
  swipeText: {
    marginTop: 40,
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  profileContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  profileTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 30,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 18,
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 30,
  },
  avatarLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  avatarScroll: {
    paddingVertical: 10,
  },
  avatarOption: {
    alignItems: 'center',
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
  },
  avatarOptionSelected: {
    borderColor: COLORS.denari,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  avatarEmoji: {
    fontSize: 36,
    marginBottom: 5,
  },
  avatarName: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  enterButton: {
    marginTop: 30,
    borderRadius: 25,
    overflow: 'hidden',
  },
  enterButtonDisabled: {
    opacity: 0.5,
  },
  enterButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  enterButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  // Tutorial styles
  tutorialContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  nonnaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nonnaAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.denari,
    shadowColor: COLORS.denari,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  nonnaEmoji: {
    fontSize: 60,
  },
  nonnaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.denari,
    marginTop: 10,
  },
  speechBubble: {
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    marginBottom: 20,
    position: 'relative',
  },
  bubbleArrow: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.glassBorder,
  },
  tipTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.denari,
    marginBottom: 15,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    backgroundColor: COLORS.denari,
    transform: [{ scale: 1.2 }],
  },
  dotCompleted: {
    backgroundColor: COLORS.success,
  },
  tutorialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    borderRadius: 15,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
