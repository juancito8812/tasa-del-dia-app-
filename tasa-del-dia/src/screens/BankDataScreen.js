import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { getAccounts, deleteAccount } from '../services/bankData';
import BankAccountCard from '../components/BankAccountCard';
import BankAccountForm from '../components/BankAccountForm';

function BankDataScreen() {
  const { colors: C } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const data = await getAccounts();
    setAccounts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAdd = useCallback(() => {
    setEditingAccount(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((account) => {
    setEditingAccount(account);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    await deleteAccount(id);
    await loadAccounts();
  }, [loadAccounts]);

  const handleSave = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet" size={64} color={C.textMuted} />
      <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>Sin cuentas guardadas</Text>
      <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
        Agrega tus datos bancarios para compartirlos fácilmente
      </Text>
    </View>
  ), [C]);

  const renderItem = useCallback(({ item }) => (
    <BankAccountCard
      account={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      colors={C}
    />
  ), [C, handleEdit, handleDelete]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Datos Bancarios</Text>
        <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>
          {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.highlight} />
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={accounts.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* FAB */}
      <TouchableOpacity onPress={handleAdd} style={[styles.fab, { backgroundColor: C.highlight }]} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Form Modal */}
      <BankAccountForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        account={editingAccount}
        colors={C}
      />
    </View>
  );
}

export default BankDataScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
