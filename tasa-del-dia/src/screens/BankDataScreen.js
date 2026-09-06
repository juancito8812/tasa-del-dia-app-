import React, { useState, useCallback, useEffect, useMemo } from 'react';
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

  const styles = useMemo(() => createStyles(C), [C]);

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
      <View style={styles.emptyIconContainer}>
        <Ionicons name="wallet-outline" size={48} color={C.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Sin cuentas guardadas</Text>
      <Text style={styles.emptySubtitle}>
        Agrega tus datos bancarios para{'\n'}compartirlos fácilmente
      </Text>
    </View>
  ), [C, styles]);

  const renderItem = useCallback(({ item }) => (
    <BankAccountCard
      account={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      colors={C}
    />
  ), [C, handleEdit, handleDelete]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={18} color={C.highlight} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Datos Bancarios</Text>
            <Text style={styles.headerSubtitle}>
              {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
            </Text>
          </View>
        </View>
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
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity onPress={handleAdd} style={styles.fab} activeOpacity={0.8}>
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

const createStyles = (C) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.highlight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 12,
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: C.glassCard,
    borderWidth: 1,
    borderColor: C.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textMuted,
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
    backgroundColor: C.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: C.highlight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
});
