import * as Haptics from 'expo-haptics';
import { hapticLight, hapticMedium, hapticSuccess, hapticSelection } from '../haptics';

describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hapticLight calls impactAsync with Light style', () => {
    hapticLight();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('hapticMedium calls impactAsync with Medium style', () => {
    hapticMedium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('hapticSuccess calls notificationAsync with Success', () => {
    hapticSuccess();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  it('hapticSelection calls selectionAsync', () => {
    hapticSelection();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });
});
