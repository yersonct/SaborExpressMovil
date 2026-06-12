import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const CashierCalculator = () => {
  const [currentNumber, setCurrentNumber] = useState('0');
  const [previousNumber, setPreviousNumber] = useState('');
  const [operator, setOperator] = useState<string | null>(null);

  const handleInput = (buttonPressed: string) => {
    if (currentNumber === '0' || currentNumber === 'Error') {
      setCurrentNumber(buttonPressed);
      return;
    }
    setCurrentNumber(currentNumber + buttonPressed);
  };

  const handleOperator = (operatorPressed: string) => {
    setOperator(operatorPressed);
    setPreviousNumber(currentNumber);
    setCurrentNumber('0');
  };

  const handleClear = () => {
    setCurrentNumber('0');
    setPreviousNumber('');
    setOperator(null);
  };

  const handleCalculate = () => {
    if (!operator || !previousNumber) return;

    const current = parseFloat(currentNumber);
    const previous = parseFloat(previousNumber);
    let result = 0;

    switch (operator) {
      case '+':
        result = previous + current;
        break;
      case '-':
        result = previous - current;
        break;
      case '*':
        result = previous * current;
        break;
      case '/':
        if (current === 0) {
          setCurrentNumber('Error');
          setPreviousNumber('');
          setOperator(null);
          return;
        }
        result = previous / current;
        break;
    }

    setCurrentNumber(result.toString());
    setPreviousNumber('');
    setOperator(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Caja - saborExpress</Text>
        <Text style={styles.subtitle}>Calculadora de Pagos y Vueltos</Text>
      </View>

      <View style={styles.resultContainer}>
        <Text style={styles.historyText}>
          {previousNumber} {operator}
        </Text>
        <Text style={styles.resultText}>{currentNumber}</Text>
      </View>

      <View style={styles.keypad}>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
            <Text style={styles.buttonTextClear}>C</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.operatorButton]} onPress={() => handleOperator('/')}>
            <Text style={styles.buttonTextOperator}>÷</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('7')}>
            <Text style={styles.buttonText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('8')}>
            <Text style={styles.buttonText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('9')}>
            <Text style={styles.buttonText}>9</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.operatorButton]} onPress={() => handleOperator('*')}>
            <Text style={styles.buttonTextOperator}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('4')}>
            <Text style={styles.buttonText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('5')}>
            <Text style={styles.buttonText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('6')}>
            <Text style={styles.buttonText}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.operatorButton]} onPress={() => handleOperator('-')}>
            <Text style={styles.buttonTextOperator}>-</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('1')}>
            <Text style={styles.buttonText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('2')}>
            <Text style={styles.buttonText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('3')}>
            <Text style={styles.buttonText}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.operatorButton]} onPress={() => handleOperator('+')}>
            <Text style={styles.buttonTextOperator}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={[styles.button, styles.zeroButton]} onPress={() => handleInput('0')}>
            <Text style={styles.buttonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleInput('.')}>
            <Text style={styles.buttonText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.equalButton]} onPress={handleCalculate}>
            <Text style={styles.buttonTextEqual}>=</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    height: 120,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  historyText: {
    fontSize: 20,
    color: '#A0A0A0',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  keypad: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FFFFFF',
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  zeroButton: {
    width: 165,
    alignItems: 'flex-start',
    paddingLeft: 30,
  },
  operatorButton: {
    backgroundColor: '#FFF0EE',
  },
  clearButton: {
    width: 255,
    backgroundColor: '#E8E8E8',
    alignItems: 'flex-start',
    paddingLeft: 30,
  },
  equalButton: {
    backgroundColor: '#FF6F61',
  },
  buttonText: {
    fontSize: 28,
    color: '#1A1A1A',
  },
  buttonTextOperator: {
    fontSize: 32,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  buttonTextClear: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
  },
  buttonTextEqual: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});