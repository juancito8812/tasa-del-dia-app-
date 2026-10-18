import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

function PayPalCalculatorHeader({ styles, C }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <Ionicons name="logo-paypal" size={18} color={C.highlight} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Calculadora PayPal</Text>
          <Text style={styles.headerSubtitle}>Comisiones oficiales Venezuela</Text>
        </View>
      </View>
    </View>
  );
}

export default PayPalCalculatorHeader;
