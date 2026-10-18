import { useLayoutEffect, useRef, useState, type ChangeEvent } from 'react';

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
export const useDraftInput = (
  storeValue: string,
  onChange: (value: string) => void
) => {
  const [value, setValue] = useState(storeValue);
  const pending = useRef<string[]>([]);

  // Layout effect so a value coming from the store is painted in the same
  // frame as the state it belongs to.
  useLayoutEffect(() => {
    const echoIndex = pending.current.indexOf(storeValue);
    if (echoIndex !== -1) {
      pending.current.splice(0, echoIndex + 1);
      return;
    }
    pending.current = [];
    setValue(storeValue);
  }, [storeValue]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const next = event.target.value;
    setValue(next);
    pending.current.push(next);
    onChange(next);
  };

  return { value, handleChange };
};
