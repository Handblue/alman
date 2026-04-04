import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { WKText, WKCard, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useSocialStore } from '@/store/useSocialStore';
import { Friend, FriendRequest } from '@/services/socialService';

function FriendCard({ friend }: { friend: Friend }) {
  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return Colors.accent.success;
      case 'away': return Colors.accent.warning;
      default: return Colors.text.secondary;
    }
  };

  const getStatusText = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'away': return 'Uzakta';
      default: return 'Çevrimdışı';
    }
  };

  return (
    <WKCard style={styles.friendCard}>
      <View style={styles.friendHeader}>
        <View style={styles.friendInfo}>
          <WKText variant="heading2">{friend.avatar || '👤'}</WKText>
          <View style={styles.friendDetails}>
            <WKText variant="body" color={Colors.text.primaryDark}>
              {friend.displayName}
            </WKText>
            <WKText variant="caption" color={Colors.text.secondary}>
              Seviye {friend.level} • {friend.xp.toLocaleString()} XP
            </WKText>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(friend.status) }]} />
          <WKText variant="caption" color={Colors.text.secondary}>
            {getStatusText(friend.status)}
          </WKText>
        </View>
      </View>
    </WKCard>
  );
}

function FriendRequestCard({ request, onAccept, onDecline }: {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <WKCard style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <WKText variant="heading2">{request.fromAvatar || '👤'}</WKText>
        <View style={styles.requestInfo}>
          <WKText variant="body" color={Colors.text.primaryDark}>
            {request.fromDisplayName}
          </WKText>
          <WKText variant="caption" color={Colors.text.secondary}>
            arkadaşlık isteği gönderdi
          </WKText>
        </View>
      </View>
      <View style={styles.requestActions}>
        <WKButton
          title="Kabul Et"
          onPress={onAccept}
          variant="primary"
          size="small"
        />
        <WKButton
          title="Reddet"
          onPress={onDecline}
          variant="secondary"
          size="small"
        />
      </View>
    </WKCard>
  );
}

export default function FriendsScreen() {
  const {
    friends,
    friendRequests,
    sentRequests,
    loading,
    loadFriends,
    loadFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    sendFriendRequest,
  } = useSocialStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Başarılı', 'Arkadaşlık isteği kabul edildi!');
    } catch (error) {
      Alert.alert('Hata', 'Arkadaşlık isteği kabul edilemedi.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      Alert.alert('Başarılı', 'Arkadaşlık isteği reddedildi.');
    } catch (error) {
      Alert.alert('Hata', 'Arkadaşlık isteği reddedilemedi.');
    }
  };

  const handleSendRequest = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Hata', 'Lütfen bir kullanıcı adı girin.');
      return;
    }

    try {
      // For now, we'll use a simple user ID search
      // In a real app, this would search by username/email
      await sendFriendRequest(searchQuery.trim());
      Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi!');
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Hata', 'Arkadaşlık isteği gönderilemedi.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={styles.backButton}
        >
          <WKText variant="body" color={Colors.text.primaryDark}>← Geri</WKText>
        </TouchableOpacity>
        <WKText variant="hero" color={Colors.text.primaryDark} style={styles.headerTitle}>
          Arkadaşlar 👥
        </WKText>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('friends')}
            accessibilityRole="tab"
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          >
            <WKText variant="caption" color={Colors.text.primaryDark}>
              Arkadaşlar ({friends.length})
            </WKText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            accessibilityRole="tab"
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          >
            <WKText variant="caption" color={Colors.text.primaryDark}>
              İstekler ({friendRequests.length})
            </WKText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('add')}
            accessibilityRole="tab"
            style={[styles.tab, activeTab === 'add' && styles.tabActive]}
          >
            <WKText variant="caption" color={Colors.text.primaryDark}>
              Ekle
            </WKText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {activeTab === 'friends' && (
          <View style={styles.content}>
            {loading.friends ? (
              <WKText variant="body" color={Colors.text.secondary} style={styles.loadingText}>
                Arkadaşlar yükleniyor...
              </WKText>
            ) : friends.length === 0 ? (
              <View style={styles.emptyState}>
                <WKText variant="heading1">👥</WKText>
                <WKText variant="heading2" color={Colors.text.primaryDark}>
                  Henüz arkadaşın yok
                </WKText>
                <WKText variant="body" color={Colors.text.secondary} style={styles.emptyText}>
                  Arkadaş eklemek için "Ekle" sekmesine geçin
                </WKText>
              </View>
            ) : (
              friends.map((friend) => (
                <FriendCard key={friend.uid} friend={friend} />
              ))
            )}
          </View>
        )}

        {activeTab === 'requests' && (
          <View style={styles.content}>
            {loading.requests ? (
              <WKText variant="body" color={Colors.text.secondary} style={styles.loadingText}>
                İstekler yükleniyor...
              </WKText>
            ) : friendRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <WKText variant="heading1">📬</WKText>
                <WKText variant="heading2" color={Colors.text.primaryDark}>
                  Yeni istek yok
                </WKText>
                <WKText variant="body" color={Colors.text.secondary} style={styles.emptyText}>
                  Arkadaşlık istekleriniz burada görünecek
                </WKText>
              </View>
            ) : (
              friendRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => handleAcceptRequest(request.id)}
                  onDecline={() => handleDeclineRequest(request.id)}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'add' && (
          <View style={styles.content}>
            <WKCard style={styles.addFriendCard}>
              <WKText variant="heading2" color={Colors.text.primaryDark}>
                Arkadaş Ekle
              </WKText>
              <WKText variant="body" color={Colors.text.secondary} style={styles.addDescription}>
                Kullanıcı adını veya ID'yi girerek arkadaşlık isteği gönderin
              </WKText>
              <TextInput
                style={styles.searchInput}
                placeholder="Kullanıcı adı veya ID"
                placeholderTextColor={Colors.text.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <WKButton
                title="İstek Gönder"
                onPress={handleSendRequest}
                variant="primary"
                disabled={!searchQuery.trim()}
              />
            </WKCard>
          </View>
        )}

        <View style={{ height: Spacing.s32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
  },
  gradientHeader: {
    paddingHorizontal: Spacing.s20,
    paddingBottom: Spacing.s24,
  },
  backButton: {
    paddingVertical: Spacing.s12,
    paddingRight: Spacing.s16,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    marginBottom: Spacing.s16,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.s8,
  },
  tab: {
    paddingVertical: Spacing.s8,
    paddingHorizontal: Spacing.s16,
    borderRadius: Radius.chip,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.s20,
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: Spacing.s32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.s64,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.s8,
  },
  friendCard: {
    marginBottom: Spacing.s12,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
  },
  friendDetails: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    gap: Spacing.s4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  requestCard: {
    marginBottom: Spacing.s12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    marginBottom: Spacing.s16,
  },
  requestInfo: {
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
  addFriendCard: {
    gap: Spacing.s16,
  },
  addDescription: {
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: Radius.card,
    padding: Spacing.s16,
    fontSize: 16,
    color: Colors.text.primaryDark,
    backgroundColor: Colors.bg.secondary,
  },
});