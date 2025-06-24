#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug() {
    [ "$HUSKY_DEBUG" = "true" ] && echo "husky: $*"
  }
  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."
  if [ "$HUSKY" = "skip" ]; then
    debug "HUSKY is set to skip, skipping hook"
    exit 0
  fi
  if [ -f ~/.huskyrc ]; then
    debug "source ~/.huskyrc"
    . ~/.huskyrc
  fi
  export husky_skip_init=1
  sh "$0" "$@"
  exit $?
fi
