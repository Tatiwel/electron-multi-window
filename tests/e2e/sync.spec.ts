import type { Page } from '@playwright/test';
import {
  test,
  expect,
  createMessage,
  messageRows,
  openChildWindow,
} from './fixtures';

const rowText = (main: Page, rowIndex: number) =>
  messageRows(main).nth(rowIndex).locator('.message-text');

const rowEditInput = (main: Page, rowIndex: number) =>
  messageRows(main).nth(rowIndex).locator('.input-edit');

// Value shown by a child window, whether it is in read or edit mode.
const childValue = (child: Page) =>
  child.evaluate(() => {
    const editor = document.querySelector<HTMLTextAreaElement>('.message-editor');
    if (editor) return editor.value;
    return document.querySelector('.message-box')?.textContent ?? '';
  });

test('creates a message', async ({ main }) => {
  await createMessage(main, 'hello world');

  const row = messageRows(main).first();
  await expect(messageRows(main)).toHaveCount(1);
  await expect(row.locator('.message-index')).toHaveText('1.');
  await expect(row.locator('.message-text')).toHaveText('hello world');
  await expect(main.getByPlaceholder('Type here.')).toHaveValue('');
});

test('does not create empty or whitespace-only messages', async ({ main }) => {
  await createMessage(main, '');
  await createMessage(main, '   ');

  await expect(messageRows(main)).toHaveCount(0);
  await expect(main.getByText('No messages yet!')).toBeVisible();
});

test('opens the full message in a modal and closes it with Escape', async ({
  main,
}) => {
  const text = 'a fairly long message that should be shown in full';
  await createMessage(main, text);

  await rowText(main, 0).click();
  const modal = main.locator('.modal-content');
  await expect(modal).toBeVisible();
  await expect(modal.locator('.modal-message-body')).toHaveText(text);

  await main.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
});

test('opens a child window with the message', async ({ app, main }) => {
  await createMessage(main, 'open me');

  const child = await openChildWindow(app, main, 0);

  await expect(child).toHaveTitle('Edit Message');
  await expect(child.locator('.message-box')).toContainText('open me');
});

test('editing in the main window syncs to the child', async ({ app, main }) => {
  // Known defect (a): the main process sends the editing state before the
  // child finishes loading, so the child opens in read mode instead of edit
  // mode. Remove test.fail() once the child opens already editing.
  test.fail();

  await createMessage(main, 'original');
  const child = await openChildWindow(app, main, 0);

  const editor = child.getByPlaceholder('Type your message');
  await expect(editor).toBeVisible();
  await expect(editor).toHaveValue('original');

  await rowEditInput(main, 0).fill('typed in main');
  await expect(editor).toHaveValue('typed in main');
});

test('saving in the main window updates the table and the child', async ({
  app,
  main,
}) => {
  await createMessage(main, 'original');
  const child = await openChildWindow(app, main, 0);

  await rowEditInput(main, 0).fill('saved in main');
  await messageRows(main)
    .first()
    .getByRole('button', { name: 'Save message' })
    .click();

  await expect(rowText(main, 0)).toHaveText('saved in main');
  await expect(rowEditInput(main, 0)).toHaveCount(0);
  await expect(child.locator('.message-editor')).toHaveCount(0);
  await expect(child.locator('.message-box')).toHaveText('saved in main');
});

test('cancelling in the main window keeps the original', async ({
  app,
  main,
}) => {
  await createMessage(main, 'original');
  const child = await openChildWindow(app, main, 0);

  await rowEditInput(main, 0).fill('discard me');
  await messageRows(main)
    .first()
    .getByRole('button', { name: 'Cancel edit' })
    .click();

  await expect(rowText(main, 0)).toHaveText('original');
  await expect(rowEditInput(main, 0)).toHaveCount(0);
  await expect(child.locator('.message-editor')).toHaveCount(0);
  await expect(child.locator('.message-box')).toHaveText('original');
});

test('editing and saving in the child updates the main window', async ({
  app,
  main,
}) => {
  await createMessage(main, 'original');
  const child = await openChildWindow(app, main, 0);

  await child.getByRole('button', { name: 'Edit message' }).click();
  await child.getByPlaceholder('Type your message').fill('saved in child');

  await expect(rowEditInput(main, 0)).toHaveValue('saved in child');

  await child.getByRole('button', { name: 'Save message' }).click();

  await expect(rowText(main, 0)).toHaveText('saved in child');
  await expect(rowEditInput(main, 0)).toHaveCount(0);
  await expect(child.locator('.message-editor')).toHaveCount(0);
  await expect(child.locator('.message-box')).toHaveText('saved in child');
});

test('editing and cancelling in the child reverts both windows', async ({
  app,
  main,
}) => {
  await createMessage(main, 'original');
  const child = await openChildWindow(app, main, 0);

  await child.getByRole('button', { name: 'Edit message' }).click();
  await child.getByPlaceholder('Type your message').fill('discard me');
  await expect(rowEditInput(main, 0)).toHaveValue('discard me');

  await child
    .getByRole('button', { name: 'Cancel and revert changes' })
    .click();

  await expect(rowText(main, 0)).toHaveText('original');
  await expect(rowEditInput(main, 0)).toHaveCount(0);
  await expect(child.locator('.message-editor')).toHaveCount(0);
  await expect(child.locator('.message-box')).toHaveText('original');
});

test('closing the child while editing ends editing in the main window', async ({
  app,
  main,
}) => {
  // Known defect (b): App.tsx does not consume the `edit-window-closed` event,
  // so the main window stays in edit mode after the child is closed with the X.
  // Remove test.fail() once the main window handles that event.
  test.fail();

  await createMessage(main, 'original');
  const child = await openChildWindow(app, main, 0);

  await child.getByRole('button', { name: 'Edit message' }).click();
  await child.getByPlaceholder('Type your message').fill('unsaved');
  await expect(rowEditInput(main, 0)).toHaveValue('unsaved');

  await child.close();
  await expect.poll(() => app.windows().length).toBe(1);

  await expect(rowEditInput(main, 0)).toHaveCount(0);
  await expect(rowText(main, 0)).toHaveText('original');
});

test('opens at most one child per message', async ({ app, main }) => {
  await createMessage(main, 'only one');
  await openChildWindow(app, main, 0);
  expect(app.windows()).toHaveLength(2);

  // The row is in edit mode while the child is open; leave edit mode so the
  // "Edit message" button is available again, then click it a second time.
  await messageRows(main)
    .first()
    .getByRole('button', { name: 'Cancel edit' })
    .click();

  let openedAnother = false;
  app.on('window', () => {
    openedAnother = true;
  });
  await messageRows(main)
    .first()
    .getByRole('button', { name: 'Edit message' })
    .click();
  await expect(rowEditInput(main, 0)).toBeVisible();
  await main.waitForTimeout(1_000);

  expect(openedAnother).toBe(false);
  expect(app.windows()).toHaveLength(2);
});

test('children of different messages are independent', async ({
  app,
  main,
}) => {
  await createMessage(main, 'first');
  await createMessage(main, 'second');

  const firstChild = await openChildWindow(app, main, 0);
  const secondChild = await openChildWindow(app, main, 1);
  expect(app.windows()).toHaveLength(3);

  await rowEditInput(main, 0).fill('first edited');

  await expect.poll(() => childValue(firstChild)).toBe('first edited');
  await expect(rowEditInput(main, 1)).toHaveValue('second');
  // Give any stray update time to arrive before checking it did not.
  await main.waitForTimeout(500);
  expect(await childValue(secondChild)).toBe('second');
});

test('deleting a message closes its child', async ({ app, main }) => {
  await createMessage(main, 'delete me');
  await openChildWindow(app, main, 0);

  // The row is in edit mode while the child is open; leave edit mode to reach
  // the "Delete message" button.
  await messageRows(main)
    .first()
    .getByRole('button', { name: 'Cancel edit' })
    .click();
  await messageRows(main)
    .first()
    .getByRole('button', { name: 'Delete message' })
    .click();

  await expect(messageRows(main)).toHaveCount(0);
  await expect.poll(() => app.windows().length).toBe(1);
});

test('closing the main window closes all children and quits', async ({
  app,
  main,
}) => {
  await createMessage(main, 'first');
  await createMessage(main, 'second');
  const firstChild = await openChildWindow(app, main, 0);
  const secondChild = await openChildWindow(app, main, 1);

  if (process.platform === 'darwin') {
    // On macOS `window-all-closed` does not quit the app by design: every
    // window closes but the process stays alive.
    await main.close();
    await expect.poll(() => app.windows().length).toBe(0);
    expect(firstChild.isClosed()).toBe(true);
    expect(secondChild.isClosed()).toBe(true);

    const openWindows = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows().length
    );
    expect(openWindows).toBe(0);
    return;
  }

  const appClosed = app.waitForEvent('close');
  await main.close();
  await expect.poll(() => app.windows().length).toBe(0);
  await appClosed;

  expect(firstChild.isClosed()).toBe(true);
  expect(secondChild.isClosed()).toBe(true);
});
