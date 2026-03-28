import { useFolderStore } from '../useFolderStore';

beforeEach(() => {
  useFolderStore.setState({ folders: [] });
});

describe('useFolderStore', () => {
  it('createFolder adds to folders list', () => {
    const id = useFolderStore.getState().createFolder('My Folder');
    const { folders } = useFolderStore.getState();
    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe('My Folder');
    expect(folders[0].id).toBe(id);
    expect(id).not.toBe('');
  });

  it('deleteFolder removes it', () => {
    const id = useFolderStore.getState().createFolder('To Delete');
    expect(useFolderStore.getState().folders).toHaveLength(1);
    useFolderStore.getState().deleteFolder(id);
    expect(useFolderStore.getState().folders).toHaveLength(0);
  });

  it('addWordToFolder adds wordId', () => {
    const id = useFolderStore.getState().createFolder('Vocab');
    useFolderStore.getState().addWordToFolder(id, 42);
    const folder = useFolderStore.getState().folders.find((f) => f.id === id);
    expect(folder?.wordIds).toContain(42);
  });

  it('isWordInFolder returns true when word is in folder', () => {
    const id = useFolderStore.getState().createFolder('Test');
    useFolderStore.getState().addWordToFolder(id, 99);
    expect(useFolderStore.getState().isWordInFolder(id, 99)).toBe(true);
  });

  it('isWordInFolder returns false when word is not in folder', () => {
    const id = useFolderStore.getState().createFolder('Test');
    expect(useFolderStore.getState().isWordInFolder(id, 999)).toBe(false);
  });

  it('max 3 folders limit works (4th folder not created)', () => {
    useFolderStore.getState().createFolder('Folder 1');
    useFolderStore.getState().createFolder('Folder 2');
    useFolderStore.getState().createFolder('Folder 3');
    const id = useFolderStore.getState().createFolder('Folder 4');
    expect(id).toBe('');
    expect(useFolderStore.getState().folders).toHaveLength(3);
  });
});
