/**
 * Local value for an input whose source of truth is the store.
 *
 * Typing updates the local value at once and reports it through `onChange`,
 * so the window that is typing never waits for the round trip to the main
 * process and no keystroke is lost. Every reported value is queued until the
 * store echoes it back: an incoming store value found in the queue is our
 * own echo and is dropped together with the older entries it supersedes;
 * any other incoming value came from another window and replaces the local
 * value. The last broadcast always wins, so every window converges on the
 * store.
 */
export const createDraftInput = (onChange) => {
  let value = '';
  let storeValue;
  let pending = [];

  return {
    get value() {
      return value;
    },

    /**
     * Feeds the current store value; call it on every render. Returns true
     * when the local value was replaced and the element must show it.
     */
    sync(nextStoreValue) {
      if (nextStoreValue === storeValue) {
        return false;
      }
      storeValue = nextStoreValue;
      const echoIndex = pending.indexOf(nextStoreValue);
      if (echoIndex !== -1) {
        pending.splice(0, echoIndex + 1);
        return false;
      }
      pending = [];
      const changed = value !== nextStoreValue;
      value = nextStoreValue;
      return changed;
    },

    /** 'input' listener of the element. */
    handleInput(event) {
      const next = event.target.value;
      value = next;
      pending.push(next);
      onChange(next);
    },
  };
};
