import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Info, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'testflow-onboarding-seen-pages-v1';

export function resetOnboardingSeenPages() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('testflow:onboarding-reset'));
}

export function restartOnboardingForCurrentPage() {
  window.dispatchEvent(new CustomEvent('testflow:onboarding-restart-current-page'));
}

const PAGE_TOUR_CONTENT = {
  Dashboard: {
    title: 'Панель управления',
    description: 'Здесь пользователь видит общую картину: активность команды, статус тестирования и ключевые метрики.',
  },
  Projects: {
    title: 'Проекты',
    description: 'Сначала создайте проект команды. Уже внутри проекта будут свои кейсы, модули и контуры вроде Web или API.',
    steps: [
      {
        key: 'projects-create',
        icon: Sparkles,
        title: 'Сначала создайте проект',
        description: 'Новый пользователь обычно начинает здесь: создаёт проект команды, например продукт, систему или сервис.',
        selectors: ['[data-onboarding-projects-create]'],
      },
      {
        key: 'projects-cards',
        icon: Info,
        title: 'Карточки проектов',
        description: 'Каждая карточка — отдельный проект. Отсюда удобно редактировать проект и проверять, сколько кейсов уже заведено.',
        selectors: ['[data-onboarding-projects-list]'],
      },
    ],
  },
  Repository: {
    title: 'Репозиторий',
    description: 'Здесь хранится база тест-кейсов. Сначала выберите проект, затем нужный модуль, и только потом работайте с кейсами.',
    steps: [
      {
        key: 'repository-projects',
        icon: Info,
        title: '1. Выберите проект',
        description: 'Сначала выберите проект команды. После этого система покажет только модули и кейсы этого проекта.',
        selectors: ['[data-onboarding-repository-project-filter]'],
      },
      {
        key: 'repository-folders',
        icon: Sparkles,
        title: '2. Откройте нужный модуль',
        description: 'В блоке «Модули» лежат разделы проекта. Уже внутри проекта можно работать с Web, API и другими контурами.',
        selectors: ['[data-onboarding-repository-folders]'],
      },
      {
        key: 'repository-cases',
        icon: Info,
        title: '3. Работайте с кейсами',
        description: 'Справа находятся тест-кейсы выбранного проекта и модуля: здесь их ищут, открывают, редактируют и запускают в работу.',
        selectors: ['[data-onboarding-repository-cases]'],
      },
      {
        key: 'repository-actions',
        icon: Sparkles,
        title: '4. Быстрые действия',
        description: 'Верхние кнопки позволяют импортировать кейсы, включить массовый режим и быстро создать новый кейс.',
        selectors: ['[data-onboarding-repository-actions]'],
      },
    ],
  },
  MindMap: {
    title: 'Интеллект-карта',
    description: 'Во вкладке можно визуально проектировать структуру тестов, модулей и сценариев перед переносом в репозиторий.',
  },
  TestDataStore: {
    title: 'Тестовые данные',
    description: 'Здесь хранятся переменные, URL, учётные данные и другие тестовые данные, которые потом переиспользуются в кейсах.',
  },
  SharedSteps: {
    title: 'Общие шаги',
    description: 'Вкладка нужна для повторно используемых шагов. Это удобно, когда один и тот же кусок сценария встречается в разных кейсах.',
  },
  Reviews: {
    title: 'Ревью',
    description: 'Здесь команда проверяет тест-кейсы перед утверждением, чтобы держать качество тестовой базы под контролем.',
  },
  Execution: {
    title: 'Выполнение',
    description: 'Во вкладке создаются запуски, назначаются исполнители и фиксируются реальные результаты прохождения тестов.',
    steps: [
      {
        key: 'execution-create',
        icon: Sparkles,
        title: 'Создайте тест-план',
        description: 'Тест-план объединяет кейсы для конкретного прогона. Обычно пользователь начинает выполнение именно с него.',
        selectors: ['[data-onboarding-execution-create]'],
      },
      {
        key: 'execution-plans',
        icon: Info,
        title: 'Список тест-планов',
        description: 'Слева находятся все тест-планы. После выбора одного из них справа откроются связанные тест-раны.',
        selectors: ['[data-onboarding-execution-plans]'],
      },
      {
        key: 'execution-runs',
        icon: Sparkles,
        title: 'Результаты выполнения',
        description: 'Здесь команда отмечает Pass, Fail и другие статусы, а также смотрит прогресс и детали прогона.',
        selectors: ['[data-onboarding-execution-runs]'],
      },
    ],
  },
  AutomationAPI: {
    title: 'API автоматизации',
    description: 'Здесь настраиваются интеграции и точки подключения для автоматизации, чтобы связать ручное и автотестовое покрытие.',
  },
  Management: {
    title: 'Управление',
    description: 'В этом разделе обычно настраивают роли, команду, нагрузку, трассировку и другие административные функции.',
  },
  Reports: {
    title: 'Отчёты',
    description: 'Здесь собираются итоговые отчёты, статистика по релизам и публичные ссылки для просмотра результатов.',
    steps: [
      {
        key: 'reports-tabs',
        icon: Info,
        title: 'Режимы отчётов',
        description: 'Во вкладке доступны режимы «Релизы», «Аналитика» и «Интеграции» — каждый отвечает за свой тип информации.',
        selectors: ['[data-onboarding-reports-tabs]'],
      },
      {
        key: 'reports-plan-filter',
        icon: Sparkles,
        title: 'Фильтр по тест-плану',
        description: 'С помощью фильтра можно смотреть данные по всем планам сразу или только по одному выбранному прогону.',
        selectors: ['[data-onboarding-reports-plan-filter]'],
      },
      {
        key: 'reports-content',
        icon: Info,
        title: 'Основной контент отчётов',
        description: 'Здесь отображаются карточки релизов, графики, публичные отчёты и интеграции — в зависимости от выбранной вкладки.',
        selectors: ['[data-onboarding-reports-content]'],
      },
    ],
  },
  Billing: {
    title: 'Тарифы',
    description: 'Во вкладке можно посмотреть ограничения и доступные возможности тарифа команды.',
  },
  Traceability: {
    title: 'Трассировка',
    description: 'Здесь отслеживается связь требований с тест-кейсами и видно, где ещё не хватает покрытия.',
  },
  Workload: {
    title: 'Нагрузка',
    description: 'Раздел помогает видеть распределение задач по команде и балансировать нагрузку между участниками.',
  },
  Team: {
    title: 'Команда',
    description: 'Здесь управляют участниками, ролями и правами доступа внутри команды.',
  },
  AuditLog: {
    title: 'Журнал действий',
    description: 'Во вкладке видно историю изменений — кто, когда и что поменял в системе.',
  },
};

function loadSeenPages() {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSeenPages(seenPages) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seenPages));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getVisibleRect(rect) {
  const top = clamp(rect.top, 16, window.innerHeight - 16);
  const left = clamp(rect.left, 16, window.innerWidth - 16);
  const right = clamp(rect.right, 16, window.innerWidth - 16);
  const bottom = clamp(rect.bottom, 16, window.innerHeight - 16);

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  };
}

export default function OnboardingTour({ currentPageName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);
  const [cardStyle, setCardStyle] = useState({ top: 24, left: 24 });
  const cardRef = useRef(null);

  const pageConfig = PAGE_TOUR_CONTENT[currentPageName];

  const steps = useMemo(() => {
    if (!pageConfig) {
      return [];
    }

    if (Array.isArray(pageConfig.steps) && pageConfig.steps.length > 0) {
      return pageConfig.steps;
    }

    return [
      {
        key: 'nav',
        icon: Info,
        title: 'Навигация по системе',
        description: `Через левое меню можно быстро перейти в раздел «${pageConfig.title}» и соседние вкладки команды.`,
        selectors: [`[data-onboarding-nav="${currentPageName}"]`, '[data-onboarding-sidebar="nav"]'],
      },
      {
        key: 'content',
        icon: Sparkles,
        title: pageConfig.title,
        description: pageConfig.description,
        selectors: [`[data-onboarding-content="${currentPageName}"]`],
      },
    ];
  }, [currentPageName, pageConfig]);

  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (!pageConfig) {
      setIsOpen(false);
      return;
    }

    const seenPages = loadSeenPages();
    if (seenPages.includes(currentPageName)) {
      setIsOpen(false);
      return;
    }

    const openTimer = window.setTimeout(() => {
      setStepIndex(0);
      setIsOpen(true);
    }, 300);

    return () => window.clearTimeout(openTimer);
  }, [currentPageName, pageConfig]);

  useEffect(() => {
    const handleReset = () => {
      if (!pageConfig) {
        return;
      }

      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener('testflow:onboarding-reset', handleReset);
    window.addEventListener('testflow:onboarding-restart-current-page', handleReset);

    return () => {
      window.removeEventListener('testflow:onboarding-reset', handleReset);
      window.removeEventListener('testflow:onboarding-restart-current-page', handleReset);
    };
  }, [pageConfig]);

  useEffect(() => {
    if (!isOpen || !currentStep) {
      setHighlightRect(null);
      return;
    }

    const updatePosition = () => {
      let targetElement = null;
      for (const selector of currentStep.selectors) {
        const foundElement = document.querySelector(selector);
        if (foundElement) {
          targetElement = foundElement;
          break;
        }
      }

      if (!targetElement) {
        setHighlightRect(null);
        setCardStyle({ top: 24, left: 24 });
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const visibleRect = getVisibleRect(rect);
      setHighlightRect(visibleRect);

      const cardWidth = 360;
      const cardHeight = cardRef.current?.offsetHeight || 220;
      const isLargeTarget = rect.height > window.innerHeight * 0.55 || rect.width > window.innerWidth * 0.7;
      const isTargetMostlyVisible = rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.2;

      if (isLargeTarget || !isTargetMostlyVisible || !visibleRect) {
        setCardStyle({ top: 24, left: 24 });
        return;
      }

      const preferredTop = rect.bottom + 16;
      const fallbackTop = rect.top - cardHeight - 16;
      const top = preferredTop + cardHeight < window.innerHeight
        ? preferredTop
        : clamp(fallbackTop, 16, window.innerHeight - cardHeight - 16);
      const left = clamp(rect.left, 16, window.innerWidth - cardWidth - 16);

      setCardStyle({ top, left });
    };

    const updateTimer = window.setTimeout(updatePosition, 120);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.clearTimeout(updateTimer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentStep, isOpen]);

  const completePageTour = () => {
    const seenPages = loadSeenPages();
    if (!seenPages.includes(currentPageName)) {
      saveSeenPages([...seenPages, currentPageName]);
    }
    setIsOpen(false);
    setStepIndex(0);
  };

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) {
      completePageTour();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  if (!isOpen || !currentStep) {
    return null;
  }

  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" />

      {highlightRect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-indigo-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.12)] transition-all duration-200"
          style={{
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
          }}
        />
      )}

      <div
        ref={cardRef}
        className="absolute z-[121] w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-card p-5 shadow-2xl"
        style={cardStyle}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-indigo-500/10 p-2 text-indigo-600">
              <StepIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-600">
                Первое знакомство
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{currentStep.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={completePageTour}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Закрыть подсказки"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-sm leading-6 text-muted-foreground">
          {currentStep.description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Шаг {stepIndex + 1} из {steps.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={completePageTour}>
              Пропустить
            </Button>
            <Button size="sm" onClick={handleNext}>
              {stepIndex === steps.length - 1 ? 'Готово' : 'Дальше'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}