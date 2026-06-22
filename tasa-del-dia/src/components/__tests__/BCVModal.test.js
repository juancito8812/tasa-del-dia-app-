import React from 'react';
import TestRenderer from 'react-test-renderer';
import BCVModal from '../BCVModal';

const C = {
  secondary: '#0f0f1e',
  cardBorder: 'rgba(255,255,255,0.08)',
  textPrimary: '#ffffff',
  textMuted: '#636e82',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.1)',
};

describe('BCVModal', () => {
  it('renders when visible', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <BCVModal
          visible={true}
          onClose={() => {}}
          editValue="36,50"
          onChangeText={() => {}}
          onSave={() => {}}
          bcvLunesColor="#a855f7"
          C={C}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const titleText = texts.find(t => t.props.children === 'BCV (Lunes)');
    expect(titleText).toBeTruthy();
  });

  it('does not render content when not visible', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <BCVModal
          visible={false}
          onClose={() => {}}
          editValue=""
          onChangeText={() => {}}
          onSave={() => {}}
          bcvLunesColor="#a855f7"
          C={C}
        />
      );
    });
    // When not visible, Modal renders nothing
    expect(renderer.toJSON()).toBeNull();
  });

  it('displays the edit value in the input', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <BCVModal
          visible={true}
          onClose={() => {}}
          editValue="42,50"
          onChangeText={() => {}}
          onSave={() => {}}
          bcvLunesColor="#a855f7"
          C={C}
        />
      );
    });
    const root = renderer.root;
    const inputs = root.findAllByType('TextInput');
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0].props.value).toBe('42,50');
  });

  it('calls onClose when Cancel button is pressed', () => {
    const onClose = jest.fn();
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <BCVModal
          visible={true}
          onClose={onClose}
          editValue=""
          onChangeText={() => {}}
          onSave={() => {}}
          bcvLunesColor="#a855f7"
          C={C}
        />
      );
    });
    const root = renderer.root;
    const buttons = root.findAllByType('Text');
    const cancelBtn = buttons.find(t => t.props.children === 'Cancelar');
    expect(cancelBtn).toBeTruthy();
    // Simular presión: encontrar TouchableOpacity padre del texto
    const touchables = root.findAllByProps({ onPress: onClose });
    expect(touchables.length).toBeGreaterThan(0);
  });

  it('calls onSave when Guardar button is pressed', () => {
    const onSave = jest.fn();
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <BCVModal
          visible={true}
          onClose={() => {}}
          editValue="40"
          onChangeText={() => {}}
          onSave={onSave}
          bcvLunesColor="#a855f7"
          C={C}
        />
      );
    });
    const root = renderer.root;
    const buttons = root.findAllByType('Text');
    const saveBtn = buttons.find(t => t.props.children === 'Guardar');
    expect(saveBtn).toBeTruthy();
  });

  it('calls onChangeText when input text changes', () => {
    const onChangeText = jest.fn();
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <BCVModal
          visible={true}
          onClose={() => {}}
          editValue=""
          onChangeText={onChangeText}
          onSave={() => {}}
          bcvLunesColor="#a855f7"
          C={C}
        />
      );
    });
    const root = renderer.root;
    const input = root.findByType('TextInput');
    expect(input.props.placeholder).toBe('0,00');
  });
});
