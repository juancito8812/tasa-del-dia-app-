import { getSeverityKey } from '../formatting';

describe('getSeverityKey (umbrales de brecha)', () => {
  it('marca >15% como highlight', () => {
    expect(getSeverityKey(15.1)).toBe('highlight');
    expect(getSeverityKey(40)).toBe('highlight');
  });

  it('marca 8–15% como warning', () => {
    expect(getSeverityKey(8.1)).toBe('warning');
    expect(getSeverityKey(15)).toBe('warning');
  });

  it('marca ≤8% como success', () => {
    expect(getSeverityKey(8)).toBe('success');
    expect(getSeverityKey(0)).toBe('success');
    expect(getSeverityKey(-3)).toBe('success');
  });
});
