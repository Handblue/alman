import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { battleApiService, BattleChallenge } from '@/services/battleApiService';
import { friendsApiService } from '@/services/friendsApiService';
import { useBattleStore } from '@/store/useBattleStore';
import { useRealtimeBattleStore } from '@/store/useRealtimeBattleStore';
import { authService } from '@/services/authService';

type SentBattle = {
  id: string;
  challenged: { id: string; displayName: string; username: string } | null;
  myScore: number;
  status: string;
  expiresAt: string;
  createdAt: string;
};

type Friend = { id: string; displayName: string; username: string; avatar?: string; level?: number };

export default function BattleLobbyScreen() {
  const router = useRouter();
  const { loadBattle, reset } = useBattleStore();
  const { findMatch, phase: rtPhase, reset: rtReset } = useRealtimeBattleStore();

  const handleFindRealtimeMatch = () => {
    rtReset();
    router.push('/(app)/battle/rtmatch');
  };

  const [pending, setPending] = useState<BattleChallenge[]>([]);
  const [sent, setSent] = useState<SentBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChallengeSheet, setShowChallengeSheet] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [challengingId, setChallengingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        battleApiService.getPending(),
        battleApiService.getSent(),
      ]);
      setPending(p);
      setSent(s);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Play a pending challenge (I'm P2) ──────────────────────────────────────
  const handlePlay = async (challenge: BattleChallenge) => {
    reset();
    await loadBattle(challenge.id, 'challengee', challenge.challenger.displayName);
    // Only navigate if questions loaded successfully
    const { phase } = useBattleStore.getState();
    if (phase === 'playing') {
      router.push('/(app)/battle/question');
    } else {
      Alert.alert('Hata', 'Sorular yüklenemedi. Lütfen tekrar deneyin.');
    }
  };

  // ── Challenge a friend ─────────────────────────────────────────────────────
  const openChallengeSheet = async () => {
    setShowChallengeSheet(true);
    setFriendsLoading(true);
    try {
      const list = await friendsApiService.getFriends();
      setFriends(list.map((f: any) => ({
        id: f.friend?.id ?? f.id,
        displayName: f.friend?.displayName ?? f.displayName,
        username: f.friend?.username ?? f.username,
        level: f.friend?.level ?? f.level,
      })));
    } catch {
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleChallengeFriend = async (friend: Friend) => {
    setChallengingId(friend.id);
    try {
      const res = await battleApiService.challengeFriend(friend.id);
      setShowChallengeSheet(false);
      // I'm P1 — play my questions now
      reset();
      await loadBattle(res.battleId, 'challenger', friend.displayName);
      const { phase } = useBattleStore.getState();
      if (phase === 'playing') {
        router.push('/(app)/battle/question');
      } else {
        Alert.alert('Hata', 'Sorular yüklenemedi. Lütfen tekrar deneyin.');
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Meydan okuma gönderilemedi');
    } finally {
      setChallengingId(null);
    }
  };

  const handleChallengeOpen = async () => {
    setShowChallengeSheet(false);
    try {
      const res = await battleApiService.challengeOpen();
      reset();
      await loadBattle(res.battleId, 'challenger', 'Bilinmiyor');
      const { phase } = useBattleStore.getState();
      if (phase === 'playing') router.push('/(app)/battle/question');
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Açık meydan okuma oluşturulamadı');
    }
  };

  const formatExpiry = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    const hours = Math.floor(diff / 3_600_000);
    if (hours <= 0) return 'Süresi doldu';
    if (hours < 24) return `${hours} saat kaldı`;
    return `${Math.floor(hours / 24)} gün kaldı`;
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.battle.purple} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={Colors.gradient.battle as any} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <WKText style={styles.backText}>← Geri</WKText>
        </Pressable>
        <WKText style={styles.headerTitle}>⚔️ Battle</WKText>
        <WKText style={styles.headerSub}>Arkadaşlarınla kelime savaşına gir!</WKText>
        <View style={styles.headerBtns}>
          <Pressable style={styles.realtimeBtn} onPress={handleFindRealtimeMatch}>
            <WKText style={styles.realtimeBtnText}>⚡ Canlı Rakip Bul</WKText>
          </Pressable>
          <Pressable style={styles.challengeBtn} onPress={openChallengeSheet}>
            <WKText style={styles.challengeBtnText}>+ Meydan Oku</WKText>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.battle.purple} />}
      >
        {/* Pending: I need to answer */}
        <WKText style={styles.sectionTitle}>
          Beni Bekleyen Meydan Okumalar{pending.length > 0 ? ` (${pending.length})` : ''}
        </WKText>

        {pending.length === 0 ? (
          <View style={styles.emptyCard}>
            <WKText style={styles.emptyText}>Bekleyen meydan okuma yok 🎯</WKText>
          </View>
        ) : (
          pending.map((c) => (
            <View key={c.id} style={styles.challengeCard}>
              <View style={styles.challengeInfo}>
                <View style={styles.avatarCircle}>
                  <WKText style={styles.avatarLetter}>
                    {c.challenger.displayName.charAt(0).toUpperCase()}
                  </WKText>
                </View>
                <View style={{ flex: 1 }}>
                  <WKText style={styles.challengerName}>{c.challenger.displayName}</WKText>
                  <WKText style={styles.challengeMeta}>
                    {c.questionCount} soru • Rakip skoru: {c.opponentScore}/{c.questionCount}
                  </WKText>
                  <WKText style={styles.expiry}>{formatExpiry(c.expiresAt)}</WKText>
                </View>
              </View>
              <Pressable style={styles.playBtn} onPress={() => handlePlay(c)}>
                <WKText style={styles.playBtnText}>Oyna</WKText>
              </Pressable>
            </View>
          ))
        )}

        {/* Sent: Waiting for opponent */}
        <WKText style={[styles.sectionTitle, { marginTop: Spacing.s24 }]}>
          Gönderdiğim Meydan Okumalar{sent.length > 0 ? ` (${sent.length})` : ''}
        </WKText>

        {sent.length === 0 ? (
          <View style={styles.emptyCard}>
            <WKText style={styles.emptyText}>Henüz meydan okuma göndermediniz 🏹</WKText>
          </View>
        ) : (
          sent.map((s) => (
            <View key={s.id} style={[styles.challengeCard, styles.sentCard]}>
              <View style={styles.challengeInfo}>
                <View style={[styles.avatarCircle, { backgroundColor: Colors.brand.primary + '33' }]}>
                  <WKText style={[styles.avatarLetter, { color: Colors.brand.primary }]}>
                    {s.challenged ? s.challenged.displayName.charAt(0).toUpperCase() : '?'}
                  </WKText>
                </View>
                <View style={{ flex: 1 }}>
                  <WKText style={styles.challengerName}>
                    {s.challenged ? s.challenged.displayName : 'Açık Meydan Okuma'}
                  </WKText>
                  <WKText style={styles.challengeMeta}>
                    Senin skoru: {s.myScore}/10 • Rakip oynamadı
                  </WKText>
                  <WKText style={styles.expiry}>{formatExpiry(s.expiresAt)}</WKText>
                </View>
              </View>
              <View style={styles.waitingBadge}>
                <WKText style={styles.waitingText}>Bekliyor</WKText>
              </View>
            </View>
          ))
        )}

        {/* History link */}
        <Pressable style={styles.historyBtn} onPress={() => router.push('/(app)/battle/history')}>
          <WKText style={styles.historyBtnText}>📋 Battle Geçmişini Gör</WKText>
        </Pressable>
      </ScrollView>

      {/* Challenge sheet */}
      <Modal
        visible={showChallengeSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChallengeSheet(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowChallengeSheet(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <WKText style={styles.sheetTitle}>Meydan Oku</WKText>

            <Pressable style={styles.openChallengeBtn} onPress={handleChallengeOpen}>
              <WKText style={styles.openChallengeBtnText}>🌍 Açık Meydan Okuma</WKText>
              <WKText style={styles.openChallengeBtnSub}>Herhangi biri cevaplayabilir</WKText>
            </Pressable>

            <WKText style={styles.sheetSectionLabel}>Arkadaşlarım</WKText>

            {friendsLoading ? (
              <ActivityIndicator color={Colors.battle.purple} style={{ marginVertical: 20 }} />
            ) : friends.length === 0 ? (
              <WKText style={styles.noFriendsText}>
                Henüz arkadaşınız yok. Arkadaş ekleyerek meydan okuyabilirsiniz.
              </WKText>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(f) => f.id}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.friendRow}
                    onPress={() => handleChallengeFriend(item)}
                    disabled={challengingId === item.id}
                  >
                    <View style={styles.friendAvatar}>
                      <WKText style={styles.friendAvatarLetter}>
                        {item.displayName.charAt(0).toUpperCase()}
                      </WKText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <WKText style={styles.friendName}>{item.displayName}</WKText>
                      <WKText style={styles.friendUsername}>@{item.username}</WKText>
                    </View>
                    {challengingId === item.id ? (
                      <ActivityIndicator size="small" color={Colors.battle.purple} />
                    ) : (
                      <WKText style={styles.challengeArrow}>⚔️</WKText>
                    )}
                  </Pressable>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primaryDark },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg.primaryDark, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: Spacing.s20,
    gap: 6,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: 'rgba(255,255,255,0.75)', fontSize: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  headerBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  realtimeBtn: {
    backgroundColor: Colors.accent.orange,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  realtimeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  challengeBtn: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  challengeBtnText: { color: Colors.battle.purple, fontWeight: '800', fontSize: 15 },

  content: { padding: Spacing.s20, paddingBottom: 48, gap: 12 },

  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },

  emptyCard: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: Colors.text.secondary, fontSize: 14 },

  challengeCard: {
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.battle.purple + '44',
  },
  sentCard: { borderColor: Colors.brand.primary + '44' },

  challengeInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.battle.purple + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: Colors.battle.purple, fontWeight: '800', fontSize: 20 },

  challengerName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  challengeMeta: { color: Colors.text.secondary, fontSize: 12, marginTop: 2 },
  expiry: { color: Colors.accent.orange + 'cc', fontSize: 11, marginTop: 2 },

  playBtn: {
    backgroundColor: Colors.battle.purple,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  playBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  waitingBadge: {
    backgroundColor: Colors.brand.primary + '22',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.brand.primary + '44',
  },
  waitingText: { color: Colors.brand.primary, fontSize: 12, fontWeight: '600' },

  historyBtn: {
    marginTop: 8,
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  historyBtnText: { color: Colors.text.secondary, fontWeight: '600', fontSize: 14 },

  // Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: { color: '#fff', fontWeight: '800', fontSize: 20 },
  openChallengeBtn: {
    backgroundColor: Colors.battle.purple + '22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.battle.purple + '55',
  },
  openChallengeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  openChallengeBtnSub: { color: Colors.text.secondary, fontSize: 12, marginTop: 4 },
  sheetSectionLabel: { color: Colors.text.secondary, fontWeight: '700', fontSize: 13, letterSpacing: 0.5, marginTop: 4 },
  noFriendsText: { color: Colors.text.secondary, fontSize: 14, textAlign: 'center', marginVertical: 16 },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.battle.purple + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarLetter: { color: Colors.battle.purple, fontWeight: '700', fontSize: 18 },
  friendName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  friendUsername: { color: Colors.text.secondary, fontSize: 12 },
  challengeArrow: { fontSize: 20 },
});
