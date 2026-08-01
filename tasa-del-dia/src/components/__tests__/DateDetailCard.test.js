import React from 'react';
import TestRenderer from 'react-test-renderer';
import DateDetailCard from '../DateDetailCard';

const C = {
  cardBg: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.08)',
  success: '#00b894',
  highlight: '#e94560',
  warning: '#f39c12',
  info: '#4fc3f7',
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  textMuted: '#636e82',
  inputBg: 'rgba(255,255,255,0.04)',
  secondary: '#0f0f1e',
};

const mockData = {
  dateKey: '2026-06-21', bcv: 80.5, paralelo: 95.2,
  binance_p2p: 92.0, euro: 85.3, fetchedAt: '2026-06-21T12:00:00Z',
};

describe('DateDetailCard', () => {
  it('returns null when no data provided', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <DateDetailCard
          selectedData={null}
          C={C}
          copiedField={null}
          handleCopy={() => {}}
          handleCopyAll={() => {}}
          onClose={() => {}}
        />
      );
    });
    expect(renderer.toJSON()).toBeNull();
  });

  it('renders date and rates when data provided', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <DateDetailCard
          selectedData={mockData}
          C={C}
          copiedField={null}
          handleCopy={() => {}}
          handleCopyAll={() => {}}
          onClose={() => {}}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    // Date should appear in DD/MM/AAAA format
    const dateText = texts.find(t => t.props.children === '21/06/2026');
    expect(dateText).toBeTruthy();
  });

  it('shows day badge (Dom for Sunday)', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <DateDetailCard
          selectedData={mockData}
          C={C}
          copiedField={null}
          handleCopy={() => {}}
          handleCopyAll={() => {}}
          onClose={() => {}}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const dayText = texts.find(t => t.props.children === 'Dom');
    expect(dayText).toBeTruthy();
  });

  it('shows manual badge when data has manual flag', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <DateDetailCard
          selectedData={{ ...mockData, manual: true }}
          C={C}
          copiedField={null}
          handleCopy={() => {}}
          handleCopyAll={() => {}}
          onClose={() => {}}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const manualText = texts.find(t => t.props.children === 'Manual');
    expect(manualText).toBeTruthy();
  });

  it('renders copy button for each rate', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <DateDetailCard
          selectedData={mockData}
          C={C}
          copiedField={null}
          handleCopy={() => {}}
          handleCopyAll={() => {}}
          onClose={() => {}}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    // Should have "Copiar" text for each rate
    const copyTexts = texts.filter(t => t.props.children === 'Copiar');
    expect(copyTexts.length).toBeGreaterThanOrEqual(3);
  });

  it('copies only the number (sin prefijo Bs.) al pulsar Copiar', () => {
    let copiedText = null;
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <DateDetailCard
          selectedData={mockData}
          C={C}
          copiedField={null}
          handleCopy={(text) => { copiedText = text; }}
          handleCopyAll={() => {}}
          onClose={() => {}}
        />
      );
    });
    const root = renderer.root;
    // Simulate pressing the first rate's "Copiar" button (BCV)
    const copyButtons = root.findAllByProps({ children: 'Copiar' });
    expect(copyButtons.length).toBeGreaterThanOrEqual(1);
    // Find the nearest ancestor with an onPress handler (the TouchableOpacity)
    const copyTextEl = copyButtons[0];
    let touchable = copyTextEl;
    while (touchable && typeof touchable.props.onPress !== 'function') {
      touchable = touchable.parent;
    }
    expect(touchable).toBeTruthy();
    TestRenderer.act(() => { touchable.props.onPress(); });
    expect(copiedText).toBe('80,50');
    expect(copiedText.startsWith('Bs.')).toBe(false);
  });

  it('renders "Copiar todo" button', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <DateDetailCard
          selectedData={mockData}
          C={C}
          copiedField={null}
          handleCopy={() => {}}
          handleCopyAll={() => {}}
          onClose={() => {}}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const copyAllText = texts.find(t => t.props.children === 'Copiar todo');
    expect(copyAllText).toBeTruthy();
  });

  it('shows copied state for a field', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <DateDetailCard
          selectedData={mockData}
          C={C}
          copiedField="bcv"
          handleCopy={() => {}}
          handleCopyAll={() => {}}
          onClose={() => {}}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const copiedText = texts.find(t => t.props.children === 'Copiado');
    expect(copiedText).toBeTruthy();
  });
});
