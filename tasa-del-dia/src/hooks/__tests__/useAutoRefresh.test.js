import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import useAutoRefresh from '../useAutoRefresh';
import { API_CONFIG } from '../../constants';

const INTERVAL = API_CONFIG.REFRESH_INTERVAL;

function TestComp({ onRefresh }) {
  useAutoRefresh(onRefresh);
  useEffect(() => {}, []);
  return null;
}

describe('useAutoRefresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should call onRefresh after REFRESH_INTERVAL', () => {
    const onRefresh = jest.fn();
    act(() => { TestRenderer.create(<TestComp onRefresh={onRefresh} />); });

    expect(onRefresh).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(INTERVAL); });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should call onRefresh multiple times at each interval', () => {
    const onRefresh = jest.fn();
    act(() => { TestRenderer.create(<TestComp onRefresh={onRefresh} />); });

    act(() => { jest.advanceTimersByTime(INTERVAL * 3); });
    expect(onRefresh).toHaveBeenCalledTimes(3);
  });
});
