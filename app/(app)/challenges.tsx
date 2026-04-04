import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { WKText, WKCard, WKButton, WKChip } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useSocialStore } from '@/store/useSocialStore';
import { SocialChallenge } from '@/services/socialService';

function ChallengeCard({ challenge, onJoin, isJoined }: {
  challenge: SocialChallenge;
  onJoin: () => void;
  isJoined: boolean;
}) {
  const progress = challenge.progress[Object.keys(challenge.progress)[0]] || { completedWords: 0, streak: 0 };
  const progressPercent = Math.min((progress.completedWords / challenge.targetWords) * 100, 100);

  const getStatusColor = (status: SocialChallenge['status']) => {
    switch (status) {
      case 'active': return Colors.accent.success;
      case 'completed': return Colors.accent.primary;
      default: return Colors.text.secondary;
    }
  };

  const getStatusText = (status: SocialChallenge['status']) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      default: return 'İptal Edildi';
    }
  };

  return (
    <WKCard style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeInfo}>
          <WKText variant="heading2" color={Colors.text.primaryDark}>
            {challenge.title}
          </WKText>
          <WKText variant="caption" color={Colors.text.secondary}>
            {challenge.creatorName} tarafından oluşturuldu
          </WKText>
        </View>
        <WKChip
          label={getStatusText(challenge.status)}
          color={getStatusColor(challenge.status)}
          size="small"
        />
      </View>

      <WKText variant="body" color={Colors.text.secondary} style={styles.description}>
        {challenge.description}
      </WKText>

      <View style={styles.challengeStats}>
        <View style={styles.stat}>
          <WKText variant="heading2" color={Colors.accent.primary}>
            {progress.completedWords}
          </WKText>
          <WKText variant="caption" color={Colors.text.secondary}>
            /{challenge.targetWords} kelime
          </WKText>
        </View>
        <View style={styles.stat}>
          <WKText variant="heading2" color={Colors.accent.warning}>
            {progress.streak}
          </WKText>
          <WKText variant="caption" color={Colors.text.secondary}>
            günlük seri
          </WKText>
        </View>
        <View style={styles.stat}>
          <WKText variant="heading2" color={Colors.accent.secondary}>
            {challenge.participants.length}
          </WKText>
          <WKText variant="caption" color={Colors.text.secondary}>
            katılımcı
          </WKText>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${progressPercent}%` }]}
        />
      </View>

      <View style={styles.challengeFooter}>
        <WKText variant="caption" color={Colors.text.secondary}>
          {new Date(challenge.startDate).toLocaleDateString('tr-TR')} - {new Date(challenge.endDate).toLocaleDateString('tr-TR')}
        </WKText>
        {!isJoined && challenge.status === 'active' && (
          <WKButton
            title="Katıl"
            onPress={onJoin}
            variant="primary"
            size="small"
          />
        )}
        {isJoined && (
          <WKChip label="Katıldın" color={Colors.accent.success} size="small" />
        )}
      </View>
    </WKCard>
  );
}

function CreateChallengeModal({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (challenge: any) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetWords, setTargetWords] = useState('');
  const [targetDays, setTargetDays] = useState('');

  const handleCreate = () => {
    if (!title.trim() || !description.trim() || !targetWords || !targetDays) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    const words = parseInt(targetWords);
    const days = parseInt(targetDays);

    if (words <= 0 || days <= 0) {
      Alert.alert('Hata', 'Geçerli değerler girin.');
      return;
    }

    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    onCreate({
      title: title.trim(),
      description: description.trim(),
      targetWords: words,
      targetDays: days,
      startDate,
      endDate,
      status: 'active',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setTargetWords('');
    setTargetDays('');
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <WKCard style={styles.modalContent}>
        <WKText variant="heading2" color={Colors.text.primaryDark}>
          Yeni Challenge Oluştur
        </WKText>

        <TextInput
          style={styles.input}
          placeholder="Challenge başlığı"
          placeholderTextColor={Colors.text.secondary}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Açıklama"
          placeholderTextColor={Colors.text.secondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Hedef kelime sayısı"
            placeholderTextColor={Colors.text.secondary}
            value={targetWords}
            onChangeText={setTargetWords}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Gün sayısı"
            placeholderTextColor={Colors.text.secondary}
            value={targetDays}
            onChangeText={setTargetDays}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.modalActions}>
          <WKButton
            title="İptal"
            onPress={onClose}
            variant="secondary"
          />
          <WKButton
            title="Oluştur"
            onPress={handleCreate}
            variant="primary"
          />
        </View>
      </WKCard>
    </View>
  );
}

export default function ChallengesScreen() {
  const {
    challenges,
    loading,
    loadChallenges,
    createChallenge,
    joinChallenge,
  } = useSocialStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadChallenges();
    // Mock user ID for demo - in real app this would come from auth
    setUserId('demo-user-id');
  }, []);

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      await createChallenge(challengeData);
      Alert.alert('Başarılı', 'Challenge oluşturuldu!');
    } catch (error) {
      Alert.alert('Hata', 'Challenge oluşturulamadı.');
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await joinChallenge(challengeId);
      Alert.alert('Başarılı', 'Challenge\'a katıldınız!');
    } catch (error) {
      Alert.alert('Hata', 'Challenge\'a katılamadı.');
    }
  };

  const isUserJoined = (challenge: SocialChallenge) => {
    return challenge.participants.includes(userId);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradient.secondary}
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
          Challenges 🏆
        </WKText>

        <WKButton
          title="+ Yeni Challenge"
          onPress={() => setShowCreateModal(true)}
          variant="secondary"
          size="small"
        />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.content}>
          {loading.challenges ? (
            <WKText variant="body" color={Colors.text.secondary} style={styles.loadingText}>
              Challenges yükleniyor...
            </WKText>
          ) : challenges.length === 0 ? (
            <View style={styles.emptyState}>
              <WKText variant="heading1">🏆</WKText>
              <WKText variant="heading2" color={Colors.text.primaryDark}>
                Henüz challenge yok
              </WKText>
              <WKText variant="body" color={Colors.text.secondary} style={styles.emptyText}>
                İlk challenge'ı sen oluştur!
              </WKText>
            </View>
          ) : (
            challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={() => handleJoinChallenge(challenge.id)}
                isJoined={isUserJoined(challenge)}
              />
            ))
          )}
        </View>

        <View style={{ height: Spacing.s32 }} />
      </ScrollView>

      <CreateChallengeModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateChallenge}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: Spacing.s12,
    paddingRight: Spacing.s16,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
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
  challengeCard: {
    marginBottom: Spacing.s16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.s8,
  },
  challengeInfo: {
    flex: 1,
  },
  description: {
    marginBottom: Spacing.s16,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.s16,
  },
  stat: {
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.bg.secondary,
    borderRadius: 2,
    marginBottom: Spacing.s16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    gap: Spacing.s16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: Radius.card,
    padding: Spacing.s16,
    fontSize: 16,
    color: Colors.text.primaryDark,
    backgroundColor: Colors.bg.secondary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
});