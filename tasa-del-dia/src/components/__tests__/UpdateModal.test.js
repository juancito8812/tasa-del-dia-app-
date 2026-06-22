import React from 'react';
import TestRenderer from 'react-test-renderer';
import UpdateModal from '../UpdateModal';

jest.mock('../../services/autoUpdate', () => ({
  downloadAndInstall: jest.fn(),
  skipVersion: jest.fn(),
}));

const C = {
  secondary: '#0f0f1e',
  cardBorder: 'rgba(255,255,255,0.08)',
  textPrimary: '#ffffff',
  textSecondary: '#a0aec0',
  textMuted: '#636e82',
  info: '#4fc3f7',
  highlight: '#e94560',
  inputBg: 'rgba(255,255,255,0.04)',
};

describe('UpdateModal', () => {  function findTextContaining(texts, substr) {
    return texts.find(t => {
      const c = t.props.children;
      if (typeof c === 'string') return c.includes(substr);
      if (Array.isArray(c)) return c.some(item => typeof item === 'string' && item.includes(substr));
      return false;
    });
  }

  it('renders version info when visible', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <UpdateModal
          visible={true}
          onClose={() => {} }
          currentVersion="1.0.1"
          latestVersion="1.0.2"
          apkUrl="https://example.com/app.apk"
          notes="Bug fixes"
          C={C}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const currentText = findTextContaining(texts, '1.0.1');
    const latestText = findTextContaining(texts, '1.0.2');
    expect(currentText).toBeTruthy();
    expect(latestText).toBeTruthy();
  });

  it('shows update title', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <UpdateModal
          visible={true}
          onClose={() => {}}
          currentVersion="1.0.1"
          latestVersion="1.0.2"
          apkUrl=""
          notes=""
          C={C}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const titleText = texts.find(t => t.props.children === 'Actualización disponible');
    expect(titleText).toBeTruthy();
  });

  it('shows download button', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <UpdateModal
          visible={true}
          onClose={() => {}}
          currentVersion="1.0.1"
          latestVersion="1.0.2"
          apkUrl="https://example.com/app.apk"
          notes=""
          C={C}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const downloadBtn = texts.find(t => t.props.children === 'Descargar APK');
    expect(downloadBtn).toBeTruthy();
  });

  it('shows skip button', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <UpdateModal
          visible={true}
          onClose={() => {}}
          currentVersion="1.0.1"
          latestVersion="1.0.2"
          apkUrl=""
          notes=""
          C={C}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const skipBtn = texts.find(t => t.props.children === 'Saltar esta versión');
    expect(skipBtn).toBeTruthy();
  });

  it('shows release notes when provided', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <UpdateModal
          visible={true}
          onClose={() => {}}
          currentVersion="1.0.1"
          latestVersion="1.0.2"
          apkUrl=""
          notes="Bug fixes and improvements"
          C={C}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const notesText = texts.find(t => t.props.children === 'Bug fixes and improvements');
    expect(notesText).toBeTruthy();
  });

  it('shows "later" link', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <UpdateModal
          visible={true}
          onClose={() => {}}
          currentVersion="1.0.1"
          latestVersion="1.0.2"
          apkUrl=""
          notes=""
          C={C}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const laterText = texts.find(t => t.props.children === 'Más tarde');
    expect(laterText).toBeTruthy();
  });

  it('does not render when not visible', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <UpdateModal
          visible={false}
          onClose={() => {}}
          currentVersion="1.0.1"
          latestVersion="1.0.2"
          apkUrl=""
          notes=""
          C={C}
        />
      );
    });
    expect(renderer.toJSON()).toBeNull();
  });
});
