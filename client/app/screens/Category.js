import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../database/db';
import { useRouter } from 'expo-router';

const CategoryScreen = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [editId, setEditId] = useState(null);

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    const success = editId
      ? await updateCategory(editId, name.trim(), type)
      : await addCategory(name.trim(), type);

    if (success) {
      setModalVisible(false);
      setName('');
      setEditId(null);
      await loadCategories();
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(id);
          await loadCategories();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setName('');
            setType('expense');
            setEditId(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <View>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryType}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  setName(item.name);
                  setType(item.type);
                  setEditId(item.id);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Category' : 'Add Category'}</Text>
            <TextInput
              placeholder="Category name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <View style={styles.typeSelector}>
              {['expense', 'income'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeButton,
                    type === t && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      type === t && styles.typeTextSelected,
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                    {editId ? 'Update' : 'Add'}
                </Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                >
                <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { marginTop: 20 },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
  },
  categoryName: { fontSize: 16, fontWeight: '600' },
  categoryType: { color: '#777', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 15 },
  editText: { color: '#007AFF', fontWeight: '600' },
  deleteText: { color: '#ff3b30', fontWeight: '600' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  typeButtonSelected: { backgroundColor: '#007AFF' },
  typeText: { color: '#007AFF', fontWeight: '600' },
  typeTextSelected: { color: '#fff' },
  saveButton: {
    width: '48%',
    backgroundColor: '#08971bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: {
    width: '48%',
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#333', fontWeight: '600' },
});

export default CategoryScreen;
