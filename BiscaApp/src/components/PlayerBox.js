import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getPortraitImage } from '../utils/images';
import { CardBack } from './Card';

export function PlayerBox({ player, isActive, isDealer, showCards, cardsToDeal }) {
  const portraitSource = getPortraitImage(player.name);
  
  const getBidStatusStyle = () => {
    if (player.bid < 0) return {};
    if (player.taken === player.bid) return { backgroundColor: 'rgba(0,255,0,0.2)', borderColor: '#0f0' };
    if (player.taken > player.bid) return { backgroundColor: 'rgba(255,0,0,0.2)', borderColor: '#f00' };
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
      
      <View style={styles.avatarFrame}>
        {portraitSource ? (
          <Image source={portraitSource} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>{player.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.playerName}>{player.name}</Text>
      
      <View style={styles.heartsContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Text key={i} style={[styles.heart, i >= player.lives && styles.deadHeart]}>
            ❤️
          </Text>
        ))}
      </View>
      
      <View style={styles.statsRow}>
        <View style={[styles.statBadge, styles.bidBadge]}>
          <Text style={styles.bidText}>BID: {player.bid >= 0 ? player.bid : '-'}</Text>
        </View>
        <View style={[styles.statBadge, styles.takenBadge, getBidStatusStyle()]}>
          <Text style={styles.takenText}>TOT: {player.taken}</Text>
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
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  activeContainer: {
    borderColor: '#FFD700',
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFD700',
  },
  eliminatedContainer: {
    opacity: 0.4,
    borderColor: '#f00',
  },
  dealerBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    backgroundColor: '#fff',
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dealerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  avatarFrame: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
    marginBottom: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  playerName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 3,
  },
  heartsContainer: {
    flexDirection: 'row',
    marginBottom: 5,
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
    backgroundColor: '#111',
    borderRadius: 4,
    padding: 2,
  },
  statBadge: {
    flex: 1,
    paddingVertical: 2,
    alignItems: 'center',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  bidBadge: {
    backgroundColor: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  takenBadge: {
    backgroundColor: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#555',
  },
  bidText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  takenText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  handContainer: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'center',
  },
  cardBackMini: {
    marginLeft: -10,
  },
  miniCardContainer: {
    width: 25,
    height: 38,
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 1,
  },
  miniCard: {
    width: '100%',
    height: '100%',
  },
});
