import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Share, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import BankAccountCard from '../BankAccountCard';

const C = {
  card: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.1)',
  highlight: '#e94560',
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  danger: '#e53e3e',
};

const mockPagoMovil = {
  id: 'acc1',
  titular: 'Luis Romero',
  tipoDocumento: 'V',
  numeroDocumento: '5624208',
  banco: '0105',
  telefono: '04143451767',
  tipoCuenta: 'ahorro',
};

const findTexts = (root, value) =>
  root.findAll((node) => node.type === Text && node.props.children === value);

// El árbol de test incluye nodos internos de RN (contenedores de TouchableOpacity);
// sube hasta el ancestro que maneja el press.
const pressableAncestor = (node) => {
  let cur = node.parent;
  while (cur && typeof cur.props.onPress !== 'function') cur = cur.parent;
  return cur;
};

describe('BankAccountCard', () => {
  let shareSpy;

  beforeEach(() => {
    shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    Clipboard.setStringAsync.mockClear();
  });

  const renderCard = (account) => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <BankAccountCard account={account} onEdit={() => {}} onDelete={() => {}} colors={C} />
      );
    });
    return renderer;
  };

  it('renders Pago Móvil section with Enviar button', () => {
    const renderer = renderCard(mockPagoMovil);

    expect(findTexts(renderer.root, 'Pago Móvil')).toHaveLength(1);
    expect(findTexts(renderer.root, 'Enviar')).toHaveLength(1);
  });

  it('shares compact pago móvil text when Enviar is pressed', async () => {
    const renderer = renderCard(mockPagoMovil);

    const enviar = findTexts(renderer.root, 'Enviar')[0];
    await TestRenderer.act(async () => {
      await pressableAncestor(enviar).props.onPress();
    });

    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledWith({
      message: '5624208\n04143451767\nMercantil',
    });
  });

  it('copies compact pago móvil text with the section copy button', async () => {
    const renderer = renderCard(mockPagoMovil);

    // El primer icono "copy" en orden de documento es el de la sección Pago Móvil
    const copyIcon = renderer.root.findAllByProps({ name: 'copy' })[0];
    await TestRenderer.act(async () => {
      await pressableAncestor(copyIcon).props.onPress();
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('5624208\n04143451767\nMercantil');
  });

  it('does not render Enviar for accounts without pago móvil', () => {
    const renderer = renderCard({ ...mockPagoMovil, telefono: '' });

    expect(findTexts(renderer.root, 'Enviar')).toHaveLength(0);
  });
});
