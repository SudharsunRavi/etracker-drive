import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Input from "../components/Input";
import Button from "../components/Button";
import { addTransaction, getCategories } from "../database/db";
import { useRouter } from "expo-router";
import dayjs from "dayjs";

const AddTransactionScreen = () => {
  const router = useRouter();

  const [type, setType] = useState("expense");
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories(type);
      setCategories(data);
      if (data.length > 0) setCategory(data[0].name);
    };
    loadCategories();
  }, [type]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(dayjs(selectedDate).format("YYYY-MM-DD"));
    setShowDatePicker(false);
  };

  const handleAddTransaction = async () => {
    if (!amount || !description) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      await addTransaction(
        parseFloat(amount),
        type,
        category,
        description,
        date
      );
      Alert.alert("Success", "Transaction added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add transaction");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.label}>Type</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.pickerButtonText}>{category}</Text>
          </TouchableOpacity>

          <Modal visible={showTypePicker} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Type</Text>
                <ScrollView>
                  {["expense", "income"].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.modalOption,
                        type === t && styles.selectedOption,
                      ]}
                      onPress={() => {
                        setType(t);
                        setShowTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          type === t && styles.selectedOptionText,
                        ]}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
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

          <Modal visible={showCategoryPicker} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <ScrollView>
                  {categories.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.modalOption,
                        category === item.name && styles.selectedOption,
                      ]}
                      onPress={() => {
                        setCategory(item.name);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          category === item.name && styles.selectedOptionText,
                        ]}
                      >
                        {item.name}
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

          <Text style={styles.label}>Amount</Text>
          <Input
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <Input
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />

          <Text style={styles.label}>Date</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.input}
          >
            <Text style={date ? styles.inputText : styles.placeholder}>
              {date}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={dayjs(date, "YYYY-MM-DD").toDate()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <View style={styles.tabsContainer}>
            {["Yesterday", "Today", "Tomorrow"].map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.tabButton}
                onPress={() => {
                  const newDate = dayjs()
                    .add(
                      d === "Yesterday" ? -1 : d === "Tomorrow" ? 1 : 0,
                      "day"
                    )
                    .format("YYYY-MM-DD");
                  setDate(newDate);
                }}
              >
                <Text style={styles.tabButtonText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Add Transaction"
            onPress={handleAddTransaction}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1 },
  input: {
    marginBottom: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    justifyContent: "center",
  },
  inputText: { fontSize: 16, color: "#000" },
  placeholder: { fontSize: 16, color: "#aaa" },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  pickerButtonText: { fontSize: 16 },
  button: { marginTop: 10 },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  tabButtonText: { fontSize: 14, fontWeight: "600" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedOption: { backgroundColor: "#007AFF" },
  modalOptionText: { fontSize: 16, color: "#333", textAlign: "center" },
  selectedOptionText: { color: "#fff", fontWeight: "600" },
  modalCancel: {
    padding: 15,
    marginTop: 28,
    backgroundColor: "#fc4545ff",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: { color: "#fff", fontWeight: "600" },
});

export default AddTransactionScreen;
