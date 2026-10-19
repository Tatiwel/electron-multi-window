export const initialState = Object.freeze({ messages: [], editing: {} });

/*
 * The reducer sees the IPC actions (see `ipc.js`) with one difference:
 * `message/create` carries the id the main process generated, which keeps
 * the reducer pure.
 */

const hasMessage = (state, id) =>
  state.messages.some((message) => message.id === id);

/**
 * Whether a draft exists for `id`. An own-property check, so ids that happen
 * to be `Object.prototype` keys (`toString`, `constructor`) are unknown.
 */
export const hasDraft = (editing, id) =>
  Object.prototype.hasOwnProperty.call(editing, id);

const withoutDraft = (editing, id) => {
  const { [id]: _removed, ...rest } = editing;
  return rest;
};

/**
 * Pure state transition. Returns the same `state` reference when the action
 * changes nothing, so callers can skip broadcasting. Actions that target an
 * unknown message id are ignored.
 */
export const reducer = (state, action) => {
  switch (action.type) {
    case 'message/create': {
      const value = action.value.trim();
      if (!value || hasMessage(state, action.id)) {
        return state;
      }
      return {
        ...state,
        messages: [...state.messages, { id: action.id, value }],
      };
    }
    case 'message/delete': {
      if (!hasMessage(state, action.id)) {
        return state;
      }
      return {
        messages: state.messages.filter((message) => message.id !== action.id),
        editing: withoutDraft(state.editing, action.id),
      };
    }
    case 'edit/start': {
      const message = state.messages.find((item) => item.id === action.id);
      if (!message || hasDraft(state.editing, action.id)) {
        return state;
      }
      return {
        ...state,
        editing: { ...state.editing, [action.id]: message.value },
      };
    }
    case 'edit/draft': {
      if (
        !hasDraft(state.editing, action.id) ||
        state.editing[action.id] === action.value
      ) {
        return state;
      }
      return {
        ...state,
        editing: { ...state.editing, [action.id]: action.value },
      };
    }
    case 'edit/save': {
      if (!hasDraft(state.editing, action.id)) {
        return state;
      }
      const value = state.editing[action.id];
      return {
        messages: state.messages.map((message) =>
          message.id === action.id ? { ...message, value } : message
        ),
        editing: withoutDraft(state.editing, action.id),
      };
    }
    case 'edit/cancel': {
      if (!hasDraft(state.editing, action.id)) {
        return state;
      }
      return { ...state, editing: withoutDraft(state.editing, action.id) };
    }
    default:
      return state;
  }
};
