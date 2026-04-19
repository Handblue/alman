import { CATEGORIES } from '@/data/categories';
import { UNITS } from '@/data/units';
import { WORDS } from '@/data/words';
import { createStorage } from '@/utils/storage';

const storage = createStorage('offline-content');

export interface OfflinePack {
  id: string;
  title: string;
  description: string;
  type: 'category' | 'essentials';
  itemCount: number;
  estimatedSizeMB: number;
  premium: boolean;
}

export interface DownloadedPack extends OfflinePack {
  downloadedAt: string;
}

const ESSENTIAL_PACK: OfflinePack = {
  id: 'essentials',
  title: 'Günlük Hayat Hızlı Paket',
  description: 'Seyahat, market ve günlük ihtiyaçlar için temel içerik.',
  type: 'essentials',
  itemCount: WORDS.filter(word => [1, 5].includes(word.categoryId)).length,
  estimatedSizeMB: 8,
  premium: false,
};

function buildCategoryPacks(): OfflinePack[] {
  return CATEGORIES.map(category => {
    const units = UNITS.filter(unit => unit.categoryId === category.id);
    const itemCount = WORDS.filter(word => word.categoryId === category.id).length;

    return {
      id: `category-${category.id}`,
      title: category.name,
      description: `${units.length} ünite, ${itemCount} kelime`,
      type: 'category',
      itemCount,
      estimatedSizeMB: Math.max(4, Math.ceil(itemCount / 12)),
      premium: category.id !== 1 && category.id !== 5,
    };
  });
}

class OfflineContentService {
  private downloadsKey = 'downloads';

  getAvailablePacks(): OfflinePack[] {
    return [ESSENTIAL_PACK, ...buildCategoryPacks()];
  }

  getDownloadedPacks(): DownloadedPack[] {
    const raw = storage.getString(this.downloadsKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as DownloadedPack[];
    } catch {
      return [];
    }
  }

  isDownloaded(packId: string): boolean {
    return this.getDownloadedPacks().some(pack => pack.id === packId);
  }

  async downloadPack(packId: string): Promise<DownloadedPack> {
    const pack = this.getAvailablePacks().find(item => item.id === packId);
    if (!pack) {
      throw new Error('Paket bulunamadı');
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const downloadedPack: DownloadedPack = {
      ...pack,
      downloadedAt: new Date().toISOString(),
    };

    const downloads = this.getDownloadedPacks();
    const updated = [downloadedPack, ...downloads.filter(item => item.id !== packId)];
    storage.set(this.downloadsKey, JSON.stringify(updated));

    const content = this.buildPackPayload(packId);
    storage.set(`payload:${packId}`, JSON.stringify(content));

    return downloadedPack;
  }

  removePack(packId: string): void {
    const updated = this.getDownloadedPacks().filter(pack => pack.id !== packId);
    storage.set(this.downloadsKey, JSON.stringify(updated));
    storage.remove(`payload:${packId}`);
  }

  getPayload(packId: string): Record<string, unknown> | null {
    const raw = storage.getString(`payload:${packId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  getStats() {
    const downloads = this.getDownloadedPacks();
    return {
      totalPacks: downloads.length,
      totalWords: downloads.reduce((sum, pack) => sum + pack.itemCount, 0),
      usedMB: downloads.reduce((sum, pack) => sum + pack.estimatedSizeMB, 0),
    };
  }

  private buildPackPayload(packId: string) {
    if (packId === 'essentials') {
      const categoryIds = [1, 5];
      return {
        unitIds: UNITS.filter(unit => categoryIds.includes(unit.categoryId)).map(unit => unit.id),
        wordIds: WORDS.filter(word => categoryIds.includes(word.categoryId)).map(word => word.id),
      };
    }

    const categoryId = Number(packId.replace('category-', ''));
    return {
      unitIds: UNITS.filter(unit => unit.categoryId === categoryId).map(unit => unit.id),
      wordIds: WORDS.filter(word => word.categoryId === categoryId).map(word => word.id),
    };
  }
}

export const offlineContentService = new OfflineContentService();
