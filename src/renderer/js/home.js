import { hasDraft } from '../../shared/reducer.js';
import { buildRoute, ROUTES } from '../../shared/routes.js';
import { createDraftInput } from './draft-input.js';
import { actionIcon, h, setValue, syncDefaultValue } from './dom.js';
import { dispatch, getState, openWindow, subscribe } from './store.js';

const isActivationKey = (key) =>
  key === 'Enter' || key === ' ' || key === 'Spacebar';

/**
 * One row of the message table. The row element and its draft live as long
 * as the message; `update` patches the row from the state.
 */
const createMessageRow = (id, { onPreview }) => {
  const draft = createDraftInput((value) => {
    dispatch({ type: 'edit/draft', id, value });
  });

  const indexCell = h('div', { class: 'message-index' });
  const el = h('div', { class: 'message-row' }, indexCell);

  let isEditing = null;
  let message = null;
  let textCell = null;
  let input = null;

  const editCells = () => {
    input = h('input', {
      class: 'input-edit',
      type: 'text',
      onInput: (event) => {
        draft.handleInput(event);
        syncDefaultValue(event);
      },
    });
    setValue(input, draft.value);
    textCell = h('div', { class: 'message-text' }, input);
    return [
      textCell,
      h(
        'div',
        { class: 'message-action' },
        h(
          'button',
          {
            class: 'btn-icon btn-save',
            'aria-label': 'Save message',
            onClick: () => dispatch({ type: 'edit/save', id }),
          },
          actionIcon('save')
        ),
        h(
          'button',
          {
            class: 'btn-icon btn-cancel',
            'aria-label': 'Cancel edit',
            onClick: () => dispatch({ type: 'edit/cancel', id }),
          },
          actionIcon('cancel')
        )
      ),
    ];
  };

  const readCells = () => {
    input = null;
    textCell = h(
      'div',
      {
        class: 'message-text',
        role: 'button',
        tabindex: '0',
        title: 'Click to view full message',
        onClick: () => onPreview(message.value),
        onKeyDown: (event) => {
          if (isActivationKey(event.key)) {
            event.preventDefault();
            onPreview(message.value);
          }
        },
      },
      message.value
    );
    return [
      textCell,
      h(
        'div',
        { class: 'message-action' },
        h(
          'button',
          {
            class: 'btn-icon btn-edit',
            'aria-label': 'Edit message',
            // Starts editing and opens (or focuses) the child window.
            onClick: () => {
              dispatch({ type: 'edit/start', id });
              openWindow(buildRoute(ROUTES.message, { id }));
            },
          },
          actionIcon('edit')
        ),
        h(
          'button',
          {
            class: 'btn-icon btn-delete',
            'aria-label': 'Delete message',
            // The main process closes the child window of a deleted message.
            onClick: () => dispatch({ type: 'message/delete', id }),
          },
          actionIcon('trash')
        )
      ),
    ];
  };

  const update = (nextMessage, index, editing) => {
    const nextIsEditing = hasDraft(editing, id);
    const valueChanged = draft.sync(nextIsEditing ? editing[id] : '');
    const previousValue = message?.value;
    message = nextMessage;

    const indexText = `${index + 1}.`;
    if (indexCell.textContent !== indexText) {
      indexCell.textContent = indexText;
    }

    if (nextIsEditing !== isEditing) {
      isEditing = nextIsEditing;
      el.replaceChildren(indexCell, ...(isEditing ? editCells() : readCells()));
      return;
    }
    if (isEditing) {
      if (valueChanged) {
        setValue(input, draft.value);
      }
    } else if (message.value !== previousValue) {
      textCell.textContent = message.value;
    }
  };

  return { el, update };
};

/** Main window screen, route `ROUTES.home`. */
export const mountHome = (container) => {
  document.title = 'Electron Multi Window';

  // Create form
  const input = h('input', {
    placeholder: 'Type here.',
    class: 'input-field',
    type: 'text',
    onInput: syncDefaultValue,
  });
  setValue(input, '');
  const form = h(
    'form',
    {
      onSubmit: (event) => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) {
          return;
        }
        dispatch({ type: 'message/create', value });
        setValue(input, '');
      },
    },
    input,
    h('button', { type: 'submit', class: 'btn-submit' }, 'Create a Message')
  );

  // Message table
  const noMessages = h('h4', { class: 'no_messages_yet' }, 'No messages yet!');
  const header = h(
    'div',
    { class: 'messages-header' },
    h('div', {}, 'Index'),
    h('div', {}, 'Message'),
    // Keep header width consistent with CSS (.message-row > div.message-action)
    h('div', { style: { width: '96px' } }, 'Action')
  );
  const grid = h('div', { class: 'messages-grid' }, header);
  const display = h(
    'div',
    { class: 'message-display' },
    h('h2', {}, 'Last Messages:'),
    noMessages
  );

  const app = h('div', { class: 'app-container' }, h('h1', {}, 'Type Something:'), form, display);
  container.append(app);

  // Modal with the full message
  let modal = null;

  const closeModal = () => {
    modal?.remove();
    modal = null;
  };

  const openModal = (text) => {
    closeModal();
    modal = h(
      'div',
      { class: 'modal-overlay open', onClick: closeModal },
      h(
        'div',
        { class: 'modal-content', onClick: (event) => event.stopPropagation() },
        h('button', { class: 'modal-close', 'aria-label': 'Close', onClick: closeModal }, '×'),
        h('div', { class: 'modal-message-body' }, text)
      )
    );
    app.append(modal);
  };

  // close modal on ESC
  const onKey = (event) => {
    if (event.key === 'Escape' && modal) closeModal();
  };
  window.addEventListener('keydown', onKey);

  // Rows keyed by message id. They are dropped with the table when the last
  // message goes, like the React rows unmount with it.
  const rows = new Map();

  const render = ({ messages, editing }) => {
    if (messages.length === 0) {
      rows.clear();
      grid.replaceChildren(header);
      if (grid.isConnected) {
        grid.replaceWith(noMessages);
      }
      return;
    }
    if (noMessages.isConnected) {
      noMessages.replaceWith(grid);
    }

    const ids = new Set(messages.map((message) => message.id));
    for (const [id, row] of rows) {
      if (!ids.has(id)) {
        row.el.remove();
        rows.delete(id);
      }
    }

    messages.forEach((message, index) => {
      let row = rows.get(message.id);
      if (!row) {
        row = createMessageRow(message.id, { onPreview: openModal });
        rows.set(message.id, row);
      }
      row.update(message, index, editing);
      // The header is child 0. Move a row only when it is out of place, so a
      // focused input is not detached.
      if (grid.children[index + 1] !== row.el) {
        grid.insertBefore(row.el, grid.children[index + 1] ?? null);
      }
    });
  };

  render(getState());
  const unsubscribe = subscribe(render);

  return {
    destroy() {
      unsubscribe();
      window.removeEventListener('keydown', onKey);
    },
  };
};
