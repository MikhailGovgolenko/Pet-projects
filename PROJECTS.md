# Pet Projects — модульная архитектура

Каждый пет-проект — самодостаточный модуль в `src/projects/<id>/`. Сайт собирает их
автоматически через «реестр» (`src/projects/index.ts`): достаточно создать папку проекта —
карточка, страница `/id`, SEO-теги и sitemap появятся сами. Удалить — удалить папку
(или использовать `pnpm project remove`).

## Структура модуля

```
src/projects/<id>/
├── manifest.json        # метаданные проекта (JSON, не код) — обязателен
├── index.tsx            # точка входа модуля (default export ProjectModule) — обязателен
├── <Page>.tsx           # страница проекта
├── i18n/
│   ├── ru.ts            # переводы `card.<id>.*`, `app.*`, ... 
│   └── en.ts
├── assets/              # картинки/ресурсы. preview-light.png / preview-dark.png =
│                        #   превью карточки; остальное (ogImage) — для og:image
└── styles.css           # стили, специфичные для проекта (импортируются из index.tsx)
```

### manifest.json

```json
{
  "formatVersion": 1,
  "apiVersion": 1,
  "id": "my-project",
  "route": "/my-project",
  "title": "Человекочитаемое название",
  "description": "Описание для карточки и SEO",
  "icon": "🏷️",
  "ogImage": "preview-light.png"
}
```

- `id` совпадает с именем папки (валидатор ругается на расхождение).
- `route` всегда `/<id>`.
- `ogImage` опционален; указывает файл в `assets/`, который станет `og:image`
  (`/projects/<id>/assets/<file>`). Если не задан — используется общая `og-image.png`.
- `icon` — эмодзи-иконка карточки (используется, когда нет preview-картинок).
- `formatVersion` / `apiVersion` — версии формата `.project` (сейчас `1`).

### index.tsx

```tsx
import { lazy } from "react";
import type { ProjectModule } from "../../core/types";
import { ru } from "./i18n/ru";
import { en } from "./i18n/en";
import manifest from "./manifest.json";
import "./styles.css";              // если нужно

const Page = lazy(() => import("./MyProjectPage"));

const project: ProjectModule = {
  manifest,
  Page,
  translations: { ru, en },
};

export default project;
```

### i18n

Минимум для карточки:

```ts
export const ru = {
  "card.my-project.title": "Мой проект",
  "card.my-project.desc": "Краткое описание для карточки.",
};
```

Если проект использует `useI18n()` на странице — свои ключи тоже здесь.
Все переводы доступны через единый контекст (`src/core/i18n.tsx`): переводы проектов
мержатся поверх общих словарей `coreRu` / `coreEn` при старте приложения.

### Превью карточки

Если в `assets/` лежат `preview-light.png` и/или `preview-dark.png`, карточка показывает
hero-картинку; иначе — иконку из `manifest.icon`.

## Общее (вне модулей)

- `src/core/` — общая инфраструктура: `theme.css`, `i18n.tsx` (провайдер переводов),
  `seo.ts`, `types.ts`, `HomePage.tsx`.
- `src/components/` — только действительно глобальные компоненты (напр. `DebugOverlay`).
  Внутренние компоненты проекта живут в самом модуле.

## CLI: `pnpm project <command>`

| Команда               | Описание                                             |
| --------------------- | ---------------------------------------------------- |
| `pnpm project list`   | список проектов из реестра                           |
| `pnpm project validate [id]` | проверка всех проектов или одного              |
| `pnpm project export <id>`   | упаковать модуль в zip-архив `./<id>.project`  |
| `pnpm project import <file.project>` | распаковать архив в `src/projects/<id>` (используйте `--force` для перезаписи) |
| `pnpm project remove <id>` | удалить модуль проекта из `src/projects`          |

## Формат `.project`

`.project` — обычный ZIP (создаётся через `fflate`), внутри — файлы модуля, включая
`manifest.json`. Формат версионируется:

- `formatVersion` — формат упаковки/структуры архива.
- `apiVersion` — совместимость контракта модуля (i18n, типы `core/types.ts`).

Импорт защищён:

- проверяются `formatVersion` / `apiVersion`; неподходящие версии отклоняются;
- нельзя импортировать поверх существующего проекта без `--force`;
- путей-записей за пределы `src/projects/<id>` (path traversal) отклоняются;
- требуется корректный `id` (нижний регистр, цифры, дефисы).

## Сборка и SEO

`vite.config.ts` на этапе `closeBundle`:

- читает `manifest.json` всех проектов через `fs` (без `import.meta.glob` — он недоступен в конфиге);
- генерирует `dist/<route>/index.html` для каждой страницы с уникальными OG-тегами;
- копирует `src/projects/<id>/assets/*` в `dist/projects/<id>/assets/` (для `og:image`);
- пишет `dist/sitemap.xml` из реестра (порядок — алфавитный по `id`).

Рантайм-реестр (`src/projects/index.ts`) использует `import.meta.glob("./*/index.tsx", { eager: true })`,
поэтому новые/удалённые папки подхватываются без правки файлов. Валидация соответствия
папки и `id` в manifest происходит на сборке и в `pnpm project validate`.

## Чеклист нового проекта

1. `mkdir src/projects/<id>` + `manifest.json` + `index.tsx` + `i18n/*` + страницу.
2. (если нужно) `assets/preview-{light,dark}.png` для карточки.
3. `pnpm project validate <id>` — должно быть `ok`.
4. `pnpm build` — SEO-страница `/id`, sitemap и og:image появились автоматически.