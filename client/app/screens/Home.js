import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initDB, getTransactions, getCategories } from '../database/db';
import { useRouter, useFocusEffect } from 'expo-router';

const HomeScreen = () => {
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [filterType, setFilterType] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [categories, setCategories] = useState({ Expense: [], Income: [] });

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories();
      const expenseCategories = data.filter(c => c.type === 'expense').map(c => c.name);
      const incomeCategories = data.filter(c => c.type === 'income').map(c => c.name);
      setCategories({ Expense: expenseCategories, Income: incomeCategories });
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
        await loadTransactions();
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize database');
      }
    };
    
    initializeApp();
  }, []);

  const normalizeTransaction = (transaction) => {
    const hasCorrectStructure = 
      typeof transaction.amount === 'number' && 
      (transaction.type === 'income' || transaction.type === 'expense');
    
    if (hasCorrectStructure) {
      return {
        ...transaction,
        amount: parseFloat(transaction.amount || 0),
        type: transaction.type.toLowerCase(),
        category: transaction.category,
        description: transaction.description || 'No description',
        date: transaction.date
      };
    } else {
      const amount = parseFloat(
        typeof transaction.amount === 'number' ? transaction.amount :
        typeof transaction.date === 'string' && !isNaN(parseFloat(transaction.date)) ? transaction.date :
        transaction.amount || 0
      );
      
      const date = 
        typeof transaction.date === 'string' && isNaN(parseFloat(transaction.date)) ? transaction.date :
        typeof transaction.amount === 'string' ? transaction.amount :
        transaction.date || 'Unknown date';
      
      let type = 'expense';
      if (transaction.type?.toLowerCase() === 'income' || transaction.category?.toLowerCase() === 'income') {
        type = 'income';
      } else if (transaction.type?.toLowerCase() === 'expense' || transaction.category?.toLowerCase() === 'expense') {
        type = 'expense';
      }
      
      const category = 
        categories.Income.includes(transaction.category) ? transaction.category :
        categories.Expense.includes(transaction.category) ? transaction.category :
        categories.Income.includes(transaction.description) ? transaction.description :
        categories.Expense.includes(transaction.description) ? transaction.description :
        transaction.category || 'Other';

      const description = 
        transaction.description && 
        !categories.Income.includes(transaction.description) && 
        !categories.Expense.includes(transaction.description) 
          ? transaction.description 
          : transaction.type || 'No description';
      
      return {
        ...transaction,
        amount,
        type,
        category,
        description,
        date
      };
    }
  };

  const loadTransactions = useCallback(async () => {
    try {
      console.log('Loading transactions with filters - Type:', filterType, 'Category:', filterCategory);
      const data = await getTransactions();
      
      const normalizedData = data.map(normalizeTransaction);
      let filteredData = normalizedData;
      
      if (filterType) {
        filteredData = filteredData.filter(t => 
          t.type.toLowerCase() === filterType.toLowerCase()
        );
      }
      
      if (filterCategory) {
        filteredData = filteredData.filter(t => 
          t.category.toLowerCase() === filterCategory.toLowerCase()
        );
      }
      filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setTransactions(filteredData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    }
  }, [filterType, filterCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleTypeFilter = (type) => {
    console.log('Setting type filter:', type);
    setFilterType(type);
    setFilterCategory(null);
    setShowTypePicker(false);
  };

  const handleCategoryFilter = (category) => {
    console.log('Setting category filter:', category);
    setFilterCategory(category);
    setShowCategoryPicker(false);
  };

  const clearAllFilters = () => {
    setFilterType(null);
    setFilterCategory(null);
  };

  const calculateTotals = () => {
    const incomeTotal = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenseTotal = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const balance = incomeTotal - expenseTotal;
    
    return { incomeTotal, expenseTotal, balance };
  };

  const { incomeTotal, expenseTotal, balance } = calculateTotals();

  const getAvailableCategories = () => {
    if (filterType) {
      return categories[filterType] || [];
    }
    return [...categories.Income, ...categories.Expense];
  };

  const renderTypePicker = () => (
    <Modal visible={showTypePicker} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter by Type</Text>

          <TouchableOpacity
            style={[styles.modalOption, filterType === null && styles.selectedOption]}
            onPress={() => handleTypeFilter(null)}
          >
            <Text style={[styles.modalOptionText, filterType === null && styles.selectedOptionText]}>
              All Types
            </Text>
          </TouchableOpacity>

          {['Income', 'Expense'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.modalOption, filterType === t && styles.selectedOption]}
              onPress={() => handleTypeFilter(t)}
            >
              <Text style={[styles.modalOptionText, filterType === t && styles.selectedOptionText]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.modalCancel} onPress={() => setShowTypePicker(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCategoryPicker = () => {
    const availableCategories = getAvailableCategories();

    return (
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Category</Text>

            <TouchableOpacity
              style={[styles.modalOption, filterCategory === null && styles.selectedOption]}
              onPress={() => handleCategoryFilter(null)}
            >
              <Text style={[styles.modalOptionText, filterCategory === null && styles.selectedOptionText]}>
                All Categories
              </Text>
            </TouchableOpacity>

            {availableCategories.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.modalOption, filterCategory === item && styles.selectedOption]}
                onPress={() => handleCategoryFilter(item)}
              >
                <Text style={[styles.modalOptionText, filterCategory === item && styles.selectedOptionText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCategoryPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSettingsModal = () => (
    <Modal visible={showSettingsModal} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Settings</Text>

          <TouchableOpacity
            style={[styles.actionButton, { marginBottom: 10 }]}
            onPress={() => { setShowSettingsModal(false); router.push('/screens/Category'); }}
          >
            <Text style={styles.actionButtonText}>Category</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { marginBottom: 10 }]}
            onPress={() => { setShowSettingsModal(false); router.push('/screens/Backup'); }}
          >
            <Text style={styles.actionButtonText}>Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => { setShowSettingsModal(false); router.push('/screens/Restore'); }}
          >
            <Text style={styles.actionButtonText}>Restore</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSettingsModal(false)}>
            <Text style={styles.modalCancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getTypeFilterText = () => filterType ? filterType : 'All Types';
  const getCategoryFilterText = () => filterCategory ? filterCategory : 'All Categories';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Expense Tracker</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/screens/AddTransaction')}
            >
              <Text style={styles.addButtonText}>➕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.graphButton}
              onPress={() => router.push('/screens/Charts')}
            >
              <Text style={styles.graphIcon}>📊</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettingsModal(true)}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.balanceCard]}>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[styles.summaryAmount, balance >= 0 ? styles.positive : styles.negative]}>
              ₹{balance.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, styles.positive]}>
                ₹{incomeTotal.toFixed(2)}
              </Text>
            </View>
            
            <View style={[styles.summaryCard, styles.expenseCard]}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, styles.negative]}>
                ₹{expenseTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton,
              filterType && styles.activeFilterButton
            ]} 
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={[
              styles.filterButtonText,
              filterType && styles.activeFilterButtonText
            ]}>
              {getTypeFilterText()}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton,
              filterCategory && styles.activeFilterButton
            ]} 
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={[
              styles.filterButtonText,
              filterCategory && styles.activeFilterButtonText
            ]}>
              {getCategoryFilterText()}
            </Text>
          </TouchableOpacity>
        </View>

        {(filterType || filterCategory) && (
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearFilterButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}

        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>
              Transactions ({transactions.length})
              {(filterType || filterCategory)}
            </Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.noTransactionsContainer}>
              <Text style={styles.noTransactions}>No transactions found</Text>
              {(filterType || filterCategory) && (
                <Text style={styles.noTransactionsHint}>
                  Try changing your filters or {''}
                  <Text 
                    style={styles.clearFilterLink} 
                    onPress={clearAllFilters}
                  >
                    clear all filters
                  </Text>
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => router.push(`/screens/EditTransaction?id=${item.id}`)}
                    activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.transactionItem,
                      item.type === 'income' ? styles.incomeItem : styles.expenseItem,
                    ]}
                  >
                    <View style={styles.transactionHeader}>
                      <View style={styles.transactionMain}>
                        <Text style={styles.transactionDescription}>
                          {item.description}
                        </Text>
                        <Text style={styles.transactionDate}>{item.createdAt}</Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          item.type === 'income' ? styles.income : styles.expense,
                        ]}
                      >
                        ₹{item.amount.toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.transactionFooter}>
                      <Text style={styles.transactionCategory}>{item.category}</Text>
                      <Text
                        style={[
                          styles.transactionType,
                          item.type === 'income' ? styles.incomeText : styles.expenseText,
                        ]}
                      >
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Text>
                    </View>
                  </View>

                </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            )}
        </View>
        {renderTypePicker()}
        {renderCategoryPicker()}
        {renderSettingsModal()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 20 },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  settingsButton: { backgroundColor: '#f0f0f0', borderRadius: 50, padding: 0, marginLeft: 10 },
  settingsIcon: { fontSize: 22 },
  addButton: { borderRadius: 50 },
  addButtonText: { fontSize: 22, color: '#fff' },
  graphButton: { borderRadius: 50, padding: 8, marginLeft: 10 },
  graphIcon: { fontSize: 22, color: '#fff' },

  summaryContainer: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceCard: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  incomeCard: {
    backgroundColor: '#f0f9f0',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  expenseCard: {
    backgroundColor: '#fef0f0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },

  filterContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: { fontSize: 16, color: '#333', fontWeight: '500' },
  activeFilterButtonText: { color: '#fff', fontWeight: '600' },

  clearFilterButton: {
    padding: 12,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  clearFilterButtonText: { color: '#fff', fontWeight: '500' },

  transactionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionsHeader: {
    marginBottom: 15,
  },
  transactionsTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333',
  },
  
  noTransactionsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noTransactions: { 
    textAlign: 'center', 
    color: '#666', 
    fontStyle: 'italic', 
    fontSize: 16,
    marginBottom: 8,
  },
  noTransactionsHint: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
  },
  clearFilterLink: {
    color: '#007AFF',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  transactionItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  incomeItem: { borderLeftColor: '#34C759' },
  expenseItem: { borderLeftColor: '#FF3B30' },
  transactionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionMain: {
    flex: 1,
    marginRight: 10,
  },
  transactionDate: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 4,
  },
  transactionAmount: { 
    fontSize: 18, 
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'right',
  },
  income: { color: '#34C759' },
  expense: { color: '#FF3B30' },
  transactionDescription: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
  },
  transactionFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transactionType: { 
    fontSize: 12, 
    fontWeight: '500', 
    textTransform: 'uppercase' 
  },
  incomeText: { color: '#34C759' },
  expenseText: { color: '#FF3B30' },

  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 20, 
    width: '100%', 
    maxHeight: '80%' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  modalOption: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0', 
    borderRadius: 8, 
    marginBottom: 5 
  },
  selectedOption: { backgroundColor: '#007AFF' },
  modalOptionText: { fontSize: 16, color: '#333', textAlign: 'center' },
  selectedOptionText: { color: '#fff', fontWeight: '600' },
  modalCancel: { 
    padding: 15, 
    marginTop: 10, 
    backgroundColor: '#6c757d', 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  modalCancelText: { color: '#fff', fontWeight: '600' },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
});

export default HomeScreen;