import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getPortraitImage } from '../utils/images';
import { CardBack } from './Card';
import { COLORS } from '../utils/constants';

export function PlayerBox({ player, isActive, isDealer, showCards, cardsToDeal }) {
  const portraitSource = getPortraitImage(player.name);
  
  const getBidStatusStyle = () => {
    if (player.bid < 0) return {};
    if (player.taken === player.bid) return { backgroundColor: 'rgba(46, 204, 113, 0.3)', borderColor: COLORS.success };
    if (player.taken > player.bid) return { backgroundColor: 'rgba(255, 71, 87, 0.3)', borderColor: COLORS.danger };
    return {};
  };

  return (
    <View style={[
      styles.container,
      isActive && styles.activeContainer,
      player.eliminated && styles.eliminatedContainer,
    ]}>
      {isDealer && (
        <View style={styles.dealerBtn}>
          <Text style={styles.dealerText}>D</Text>
        </View>
      )}
      
      <View style={[styles.avatarFrame, isActive && styles.avatarFrameActive]}>
        {portraitSource ? (
          <Image source={portraitSource} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>{player.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
      
      <View style={styles.heartsContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Text key={i} style={[styles.heart, i >= player.lives && styles.deadHeart]}>
            ❤️
          </Text>
        ))}
      </View>
      
      <View style={styles.statsRow}>
        <View style={[styles.statBadge, styles.bidBadge]}>
          <Text style={styles.bidText}>{player.bid >= 0 ? player.bid : '-'}</Text>
        </View>
        <View style={[styles.statBadge, styles.takenBadge, getBidStatusStyle()]}>
          <Text style={styles.takenText}>{player.taken}</Text>
        </View>
      </View>
      
      {!player.eliminated && player.hand.length > 0 && (
        <View style={styles.handContainer}>
          {player.hand.map((card, i) => (
            showCards && cardsToDeal === 1 ? (
              <View key={i} style={styles.miniCardContainer}>
                <Image 
                  source={require('../utils/images').getCardImage(card.getImageName())}
                  style={styles.miniCard}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <CardBack key={i} small style={styles.cardBackMini} />
            )
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activeContainer: {
    borderColor: COLORS.denari,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    shadowColor: COLORS.denari,
    shadowOpacity: 0.5,
  },
  eliminatedContainer: {
    opacity: 0.4,
    borderColor: COLORS.danger,
  },
  dealerBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: COLORS.denari,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: COLORS.denari,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  dealerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  avatarFrame: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatarFrameActive: {
    borderColor: COLORS.denari,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  playerName: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
  },
  heartsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  heart: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  deadHeart: {
    opacity: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 4,
  },
  statBadge: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 8,
  },
  bidBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.denari,
  },
  takenBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bidText: {
    color: COLORS.denari,
    fontSize: 14,
    fontWeight: 'bold',
  },
  takenText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  handContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'center',
  },
  cardBackMini: {
    marginLeft: -8,
  },
  miniCardContainer: {
    width: 28,
    height: 42,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 1,
  },
  miniCard: {
    width: '100%',
    height: '100%',
  },
});
