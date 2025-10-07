import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const Button = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default Button;
