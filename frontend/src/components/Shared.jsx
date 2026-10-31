import { AlertCircle, BookOpen, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Brand({ inverse = false }) {
  return <div className={`brand ${inverse ? 'brand-inverse' : ''}`}><span className="brand-mark"><BookOpen size={23} strokeWidth={1.6} /></span><div><span className="brand-name">kharcha paani<span className="brand-dot">.</span></span></div></div>;
}
export function Spinner({ label = 'Loading your workspace…' }) {
  return <div className="loading-state" role="status"><LoaderCircle className="spin" size={25} /><span>{label}</span></div>;
}
export function Notice({ children, action, onAction, type = 'error' }) {
  if (!children) return null;
  return <div className={`notice notice-${type}`} role={type === 'error' ? 'alert' : 'status'}><AlertCircle size={18} /><span>{children}</span>{action && <button type="button" onClick={onAction}>{action}</button>}</div>;
}
export function Field({ label, error, children, hint, htmlFor }) {
  return <div className="field"><label htmlFor={htmlFor}>{label}</label>{children}{error ? <p className="field-error" id={`${htmlFor}-error`}>{error}</p> : hint && <p className="field-hint" id={`${htmlFor}-hint`}>{hint}</p>}</div>;
}
export function Modal({ title, subtitle, onClose, children, busy = false }) {
  const dialog = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const active = document.activeElement;
    const element = dialog.current;
    const focusable = () => [...element.querySelectorAll('button:not(:disabled), input:not(:disabled), select, textarea, [tabindex="0"]')];
    focusable().find(item => item.tagName === 'INPUT')?.focus();
    const handler = (event) => {
      if (event.key === 'Escape' && !busy) closeRef.current();
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handler); active?.focus(); };
  }, [busy]);
  return <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}><section ref={dialog} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-subtitle"><div className="modal-heading"><div><h2 id="modal-title">{title}</h2><p id="modal-subtitle">{subtitle}</p></div><button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Close dialog"><X size={20}/></button></div>{children}</section></div>;
}
