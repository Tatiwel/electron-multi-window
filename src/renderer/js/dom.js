/**
 * Creates an element. `props` keys:
 *   on<Event>  listener, e.g. onClick → 'click'
 *   style      object of style properties
 *   anything else is set as an attribute, skipped when null or false
 * `children` are nodes or strings.
 */
export const h = (tag, props = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) {
      continue;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'style') {
      Object.assign(el.style, value);
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  el.append(...children);
  return el;
};

/** Path of an icon in src/renderer/assets/icons, relative to index.html. */
export const icon = (name) => `./assets/icons/${name}-icon.svg`;

/** The `<img>` every icon button holds. */
export const actionIcon = (name) =>
  h('img', { alt: '', class: 'action-icon', src: icon(name) });

/**
 * Sets the value of an input or textarea the way React does for a controlled
 * one: the property, and also the default value (the `value` attribute of an
 * input, the text of a textarea), so the markup matches the React version.
 */
export const setValue = (el, value) => {
  if (el.value !== value) {
    el.value = value;
  }
  // Always assigned: an input without a `value` attribute already reports
  // '' as its default value, and React still writes value="".
  el.defaultValue = value;
};

/** 'input' listener that keeps the default value in step with typing. */
export const syncDefaultValue = (event) => {
  setValue(event.target, event.target.value);
};
