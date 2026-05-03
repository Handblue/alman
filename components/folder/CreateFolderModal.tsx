import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useFolderStore } from '@/store/useFolderStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (folderId: string) => void;
}

export function CreateFolderModal({ visible, onClose, onCreated }: Props) {
  const { createFolder } = useFolderStore();
  const [name, setName] = useState('');

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createFolder(trimmed);
    if (id) {
      setName('');
      onCreated(id);
    }
  }

  function handleClose() {
    setName('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Kapat">
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.card}>
          <WKText variant="heading2" style={{ marginBottom: Spacing.s16 }}>
            Yeni Klasör
          </WKText>

          <TextInput
            style={styles.input}
            placeholder="Klasör adı..."
            placeholderTextColor={Colors.text.secondary}
            value={name}
            onChangeText={text => setName(text.slice(0, 30))}
            maxLength={30}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            accessibilityLabel="Klasör adı"
          />

          <WKText variant="caption" color={Colors.text.secondary} style={styles.charCount}>
            {name.length}/30
          </WKText>

          <View style={styles.actions}>
            <WKButton
              label="İptal"
              variant="ghost"
              onPress={handleClose}
              style={styles.actionBtn}
            />
            <WKButton
              label="Oluştur"
              variant="primary"
              onPress={handleCreate}
              disabled={name.trim().length === 0}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.modal,
    padding: Spacing.s24,
    width: '85%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  input: {
    backgroundColor: Colors.bg.light,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    fontSize: 16,
    minHeight: 48,
  },
  charCount: {
    textAlign: 'right',
    marginTop: Spacing.s4,
    marginBottom: Spacing.s16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
  actionBtn: {
    flex: 1,
  },
});
