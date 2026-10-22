import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextInput, Text } from 'react-native';
import BankAccountForm from '../BankAccountForm';
import { saveAccount } from '../../services/bankData';
import { darkTheme } from '../../constants/themes';

jest.mock('../../services/bankData', () => ({
  saveAccount: jest.fn(() => Promise.resolve({ id: 'new-1' })),
}));

const COLORS = darkTheme.colors || darkTheme;

/** Escribe en el input que tiene ese placeholder. */
function typeInto(renderer, placeholder, value) {
  const input = renderer.root.findAllByType(TextInput).find((n) => n.props.placeholder === placeholder);
  if (!input) throw new Error(`No se encontró el input con placeholder "${placeholder}"`);
  act(() => {
    input.props.onChangeText(value);
  });
}

function pressText(renderer, label) {
  const target = renderer.root
    .findAllByType(Text)
    .find((n) => [].concat(n.props.children).join('') === label);
  if (!target) throw new Error(`No se encontró el texto "${label}"`);
  let node = target.parent;
  while (node && !node.props.onPress) node = node.parent;
  if (!node) throw new Error(`El texto "${label}" no está dentro de un TouchableOpacity`);
  act(() => {
    node.props.onPress();
  });
}

async function fillValidPerson(renderer) {
  typeInto(renderer, 'Ej: 12345678', '12345678');
  typeInto(renderer, 'Nombre completo', 'Luis Romero');
}

describe('BankAccountForm', () => {
  beforeEach(() => {
    saveAccount.mockClear();
  });

  it('does not save and shows the general error when the phone is invalid', async () => {
    let renderer;
    await act(async () => {
      renderer = TestRenderer.create(<BankAccountForm visible onClose={jest.fn()} colors={COLORS} />);
    });

    await fillValidPerson(renderer);
    typeInto(renderer, '0412-1234567', '0414ABC4567');

    await act(async () => {
      pressText(renderer, 'Guardar');
    });

    expect(saveAccount).not.toHaveBeenCalled();
    const texts = renderer.root.findAllByType(Text).map((n) => [].concat(n.props.children).join(''));
    expect(texts).toContain('Agrega al menos un método de pago');
  });

  it('explains why the phone is rejected instead of only showing the general error', async () => {
    let renderer;
    await act(async () => {
      renderer = TestRenderer.create(<BankAccountForm visible onClose={jest.fn()} colors={COLORS} />);
    });

    await fillValidPerson(renderer);
    typeInto(renderer, '0412-1234567', '0414ABC4567');

    await act(async () => {
      pressText(renderer, 'Guardar');
    });

    const texts = renderer.root.findAllByType(Text).map((n) => [].concat(n.props.children).join(''));
    expect(texts).toContain('Solo números');
  });

  it('rejects a malformed PayPal email and tells the user the email is wrong', async () => {
    let renderer;
    await act(async () => {
      renderer = TestRenderer.create(<BankAccountForm visible onClose={jest.fn()} colors={COLORS} />);
    });

    await fillValidPerson(renderer);
    await act(async () => {
      pressText(renderer, 'Digital');
    });
    typeInto(renderer, 'correo@paypal.com', 'luis@correo');

    await act(async () => {
      pressText(renderer, 'Guardar');
    });

    expect(saveAccount).not.toHaveBeenCalled();
    const texts = renderer.root.findAllByType(Text).map((n) => [].concat(n.props.children).join(''));
    expect(texts).toContain('Correo inválido');
  });

  it('saves the account with the form data and closes the sheet', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    let renderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BankAccountForm visible onClose={onClose} onSave={onSave} colors={COLORS} />
      );
    });

    await fillValidPerson(renderer);
    typeInto(renderer, '0412-1234567', '04141234567');

    await act(async () => {
      pressText(renderer, 'Guardar');
    });

    expect(saveAccount).toHaveBeenCalledTimes(1);
    expect(saveAccount.mock.calls[0][0]).toMatchObject({
      numeroDocumento: '12345678',
      titular: 'Luis Romero',
      telefono: '04141234567',
    });
    expect(onSave).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the reason a document number is rejected', async () => {
    let renderer;
    await act(async () => {
      renderer = TestRenderer.create(<BankAccountForm visible onClose={jest.fn()} colors={COLORS} />);
    });

    typeInto(renderer, 'Ej: 12345678', 'V12345678');
    typeInto(renderer, 'Nombre completo', 'Luis Romero');
    typeInto(renderer, '0412-1234567', '04141234567');

    await act(async () => {
      pressText(renderer, 'Guardar');
    });

    expect(saveAccount).not.toHaveBeenCalled();
    const texts = renderer.root.findAllByType(Text).map((n) => [].concat(n.props.children).join(''));
    expect(texts).toContain('Cédula inválida (6 a 9 dígitos, sin letras)');
  });

  it('shows the reason an account number is rejected', async () => {
    let renderer;
    await act(async () => {
      renderer = TestRenderer.create(<BankAccountForm visible onClose={jest.fn()} colors={COLORS} />);
    });

    await fillValidPerson(renderer);
    typeInto(renderer, '0134-12-1234567890', 'ABC-123456');

    await act(async () => {
      pressText(renderer, 'Guardar');
    });

    expect(saveAccount).not.toHaveBeenCalled();
    const texts = renderer.root.findAllByType(Text).map((n) => [].concat(n.props.children).join(''));
    expect(texts).toContain('Solo números');
  });

  it('keeps the account id when editing an existing account', async () => {
    const account = {
      id: 'acc-9',
      tipoDocumento: 'V',
      numeroDocumento: '12345678',
      titular: 'Luis Romero',
      banco: '0134',
      telefono: '04141234567',
    };
    let renderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BankAccountForm visible onClose={jest.fn()} account={account} colors={COLORS} />
      );
    });

    await act(async () => {
      pressText(renderer, 'Guardar');
    });

    expect(saveAccount).toHaveBeenCalledTimes(1);
    expect(saveAccount.mock.calls[0][0].id).toBe('acc-9');
  });
});
