import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { getCardImage } from '../utils/images';

export function CardComponent({ card, onPress, disabled, isHidden, isJolly, style }) {
  const imageName = card ? card.getImageName() : null;

  if (isHidden) {
    return (
      <View style={[styles.card, styles.cardBack, style]}>
        <View style={styles.backPattern} />
      </View>
    );
  }

  const cardContent = (
    <View style={[styles.card, isJolly && styles.jollyCard, style]}>
      {imageName && (
        <Image
          source={getCardImage(imageName)}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

export function CardBack({ style, small }) {
  return (
    <View style={[small ? styles.smallCard : styles.card, styles.cardBack, style]}>
      <View style={styles.backPattern} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 105,
    borderRadius: 6,
    backgroundColor: '#fdfbf7',
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  smallCard: {
    width: 30,
    height: 45,
    borderRadius: 3,
    backgroundColor: '#fdfbf7',
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBack: {
    backgroundColor: '#8b0000',
    borderColor: '#fff',
    borderWidth: 2,
  },
  backPattern: {
    flex: 1,
    backgroundColor: '#8b0000',
    opacity: 0.9,
  },
  jollyCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
    shadowColor: '#FFD700',
    shadowRadius: 10,
  },
});
