import assert from 'node:assert/strict';
import test from 'node:test';
import { persistPrinterAfterSuccessfulTest } from './printerSelectionWorkflow.ts';

test('printer is persisted only after the test receipt send succeeds', async () => {
  const calls = [];
  const printer = { address: 'synthetic-device', name: 'Synthetic printer' };

  const selected = await persistPrinterAfterSuccessfulTest(
    printer,
    async () => { calls.push('test'); },
    async () => { calls.push('persist'); },
  );

  assert.equal(selected, printer);
  assert.deepEqual(calls, ['test', 'persist']);
});

test('failed test receipt leaves the printer unpersisted', async () => {
  const calls = [];

  await assert.rejects(
    persistPrinterAfterSuccessfulTest(
      { address: 'synthetic-device' },
      async () => { calls.push('test'); throw new Error('synthetic send failure'); },
      async () => { calls.push('persist'); },
    ),
    /synthetic send failure/,
  );

  assert.deepEqual(calls, ['test']);
});
