import React, { useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { getCardImage } from '../utils/images';
import { COLORS } from '../utils/constants';

export function CardComponent({ card, onPress, disabled, isHidden, isJolly, style, isSelected }) {
  const imageName = card ? card.getImageName() : null;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const liftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(liftAnim, {
          toValue: -10,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(liftAnim, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  if (isHidden) {
    return (
      <View style={[styles.card, styles.cardBack, style]}>
        <View style={styles.backPattern}>
          <View style={styles.backInner} />
        </View>
      </View>
    );
  }

  const cardContent = (
    <Animated.View 
      style={[
        styles.card, 
        isJolly && styles.jollyCard, 
        style,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: liftAnim },
          ],
        },
      ]}
    >
      {imageName && (
        <Image
          source={getCardImage(imageName)}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

export function CardBack({ style, small }) {
  return (
    <View style={[small ? styles.smallCard : styles.card, styles.cardBack, style]}>
      <View style={styles.backPattern}>
        <View style={styles.backInner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 105,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  smallCard: {
    width: 30,
    height: 45,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBack: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 3,
    borderColor: COLORS.denari,
  },
  backPattern: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backInner: {
    width: '70%',
    height: '70%',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.denari,
    opacity: 0.5,
  },
  jollyCard: {
    borderWidth: 3,
    borderColor: COLORS.denari,
    shadowColor: COLORS.denari,
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
});
