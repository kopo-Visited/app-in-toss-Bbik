module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat','fix','refactor','test','docs','chore']],
    'scope-empty': [2, 'never'],          // 스코프(F-ID/BL-ID) 필수
    'subject-case': [0],
  },
};
