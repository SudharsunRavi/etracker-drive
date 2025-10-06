import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ScrollView, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/Input';
import Button from '../components/Button';
import { initDB, addTransaction, getTransactions } from '../database/db';
  import { useRouter } from 'expo-router';

const HomeScreen = () => {

  const router = useRouter();

  const navigateToBackup = () => {
    router.push('/screens/Backup');
  };

  const navigateToRestore = () => {
    router.push('/screens/Restore');
  };
  
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categories = {
    expense: ['Food', 'Rent', 'Entertainment', 'Transport', 'Shopping', 'Bills', 'Healthcare'],
    income: ['Salary', 'Investment', 'Freelance', 'Gift', 'Bonus']
  };

  useEffect(() => {
    const init = async () => {
      await initDB();
      loadTransactions();
    };
    init();
  }, []);

  const loadTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  const handleAddTransaction = async () => {
    if (!date || !description || !amount) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      await addTransaction(
        date, 
        description, 
        type, 
        category, 
        parseFloat(amount)
      );
      
      setDate(''); 
      setDescription(''); 
      setAmount('');
      loadTransactions();
      alert('Transaction added successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const renderTypePicker = () => (
    <Modal
      visible={showTypePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowTypePicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Type</Text>
          <ScrollView>
            <TouchableOpacity
              style={[styles.modalOption, type === 'expense' && styles.selectedOption]}
              onPress={() => {
                setType('expense');
                setShowTypePicker(false);
              }}
            >
              <Text style={[styles.modalOptionText, type === 'expense' && styles.selectedOptionText]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, type === 'income' && styles.selectedOption]}
              onPress={() => {
                setType('income');
                setShowTypePicker(false);
              }}
            >
              <Text style={[styles.modalOptionText, type === 'income' && styles.selectedOptionText]}>
                Income
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => setShowTypePicker(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCategoryPicker = () => (
    <Modal
      visible={showCategoryPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView style={styles.modalScroll}>
            {categories[type].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.modalOption, category === item && styles.selectedOption]}
                onPress={() => {
                  setCategory(item);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, category === item && styles.selectedOptionText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => setShowCategoryPicker(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Expense Tracker</Text>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToBackup}
            >
              <Text style={styles.actionButtonIcon}>📤</Text>
              <Text style={styles.actionButtonText}>Backup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToRestore}
            >
              <Text style={styles.actionButtonIcon}>📥</Text>
              <Text style={styles.actionButtonText}>Restore</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formContainer}>
            <Input 
              placeholder="Date (YYYY-MM-DD)" 
              value={date} 
              onChangeText={setDate}
              style={styles.input}
              placeholderTextColor="#999"
            />
            
            <Input 
              placeholder="Description" 
              value={description} 
              onChangeText={setDescription}
              style={styles.input}
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>Type</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowTypePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {type === 'expense' ? 'Expense' : 'Income'}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={styles.pickerButtonText}>{category}</Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
            
            <Input 
              placeholder="Amount" 
              value={amount} 
              onChangeText={setAmount} 
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#999"
            />
            
            <Button 
              title="Add Transaction" 
              onPress={handleAddTransaction}
              style={styles.button}
            />
          </View>

          <View style={styles.transactionsContainer}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.transactionsTitle}>Recent Transactions</Text>
              <Text style={styles.transactionsCount}>({transactions.length})</Text>
            </View>
            {transactions.length === 0 ? (
              <Text style={styles.noTransactions}>No transactions yet</Text>
            ) : (
              <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={[
                    styles.transactionItem,
                    item.type === 'income' ? styles.incomeItem : styles.expenseItem
                  ]}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.transactionDate}>{item.date}</Text>
                      <Text style={[
                        styles.transactionAmount,
                        item.type === 'income' ? styles.income : styles.expense
                      ]}>
                        ${parseFloat(item.amount).toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.transactionDescription}>{item.description}</Text>
                    <View style={styles.transactionFooter}>
                      <Text style={styles.transactionCategory}>{item.category}</Text>
                      <Text style={[
                        styles.transactionType,
                        item.type === 'income' ? styles.incomeText : styles.expenseText
                      ]}>
                        {item.type}
                      </Text>
                    </View>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </View>

          {renderTypePicker()}
          {renderCategoryPicker()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  // New Action Buttons Styles
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  button: {
    marginTop: 10,
  },
  transactionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionsCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noTransactions: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  transactionItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  incomeItem: {
    borderLeftColor: '#34C759',
  },
  expenseItem: {
    borderLeftColor: '#FF3B30',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  income: {
    color: '#34C759',
  },
  expense: {
    color: '#FF3B30',
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  transactionType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  incomeText: {
    color: '#34C759',
  },
  expenseText: {
    color: '#FF3B30',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalCancel: {
    padding: 15,
    marginTop: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

export default HomeScreen;