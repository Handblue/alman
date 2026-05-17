# Implementation Plan: Study Groups + Progress Sharing

**Tarih:** 2026-04-06  
**Faz:** Faz 5 Devamı (Sosyal & Topluluk)  
**Bağımlılık:** `services/socialService.ts`, `store/useSocialStore.ts`, Firebase Firestore  
**Product Owner Kontrolü:** ✅ Faz 3 kapsamında (Sosyal sistem) — CLAUDE.md §4.1, §4.2

---

## Genel Bakış

İki bağımsız özellik, aynı altyapıyı paylaşıyor:

1. **Study Groups:** Firestore realtime — grup oluşturma, katılma, grup içi leaderboard
2. **Progress Sharing:** Arkadaşlara öğrenme ilerlemesi paylaşımı (deep link veya in-app)

Her ikisi de mevcut `socialService.ts` üzerine inşa edilecek. UI Design System kuralları uygulanacak.

---

## Dosya Yapısı

### Yeni Dosyalar
```
services/studyGroupService.ts          # Grup CRUD + realtime listeners
store/useStudyGroupStore.ts            # Zustand store
app/(app)/study-groups.tsx             # Grup listesi + oluşturma
app/(app)/study-group/[id].tsx         # Grup detay + üyeler + leaderboard
components/social/StudyGroupCard.tsx   # Grup kartı bileşeni
components/social/GroupLeaderboard.tsx # Grup içi leaderboard
services/__tests__/studyGroupService.test.ts
store/__tests__/useStudyGroupStore.test.ts
```

### Değiştirilecek Dosyalar
```
services/socialService.ts              # progressSharing metodları eklenir
store/useSocialStore.ts                # progress sharing state eklenir
app/(app)/friends.tsx                  # "İlerleme Paylaş" butonu eklenir
app/(app)/_layout.tsx                  # study-groups tab veya erişim noktası
```

---

## Firestore Şeması

```
studyGroups/{groupId}/
  name: string
  description: string
  creatorUid: string
  members: string[]          // uid listesi
  maxMembers: number         // default 10
  level: 'A1'|'A2'|'B1'|'B2'|'C1'|'mixed'
  isPrivate: boolean
  inviteCode: string         // 6 karakter random
  createdAt: Timestamp
  weeklyXP: { [uid]: number } // haftalık XP sıralaması
  totalXP: { [uid]: number }

studyGroups/{groupId}/messages/{msgId}/   // Opsiyonel: grup mesajlaşma (Faz 5+)

progressShares/{shareId}/
  fromUid: string
  toUid: string              // null = herkese açık
  weeklyXP: number
  wordsLearned: number
  streakDays: number
  topCategory: string
  sharedAt: Timestamp
  isPublic: boolean
```

---

## Görev Listesi

### WAVE 1: studyGroupService.ts (Backend)

#### Görev 1.1 — Failing test yaz (StudyGroupService temel CRUD)
**Dosya:** `services/__tests__/studyGroupService.test.ts`
```typescript
// Test: createGroup, joinGroup, leaveGroup, getGroupMembers
describe('StudyGroupService', () => {
  it('creates a study group with correct fields', async () => { ... });
  it('allows a user to join a group', async () => { ... });
  it('prevents joining full group (maxMembers reached)', async () => { ... });
  it('allows leaving a group', async () => { ... });
  it('returns group by invite code', async () => { ... });
});
```
Testi çalıştır → başarısız olduğunu doğrula.

#### Görev 1.2 — studyGroupService.ts oluştur
**Dosya:** `services/studyGroupService.ts`

```typescript
import { doc, collection, getDoc, setDoc, updateDoc, onSnapshot,
  query, where, arrayUnion, arrayRemove, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { authService } from './authService';

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  creatorUid: string;
  members: string[];
  maxMembers: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'mixed';
  isPrivate: boolean;
  inviteCode: string;
  createdAt: string;
  weeklyXP: Record<string, number>;
  totalXP: Record<string, number>;
}

class StudyGroupService {
  async createGroup(params: {
    name: string;
    description: string;
    level: StudyGroup['level'];
    isPrivate: boolean;
    maxMembers?: number;
  }): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const newGroup: StudyGroup = {
      id: groupId,
      name: params.name,
      description: params.description,
      creatorUid: user.uid,
      members: [user.uid],
      maxMembers: params.maxMembers ?? 10,
      level: params.level,
      isPrivate: params.isPrivate,
      inviteCode,
      createdAt: new Date().toISOString(),
      weeklyXP: { [user.uid]: 0 },
      totalXP: { [user.uid]: 0 },
    };

    await setDoc(doc(db, 'studyGroups', groupId), newGroup);
    return groupId;
  }

  async joinGroup(groupId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const groupRef = doc(db, 'studyGroups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) throw new Error('Group not found');

    const group = groupSnap.data() as StudyGroup;
    if (group.members.length >= group.maxMembers) throw new Error('Group is full');
    if (group.members.includes(user.uid)) throw new Error('Already a member');

    await updateDoc(groupRef, {
      members: arrayUnion(user.uid),
      [`weeklyXP.${user.uid}`]: 0,
      [`totalXP.${user.uid}`]: 0,
    });
  }

  async joinGroupByInviteCode(inviteCode: string): Promise<string> {
    const groupsRef = collection(db, 'studyGroups');
    const q = query(groupsRef, where('inviteCode', '==', inviteCode.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Invalid invite code');

    const groupId = snap.docs[0].id;
    await this.joinGroup(groupId);
    return groupId;
  }

  async leaveGroup(groupId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const groupRef = doc(db, 'studyGroups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(user.uid),
    });
  }

  async updateWeeklyXP(groupId: string, xp: number): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    const groupRef = doc(db, 'studyGroups', groupId);
    await updateDoc(groupRef, {
      [`weeklyXP.${user.uid}`]: xp,
      [`totalXP.${user.uid}`]: xp, // TODO: increment, not set
    });
  }

  async getUserGroups(): Promise<StudyGroup[]> {
    const user = authService.getCurrentUser();
    if (!user) return [];

    const groupsRef = collection(db, 'studyGroups');
    const q = query(groupsRef, where('members', 'array-contains', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StudyGroup);
  }

  async getPublicGroups(): Promise<StudyGroup[]> {
    const groupsRef = collection(db, 'studyGroups');
    const q = query(groupsRef, where('isPrivate', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StudyGroup);
  }

  subscribeToGroup(groupId: string, callback: (group: StudyGroup) => void) {
    const groupRef = doc(db, 'studyGroups', groupId);
    return onSnapshot(groupRef, snap => {
      if (snap.exists()) callback(snap.data() as StudyGroup);
    });
  }
}

export const studyGroupService = new StudyGroupService();
```

#### Görev 1.3 — Testleri geçir, commit
```bash
npx jest services/__tests__/studyGroupService.test.ts
```
✅ Geçiyorsa commit: `feat: add studyGroupService with CRUD and realtime`

---

### WAVE 2: useStudyGroupStore.ts (State)

#### Görev 2.1 — Failing store test yaz
**Dosya:** `store/__tests__/useStudyGroupStore.test.ts`
```typescript
// Test: loadUserGroups, createGroup, joinGroup, leaveGroup
```

#### Görev 2.2 — useStudyGroupStore.ts oluştur
**Dosya:** `store/useStudyGroupStore.ts`

```typescript
import { create } from 'zustand';
import { studyGroupService, StudyGroup } from '@/services/studyGroupService';

interface StudyGroupState {
  myGroups: StudyGroup[];
  publicGroups: StudyGroup[];
  activeGroup: StudyGroup | null;
  loading: boolean;

  loadMyGroups: () => Promise<void>;
  loadPublicGroups: () => Promise<void>;
  createGroup: (params: Parameters<typeof studyGroupService.createGroup>[0]) => Promise<string>;
  joinGroup: (groupId: string) => Promise<void>;
  joinByCode: (code: string) => Promise<string>;
  leaveGroup: (groupId: string) => Promise<void>;
  setActiveGroup: (group: StudyGroup | null) => void;
}

export const useStudyGroupStore = create<StudyGroupState>((set) => ({
  myGroups: [],
  publicGroups: [],
  activeGroup: null,
  loading: false,

  loadMyGroups: async () => {
    set({ loading: true });
    try {
      const groups = await studyGroupService.getUserGroups();
      set({ myGroups: groups });
    } finally {
      set({ loading: false });
    }
  },

  loadPublicGroups: async () => {
    set({ loading: true });
    try {
      const groups = await studyGroupService.getPublicGroups();
      set({ publicGroups: groups });
    } finally {
      set({ loading: false });
    }
  },

  createGroup: async (params) => {
    const groupId = await studyGroupService.createGroup(params);
    await useStudyGroupStore.getState().loadMyGroups();
    return groupId;
  },

  joinGroup: async (groupId) => {
    await studyGroupService.joinGroup(groupId);
    await useStudyGroupStore.getState().loadMyGroups();
  },

  joinByCode: async (code) => {
    const groupId = await studyGroupService.joinGroupByInviteCode(code);
    await useStudyGroupStore.getState().loadMyGroups();
    return groupId;
  },

  leaveGroup: async (groupId) => {
    await studyGroupService.leaveGroup(groupId);
    await useStudyGroupStore.getState().loadMyGroups();
  },

  setActiveGroup: (group) => set({ activeGroup: group }),
}));
```

#### Görev 2.3 — Testleri geçir, commit
`feat: add useStudyGroupStore`

---

### WAVE 3: Progress Sharing (socialService.ts Eklentisi)

#### Görev 3.1 — Failing test yaz
**Dosya:** `services/__tests__/socialService-progressSharing.test.ts`
```typescript
// Test: shareProgress, getFriendProgress, getProgressFeed
```

#### Görev 3.2 — socialService.ts'e metod ekle
`services/socialService.ts` sonuna ekle (class içine):

```typescript
async shareProgress(params: {
  toUid?: string;  // null = herkese açık
  weeklyXP: number;
  wordsLearned: number;
  streakDays: number;
  topCategory: string;
  isPublic: boolean;
}): Promise<string> {
  const user = authService.getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const shareId = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const shareData = {
    id: shareId,
    fromUid: user.uid,
    toUid: params.toUid ?? null,
    weeklyXP: params.weeklyXP,
    wordsLearned: params.wordsLearned,
    streakDays: params.streakDays,
    topCategory: params.topCategory,
    sharedAt: new Date().toISOString(),
    isPublic: params.isPublic,
  };

  await setDoc(doc(db, 'progressShares', shareId), shareData);
  return shareId;
}

async getFriendProgressFeed(friendUids: string[]): Promise<ProgressShare[]> {
  if (friendUids.length === 0) return [];
  const sharesRef = collection(db, 'progressShares');
  // Firestore 'in' operator max 10 items
  const q = query(sharesRef, where('fromUid', 'in', friendUids.slice(0, 10)));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as ProgressShare);
}
```

#### Görev 3.3 — Testleri geçir, commit
`feat: add progress sharing to socialService`

---

### WAVE 4: UI — Study Groups Ekranları

#### Görev 4.1 — StudyGroupCard bileşeni
**Dosya:** `components/social/StudyGroupCard.tsx`

```typescript
// Props: group: StudyGroup, onPress: () => void, isMember: boolean
// Design: color-bg-card, 16px border-radius, level chip (color-info), 
//         üye sayısı, XP lideri, "Katıl" veya "Gir" butonu
// Dark/Light her ikisi de çalışmalı
// Min dokunma alanı: 44x44px
```

#### Görev 4.2 — GroupLeaderboard bileşeni
**Dosya:** `components/social/GroupLeaderboard.tsx`

```typescript
// Props: weeklyXP: Record<string, number>, members: string[]
// Sıralama: weeklyXP'ye göre desc
// 1. sıra: color-accent-gold, taç ikonu
// 2. sıra: #C0C0C0
// 3. sıra: #CD7F32
// Diğerleri: standart text-body
```

#### Görev 4.3 — study-groups.tsx ana ekranı
**Dosya:** `app/(app)/study-groups.tsx`

```
Bölüm 1: "Gruplarım" — FlatList, StudyGroupCard, "Oluştur" FAB
Bölüm 2: "Herkese Açık Gruplar" — FlatList, filter: seviye
Modal: Grup oluşturma formu (isim, açıklama, seviye, gizlilik)
Modal: Davet kodu ile katılma
```

**UI Guardian kontrolleri:**
- [ ] Renk token'ları (hardcoded HEX yok)
- [ ] Dark/Light mode
- [ ] 44px min touch target
- [ ] accessibilityLabel

#### Görev 4.4 — study-group/[id].tsx detay ekranı
**Dosya:** `app/(app)/study-group/[id].tsx`

```
Header: Grup adı + davet kodu paylaşım butonu
GroupLeaderboard bileşeni (realtime onSnapshot)
Üyeler listesi (avatar + XP)
"Gruptan Ayrıl" butonu (kırmızı, onaylama modal)
```

#### Görev 4.5 — friends.tsx'e "İlerleme Paylaş" butonu ekle
**Dosya:** `app/(app)/friends.tsx`

```typescript
// Mevcut friends listesinin üstüne ekle:
// "Bu haftaki ilerlemeni paylaş" kartı
// weeklyXP + wordsLearned + streakDays + topCategory
// "Arkadaşlarıma Paylaş" + "Herkese Açık Paylaş" iki CTA
// Paylaşım sonrası: +50 XP (CLAUDE.md §3.1 — "Özel liste paylaşma: +50")
```

#### Görev 4.6 — Testleri çalıştır, commit
```bash
npx jest --testPathPattern="studyGroup|progressShare|social"
```
`feat: Study Groups UI + Progress Sharing`

---

### WAVE 5: _layout.tsx Entegrasyonu + QA

#### Görev 5.1 — Navigasyon erişim noktası
`app/(app)/_layout.tsx`'e study-groups rotası ekle.  
Friends tab'ında veya ayrı "Topluluk" tab'ında — mevcut tab yapısına bak, uygun olanı seç.

#### Görev 5.2 — Edge case testleri (qa-sentinel)
```
- Tam grup (maxMembers) → "Katıl" disabled, doğru hata mesajı
- Geçersiz davet kodu → "Bulunamadı" toast
- Kendi kendine XP paylaşımı → geçerli
- Arkadaş listesi boşken progress feed → boş state UI
- Gece 00:00 weeklyXP sıfırlanma → sunucu timestamp
- Offline'da grup oluşturma → offlineQueue'ya ekle
```

#### Görev 5.3 — TypeScript strict kontrol
```bash
npx tsc --noEmit
```
Hata yoksa devam.

#### Görev 5.4 — Final commit + push
```bash
git add services/studyGroupService.ts store/useStudyGroupStore.ts \
  app/(app)/study-groups.tsx app/(app)/study-group/ \
  components/social/StudyGroupCard.tsx components/social/GroupLeaderboard.tsx
git commit -m "feat: Study Groups (realtime Firestore) + Progress Sharing"
git push origin main
```

---

## Gamification Etkisi (gamification-balancer kontrolü)

| Aksiyon | XP |
|---------|-----|
| Grup oluşturma | +50 (liste paylaşma eşdeğeri) |
| İlerleme paylaşımı | +50 (özel liste paylaşma) |
| Grup içi haftalık 1. olmak | +100 (öneri: yeni başarım) |

**Premium/Free:** Study Groups tamamen ücretsiz. Progress sharing ücretsiz (sosyal büyüme motoru).

---

## Başarı Kriterleri

- [ ] Kullanıcı grup oluşturabilir ve davet kodu ile arkadaşını ekleyebilir
- [ ] Grup leaderboard'u realtime güncellenir (onSnapshot)
- [ ] İlerleme paylaşımı friends.tsx'ten yapılabilir
- [ ] Tüm testler geçiyor
- [ ] TypeScript strict hatası yok
- [ ] Dark/Light mode çalışıyor
- [ ] 60 FPS (büyük üye listelerinde FlatList kullanılıyor)
