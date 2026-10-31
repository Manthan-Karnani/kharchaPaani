import { useState } from 'react';
import { ArrowRight, IndianRupee, Plus, Tag } from 'lucide-react';
import { api, amountError, localDate, money, monthLabel } from '../lib';
import { Field, Modal, Notice } from './Shared';

const suggestedCategories = ['Food', 'Groceries', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];

export function ExpenseForm({ expense, categories, onClose, onSaved }) {
  const [form, setForm] = useState({ description: expense?.description || '', amount: expense ? String(expense.amount) : '', expenseDate: expense?.expenseDate || localDate(), categoryName: expense?.categoryName || '' });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const isNew = form.categoryName.trim() && !categories.some(c => c.name.toLocaleLowerCase() === form.categoryName.trim().toLocaleLowerCase());
  const change = (key) => e => setForm(previous => ({ ...previous, [key]: e.target.value }));
  const categoryOptions = [...categories.map(category => category.name), expense?.categoryName, ...suggestedCategories]
    .filter((name, index, names) => name && names.findIndex(candidate => candidate?.toLocaleLowerCase() === name.toLocaleLowerCase()) === index);
  function chooseCategory(event) {
    const choice = event.target.value;
    setCreatingCategory(choice === 'new');
    setForm(previous => ({ ...previous, categoryName: choice.startsWith('category:') ? choice.slice(9) : '' }));
    setFields(previous => ({ ...previous, categoryName: undefined }));
  }
  async function submit(event) {
    event.preventDefault(); setError('');
    const invalid = {};
    if (amountError(form.amount)) invalid.amount = amountError(form.amount);
    if (!form.description.trim()) invalid.description = 'Add a short description.';
    if (!form.categoryName.trim()) invalid.categoryName = 'Choose or name a category.';
    setFields(invalid);
    if (Object.keys(invalid).length) return;
    setBusy(true);
    try {
      await api(expense ? `/expenses/${expense.id}` : '/expenses', { method: expense ? 'PUT' : 'POST', body: { ...form, description: form.description.trim(), categoryName: form.categoryName.trim(), amount: form.amount } });
      onSaved(form.expenseDate.slice(0, 7), expense ? 'Expense updated.' : 'Expense added. Every little bit accounted for.');
    } catch (err) { setError(err.message); setFields(err.fields || {}); }
    finally { setBusy(false); }
  }
  return (
    <Modal title={expense ? 'Edit your expense.' : 'What did you spend on?'} subtitle="The little things add up. Let’s keep track of them." onClose={onClose} busy={busy}>
      <form onSubmit={submit}>
        <Notice>{error}</Notice>
        <div className="amount-entry">
          <label htmlFor="expense-amount">AMOUNT</label>
          <div><IndianRupee size={28}/><input id="expense-amount" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={change('amount')} required aria-invalid={!!fields.amount} disabled={busy}/></div>
          {fields.amount && <p className="field-error">{fields.amount}</p>}
        </div>
        <Field label="What was it for?" htmlFor="expense-description" error={fields.description}>
          <input id="expense-description" placeholder="e.g. Lunch with a friend" value={form.description} onChange={change('description')} required maxLength={160} disabled={busy}/>
        </Field>
        <div className="form-row">
          <div>
            <Field label="Category" htmlFor="expense-category" error={!creatingCategory ? fields.categoryName : undefined}>
              <select id="expense-category" value={creatingCategory ? 'new' : form.categoryName ? `category:${form.categoryName}` : ''} onChange={chooseCategory} required disabled={busy} aria-invalid={!creatingCategory && !!fields.categoryName}>
                <option value="" disabled>Choose a category</option>
                {categoryOptions.map(name => <option key={name} value={`category:${name}`}>{name}</option>)}
                <option value="new">+ Add new category</option>
              </select>
            </Field>
            {creatingCategory && <Field label="New category" htmlFor="expense-new-category" error={fields.categoryName}>
              <input id="expense-new-category" placeholder="e.g. Stationery" value={form.categoryName} onChange={change('categoryName')} required maxLength={40} disabled={busy} aria-invalid={!!fields.categoryName}/>
            </Field>}
          </div>
          <Field label="Date" htmlFor="expense-date" error={fields.expenseDate}>
            <input id="expense-date" type="date" value={form.expenseDate} onChange={change('expenseDate')} required min="1000-01-01" max="9998-12-31" disabled={busy}/>
          </Field>
        </div>
        <p className="category-tip">{isNew ? <><Plus size={14}/> “{form.categoryName.trim()}” will be saved as a new category.</> : <><Tag size={14}/> Choose a category, or add your own.</>}</p>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="button primary" disabled={busy}>{busy ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}<ArrowRight size={16}/></button>
        </div>
      </form>
    </Modal>
  );
}

export function BudgetForm({ month, budget, onClose, onSaved }) {
  const [amount, setAmount] = useState(budget === null ? '' : String(budget));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const invalid = amountError(amount, true);
    if (invalid) { setError(invalid); return; }
    setError(''); setBusy(true);
    try { await api(`/budgets/${month}`, { method: 'PUT', body: { amount } }); onSaved(month, 'Monthly budget saved. A little plan goes a long way.'); }
    catch (err) { setError(err.fields?.amount || err.message); }
    finally { setBusy(false); }
  }
  return <Modal title={budget === null ? 'Give your month a plan.' : 'A little change of plan.'} subtitle={`Set your spending budget for ${monthLabel(month)}.`} onClose={onClose} busy={busy}><form onSubmit={submit}><Notice>{error}</Notice><div className="amount-entry"><label htmlFor="budget-amount">MONTHLY BUDGET</label><div><IndianRupee size={28}/><input id="budget-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required disabled={busy}/></div></div><div className="soft-note">This budget belongs to {monthLabel(month)}. You can change it anytime. Your expenses will still be recorded if you go over budget.</div><div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save budget'}<ArrowRight size={16}/></button></div></form></Modal>;
}

export function DeleteDialog({ expense, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function remove() {
    setBusy(true); setError('');
    try { await api(`/expenses/${expense.id}`, { method: 'DELETE' }); onDeleted(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <Modal title="Remove this expense?" subtitle="Your budget and category totals will update automatically." onClose={onClose} busy={busy}><Notice>{error}</Notice><div className="delete-summary"><strong>{expense.description}</strong><span>{money(expense.amount)}</span></div><p className="muted small">This removes the saved expense permanently.</p><div className="modal-actions"><button className="button secondary" onClick={onClose} disabled={busy}>Keep expense</button><button className="button danger" onClick={remove} disabled={busy}>{busy ? 'Removing…' : 'Delete expense'}</button></div></Modal>;
}
