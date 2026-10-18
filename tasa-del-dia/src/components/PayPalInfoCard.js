import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

function PayPalInfoCard({ styles, C }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name="information-circle" size={16} color={C.textMuted} />
      <Text style={styles.infoText}>
        Tarifas oficiales PayPal Venezuela: 5.4% + $0.30 USD. Las tasas de cambio son las que muestra la app en tiempo real.
      </Text>
    </View>
  );
}

export default PayPalInfoCard;
