import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BANKS } from '../../constants/banks';

/**
 * Campo de búsqueda/selección de banco (reutilizado por Pago Móvil y Transferencia).
 */
function BankSearchField({ C, styles, selectedCode, search, onSearchChange, onSelect }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return BANKS;
    return BANKS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.code.includes(q),
    );
  }, [search]);

  const selectedName = BANKS.find((b) => b.code === selectedCode)?.name || selectedCode;

  return (
    <>
      <Text style={[styles.label, { color: C.textSecondary }]}>Banco</Text>
      <View style={[styles.searchRow, { backgroundColor: C.inputBg, borderColor: selectedCode && !search ? C.highlight : C.inputBorder }]}>
        <Ionicons name="search" size={16} color={C.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: C.textPrimary }]}
          value={search}
          onChangeText={onSearchChange}
          placeholder={selectedCode ? `${selectedName} — tocar para cambiar` : 'Buscar banco...'}
          placeholderTextColor={selectedCode ? C.highlight : C.textMuted}
          autoCorrect={false}
        />
        {(search.length > 0 || selectedCode) && (
          <TouchableOpacity onPress={() => { onSearchChange(''); onSelect(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {search.length > 0 && filtered.length > 0 && (
        <View style={[styles.bankResults, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
          {filtered.slice(0, 3).map((bank) => (
            <TouchableOpacity
              key={bank.code}
              onPress={() => { onSelect(bank.code); onSearchChange(''); }}
              style={[styles.bankResultItem]}
              activeOpacity={0.7}
            >
              <Text style={[styles.bankResultName, { color: C.textPrimary }]}>{bank.name}</Text>
              <Text style={[styles.bankResultCode, { color: C.textMuted }]}>{bank.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {search.length > 0 && filtered.length === 0 && (
        <Text style={[styles.bankNoResults, { color: C.textMuted }]}>No se encontraron bancos</Text>
      )}
    </>
  );
}

export default BankSearchField;
