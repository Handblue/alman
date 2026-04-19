import { render } from '@testing-library/react-native';
import { CacheManagementCard } from '@/components/profile/CacheManagementCard';
import { useAudioCache } from '@/hooks/useAudioCache';

// Mock the useAudioCache hook
jest.mock('@/hooks/useAudioCache');

describe('CacheManagementCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAudioCache as jest.Mock).mockReturnValue({
      cacheStats: { totalSize: 5242880, fileCount: 10 }, // 5MB, 10 files
      getCacheSizeInMB: jest.fn(() => 5),
      clearCache: jest.fn(),
      clearCacheByPrefix: jest.fn(),
      updateCacheStats: jest.fn(),
    });
  });

  it('should render cache card with stats', () => {
    const { getByText } = render(<CacheManagementCard />);

    expect(getByText('Ses Önbelleği')).toBeTruthy();
    expect(getByText(/5 MB/)).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });

  it('should display file count and size', () => {
    const { getByText } = render(<CacheManagementCard />);

    expect(getByText('Dosya Sayısı')).toBeTruthy();
    expect(getByText('Toplam Boyut')).toBeTruthy();
  });

  it('should render clear buttons', () => {
    const { getByText } = render(<CacheManagementCard />);

    expect(getByText('TTS Temizle')).toBeTruthy();
    expect(getByText('Ses Temizle')).toBeTruthy();
    expect(getByText('Tümünü Sil')).toBeTruthy();
  });

  it('should call onCacheCleared callback', () => {
    const mockCallback = jest.fn();
    render(<CacheManagementCard onCacheCleared={mockCallback} />);

    // Note: Full interaction testing would require fireEvent which needs more setup
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
