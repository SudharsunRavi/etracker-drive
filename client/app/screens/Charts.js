import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart } from "react-native-chart-kit";
import { getTransactions } from "../database/db";
import { useRouter, useFocusEffect } from "expo-router";
import DateFilterModal from "../components/DateFilterModal";

const Charts = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState({ type: "this_month" });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      let filteredData = data;

      if (dateFilter && dateFilter.type) {
        const now = new Date();
        let from, to;

        switch (dateFilter.type) {
          case "this_month":
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            to = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            );
            break;
          case "last_month":
            from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            to = new Date(
              now.getFullYear(),
              now.getMonth(),
              0,
              23,
              59,
              59,
              999
            );
            break;
          case "last_3_months":
            from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            to = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            );
            break;
          case "last_6_months":
            from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            to = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            );
            break;
          case "past_1_year":
            from = new Date(
              now.getFullYear() - 1,
              now.getMonth(),
              now.getDate()
            );
            to = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            );
            break;
          case "custom":
            from = new Date(dateFilter.from);
            to = new Date(dateFilter.to);
            to.setHours(23, 59, 59, 999);
            break;
          default:
            from = new Date(0);
            to = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            );
        }

        filteredData = filteredData.filter((t) => {
          if (!t.date) return false;
          const txDate = new Date(t.date);
          const txDateStart = new Date(
            txDate.getFullYear(),
            txDate.getMonth(),
            txDate.getDate()
          );
          return txDateStart >= from && txDateStart <= to;
        });
      }

      setTransactions(filteredData);
    } catch (error) {
      console.error("Error loading transactions for charts:", error);
      Alert.alert("Error", "Failed to load transactions");
    }
  }, [dateFilter]);

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

  const clearDateFilter = () => {
    setDateFilter({ type: "this_month" });
  };

  const getDateFilterText = () => {
    if (!dateFilter) return "All Dates";

    switch (dateFilter.type) {
      case "this_month":
        return "This Month";
      case "last_month":
        return "Last Month";
      case "last_3_months":
        return "Last 3 Months";
      case "last_6_months":
        return "Last 6 Months";
      case "past_1_year":
        return "Past 1 Year";
      case "custom":
        const from = new Date(dateFilter.from).toLocaleDateString();
        const to = new Date(dateFilter.to).toLocaleDateString();
        return `${from} - ${to}`;
      default:
        return "All Dates";
    }
  };

  const getExpenseData = () => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const categoryTotals = {};

    expenses.forEach((transaction) => {
      const category = transaction.category || "Other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + (transaction.amount || 0);
    });

    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#8AC926",
      "#1982C4",
      "#6A4C93",
      "#FF595E",
    ];

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: `${category} - ₹${amount.toFixed(0)}`,
      population: amount,
      color: colors[index % colors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    }));
  };

  const getIncomeData = () => {
    const incomes = transactions.filter((t) => t.type === "income");
    const categoryTotals = {};

    incomes.forEach((transaction) => {
      const category = transaction.category || "Other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + (transaction.amount || 0);
    });

    const colors = [
      "#34C759",
      "#5856D6",
      "#AF52DE",
      "#007AFF",
      "#FF9500",
      "#FF2D70",
      "#32D74B",
      "#0A84FF",
      "#5E5CE6",
      "#30B0C7",
    ];

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: `${category} - ₹${amount.toFixed(0)}`,
      population: amount,
      color: colors[index % colors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    }));
  };

  const expenseData = getExpenseData();
  const incomeData = getIncomeData();
  const screenWidth = Dimensions.get("window").width - 40;

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const CustomLegend = ({ data }) => {
    return (
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>{item.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
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

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              dateFilter && styles.activeFilterButton,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={[
                styles.filterButtonText,
                dateFilter && styles.activeFilterButtonText,
              ]}
            >
              {getDateFilterText()}
            </Text>
          </TouchableOpacity>

          {dateFilter && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={clearDateFilter}
            >
              <Text style={styles.clearFilterButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {incomeData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Income Distribution</Text>
            <PieChart
              data={incomeData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="80"
              hasLegend={false}
            />
            <CustomLegend data={incomeData} />
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
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="80"
              hasLegend={false}
            />
            <CustomLegend data={expenseData} />
          </View>
        )}

        {transactions.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No transactions data available
            </Text>
            <Text style={styles.noDataSubtext}>
              Add some transactions to see charts
            </Text>
          </View>
        )}

        {transactions.length > 0 &&
          expenseData.length === 0 &&
          incomeData.length === 0 && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                No income or expense data available
              </Text>
              <Text style={styles.noDataSubtext}>
                Add income or expense transactions to see charts
              </Text>
            </View>
          )}

        <DateFilterModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={(filter) => setDateFilter(filter)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 60,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  activeFilterButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: { fontSize: 16, color: "#333", fontWeight: "500" },
  activeFilterButtonText: { color: "#fff", fontWeight: "600" },
  clearFilterButton: {
    padding: 12,
    backgroundColor: "#6c757d",
    borderRadius: 8,
    alignItems: "center",
    minWidth: 80,
  },
  clearFilterButtonText: { color: "#fff", fontWeight: "500" },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  incomeSummary: {
    backgroundColor: "#f0f9f0",
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  expenseSummary: {
    backgroundColor: "#fef0f0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  positive: {
    color: "#34C759",
  },
  negative: {
    color: "#FF3B30",
  },
  chartContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
    paddingTop: 16,
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    margin: 5,
    maxWidth: "45%",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#7F7F7F",
    flexShrink: 1,
  },
});

export default Charts;
