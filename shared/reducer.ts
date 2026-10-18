import type { Action, AppState } from './ipc';

export const initialState: AppState = { messages: [], editing: {} };

/**
 * Actions as the reducer sees them. The only difference from the IPC `Action`
 * is that `message/create` carries the id the main process generated, which
 * keeps the reducer pure.
 */
export type ReducerAction =
  | Exclude<Action, { type: 'message/create' }>
  | { type: 'message/create'; id: string; value: string };

const hasMessage = (state: AppState, id: string) =>
  state.messages.some((message) => message.id === id);

/**
 * Whether a draft exists for `id`. An own-property check, so ids that happen
 * to be `Object.prototype` keys (`toString`, `constructor`) are unknown.
 */
export const hasDraft = (editing: AppState['editing'], id: string) =>
  Object.prototype.hasOwnProperty.call(editing, id);

const withoutDraft = (editing: AppState['editing'], id: string) => {
  const { [id]: _removed, ...rest } = editing;
  return rest;
};

/**
 * Pure state transition. Returns the same `state` reference when the action
 * changes nothing, so callers can skip broadcasting. Actions that target an
 * unknown message id are ignored.
 */
export const reducer = (state: AppState, action: ReducerAction): AppState => {
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
