module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'prefix-required': ({ raw }) => [
          /^(feat|fix|chore|refactor):/.test(raw),
          'missing prefix. Use "fix:", "feat:", "chore:", or "refactor:"',
        ],
      },
    },
  ],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'refactor']],
    'prefix-required': [2, 'always'],
  },
};
