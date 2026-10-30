import path from 'node:path';
import {
  _electron,
  expect,
  test as base,
  type ElectronApplication,
  type Page,
} from '@playwright/test';

const projectRoot = path.resolve(import.meta.dirname, '../..');

type Fixtures = {
  app: ElectronApplication;
  main: Page;
};

export const test = base.extend<Fixtures>({
  app: async ({}, use) => {
    // Without VITE_DEV_SERVER_URL the app loads the built files from dist/.
    // process.env never holds undefined values at runtime; the cast only
    // narrows its index signature to what launch() accepts.
    const env = { ...process.env } as Record<string, string>;
    delete env.VITE_DEV_SERVER_URL;

    const app = await _electron.launch({
      args: ['.'],
      cwd: projectRoot,
      env,
    });
    await use(app);
    await app.close();
  },
  main: async ({ app }, use) => {
    const main = await app.firstWindow();
    await main.waitForLoadState('domcontentloaded');
    await expect(main.locator('h1')).toBeVisible();
    await use(main);
  },
});

export { expect };

export const messageRows = (main: Page) => main.locator('.message-row');

export const createMessage = async (main: Page, text: string) => {
  await main.getByPlaceholder('Type here.').fill(text);
  await main.getByRole('button', { name: 'Create a Message' }).click();
};

export const openChildWindow = async (
  app: ElectronApplication,
  main: Page,
  rowIndex: number
): Promise<Page> => {
  const [child] = await Promise.all([
    app.waitForEvent('window'),
    messageRows(main)
      .nth(rowIndex)
      .getByRole('button', { name: 'Edit message' })
      .click(),
  ]);
  await child.waitForLoadState('domcontentloaded');
  await expect(child).toHaveTitle('Edit Message');
  return child;
};
