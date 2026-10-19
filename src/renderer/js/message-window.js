import { hasDraft } from '../../shared/reducer.js';
import { createDraftInput } from './draft-input.js';
import { actionIcon, h, setValue, syncDefaultValue } from './dom.js';
import { dispatch, getState, subscribe } from './store.js';

/** Child window screen, route `ROUTES.message`; `messageId` comes from it. */
export const mountMessageWindow = (container, messageId) => {
  document.title = 'Edit Message';

  const draft = createDraftInput((value) => {
    dispatch({ type: 'edit/draft', id: messageId, value });
  });

  const messageBox = h('div');
  const actions = h('div', { class: 'newWindow-actions' });
  container.append(
    h('div', { class: 'newWindow-container' }, h('h1', {}, 'User Message'), messageBox, actions)
  );

  let editor = null;
  let isEditing = null;
  let userMessage = null;
  let lockedHeight = null;
  // Height of the box in read mode, kept so edit mode does not shrink it.
  let readHeight = null;

  const iconButton = (className, label, iconName, onClick) =>
    h(
      'button',
      { type: 'button', class: `btn-icon ${className}`, 'aria-label': label, onClick },
      actionIcon(iconName)
    );

  const applyLockedHeight = () => {
    const minHeight = lockedHeight ? `${lockedHeight}px` : '';
    messageBox.style.minHeight = minHeight;
    if (editor) {
      editor.style.minHeight = minHeight;
    }
  };

  const showMode = () => {
    messageBox.className = `message-box ${isEditing ? 'editing' : ''}`;
    if (isEditing) {
      editor = h('textarea', {
        class: 'message-editor',
        placeholder: 'Type your message',
        onInput: (event) => {
          draft.handleInput(event);
          syncDefaultValue(event);
        },
      });
      setValue(editor, draft.value);
      messageBox.replaceChildren(editor);
      actions.replaceChildren(
        iconButton('btn-save', 'Save message', 'save', () =>
          dispatch({ type: 'edit/save', id: messageId })
        ),
        iconButton('btn-cancel', 'Cancel and revert changes', 'cancel', () =>
          dispatch({ type: 'edit/cancel', id: messageId })
        )
      );
      editor.focus();
    } else {
      editor = null;
      messageBox.replaceChildren(userMessage || 'No messages received.');
      actions.replaceChildren(
        iconButton('btn-edit', 'Edit message', 'edit', () =>
          dispatch({ type: 'edit/start', id: messageId })
        )
      );
    }
  };

  // Everything is derived from the store. If the message is deleted the
  // window shows nothing; the main process closes it anyway.
  const render = (state) => {
    const message = state.messages.find((item) => item.id === messageId);
    const nextMessage = message?.value ?? '';
    const nextIsEditing = hasDraft(state.editing, messageId);
    const valueChanged = draft.sync(nextIsEditing ? state.editing[messageId] : '');

    const modeChanged = nextIsEditing !== isEditing;
    const messageChanged = nextMessage !== userMessage;
    isEditing = nextIsEditing;
    userMessage = nextMessage;

    if (modeChanged) {
      showMode();
    } else if (isEditing && valueChanged) {
      setValue(editor, draft.value);
    } else if (!isEditing && messageChanged) {
      messageBox.replaceChildren(userMessage || 'No messages received.');
    }

    if (modeChanged || messageChanged) {
      if (isEditing) {
        lockedHeight = lockedHeight ?? readHeight;
        applyLockedHeight();
      } else {
        lockedHeight = null;
        applyLockedHeight();
        readHeight = messageBox.clientHeight;
      }
    }

    if (modeChanged && isEditing) {
      const current = editor;
      window.requestAnimationFrame(() => {
        current.scrollTop = 0;
      });
    }

    if (!isEditing && (modeChanged || messageChanged)) {
      messageBox.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  };

  render(getState());
  const unsubscribe = subscribe(render);

  return {
    destroy() {
      unsubscribe();
    },
  };
};
