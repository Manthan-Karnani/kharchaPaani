export const palette = ['#e4c583', '#b98a46', '#f2dda9', '#9c8060', '#c6a876', '#e1a665', '#aaa06a', '#d3b9a0'];
export const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value ?? 0));
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const currentMonth = () => localDate().slice(0, 7);
export const monthLabel = (month, style = 'long') => new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', { month: style, year: 'numeric' });
export const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const shiftMonth = (month, delta) => {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + delta);
  return localDate(date).slice(0, 7);
};
export const percentSpent = (spent, budget) => budget === null ? null : Number(budget) === 0 ? (Number(spent) > 0 ? 100 : 0) : Number(spent) / Number(budget) * 100;
export function amountError(value, allowZero = false) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return 'Enter an amount with up to two decimal places.';
  const number = Number(value);
  if (number < (allowZero ? 0 : 0.01)) return allowZero ? 'Budget cannot be negative.' : 'Amount must be at least ₹0.01.';
  if (number > 9999999999.99) return 'Amount must be ₹9,99,99,99,999.99 or less.';
  return '';
}

let csrf = null;
export class ApiError extends Error {
  constructor(message, status, fields = {}) { super(message); this.status = status; this.fields = fields; }
}
async function send(path, options) {
  try { return await fetch(`/api${path}`, { credentials: 'same-origin', ...options }); }
  catch { throw new ApiError('Cannot reach the server. Make sure the Spring Boot backend is running on port 8080.', 0); }
}
export async function refreshCsrf() {
  const response = await send('/auth/csrf');
  if (!response.ok) throw new ApiError('Cannot connect to the server. Please try again.', response.status);
  csrf = await response.json();
  return csrf;
}
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (method !== 'GET') {
    if (!csrf) await refreshCsrf();
    headers[csrf.headerName] = csrf.token;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await send(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 403) csrf = null;
    if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('session-expired'));
    throw new ApiError(data.message || 'Something went wrong. Please try again.', response.status, data.fields);
  }
  if (path === '/auth/login' || path === '/auth/logout') csrf = null;
  return response.status === 204 ? null : response.json();
}
