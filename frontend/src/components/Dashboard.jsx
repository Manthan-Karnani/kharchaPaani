import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Coffee, LayoutDashboard, Leaf, ListFilter, LogOut, Menu, Pencil, Plus, Search, ShoppingBag, Sparkles, Target, Trash2, TrendingUp, Wallet, X } from 'lucide-react';
import { currentMonth, dateLabel, money, monthLabel, palette, percentSpent, shiftMonth } from '../lib';
import { Brand, Notice, Spinner } from './Shared';
import MoneyShower from './MoneyShower';
import { playMarioDeathSound } from '../marioDeathSound';

function CategoryIcon({ name, size = 18 }) {
  const lower = name.toLowerCase();
  if (/food|coffee|lunch|dinner|cafe|restaurant|snack/.test(lower)) return <Coffee size={size}/>;
  if (/shop|groc|cloth/.test(lower)) return <ShoppingBag size={size}/>;
  if (/travel|transport|fuel|commut/.test(lower)) return <ArrowUpRight size={size}/>;
  if (/health|well|nature/.test(lower)) return <Leaf size={size}/>;
  return <Wallet size={size}/>;
}

function MonthPicker({ month, onChange }) {
  return <div className="month-picker"><button className="icon-button" aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))} disabled={month === '1000-01'}><ChevronLeft size={17}/></button><div className="month-input"><CalendarDays size={16}/><span>{monthLabel(month)}</span><ChevronDown size={14}/><input type="month" aria-label="Select month" value={month} min="1000-01" max="9998-12" onChange={e => { if (/^\d{4}-\d{2}$/.test(e.target.value)) onChange(e.target.value); }}/></div><button className="icon-button" aria-label="Next month" onClick={() => onChange(shiftMonth(month, 1))} disabled={month === '9998-12'}><ChevronRight size={17}/></button></div>;
}

function SummaryCards({ data, onBudget }) {
  const noBudget = data.budget === null;
  const over = !noBudget && Number(data.remaining) < 0;
  return <div className="summary-grid"><article className="stat-card"><div className="stat-heading"><span>Monthly budget</span><span className="stat-icon"><Wallet size={19}/></span></div><strong className={`stat-value ${noBudget ? 'stat-empty' : ''}`}>{noBudget ? 'A fresh start' : money(data.budget)}</strong><div className="stat-foot"><span>{noBudget ? 'Give this month a spending plan' : 'A little plan for the month'}</span><button onClick={onBudget} aria-label={noBudget ? 'Set monthly budget' : 'Edit monthly budget'}>{noBudget ? <Plus size={16}/> : <Pencil size={14}/>}</button></div></article><article className="stat-card"><div className="stat-heading"><span>Total spent</span><span className="stat-icon sand"><ArrowUpRight size={19}/></span></div><strong className="stat-value">{money(data.totalSpent)}</strong><div className="stat-foot"><span className="stat-dot"/><span>{data.expenseCount} {data.expenseCount === 1 ? 'expense' : 'expenses'} accounted for</span></div></article><article className={`stat-card remaining-card ${over ? 'is-over' : ''}`}><div className="stat-heading"><span>{over ? 'Over budget' : 'Left to spend'}</span><span className="stat-icon"><ArrowDownLeft size={19}/></span></div><strong className={`stat-value ${noBudget ? 'stat-empty' : ''}`}>{noBudget ? 'Your call.' : money(data.remaining)}</strong><div className="stat-foot"><span className="status-dot"/><span>{noBudget ? 'Set a budget to see what’s left' : over ? 'Time for a little course correction' : Number(data.remaining) === 0 ? 'Your budget is fully accounted for' : 'A little breathing room feels good'}</span></div><span className="stat-decoration" aria-hidden="true"/></article></div>;
}

function BudgetJourney({ month, data, onBudget }) {
  const percent = percentSpent(data.totalSpent, data.budget);
  const over = data.remaining !== null && Number(data.remaining) < 0;
  return <section className="panel budget-panel"><div className="panel-heading"><div><h2>Your month, in balance.</h2></div><span className="soft-icon"><Target size={21} strokeWidth={1.6}/></span></div>{data.budget === null ? <div className="budget-empty"><div className="budget-empty-copy"><span className="empty-glyph"><Sparkles size={23}/></span><h3>Every good month starts with a plan.</h3><p>Set a budget for {monthLabel(month)}.<br/>We’ll help you keep an eye on the rest.</p></div><button className="button primary" onClick={onBudget}>Set monthly budget<ArrowRight size={16}/></button></div> : <><div className="journey-head"><span><strong>{Math.round(percent)}%</strong> of your budget used</span><button className="text-button" onClick={onBudget}>Edit budget<Pencil size={13}/></button></div><div className={`progress-track ${over ? 'over' : ''}`} role="progressbar" aria-label="Monthly budget spent" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(percent))}><span style={{ width: `${Math.min(100, percent)}%` }}/></div><div className="journey-labels"><span>{money(data.totalSpent)} spent</span><span>{money(data.budget)} budget</span></div><div className={`journey-note ${over ? 'over' : ''}`}><span>{over ? <TrendingUp size={19}/> : <Leaf size={19}/>}</span><p><strong>{over ? 'A little over. Still in control.' : percent >= 85 ? 'You’re getting close to your limit.' : 'Small check-ins make a big difference.'}</strong>{over ? `You’ve spent ${money(-Number(data.remaining))} above your plan. You can adjust your budget anytime.` : percent >= 85 ? 'Keep an eye on the little extras for the rest of this month.' : 'Keep adding your expenses to see the whole picture.'}</p></div></>}</section>;
}

function CategoryChart({ data }) {
  const [expanded, setExpanded] = useState(false);
  const circumference = 2 * Math.PI * 62;
  let offset = 0;
  const categories = data.categories;
  const visible = expanded ? categories : categories.slice(0, 4);
  return <section className="panel category-panel"><div className="panel-heading"><div><h2>Where it all goes.</h2></div><span className="soft-icon"><ShoppingBag size={20} strokeWidth={1.6}/></span></div>{!categories.length ? <div className="category-empty"><div className="empty-donut"><span><ShoppingBag size={27} strokeWidth={1.3}/></span></div><h3>A story waiting to be told.</h3><p>Add your first expense to see your<br/>spending by category.</p></div> : <><div className="category-content"><div className="donut-wrap"><svg viewBox="0 0 150 150" role="img" aria-label="Spending by category; totals and percentages listed beside chart"><circle cx="75" cy="75" r="62" fill="none" stroke="var(--chart-track)" strokeWidth="17"/>{categories.map((category, index) => { const ratio = Number(category.total) / Number(data.totalSpent); const length = ratio * circumference; const start = offset; offset += length; return <circle key={category.categoryId} cx="75" cy="75" r="62" fill="none" stroke={palette[index % palette.length]} strokeWidth="17" strokeDasharray={`${Math.max(0, length - (categories.length > 1 ? 2.5 : 0))} ${circumference}`} strokeDashoffset={-start} transform="rotate(-90 75 75)"/>; })}</svg><div className="donut-label"><span>{categories.length}</span><small>{categories.length === 1 ? 'category' : 'categories'}</small></div></div><div className="category-legend">{visible.map((category, i) => <div className="legend-row" key={category.categoryId}><span className="legend-dot" style={{ background: palette[i % palette.length] }}/><span className="legend-name" title={category.categoryName}>{category.categoryName}</span><span className="legend-values"><strong>{money(category.total)}</strong><small>{Math.round(Number(category.total) / Number(data.totalSpent) * 100)}%</small></span></div>)}{categories.length > 4 && <button className="text-button legend-expand" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer' : `+ ${categories.length - 4} more categories`}<ChevronDown size={12}/></button>}</div></div><div className="category-foot"><span>Most spent on</span><strong>{categories[0].categoryName}<ArrowUpRight size={14}/></strong></div></>}</section>;
}

function ExpenseTable({ expenses, data, onEdit, onDelete, onAdd }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => expenses.filter(e => (!category || String(e.categoryId) === category) && `${e.description} ${e.categoryName}`.toLowerCase().includes(search.toLowerCase())), [expenses, category, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const safePage = Math.min(page, pages);
  const shown = filtered.slice((safePage - 1) * 8, safePage * 8);
  const colors = new Map(data.categories.map((c, i) => [c.categoryId, palette[i % palette.length]]));
  return <section className="panel expenses-panel"><div className="expense-heading"><div><h2>Your expenses<span className="count-badge">{expenses.length}</span></h2></div><div className="expense-tools"><div className="search-input"><Search size={16}/><input aria-label="Search expenses" placeholder="Find an expense…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></div><div className="category-filter"><ListFilter size={15}/><select aria-label="Filter by category" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{data.categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}</select></div></div></div>{!shown.length ? <div className="expenses-empty"><span className="empty-glyph"><Wallet size={26} strokeWidth={1.5}/></span><h3>{expenses.length ? 'Nothing matches just yet.' : 'Start with your first little expense.'}</h3><p>{expenses.length ? 'Try another search or category.' : 'A coffee, a commute, a grocery run. It all belongs here.'}</p>{!expenses.length && <button className="button secondary" onClick={onAdd}><Plus size={16}/>Add an expense</button>}</div> : <><div className="table-scroll"><table><thead><tr><th>EXPENSE</th><th>CATEGORY</th><th>DATE</th><th className="text-right">AMOUNT</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{shown.map(e => <tr key={e.id}><td><div className="expense-description"><span className="category-icon" style={{ color: colors.get(e.categoryId), background: `${colors.get(e.categoryId)}16` }}><CategoryIcon name={e.categoryName}/></span><strong>{e.description}</strong></div></td><td><span className="category-pill"><i style={{ background: colors.get(e.categoryId) }}/>{e.categoryName}</span></td><td className="date-cell">{dateLabel(e.expenseDate)}</td><td className="expense-amount">{money(e.amount)}</td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${e.description}`} onClick={() => onEdit(e)}><Pencil size={15}/></button><button className="icon-button delete-button" aria-label={`Delete ${e.description}`} onClick={() => onDelete(e)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div><div className="table-foot"><span>Showing {(safePage - 1) * 8 + 1}–{Math.min(safePage * 8, filtered.length)} of {filtered.length} expenses</span>{pages > 1 ? <div className="pagination"><button className="icon-button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16}/></button><span>{safePage} / {pages}</span><button className="icon-button" aria-label="Next page" disabled={safePage === pages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16}/></button></div> : null}</div></>}</section>;
}

export default function Dashboard({ user, month, onMonth, data, expenses, loading, error, onRetry, onLogout, onAdd, onEdit, onDelete, onBudget, notice }) {
  const [view, setView] = useState('overview');
  const [menu, setMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const stopMarioSound = useRef(null);
  useEffect(() => () => stopMarioSound.current?.(), []);
  const nav = (next) => {
    if (next !== view) {
      stopMarioSound.current?.();
      stopMarioSound.current = next === 'expenses' ? playMarioDeathSound() : null;
    }
    setView(next);
    setMenu(false);
  };
  async function logout() { setLoggingOut(true); setLogoutError(''); try { await onLogout(); } catch (err) { setLogoutError(err.message); setLoggingOut(false); } }
  return <div className="app-shell">{view === 'expenses' && <MoneyShower/>}{menu && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenu(false)}/>}<aside className={`sidebar ${menu ? 'open' : ''}`}><Brand/><button className="sidebar-close icon-button" aria-label="Close navigation" onClick={() => setMenu(false)}><X size={21}/></button><div className="nav-section"><nav aria-label="Main navigation"><button className={view === 'overview' ? 'active' : ''} onClick={() => nav('overview')}><LayoutDashboard size={18}/>Overview<span className="nav-active-dot"/></button><button className={view === 'expenses' ? 'active' : ''} onClick={() => nav('expenses')}><Wallet size={18}/>Expenses</button></nav></div><div className="sidebar-bottom"><div className="user-box"><span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span><div><strong title={user.username}>{user.username}</strong></div><button className="icon-button" aria-label="Log out" title="Log out" onClick={logout} disabled={loggingOut}><LogOut size={17}/></button></div></div></aside><div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMenu(true)}><Menu size={21}/></button><span>Your workspace</span><ChevronRight size={13}/><strong>{view === 'overview' ? 'Overview' : 'Expenses'}</strong></div></header><main className="dashboard-main"><div className="page-heading"><div><h1>{view === 'overview' ? 'Let’s make it all add up.' : 'The little things, all here.'}</h1><p>{view === 'overview' ? 'A clear picture of your spending. A little more peace of mind.' : 'Every coffee, every commute, every little expense accounted for.'}</p></div><button className="button primary add-expense" onClick={onAdd} disabled={loading || !data}><Plus size={18}/>Add expense</button></div><div className="month-row"><div className="month-title"><h2>{monthLabel(month)}</h2><span className="period-badge">{month === currentMonth() ? 'THIS MONTH' : month < currentMonth() ? 'PAST MONTH' : 'UPCOMING'}</span></div><MonthPicker month={month} onChange={onMonth}/></div><Notice>{logoutError}</Notice><Notice type="success">{notice}</Notice>{error ? <div className="dashboard-error"><Notice action="Try again" onAction={onRetry}>{error}</Notice><p>Your saved records remain in MySQL. Reconnect to load this month.</p></div> : loading || !data ? <Spinner label={`Gathering your ${monthLabel(month, 'short')} picture…`}/> : <>
    {view === 'overview' && <>
      <SummaryCards data={data} onBudget={onBudget}/>
      <BudgetJourney data={data} month={month} onBudget={onBudget}/>
    </>}
    {view === 'expenses' && <>
      <div className="expense-summary">
        <section className="panel expense-month-total" aria-labelledby="expense-total-heading">
          <div><h2 id="expense-total-heading">Total spent in {monthLabel(month)}</h2><p>{data.expenseCount} {data.expenseCount === 1 ? 'expense' : 'expenses'}</p></div>
          <strong className="expense-month-amount">{money(data.totalSpent)}</strong>
        </section>
        <CategoryChart key={month} data={data}/>
      </div>
      <ExpenseTable key={month} expenses={expenses} data={data} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete}/>
    </>}
  </>}</main></div></div>;
}
