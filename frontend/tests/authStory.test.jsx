import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { gsap } from 'gsap';
import AuthStory from '../src/components/AuthStory';

function motionPreference(reduced = false, desktop = true) {
  const preference = { reduced };
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    get matches() {
      if (query.includes('prefers-reduced-motion')) return !preference.reduced;
      return desktop;
    },
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  return preference;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('login story motion', () => {
  it('keeps content visible and creates no animations with reduced motion', () => {
    motionPreference(true);
    const { container } = render(<AuthStory />);
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
    expect(screen.queryByRole('button', { name: /motion/ })).not.toBeInTheDocument();
    expect(gsap.getTweensOf([...container.querySelectorAll('*')])).toHaveLength(0);
  });

  it('pauses, resumes, responds to backgrounding, and cleans up in Strict Mode', async () => {
    motionPreference();
    const user = userEvent.setup();
    const view = render(<StrictMode><AuthStory /></StrictMode>);
    const nodes = [...view.container.querySelectorAll('*')];
    const floating = gsap.getTweensOf(view.container.querySelector('.front-card'))[0].parent;
    const moneyLoop = gsap.getById('auth-money-loop');
    await user.click(screen.getByRole('button', { name: 'Pause motion' }));
    expect(floating.paused()).toBe(true);
    expect(moneyLoop.paused()).toBe(true);
    expect(screen.getByRole('button', { name: 'Resume motion' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Resume motion' }));
    expect(floating.paused()).toBe(false);
    expect(moneyLoop.paused()).toBe(false);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(floating.paused()).toBe(true);
    expect(moneyLoop.paused()).toBe(true);
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(floating.paused()).toBe(false);
    expect(moneyLoop.paused()).toBe(false);
    view.unmount();
    expect(gsap.getTweensOf(nodes)).toHaveLength(0);
  });

  it.each([true, false])('repeats the expense and savings story without stopping (desktop: %s)', (desktop) => {
    motionPreference(false, desktop);
    const { container } = render(<AuthStory />);
    const loop = gsap.getById('auth-money-loop');
    const opacity = selector => Number(gsap.getProperty(container.querySelector(selector), 'opacity'));
    expect(loop.repeat()).toBe(-1);
    expect(loop.repeatDelay()).toBe(0);
    act(() => { loop.pause(); loop.totalTime(5); });
    expect(opacity('.balance-final')).toBe(1);
    expect(opacity('.spent-final')).toBe(1);
    expect(Number(gsap.getProperty(container.querySelector('.illustration-progress span'), 'scaleX'))).toBeCloseTo(0.24);
    act(() => { loop.totalTime(9); });
    expect(opacity('.saved-final')).toBe(1);
    const duration = loop.duration();
    act(() => { loop.totalTime(duration + 0.5); });
    expect(loop.iteration()).toBe(2);
    expect(opacity('.balance-start')).toBe(1);
    expect(opacity('.ledger-coffee')).toBe(0);
    act(() => { loop.totalTime(duration * 2 + 5); });
    expect(loop.iteration()).toBe(3);
    expect(opacity('.balance-final')).toBe(1);
    expect(opacity('.spent-final')).toBe(1);
  });

  it('reverts running animations when reduced motion is enabled', () => {
    const preference = motionPreference();
    const { container } = render(<AuthStory />);
    const nodes = [...container.querySelectorAll('*')];
    expect(screen.getByRole('button', { name: 'Pause motion' })).toBeInTheDocument();
    expect(gsap.getTweensOf(nodes).length).toBeGreaterThan(0);
    preference.reduced = true;
    act(() => gsap.matchMediaRefresh());
    expect(screen.queryByRole('button', { name: /motion/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
    expect(gsap.getTweensOf(nodes)).toHaveLength(0);
  });
});
