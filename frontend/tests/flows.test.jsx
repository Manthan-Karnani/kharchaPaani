import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import Dashboard from '../src/components/Dashboard';
import { BudgetForm, DeleteDialog, ExpenseForm } from '../src/components/Forms';
import { api, ApiError, localDate } from '../src/lib';

vi.mock('../src/lib', async importOriginal => ({ ...await importOriginal(), api: vi.fn() }));

const expenses = [
  { id: 1, description: 'Morning coffee', amount: 100.10, expenseDate: '2026-10-02', categoryId: 1, categoryName: 'Food' },
  { id: 2, description: 'Bus ticket', amount: 20.20, expenseDate: '2026-10-01', categoryId: 2, categoryName: 'Travel' },
];
const categories = [{ id: 1, name: 'Food' }, { id: 2, name: 'Travel' }];
const data = { month: '2026-10', budget: 100, totalSpent: 120.30, remaining: -20.30, expenseCount: 2, categories: [
  { categoryId: 1, categoryName: 'Food', total: 100.10, expenseCount: 1 },
  { categoryId: 2, categoryName: 'Travel', total: 20.20, expenseCount: 1 },
] };
const props = { user: { id: 7, username: 'person' }, month: '2026-10', data, expenses, loading: false, error: '', onMonth: vi.fn(), onRetry: vi.fn(), onLogout: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onBudget: vi.fn() };

beforeEach(() => vi.resetAllMocks());

describe('dashboard', () => {
  it('shows a negative balance and supports searching/filtering expenses', async () => {
    const user = userEvent.setup();
    render(<Dashboard {...props}/>);
    expect(screen.getByText('Over budget')).toBeInTheDocument();
    expect(screen.getByText('-₹20.30')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expenses', exact: true }));
    const monthlyTotal = screen.getByRole('region', { name: 'Total spent in October 2026' });
    expect(within(monthlyTotal).getByText('₹120.30')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Search expenses' }), 'coffee');
    expect(screen.getByText('Morning coffee')).toBeInTheDocument();
    expect(screen.queryByText('Bus ticket')).not.toBeInTheDocument();
    expect(within(monthlyTotal).getByText('₹120.30')).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: 'Search expenses' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by category' }), '2');
    expect(screen.queryByText('Morning coffee')).not.toBeInTheDocument();
    expect(screen.getByText('Bus ticket')).toBeInTheDocument();
    expect(within(monthlyTotal).getByText('₹120.30')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit Bus ticket' }));
    expect(props.onEdit).toHaveBeenCalledWith(expenses[1]);
  });

  it('distinguishes an unset budget from zero and opens the budget action', async () => {
    const user = userEvent.setup();
    render(<Dashboard {...props} data={{ ...data, budget: null, remaining: null }}/>);
    expect(screen.getByText('Your call.')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Set monthly budget', exact: true })[0]);
    expect(props.onBudget).toHaveBeenCalled();
  });

  it('shows zero spending for an empty month and updates the total when the month changes', async () => {
    const user = userEvent.setup();
    const view = render(<Dashboard {...props} month="2026-11" data={{ ...data, month: '2026-11', totalSpent: 0, expenseCount: 0, categories: [] }} expenses={[]}/>);
    await user.click(screen.getByRole('button', { name: 'Expenses', exact: true }));
    expect(within(screen.getByRole('region', { name: 'Total spent in November 2026' })).getByText('₹0.00')).toBeInTheDocument();
    view.rerender(<Dashboard {...props} month="2026-12" data={{ ...data, month: '2026-12' }}/>);
    expect(screen.queryByRole('region', { name: 'Total spent in November 2026' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Total spent in December 2026' })).getByText('₹120.30')).toBeInTheDocument();
  });
});

describe('expense and budget forms', () => {
  it('creates an inline category with an exact decimal amount and local date', async () => {
    const user = userEvent.setup(); const saved = vi.fn(); api.mockResolvedValue({ id: 3 });
    render(<ExpenseForm categories={categories} onClose={vi.fn()} onSaved={saved}/>);
    expect(screen.getByLabelText('Date')).toHaveValue(localDate());
    await user.type(screen.getByLabelText('AMOUNT'), '123.45');
    await user.type(screen.getByLabelText('What was it for?'), 'Notebook');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Category', exact: true }), 'new');
    await user.type(screen.getByLabelText('New category'), 'Stationery');
    expect(screen.getByText(/will be saved as a new category/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add expense', exact: true }));
    expect(api).toHaveBeenCalledWith('/expenses', { method: 'POST', body: { amount: '123.45', description: 'Notebook', categoryName: 'Stationery', expenseDate: localDate() } });
    expect(saved).toHaveBeenCalledWith(localDate().slice(0, 7), expect.any(String));
  });

  it('prefills an existing category and saves a selection from the dropdown', async () => {
    const user = userEvent.setup(); const saved = vi.fn(); api.mockResolvedValue({ id: 1 });
    render(<ExpenseForm expense={expenses[0]} categories={categories} onClose={vi.fn()} onSaved={saved}/>);
    const dropdown = screen.getByRole('combobox', { name: 'Category', exact: true });
    expect(dropdown).toHaveValue('category:Food');
    await user.selectOptions(dropdown, 'category:Travel');
    expect(screen.queryByLabelText('New category')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(api).toHaveBeenCalledWith('/expenses/1', { method: 'PUT', body: { amount: '100.1', description: 'Morning coffee', categoryName: 'Travel', expenseDate: '2026-10-02' } });
    expect(saved).toHaveBeenCalledWith('2026-10', 'Expense updated.');
  });

  it('rejects excess decimal places before sending a mutation', async () => {
    const user = userEvent.setup();
    render(<ExpenseForm expense={expenses[0]} categories={categories} onClose={vi.fn()} onSaved={vi.fn()}/>);
    await user.clear(screen.getByLabelText('AMOUNT')); await user.type(screen.getByLabelText('AMOUNT'), '1.001');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText('Enter an amount with up to two decimal places.')).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });

  it('allows a zero budget and keeps a failed deletion open', async () => {
    const user = userEvent.setup(); const saved = vi.fn(); api.mockResolvedValue({ month: '2026-10', amount: 0 });
    const view = render(<BudgetForm month="2026-10" budget={null} onClose={vi.fn()} onSaved={saved}/>);
    await user.type(screen.getByLabelText('MONTHLY BUDGET'), '0');
    await user.click(screen.getByRole('button', { name: 'Save budget' }));
    expect(api).toHaveBeenCalledWith('/budgets/2026-10', { method: 'PUT', body: { amount: '0' } });
    view.unmount();
    const deleted = vi.fn(); api.mockRejectedValue(new ApiError('Database unavailable', 503));
    render(<DeleteDialog expense={expenses[0]} onClose={vi.fn()} onDeleted={deleted}/>);
    await user.click(screen.getByRole('button', { name: 'Delete expense' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
    expect(deleted).not.toHaveBeenCalled();
  });

  it('supports Escape and returns focus to the opener', async () => {
    const user = userEvent.setup(); const close = vi.fn();
    const opener = document.createElement('button'); document.body.appendChild(opener); opener.focus();
    const view = render(<BudgetForm month="2026-10" budget={null} onClose={close} onSaved={vi.fn()}/>);
    expect(screen.getByLabelText('MONTHLY BUDGET')).toHaveFocus();
    await user.keyboard('{Escape}'); expect(close).toHaveBeenCalled();
    view.unmount(); expect(opener).toHaveFocus(); opener.remove();
  });
});

describe('account access', () => {
  it('registers, logs in, and loads the authenticated workspace', async () => {
    const user = userEvent.setup();
    api.mockImplementation(async (path) => {
      if (path === '/auth/me') throw new ApiError('Please log in', 401);
      if (path === '/auth/register' || path === '/auth/login') return props.user;
      if (path.startsWith('/dashboard')) return data;
      if (path.startsWith('/expenses')) return expenses;
      if (path === '/categories') return categories;
      return null;
    });
    render(<App/>);
    await user.click(await screen.findByRole('tab', { name: 'Create account' }));
    await user.type(screen.getByLabelText('Username'), 'person');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create your account' }));
    expect(await screen.findByText('Let’s make it all add up.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expenses', exact: true }));
    expect(await screen.findByText('Morning coffee')).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith('/auth/register', { method: 'POST', body: { username: 'person', password: 'password123' } });
    expect(api).toHaveBeenCalledWith('/auth/login', { method: 'POST', body: { username: 'person', password: 'password123' } });
  });
});
