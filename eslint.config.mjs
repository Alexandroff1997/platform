import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          // Матрица границ между сервисами:
          // - проекты, не подошедшие ни под один constraint, не могут зависеть ни от кого
          //   (правило Nx сообщает projectWithoutTagsCannotHaveDependencies) — будущий сервис
          //   обязан явно объявить свой constraint;
          // - импорт приложения из другого проекта запрещён самим правилом (noImportsOfApps),
          //   поэтому отдельный constraint для type:app не нужен и вреден: он не позволил бы
          //   приложению зависеть от библиотек собственного scope.
          depConstraints: [
            {
              // Общие контракты не тянут сервисный код.
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared', 'type:contracts'],
            },
            {
              // Сервис account: свои библиотеки + общие контракты, чужие сервисные scope — запрещены.
              sourceTag: 'scope:account',
              onlyDependOnLibsWithTags: [
                'scope:account',
                'scope:shared',
                'type:contracts',
              ],
            },
            {
              // Библиотеки контрактов (в любом scope) зависят только от общих контрактов.
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['scope:shared', 'type:contracts'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
