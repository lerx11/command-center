# COMMAND CENTER — PWA: план реализации

## Контекст

Создаём с нуля PWA-приложение **COMMAND CENTER** — персональную систему фокус-менеджмента: «ONE DAY → ONE BIG WIN → ONE CURRENT FOCUS». Цель — помогать человеку с множеством проектов/идей каждый день видеть главное, выбрать одно действие и реально его закончить, не распыляясь. Рабочая директория пуста — проект с нуля.

Принципы V1 (от пользователя): простота, без overengineering; Supabase + RLS с самого начала; данные в облаке, не в localStorage; premium command-center UX; основной цикл `OPEN → TODAY → CHOOSE → FOCUS → FINISH → REVIEW`; новые идеи идут в Parking Lot, а не в Today; никаких AI/Telegram/календаря/команд/CRM/платежей; миграции + индексы + RLS; проверка auth/persistence/CRUD/RLS/mobile/PWA; в конце — объяснить что построено и шаги Supabase-сетапа.

Решения после уточнений:
- **Дизайн:** premium minimalist по спеке (dark mode основной, много воздуха, ограниченные цвета, акцент только на важных состояниях).
- **Supabase:** `.env.example` с плейсхолдерами; пользователь подключит свой проект позже.
- **PWA-иконки:** сгенерировать AI-иконку COMMAND CENTER (192/512/maskable).

## Технологии и ключевые паттерны

- **Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui (new-york style).**
- **Supabase SSR auth** через `@supabase/ssr` (auth-helpers устарел). Cookie-методы строго `getAll`/`setAll`; `cookies()` асинхронный; для авторизации — `auth.getUser()`, не `getSession()`.
- **Мутации — Server Actions** (`'use server'`), через серверный клиент Supabase.
- **Профиль создаётся DB-триггером** `handle_new_user` (`SECURITY DEFINER`, `set search_path=''`) на `auth.users AFTER INSERT`.
- **PWA через Serwist** (`@serwist/next`) — `next-pwa` устарел для App Router. Прекэш + офлайн-фолбэк `/~offline`.
- **Миграции:** и консолидированный `supabase/schema.sql` (для SQL Editor — самый портативный), и таймштампованные `supabase/migrations/*.sql` (для CLI-воркфлоу).
- **Тема:** `next-themes` (`attribute="class"`, `suppressHydrationWarning` на `<html>`).
- **Формы:** react-hook-form + zod.
- **Toast-фидбек:** shadcn `sonner`.
- Env: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (по спеке; оба работают с `@supabase/ssr`).

## Структура проекта

```
task/
├── .env.example
├── next.config.mjs                      # обёрнут withSerwist
├── middleware.ts                        # делегирует в utils/supabase/middleware.ts
├── components.json                      # shadcn new-york
├── app/
│   ├── (auth)/{login,register,forgot-password,reset-password,onboarding}/page.tsx
│   ├── app/
│   │   ├── layout.tsx                   # auth guard + AppShell (sidebar/bottom-nav)
│   │   ├── today/page.tsx              # COMMAND CENTER (главный)
│   │   ├── focus/page.tsx              # Focus Mode
│   │   ├── projects/page.tsx + [id]/page.tsx
│   │   ├── parking/page.tsx
│   │   ├── review/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── settings/page.tsx
│   ├── manifest.ts                      # MetadataRoute.Manifest
│   ├── sw.ts                            # Serwist-воркер
│   ├── ~offline/page.tsx               # офлайн-фолбэк
│   ├── layout.tsx                       # root + ThemeProvider + Toaster
│   └── globals.css                      # tailwind v4 + тема (dark primary)
├── utils/supabase/{client.ts,server.ts,middleware.ts}
├── components/
│   ├── ui/                              # shadcn: button,card,dialog,input,select,dropdown-menu,sonner,checkbox,skeleton,badge,textarea,tooltip,form,label
│   ├── layout/{app-shell.tsx,sidebar.tsx,bottom-nav.tsx,quick-capture-fab.tsx}
│   ├── today/{cash-target.tsx, big-win-card.tsx, money-card.tsx, asset-card.tsx, energy-section.tsx, current-focus.tsx}
│   ├── focus/{focus-timer.tsx}
│   ├── parking/{parking-idea-card.tsx, new-idea-dialog.tsx}
│   ├── projects/{project-card.tsx, project-form.tsx, active-limit-dialog.tsx}
│   ├── tasks/{task-form.tsx, task-card.tsx, task-menu.tsx}
│   ├── review/{done-today-list.tsx, money-moved-input.tsx, reflections-inputs.tsx, what-to-move.tsx, plan-tomorrow.tsx}
│   ├── shared/{empty-state.tsx, loading.tsx, error-state.tsx}
│   └── command-center/command-center-header.tsx
├── lib/
│   ├── utils.ts                         # cn()
│   ├── constants.ts                     # enums (ProjectCategory, TaskType, Priority, Status…)
│   └── validations.ts                  # zod-схемы для всех форм
├── hooks/
│   ├── use-keyboard-shortcuts.ts        # N/F/P/T/R/Esc/Space
│   └── use-focus-timer.ts               # start/pause/resume/complete, persist focus_session
├── supabase/
│   ├── schema.sql                       # консолидированный (для SQL Editor)
│   └── migrations/
│       ├── 0001_profiles.sql            # profiles + handle_new_user trigger
│       ├── 0002_cash_targets.sql        # добавлено: финансовый блок (по спеке §9)
│       ├── 0003_projects.sql
│       ├── 0004_tasks.sql
│       ├── 0005_daily_plans.sql
│       ├── 0006_energy_tasks.sql
│       ├── 0007_parking_ideas.sql
│       ├── 0008_focus_sessions.sql
│       ├── 0009_daily_reviews.sql
│       ├── 0010_indexes.sql             # все индексы из §5
│       ├── 0011_rls_policies.sql        # RLS + policies для всех таблиц
│       └── 0012_foreign_keys.sql        # FK-связи (или внутри каждой таблицы)
└── public/icons/                         # сгенерированные PWA-иконки
```

> Примечание: `cash_targets` — таблица не указана в спеке явно, но §9 (CASH TARGET с min/max/получено/в работе/ожидается) и §3 (изоляция «финансовых показателей») требуют персистентности + RLS. Добавляю как минимальную таблицу: `id, user_id, period, min_target, max_target, received, in_progress, expected, created_at, updated_at`.

## Этапы реализации (по спеке §48, сгруппированы для эффективности)

### Этап A — Фундамент (спека-фазы 1–4)
1. `package.json`, tsconfig, `next.config.mjs` (Serwist), Tailwind v4, PostCSS, `components.json`, `globals.css` (dark primary + light), `.env.example`, `.gitignore`.
2. `utils/supabase/{client,server,middleware}.ts` + `middleware.ts` (редирект неавторизованных с `/app/*` на `/login`, обновление сессии).
3. SQL-миграции: все 8 таблиц спеки + `cash_targets` + индексы (§5) + RLS-policies (§6) + FK + триггер `handle_new_user`. `supabase/schema.sql` (консолидированный) + `supabase/migrations/*.sql`.
4. `app/layout.tsx` (root: ThemeProvider + Toaster + html dark), `app/page.tsx` (редирект `/`→`/app/today` или `/login`).
5. Auth-страницы: login/register/forgot-password/reset-password (react-hook-form + zod + Server Actions). Session persistence — через cookies Supabase SSR (авто-восстановление).
6. Onboarding-флоу (§42): welcome → ONE BIG WIN → MONEY → ASSET → открытие Today.

### Этап B — Сущности (фазы 5–6)
7. Projects: список по категориям (CASH_NOW/CASH_ENGINE/ASSET/PARKING), карточка, форма, лимит 3 активных (§18, soft-warning), страница проекта (§19), действия Pause/Park/Complete.
8. Tasks: форма (§20, типы Big Win/Money/Asset/Energy/Other + приоритеты), CRUD, переход в Today/Project/Park после создания. Server Actions для всех мутаций.

### Этап C — Главный экран (фазы 7–8)
9. `/app/today` = COMMAND CENTER: хедер + дата, Cash Target (§9), TODAY-блок (§10): ONE BIG WIN / MONEY / ASSET карточки с ▶Focus/✓Done/•••-меню (Edit/Move/Delete/Park), ENERGY (§11) — BODY/MIND/RECOVERY чекбоксы.
10. Current Focus (§12): кнопка «▶ СЕЙЧАС ДЕЛАЮ» → выбор задачи → Focus Mode.
11. `/app/focus` (§13–14): минималистичный FOCUS с названием задачи, таймером `00:27:41`, Pause/Resume/Complete/Exit. `use-focus-timer.ts` сохраняет `focus_sessions` (task_id, started_at, ended_at, duration_seconds) по Complete, короткий toast «Focus session completed.»
12. Авто-логика нового дня (§24): создание `daily_plans` на новую дату, если нет; НЕ перенос вчерашних задач; предложение выбрать задачи на сегодня.

### Этап D — Capture & Review (фазы 9–10)
13. Parking Lot (§15–16): глобальная кнопка «+»/Quick Capture (§21) → «Что пришло в голову?» → Save Idea → только в Parking. `/app/parking` со списком (название/дата/проект/статус) + Convert to Task (TODAY/PROJECT/LATER) / Move to Project / Delete.
14. `/app/review` (§22–23): DONE TODAY (выполненные), MONEY MOVED (₽), WHAT WORKED?, WHAT DISTRACTED?, WHAT TO MOVE? (незавершённые → Move to tomorrow/project/park/delete), PLAN TOMORROW (ONE BIG WIN/MONEY/ASSET/ENERGY×3). После сохранения — следующий день открывается с этим планом.

### Этап E — Polish (фазы 11–14)
15. `/app/dashboard` (§25): Today/This Week — Big Wins completed, Money actions completed, Tasks completed, Focus time, Money moved. Простой weekly progress, без перегруженных графиков.
16. `/app/settings` (§26): profile (name/email), theme (Dark/Light/System), Logout. Архитектура допускает будущее расширение (Notifications/Telegram/Calendar), но не реализуем.
17. PWA (§34): `app/manifest.ts`, сгенерированные AI-иконки (192/512/maskable), Serwist service worker, офлайн-фолбэк `/~offline`, viewport meta.
18. Responsive (§35): desktop sidebar + mobile bottom-nav (Today/Focus/Projects/Parking + кнопка «+»). Today/Focus/Quick Capture идеально на телефоне.
19. Visual polish (§28–31, §33): empty states (§30), loading/error/saving/saved-состояния (§36), feedback toasts (§31), keyboard shortcuts (§33): N/F/P/T/R/Esc/Space — без перехвата в input/textarea.
20. AppShell-навигация (§27): sidebar COMMAND CENTER/Today/Focus/Projects/Parking/Review/Dashboard/Settings; mobile bottom-nav Today/Focus/Projects/Parking + FAB.

## Критичные файлы (представители паттернов)

- `utils/supabase/server.ts` — серверный клиент (async cookies, getAll/setAll).
- `utils/supabase/middleware.ts` + `middleware.ts` — `updateSession`, `getUser()`, redirect `/app/*`→`/login`.
- `app/app/layout.tsx` — auth guard (Server Component: `getUser()`, redirect если нет).
- `supabase/migrations/0001_profiles.sql` — `handle_new_user` триггер (`SECURITY DEFINER`, `search_path=''`).
- `supabase/migrations/0011_rls_policies.sql` — все RLS-policies (`user_id = auth.uid()` для SELECT/INSERT/UPDATE/DELETE).
- `app/app/today/page.tsx` — COMMAND CENTER, главный экран.
- `app/app/focus/page.tsx` + `hooks/use-focus-timer.ts` — Focus Mode + persist focus_session.
- `next.config.mjs` — `withSerwist`.
- `lib/validations.ts` — zod-схемы.
- `lib/constants.ts` — enums (types/statuses/priorities), совпадающие с SQL-CONSTRAINT-ами.

## RLS-изоляция (критично, §3, §38)

Все пользовательские таблицы (`profiles, projects, tasks, daily_plans, energy_tasks, parking_ideas, focus_sessions, daily_reviews, cash_targets`) получают:
- `enable row level security;`
- 4 policies на каждую (SELECT/INSERT/UPDATE/DELETE) с `using (user_id = auth.uid())` и `with check (user_id = auth.uid())`. Профиль — по `id = auth.uid()`.
- INSERT-policies должны позволять пользователю ставить `user_id = auth.uid()` (валидация в `with check`).

Много-пользовательский тест (§38): USER A и USER B не видят данные друг друга — обеспечивается RLS, не клиент-сайд фильтрацией.

## Верификация (по спеке §49)

После каждой крупной функции проверять, что прежний функционал работает. Финальная проверка:
1. **Auth:** register → login → logout → forgot-password → reset-password; session persist после закрытия браузера.
2. **CRUD:** создание/редактирование/удаление/выполнение tasks и projects.
3. **Persistence:** создать задачу → refresh → задача на месте; закрыть/открыть браузер → login → задача на месте (§37).
4. **RLS-изоляция:** USER A создаёт Project/Task/Parking/Review; USER B регистрируется и НЕ видит ничего; данные USER A неизменны (§38).
5. **Focus:** Start/Pause/Resume/Complete → `focus_sessions` сохранён, toast подтверждает.
6. **Mobile UX:** Today, Focus Mode, Quick Capture работают на телефоне.
7. **PWA:** installable, manifest валиден, иконки отображаются, service worker активен, офлайн-фолбэк работает.
8. **Empty/loading/error states:** корректные состояния во всех критичных местах.

Запуск: `pnpm install` → пользователь заполняет `.env.local` из `.env.example` (URL+anon key своего Supabase-проекта) → выполняет `supabase/schema.sql` в SQL Editor → `pnpm dev`.

## Итоговый отчёт пользователю

В конце — краткое объяснение: что построено, какие роуты, структура БД, и точные шаги Supabase-сетапа (создать проект → скопировать URL+anon key в `.env.local` → выполнить `supabase/schema.sql` в SQL Editor → `pnpm dev`).
