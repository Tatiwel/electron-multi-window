#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky (debug) -" "$@"
  }

  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."
  if [ "$HUSKY" = "skip" ]; then
    debug "HUSKY env variable is set to skip hooks"
    exit 0
  fi
  if [ -r "~/.huskyrc" ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi
  readonly husky_skip_init=1
  export husky_skip_init
  sh -e "$(dirname "$0")/../$hook_name" "$@"
  exit $?
fi
