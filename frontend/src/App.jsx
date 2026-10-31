import { useEffect, useRef, useState } from 'react';
import { api, currentMonth } from './lib';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { BudgetForm, DeleteDialog, ExpenseForm } from './components/Forms';
import { Brand, Spinner } from './components/Shared';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [reload, setReload] = useState(0);
  const request = useRef(0);
  useEffect(() => {
    let active = true;
    api('/auth/me').then(u => { if (active) setUser(u); }).catch(err => { if (active && err.status !== 401) setAuthError(err.message); }).finally(() => { if (active) setChecking(false); });
    const expired = () => { request.current++; setUser(null); setModal(null); setData(null); setAuthError('Your session has ended. Log in to pick up where you left off.'); };
    window.addEventListener('session-expired', expired);
    return () => { active = false; window.removeEventListener('session-expired', expired); };
  }, []);
  useEffect(() => {
    if (!user) return;
    const id = ++request.current;
    setLoading(true); setError('');
    Promise.all([api(`/dashboard?month=${month}`), api(`/expenses?month=${month}`), api('/categories')])
      .then(([summary, rows, groups]) => { if (id === request.current) { setData(summary); setExpenses(rows); setCategories(groups); } })
      .catch(err => { if (id === request.current) setError(err.message); })
      .finally(() => { if (id === request.current) setLoading(false); });
    return () => { if (id === request.current) request.current++; };
  }, [user, month, reload]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(timer); }, [notice]);
  function saved(savedMonth, message) { setModal(null); setNotice(message); setMonth(savedMonth); setReload(r => r + 1); }
  async function logout() { await api('/auth/logout', { method: 'POST' }); request.current++; setUser(null); setData(null); setExpenses([]); setCategories([]); setModal(null); setNotice(''); setAuthError(''); }
  if (checking) return <div className="boot-screen"><Brand/><Spinner label="Opening your little book…"/></div>;
  if (!user) return <Auth initialError={authError} onLogin={u => { setMonth(currentMonth()); setData(null); setUser(u); setAuthError(''); }}/>;
  return <><Dashboard user={user} month={month} onMonth={m => { setMonth(m); setNotice(''); }} data={data} expenses={expenses} loading={loading} error={error} notice={notice} onRetry={() => setReload(r => r + 1)} onLogout={logout} onAdd={() => setModal({ type: 'expense' })} onEdit={expense => setModal({ type: 'expense', expense })} onDelete={expense => setModal({ type: 'delete', expense })} onBudget={() => setModal({ type: 'budget' })}/>{modal?.type === 'expense' && <ExpenseForm expense={modal.expense} categories={categories} onClose={() => setModal(null)} onSaved={saved}/ >}{modal?.type === 'budget' && data && <BudgetForm month={month} budget={data.budget} onClose={() => setModal(null)} onSaved={saved}/ >}{modal?.type === 'delete' && <DeleteDialog expense={modal.expense} onClose={() => setModal(null)} onDeleted={() => saved(month, 'Expense removed. Your totals are up to date.')}/ >}</>;
}
