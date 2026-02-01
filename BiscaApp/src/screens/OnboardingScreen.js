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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { COLORS, AVATAR_OPTIONS } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const { updatePlayerData } = useGame();
  const [step, setStep] = useState(0); // 0: intro, 1: swipe card, 2: profile
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const backgroundGlow = useRef(new Animated.Value(0)).current;
  const profileSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
      setStep(2);
      Animated.spring(profileSlide, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleComplete = async () => {
    if (name.trim().length < 2) {
      return;
    }
    
    await updatePlayerData({
      name: name.trim().toUpperCase(),
      avatar: selectedAvatar.emoji,
      hasCompletedOnboarding: true,
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
          onPress={handleComplete}
          disabled={name.trim().length < 2}
        >
          <LinearGradient
            colors={name.trim().length >= 2 ? COLORS.gradientPurple : ['#333', '#222']}
            style={styles.enterButtonGradient}
          >
            <Text style={styles.enterButtonText}>Entra nel Circolo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

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

      {step < 2 && renderIntroCard()}
      {step >= 2 && renderProfileCreation()}
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
});
