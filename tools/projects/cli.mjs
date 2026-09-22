const HELP = `
Pet Projects CLI — управление модулями проектов (src/projects/<id>).

Usage:
  pnpm project <command> [args]

Commands:
  list                       список проектов
  validate [id]              проверить все проекты или один
  export <id>                экспортировать модуль в zip-архив ./<id>.project
  import <file.project>      импортировать архив в src/projects/<id>
                             (--force — перезаписать существующий проект)
  remove <id>                удалить модуль проекта из src/projects

Examples:
  pnpm project list
  pnpm project validate lens
  pnpm project export lens
  pnpm project remove lens
  pnpm project import lens.project
`;

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || ["help", "--help", "-h"].includes(args[0])) {
    console.log(HELP);
    return;
  }
  const [cmd, ...rest] = args;
  const { default: run } = await import(`./${cmd}.mjs`);
  try {
    await run(rest);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  }
}

main();