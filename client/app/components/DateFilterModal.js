import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const DateFilterModal = ({ visible, onClose, onSelect }) => {
  const [customFrom, setCustomFrom] = useState(new Date());
  const [customTo, setCustomTo] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const predefinedOptions = [
    { label: "This Month", value: "this_month" },
    { label: "Last Month", value: "last_month" },
    { label: "Last 3 Months", value: "last_3_months" },
    { label: "Last 6 Months", value: "last_6_months" },
    { label: "Past 1 Year", value: "past_1_year" },
    { label: "Custom", value: "custom" },
  ];

  const handleSelectPredefined = (value) => {
    if (value !== "custom") {
      onSelect({ type: value });
      onClose();
    }
  };

  const handleApplyCustom = () => {
    if (customFrom > customTo) {
      alert("Start date cannot be after end date");
      return;
    }
    onSelect({ type: "custom", from: customFrom, to: customTo });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter by Date</Text>

          {predefinedOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.modalOption}
              onPress={() => handleSelectPredefined(option.value)}
            >
              <Text style={styles.modalOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}

          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowFromPicker(true)}
            >
              <Text>From: {customFrom.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowToPicker(true)}
            >
              <Text>To: {customTo.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>

          {(showFromPicker || showToPicker) && (
            <DateTimePicker
              value={showFromPicker ? customFrom : customTo}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (showFromPicker) {
                  setShowFromPicker(false);
                  if (selectedDate) setCustomFrom(selectedDate);
                }
                if (showToPicker) {
                  setShowToPicker(false);
                  if (selectedDate) setCustomTo(selectedDate);
                }
              }}
            />
          )}

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyCustom}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DateFilterModal;

const styles = StyleSheet.create({
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
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  modalOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalOptionText: { fontSize: 16 },
  datePickerButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 5,
  },
  applyButton: {
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  applyButtonText: { color: "#fff", fontWeight: "600" },
  cancelButton: {
    padding: 12,
    backgroundColor: "#6c757d",
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  cancelButtonText: { color: "#fff", fontWeight: "600" },
});
