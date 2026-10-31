import test from 'node:test';
import assert from 'node:assert/strict';
import { amountError, localDate, money, percentSpent, shiftMonth } from './lib.js';

test('money uses INR and Indian digit grouping', () => {
  assert.equal(money(123456.78), '₹1,23,456.78');
  assert.equal(money(-15.25), '-₹15.25');
});
test('money validation accepts exact decimal input and rejects invalid amounts', () => {
  for (const value of ['0.01', '10', '12.50', '9999999999.99']) assert.equal(amountError(value), '');
  for (const value of ['', '-1', '0', '1.001', '1e3', 'Infinity', '10000000000']) assert.ok(amountError(value));
  assert.equal(amountError('0', true), '');
});
test('month navigation crosses year and leap-month boundaries', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2024-02', 1), '2024-03');
});
test('default expense date uses the local calendar, not UTC', () => {
  const date = new Date(2026, 9, 28, 0, 1);
  assert.equal(localDate(date), '2026-10-28');
});
test('budget percentages distinguish missing, zero and overspent budgets', () => {
  assert.equal(percentSpent(500, null), null);
  assert.equal(percentSpent(0, 0), 0);
  assert.equal(percentSpent(1, 0), 100);
  assert.equal(percentSpent(125, 100), 125);
});
