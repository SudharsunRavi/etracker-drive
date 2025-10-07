import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { getTransactions } from '../database/db';
import { useRouter, useFocusEffect } from 'expo-router';

const Charts = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions for charts:', error);
      Alert.alert('Error', 'Failed to load transactions');
    }
  }, []);

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

  const getExpenseData = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    console.log('Expenses for Pie Chart:', expenses);
    const categoryTotals = {};

    expenses.forEach(transaction => {
      const category = transaction.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + (transaction.amount || 0);
    });

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      amount: amount,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const getIncomeData = () => {
    const incomes = transactions.filter(t => t.type === 'income');
    const categoryTotals = {};

    incomes.forEach(transaction => {
      const category = transaction.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + (transaction.amount || 0);
    });

    const colors = [
      '#34C759', '#5856D6', '#AF52DE', '#007AFF', '#FF9500',
      '#FF2D70', '#32D74B', '#0A84FF', '#5E5CE6', '#30B0C7'
    ];

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      amount: amount,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const getBarChartData = () => {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthYear].income += transaction.amount || 0;
      } else {
        monthlyData[monthYear].expense += transaction.amount || 0;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);

    return {
      labels: last6Months.map(month => {
        const [year, monthNum] = month.split('-');
        return `${monthNum}/${year.slice(2)}`;
      }),
      datasets: [
        {
          data: last6Months.map(month => monthlyData[month].income),
          color: () => '#34C759', 
        },
        {
          data: last6Months.map(month => monthlyData[month].expense),
          color: () => '#FF3B30',
        },
      ],
    };
  };

  const expenseData = getExpenseData();
  const incomeData = getIncomeData();
  const barChartData = getBarChartData();

  const screenWidth = Dimensions.get('window').width - 40;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Financial Charts</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.incomeSummary]}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryAmount, styles.positive]}>
              ₹{totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseSummary]}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryAmount, styles.negative]}>
              ₹{totalExpense.toFixed(2)}
            </Text>
          </View>
        </View>

        {incomeData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Income Distribution</Text>
            <PieChart
              data={incomeData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {expenseData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Expense Distribution</Text>
            <PieChart
              data={expenseData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {transactions.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No transactions data available</Text>
            <Text style={styles.noDataSubtext}>Add some transactions to see charts</Text>
          </View>
        )}

        {transactions.length > 0 && expenseData.length === 0 && incomeData.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No income or expense data available</Text>
            <Text style={styles.noDataSubtext}>Add income or expense transactions to see charts</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
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
  incomeSummary: {
    backgroundColor: '#f0f9f0',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  expenseSummary: {
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  chartContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  chart: {
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default Charts;