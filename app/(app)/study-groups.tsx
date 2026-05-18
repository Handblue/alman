import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { WKText, WKCard, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { StudyGroupCard } from '@/components/social/StudyGroupCard';
import { useStudyGroupStore } from '@/store/useStudyGroupStore';
import { StudyGroup } from '@/services/studyGroupService';
import { authService } from '@/services/authService';

const LEVELS: StudyGroup['level'][] = ['A1', 'A2', 'B1', 'B2', 'C1', 'mixed'];

function CreateGroupModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: {
    name: string;
    description: string;
    level: StudyGroup['level'];
    isPrivate: boolean;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<StudyGroup['level']>('mixed');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Grup adı boş olamaz.');
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim(), level, isPrivate });
    setName('');
    setDescription('');
    setLevel('mixed');
    setIsPrivate(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <WKText style={styles.modalTitle}>Grup Oluştur</WKText>

          <TextInput
            style={styles.input}
            placeholder="Grup adı"
            placeholderTextColor={Colors.text.secondary}
            value={name}
            onChangeText={setName}
            maxLength={40}
            accessibilityLabel="Grup adı"
          />

          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Açıklama (opsiyonel)"
            placeholderTextColor={Colors.text.secondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
            accessibilityLabel="Grup açıklaması"
          />

          <WKText style={styles.label}>Seviye</WKText>
          <View style={styles.levelRow}>
            {LEVELS.map(l => (
              <TouchableOpacity
                key={l}
                onPress={() => setLevel(l)}
                style={[
                  styles.levelChip,
                  level === l && styles.levelChipActive,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: level === l }}
                accessibilityLabel={`Seviye ${l}`}
              >
                <WKText style={[styles.levelChipText, level === l && styles.levelChipTextActive]}>
                  {l}
                </WKText>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setIsPrivate(p => !p)}
            style={styles.privateToggle}
            accessibilityRole="switch"
            accessibilityState={{ checked: isPrivate }}
            accessibilityLabel="Gizli grup"
          >
            <WKText style={styles.toggleLabel}>
              {isPrivate ? '🔒 Gizli grup' : '🌐 Herkese açık grup'}
            </WKText>
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <WKButton title="İptal" onPress={onClose} variant="secondary" />
            <WKButton title="Oluştur" onPress={handleSubmit} variant="primary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function JoinByCodeModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!code.trim()) {
      Alert.alert('Hata', 'Davet kodu boş olamaz.');
      return;
    }
    onSubmit(code.trim().toUpperCase());
    setCode('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <WKText style={styles.modalTitle}>Kodla Katıl</WKText>
          <WKText style={styles.modalSubtitle}>
            Grubun davet kodunu girerek katılabilirsin.
          </WKText>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="Davet kodu (örn. ABC123)"
            placeholderTextColor={Colors.text.secondary}
            value={code}
            onChangeText={t => setCode(t.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            accessibilityLabel="Davet kodu"
          />
          <View style={styles.modalActions}>
            <WKButton title="İptal" onPress={onClose} variant="secondary" />
            <WKButton title="Katıl" onPress={handleSubmit} variant="primary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function StudyGroupsScreen() {
  const {
    myGroups,
    publicGroups,
    loading,
    error,
    loadMyGroups,
    loadPublicGroups,
    createGroup,
    joinGroup,
    joinByCode,
    clearError,
  } = useStudyGroupStore();

  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);

  const currentUid = authService.getCurrentUser()?.id ?? '';

  useEffect(() => {
    loadMyGroups();
    loadPublicGroups();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Hata', error, [{ text: 'Tamam', onPress: clearError }]);
    }
  }, [error]);

  const handleCreate = async (params: Parameters<typeof createGroup>[0]) => {
    try {
      const groupId = await createGroup(params);
      setShowCreate(false);
      router.push(`/study-group/${groupId}`);
    } catch {
      // error shown via store error state
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      await joinGroup(groupId);
      router.push(`/study-group/${groupId}`);
    } catch {
      // error shown via store error state
    }
  };

  const handleJoinByCode = async (code: string) => {
    try {
      const groupId = await joinByCode(code);
      setShowJoinCode(false);
      router.push(`/study-group/${groupId}`);
    } catch {
      // error shown via store error state
    }
  };

  const myGroupIds = new Set(myGroups.map(g => g.id));

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradient.cta as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={styles.backButton}
        >
          <WKText style={styles.backText}>← Geri</WKText>
        </TouchableOpacity>
        <WKText style={styles.headerTitle}>Çalışma Grupları 👥</WKText>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowJoinCode(true)}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Kodla katıl"
          >
            <WKText style={styles.headerBtnText}>Kod ile Katıl</WKText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={[styles.headerBtn, styles.headerBtnPrimary]}
            accessibilityRole="button"
            accessibilityLabel="Yeni grup oluştur"
          >
            <WKText style={styles.headerBtnText}>+ Yeni Grup</WKText>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('my')}
            style={[styles.tab, activeTab === 'my' && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'my' }}
          >
            <WKText style={styles.tabText}>Gruplarım ({myGroups.length})</WKText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('discover')}
            style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'discover' }}
          >
            <WKText style={styles.tabText}>Keşfet</WKText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {loading && (
            <WKText style={styles.loadingText}>Yükleniyor...</WKText>
          )}

          {activeTab === 'my' && !loading && (
            myGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <WKText style={styles.emptyIcon}>👥</WKText>
                <WKText style={styles.emptyTitle}>Henüz bir grubun yok</WKText>
                <WKText style={styles.emptyDesc}>
                  Yeni bir grup oluştur veya var olan gruplara katıl
                </WKText>
                <WKButton
                  title="Grup Oluştur"
                  onPress={() => setShowCreate(true)}
                  variant="primary"
                />
              </View>
            ) : (
              myGroups.map(group => (
                <StudyGroupCard
                  key={group.id}
                  group={group}
                  isMember
                  onPress={() => router.push(`/study-group/${group.id}`)}
                />
              ))
            )
          )}

          {activeTab === 'discover' && !loading && (
            publicGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <WKText style={styles.emptyIcon}>🔍</WKText>
                <WKText style={styles.emptyTitle}>Henüz herkese açık grup yok</WKText>
                <WKText style={styles.emptyDesc}>
                  İlk grubu sen oluştur!
                </WKText>
              </View>
            ) : (
              publicGroups.map(group => {
                const isMember = myGroupIds.has(group.id);
                return (
                  <StudyGroupCard
                    key={group.id}
                    group={group}
                    isMember={isMember}
                    onPress={() => router.push(`/study-group/${group.id}`)}
                    onJoin={isMember ? undefined : () => handleJoin(group.id)}
                  />
                );
              })
            )
          )}
        </View>
        <View style={{ height: Spacing.s32 }} />
      </ScrollView>

      <CreateGroupModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
      <JoinByCodeModal
        visible={showJoinCode}
        onClose={() => setShowJoinCode(false)}
        onSubmit={handleJoinByCode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.light,
  },
  header: {
    paddingHorizontal: Spacing.s20,
    paddingBottom: Spacing.s16,
  },
  backButton: {
    paddingVertical: Spacing.s12,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    color: Colors.text.primary,
    fontSize: 16,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.s12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.s8,
    marginBottom: Spacing.s16,
  },
  headerBtn: {
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
    borderRadius: Radius.button,
    backgroundColor: 'rgba(255,255,255,0.2)',
    minHeight: 44,
    justifyContent: 'center',
  },
  headerBtnPrimary: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  headerBtnText: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
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
    minHeight: 44,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.s20,
  },
  loadingText: {
    textAlign: 'center',
    color: Colors.text.secondary,
    paddingVertical: Spacing.s32,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.s64,
    gap: Spacing.s12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.s8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bg.card,
    borderTopLeftRadius: Radius.bottomSheet,
    borderTopRightRadius: Radius.bottomSheet,
    padding: Spacing.s24,
    gap: Spacing.s16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: Radius.input,
    padding: Spacing.s16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.bg.light,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
  },
  levelChip: {
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
    borderRadius: Radius.chip,
    backgroundColor: Colors.bg.light,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minHeight: 44,
    justifyContent: 'center',
  },
  levelChipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '22',
  },
  levelChipText: {
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  levelChipTextActive: {
    color: Colors.brand.primary,
  },
  privateToggle: {
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    borderRadius: Radius.card,
    backgroundColor: Colors.bg.light,
    minHeight: 48,
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.s12,
    paddingTop: Spacing.s8,
  },
});
