import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import { api } from '../lib';
import { Field, Notice } from './Shared';
import AuthStory from './AuthStory';

export default function Auth({ onLogin, initialError = '' }) {
  const layout = useRef(null);
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState('');
  useEffect(() => {
    const element = layout.current;
    if (!window.matchMedia) return;
    const motion = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let x = 0;
    let y = 0;
    const hide = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      delete element.dataset.cursorActive;
    };
    const move = (event) => {
      if (!motion.matches || event.pointerType === 'touch') return;
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      // Update the decoration once per frame without re-rendering the form.
      frame = requestAnimationFrame(() => {
        const bounds = element.getBoundingClientRect();
        element.style.setProperty('--cursor-x', `${x - bounds.left}px`);
        element.style.setProperty('--cursor-y', `${y - bounds.top}px`);
        element.dataset.cursorActive = 'true';
        frame = 0;
      });
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('scroll', hide, true);
    motion.addEventListener('change', hide);
    return () => {
      hide();
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('scroll', hide, true);
      motion.removeEventListener('change', hide);
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setFields({}); setError(''); setMessage('');
    if (new TextEncoder().encode(password).length > 72) { setFields({ password: 'Password must be at most 72 UTF-8 bytes.' }); return; }
    setBusy(true);
    try {
      if (mode === 'register') {
        await api('/auth/register', { method: 'POST', body: { username, password } });
        setMessage('Your account is ready. Signing you in…');
        setMode('login');
      }
      const user = await api('/auth/login', { method: 'POST', body: { username, password } });
      onLogin(user);
    } catch (err) { setError(err.message); setFields(err.fields || {}); }
    finally { setBusy(false); }
  }
  const register = mode === 'register';
  function switchMode(next) {
    setMode(next);
    setError('');
    setFields({});
    setMessage('');
  }

  return (
    <main ref={layout} className="auth-layout">
      <div className="auth-cursor-ring" aria-hidden="true" />
      <AuthStory />

      <section className="auth-form-side" aria-labelledby="auth-heading">
        <div className="auth-form-wrap">
          <span className="auth-form-symbol" aria-hidden="true"><Sparkles size={22} strokeWidth={1.4} /></span>
          <h2 id="auth-heading">{register ? 'Your fresh start.' : 'Good to have you back.'}</h2>
          <p className="auth-description">{register ? 'A simpler relationship with money starts here.' : 'A clear picture of your money is just a login away.'}</p>
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={!register} disabled={busy} onClick={() => switchMode('login')}>Log in</button>
            <button type="button" role="tab" aria-selected={register} disabled={busy} onClick={() => switchMode('register')}>Create account</button>
          </div>
          <Notice>{error}</Notice>
          <Notice type="success">{message}</Notice>
          <form onSubmit={submit} className="auth-form">
            <Field label="Username" htmlFor="username" error={fields.username} hint={register ? '3–32 letters, numbers, or underscores.' : null}>
              <div className="input-with-icon">
                <UserRound size={18} />
                <input id="username" name="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" autoComplete="username" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]{3,32}" aria-invalid={!!fields.username} disabled={busy} />
              </div>
            </Field>
            <Field label="Password" htmlFor="password" error={fields.password} hint={register ? 'At least 8 characters. Keep it somewhere safe.' : null}>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input id="password" name="password" type={visible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={register ? 'Create a password' : 'Your password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={8} maxLength={72} aria-invalid={!!fields.password} disabled={busy} />
                <button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <button className="button primary auth-submit" disabled={busy}>
              {busy ? 'Just a moment…' : register ? 'Create your account' : 'Step into your workspace'}<ArrowRight size={17} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
