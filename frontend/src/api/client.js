const STORAGE_KEY = 'testflow.local-data.v1';
const CURRENT_USER_KEY = 'testflow.current-user-id';

const ENTITY_NAMES = [
  'Folder',
  'TestCase',
  'TestPlan',
  'TestRun',
  'Release',
  'TestCaseHistory',
  'Comment',
  'SharedStep',
  'WebhookConfig',
  'PublicReport',
  'BugTrackerConfig',
  'Project',
  'TestData',
  'AutomationToken',
  'AuditLog',
  'User',
];

const nowIso = () => new Date().toISOString();

const inMemoryState = {
  store: null,
  currentUserId: null,
};

const defaultUsers = [
  {
    id: 'user-admin',
    full_name: 'Admin User',
    email: 'admin@testflow.local',
    qa_role: 'QA Lead',
    role: 'admin',
    subscription_plan: 'team',
    created_date: nowIso(),
  },
  {
    id: 'user-anna',
    full_name: 'Anna Petrova',
    email: 'anna@testflow.local',
    qa_role: 'Tester',
    role: 'user',
    subscription_plan: 'team',
    created_date: nowIso(),
  },
  {
    id: 'user-max',
    full_name: 'Max Ivanov',
    email: 'max@testflow.local',
    qa_role: 'Tester',
    role: 'user',
    subscription_plan: 'team',
    created_date: nowIso(),
  },
];

const guestUser = {
  id: 'guest-user',
  full_name: 'Guest',
  email: 'guest@testflow.local',
  qa_role: 'Viewer',
  role: 'viewer',
  subscription_plan: 'free',
};

function createSeedData() {
  const createdDate = nowIso();

  const projects = [
    {
      id: 'project-web',
      name: 'Web Portal',
      key: 'WEB',
      description: 'Основной проект клиентского веб-приложения',
      color: '#6366f1',
      status: 'active',
      created_date: createdDate,
    },
    {
      id: 'project-api',
      name: 'Public API',
      key: 'API',
      description: 'Интеграционные и API сценарии',
      color: '#10b981',
      status: 'active',
      created_date: createdDate,
    },
  ];

  const folders = [
    { id: 'folder-auth', name: 'Authentication', parent_id: null, created_date: createdDate },
    { id: 'folder-profile', name: 'Profile', parent_id: null, created_date: createdDate },
    { id: 'folder-api', name: 'API Smoke', parent_id: null, created_date: createdDate },
  ];

  const testCases = [
    {
      id: 'tc-login-valid',
      title: 'Успешный вход с валидными данными',
      project_id: 'project-web',
      folder_id: 'folder-auth',
      priority: 'P1',
      type: 'Manual',
      status: 'Approved',
      tags: ['Smoke', 'UI'],
      preconditions: 'Пользователь зарегистрирован и активен',
      steps: [
        { step: 'Открыть страницу входа', expected: 'Форма входа доступна' },
        { step: 'Ввести валидный email и пароль', expected: 'Поля заполнены без ошибок' },
        { step: 'Нажать кнопку входа', expected: 'Пользователь попадает в личный кабинет' },
      ],
      requirements: [{ id: 'REQ-101', name: 'Авторизация пользователя' }],
      created_by: 'admin@testflow.local',
      created_date: createdDate,
      bugs: [],
      is_flaky: false,
      flaky_count: 0,
    },
    {
      id: 'tc-login-invalid',
      title: 'Ошибка входа с неверным паролем',
      project_id: 'project-web',
      folder_id: 'folder-auth',
      priority: 'P1',
      type: 'Manual',
      status: 'Approved',
      tags: ['Regression', 'UI'],
      preconditions: 'Пользователь существует',
      steps: [
        { step: 'Открыть страницу входа', expected: 'Форма входа отображается' },
        { step: 'Ввести неверный пароль', expected: 'Данные введены' },
        { step: 'Нажать кнопку входа', expected: 'Появляется сообщение об ошибке' },
      ],
      requirements: [{ id: 'REQ-102', name: 'Обработка невалидных учетных данных' }],
      created_by: 'anna@testflow.local',
      created_date: createdDate,
      bugs: [
        {
          bug_id: 'BUG-101',
          tracker_type: 'jira',
          url: 'https://tracker.local/BUG-101',
          title: 'Неконсистентное сообщение об ошибке',
          created_at: createdDate,
        },
      ],
      is_flaky: true,
      flaky_count: 1,
    },
    {
      id: 'tc-profile-update',
      title: 'Обновление профиля пользователя',
      project_id: 'project-web',
      folder_id: 'folder-profile',
      priority: 'P2',
      type: 'Manual',
      status: 'Draft',
      tags: ['Regression', 'UI'],
      preconditions: 'Пользователь вошел в систему',
      steps: [
        { step: 'Открыть профиль', expected: 'Данные профиля отображаются' },
        { step: 'Изменить имя пользователя', expected: 'Поле становится редактируемым' },
        { step: 'Сохранить изменения', expected: 'Показывается успешное уведомление' },
      ],
      requirements: [{ id: 'REQ-201', name: 'Редактирование профиля' }],
      created_by: 'max@testflow.local',
      created_date: createdDate,
      bugs: [],
      is_flaky: false,
      flaky_count: 0,
    },
    {
      id: 'tc-api-health',
      title: 'Проверка health endpoint',
      project_id: 'project-api',
      folder_id: 'folder-api',
      priority: 'P2',
      type: 'Automated',
      status: 'Approved',
      tags: ['Smoke', 'API'],
      preconditions: 'API доступен по базовому URL',
      steps: [
        { step: 'Отправить GET запрос на /health', expected: 'Ответ 200 OK' },
        { step: 'Проверить тело ответа', expected: 'Поле status равно ok' },
      ],
      requirements: [{ id: 'REQ-301', name: 'Health-check API' }],
      created_by: 'admin@testflow.local',
      created_date: createdDate,
      bugs: [],
      is_flaky: false,
      flaky_count: 0,
    },
  ];

  const testPlans = [
    {
      id: 'plan-smoke-1',
      name: 'Smoke Regression',
      description: 'Ежедневный smoke-прогон критических сценариев',
      status: 'Active',
      created_date: createdDate,
    },
  ];

  const testRuns = [
    {
      id: 'run-1',
      test_plan_id: 'plan-smoke-1',
      test_case_id: 'tc-login-valid',
      snapshot: {
        title: 'Успешный вход с валидными данными',
        priority: 'P1',
        type: 'Manual',
        steps: testCases[0].steps,
      },
      environment: { browser: 'Chrome', os: 'Windows', version: '122' },
      status: 'Pass',
      assigned_to: 'anna@testflow.local',
      executed_by: 'anna@testflow.local',
      duration_seconds: 120,
      created_date: createdDate,
      completed_at: createdDate,
    },
    {
      id: 'run-2',
      test_plan_id: 'plan-smoke-1',
      test_case_id: 'tc-login-invalid',
      snapshot: {
        title: 'Ошибка входа с неверным паролем',
        priority: 'P1',
        type: 'Manual',
        steps: testCases[1].steps,
      },
      environment: { browser: 'Firefox', os: 'macOS', version: '123' },
      status: 'Fail',
      assigned_to: 'max@testflow.local',
      executed_by: 'max@testflow.local',
      duration_seconds: 185,
      created_date: createdDate,
      completed_at: createdDate,
      comment: 'Получено общее сообщение об ошибке',
    },
    {
      id: 'run-3',
      test_plan_id: 'plan-smoke-1',
      test_case_id: 'tc-api-health',
      snapshot: {
        title: 'Проверка health endpoint',
        priority: 'P2',
        type: 'Automated',
        steps: testCases[3].steps,
      },
      environment: { browser: 'API', os: 'Linux', version: 'v1' },
      status: 'Pass',
      created_date: createdDate,
      completed_at: createdDate,
      duration_seconds: 8,
    },
  ];

  const sharedSteps = [
    {
      id: 'shared-login',
      name: 'Авторизация пользователя',
      category: 'Authentication',
      steps: [
        { step: 'Открыть страницу входа', expected: 'Страница доступна' },
        { step: 'Ввести логин и пароль', expected: 'Данные приняты' },
      ],
      created_date: createdDate,
    },
  ];

  const testData = [
    {
      id: 'data-1',
      label: 'Валидный пользователь',
      category: 'auth',
      project_id: 'project-web',
      params: { email: 'anna@testflow.local', password: 'Password123!' },
      created_date: createdDate,
    },
  ];

  const automationTokens = [
    {
      id: 'token-1',
      name: 'CI Runner',
      token: 'tf_demo_token_123456',
      created_date: createdDate,
    },
  ];

  const releases = [
    {
      id: 'release-1',
      name: 'Release 1.0',
      version: '1.0.0',
      status: 'ready',
      test_plan_id: 'plan-smoke-1',
      release_date: createdDate,
      created_date: createdDate,
    },
  ];

  const history = testCases.map((testCase, index) => ({
    id: `history-${index + 1}`,
    test_case_id: testCase.id,
    version: 1,
    snapshot: testCase,
    changed_by: testCase.created_by,
    created_date: createdDate,
  }));

  return {
    Folder: folders,
    TestCase: testCases,
    TestPlan: testPlans,
    TestRun: testRuns,
    Release: releases,
    TestCaseHistory: history,
    Comment: [],
    SharedStep: sharedSteps,
    WebhookConfig: [],
    PublicReport: [],
    BugTrackerConfig: [],
    Project: projects,
    TestData: testData,
    AutomationToken: automationTokens,
    AuditLog: [
      {
        id: 'audit-seed-1',
        action: 'seed',
        entity_type: 'system',
        entity_id: 'seed',
        details: 'Демо-данные инициализированы',
        created_date: createdDate,
        user_email: 'admin@testflow.local',
      },
    ],
    User: defaultUsers,
  };
}

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readLocalStorage(key) {
  if (!hasWindow()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeLocalStorage(key, value) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStoreShape(store) {
  const nextStore = store ? cloneValue(store) : {};

  for (const entityName of ENTITY_NAMES) {
    if (!Array.isArray(nextStore[entityName])) {
      nextStore[entityName] = [];
    }
  }

  return nextStore;
}

function persistStore() {
  if (inMemoryState.store) {
    writeLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryState.store));
  }
}

function getStore() {
  if (inMemoryState.store) {
    return inMemoryState.store;
  }

  const rawStore = readLocalStorage(STORAGE_KEY);
  inMemoryState.store = ensureStoreShape(rawStore ? JSON.parse(rawStore) : createSeedData());
  persistStore();

  const storedUserId = readLocalStorage(CURRENT_USER_KEY);
  inMemoryState.currentUserId = storedUserId || defaultUsers[0].id;
  if (!storedUserId) {
    writeLocalStorage(CURRENT_USER_KEY, inMemoryState.currentUserId);
  }

  return inMemoryState.store;
}

function getCurrentUserId() {
  getStore();
  return inMemoryState.currentUserId;
}

function setCurrentUserId(userId) {
  inMemoryState.currentUserId = userId;
  if (userId) {
    writeLocalStorage(CURRENT_USER_KEY, userId);
  } else if (hasWindow()) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function generateId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function compareValues(left, right) {
  if (left === right) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);

  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate;
  }

  return String(left).localeCompare(String(right), 'ru');
}

function sortItems(items, sortBy) {
  if (!sortBy) {
    return [...items];
  }

  const direction = sortBy.startsWith('-') ? -1 : 1;
  const fieldName = sortBy.replace(/^-/, '');
  return [...items].sort((first, second) => direction * compareValues(first[fieldName], second[fieldName]));
}

function limitItems(items, limit) {
  if (!limit) {
    return items;
  }

  return items.slice(0, limit);
}

function matchesFilter(item, criteria = {}) {
  return Object.entries(criteria).every(([fieldName, expectedValue]) => {
    if (expectedValue === undefined) {
      return true;
    }

    const actualValue = item[fieldName];
    if (Array.isArray(expectedValue)) {
      return expectedValue.includes(actualValue);
    }

    return actualValue === expectedValue;
  });
}

function resolveEntityArray(entityName) {
  return getStore()[entityName];
}

function getCurrentUser() {
  const users = resolveEntityArray('User');
  const currentUser = users.find((user) => user.id === getCurrentUserId());
  return cloneValue(currentUser || guestUser);
}

function addAuditEntry(action, entityName, entityId, details) {
  if (entityName === 'AuditLog') {
    return;
  }

  const auditLog = resolveEntityArray('AuditLog');
  const user = getCurrentUser();
  auditLog.unshift({
    id: generateId('audit'),
    action,
    entity_type: entityName,
    entity_id: entityId,
    details,
    user_email: user.email,
    created_date: nowIso(),
  });
  persistStore();
}

function createEntityApi(entityName) {
  return {
    async list(sortBy, limit) {
      const items = resolveEntityArray(entityName);
      return cloneValue(limitItems(sortItems(items, sortBy), limit));
    },
    async filter(criteria = {}, sortBy, limit) {
      const items = resolveEntityArray(entityName).filter((item) => matchesFilter(item, criteria));
      return cloneValue(limitItems(sortItems(items, sortBy), limit));
    },
    async create(data = {}) {
      const items = resolveEntityArray(entityName);
      const record = {
        id: data.id || generateId(entityName.toLowerCase()),
        created_date: data.created_date || nowIso(),
        updated_date: nowIso(),
        ...cloneValue(data),
      };

      if (entityName === 'PublicReport' && !record.token) {
        record.token = generateId('report');
      }

      items.unshift(record);
      persistStore();
      addAuditEntry('create', entityName, record.id, `Создана запись ${entityName}`);
      return cloneValue(record);
    },
    async bulkCreate(records = []) {
      const createdRecords = [];
      for (const record of records) {
        createdRecords.push(await this.create(record));
      }
      return createdRecords;
    },
    async update(id, patch = {}) {
      const items = resolveEntityArray(entityName);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error(`Запись ${entityName} с id ${id} не найдена`);
      }

      items[index] = {
        ...items[index],
        ...cloneValue(patch),
        updated_date: nowIso(),
      };

      persistStore();
      addAuditEntry('update', entityName, id, `Обновлена запись ${entityName}`);
      return cloneValue(items[index]);
    },
    async delete(id) {
      const items = resolveEntityArray(entityName);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return false;
      }

      items.splice(index, 1);
      persistStore();
      addAuditEntry('delete', entityName, id, `Удалена запись ${entityName}`);
      return true;
    },
  };
}

function inferTitleFromPrompt(prompt) {
  const quotedMatch = prompt.match(/"([^"]+)"/);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const titleMatch = prompt.match(/Название[^:]*:\s*([^\n]+)/i);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim();
  }

  return 'сценарий';
}

function buildSteps(title) {
  return [
    { step: `Открыть раздел для сценария «${title}»`, expected: 'Раздел загружен без ошибок' },
    { step: 'Подготовить входные данные и стартовое состояние', expected: 'Система готова к проверке' },
    { step: 'Выполнить основное пользовательское действие', expected: 'Действие обрабатывается корректно' },
    { step: 'Проверить результат на интерфейсе и в данных', expected: 'Результат соответствует ожидаемому' },
    { step: 'Проверить отсутствие ошибок и побочных эффектов', expected: 'Ошибки не отображаются, состояние консистентно' },
  ];
}

function buildMindMapNodes() {
  return {
    nodes: [
      { id: '1', label: 'Login', type: 'folder', parentId: null, priority: 'P1', tags: ['Smoke', 'UI'] },
      { id: '2', label: 'Успешный вход', type: 'testcase', parentId: '1', priority: 'P1', tags: ['Smoke', 'UI'] },
      { id: '3', label: 'Ошибка авторизации', type: 'testcase', parentId: '1', priority: 'P1', tags: ['Regression', 'UI'] },
      { id: '4', label: 'Profile', type: 'folder', parentId: null, priority: 'P2', tags: ['Regression', 'UI'] },
      { id: '5', label: 'Редактирование профиля', type: 'testcase', parentId: '4', priority: 'P2', tags: ['Regression', 'UI'] },
      { id: '6', label: 'Settings', type: 'folder', parentId: null, priority: 'P2', tags: ['Regression', 'UI'] },
      { id: '7', label: 'Смена настроек уведомлений', type: 'testcase', parentId: '6', priority: 'P3', tags: ['Regression', 'UI'] },
    ],
  };
}

function buildRiskRecommendation() {
  const testCases = resolveEntityArray('TestCase');
  const testRuns = resolveEntityArray('TestRun');

  const scores = testCases.map((testCase) => {
    const runs = testRuns.filter((run) => run.test_case_id === testCase.id);
    const failedRuns = runs.filter((run) => run.status === 'Fail').length;
    const passRuns = runs.filter((run) => run.status === 'Pass').length;
    const score = (failedRuns * 20) + ((testCase.bugs?.length || 0) * 10) + (testCase.is_flaky ? 15 : 0) + (testCase.priority === 'P1' ? 10 : 0) + (passRuns === 0 ? 5 : 0);

    return {
      id: testCase.id,
      score,
      module: testCase.tags?.[0] || 'General',
    };
  }).sort((left, right) => right.score - left.score);

  const recommended = scores.slice(0, 10);
  return {
    recommended_test_ids: recommended.map((item) => item.id),
    risk_modules: [...new Set(recommended.map((item) => item.module))].map((moduleName) => ({
      name: moduleName,
      reason: 'Модуль содержит критичные или нестабильные сценарии в недавних прогонах',
    })),
    summary: recommended.length
      ? 'Рекомендуется включить сценарии с высоким приоритетом, историей падений и признаками нестабильности.'
      : 'Недостаточно данных для риск-анализа, выбраны базовые критические сценарии.',
  };
}

function buildBugDraft() {
  const bugKey = `BUG-${String(Date.now()).slice(-5)}`;
  return {
    success: true,
    bug_url: `https://tracker.local/${bugKey}`,
    bug_key: bugKey,
    message: 'Создан локальный черновик бага',
  };
}

function fillSchema(schema) {
  if (!schema) {
    return {};
  }

  const schemaTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (schemaTypes.includes('object')) {
    return Object.fromEntries(Object.entries(schema.properties || {}).map(([key, value]) => [key, fillSchema(value)]));
  }

  if (schemaTypes.includes('array')) {
    return [];
  }

  if (schemaTypes.includes('boolean')) {
    return false;
  }

  if (schemaTypes.includes('number') || schemaTypes.includes('integer')) {
    return 0;
  }

  return '';
}

function navigateTo(pathname) {
  if (!hasWindow()) {
    return;
  }

  window.history.pushState({}, '', pathname);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

function parseCsv(text) {
  const rows = text.split(/\r?\n/).filter(Boolean);
  if (rows.length === 0) {
    return [];
  }

  const detectDelimiter = (line) => {
    const delimiters = [',', ';', '\t'];
    const scores = delimiters.map((delimiter) => ({
      delimiter,
      count: line.split(delimiter).length - 1
    }));

    return scores.sort((left, right) => right.count - left.count)[0]?.delimiter || ',';
  };

  const delimiter = detectDelimiter(rows[0]);

  const knownHeaderTokens = [
    'id', 'title', 'name', 'название', 'кейс', 'testcase', 'priority', 'приоритет',
    'status', 'статус', 'type', 'тип', 'tags', 'теги', 'steps', 'шаги',
    'requirements', 'требования', 'preconditions', 'предусловия'
  ];

  const normalizeHeader = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, '')
    .replace(/\s+/g, '')
    .replace(/[_-]+/g, '');

  const parseLine = (line) => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const nextChar = line[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    return values;
  };

  const firstRowValues = parseLine(rows[0]).map((value) => value.replace(/^\ufeff/, ''));
  const hasKnownHeaders = firstRowValues.some((header) => knownHeaderTokens.includes(normalizeHeader(header)));

  if (!hasKnownHeaders) {
    const columnCount = firstRowValues.length;
    const generatedHeaders = Array.from({ length: columnCount }, (_, index) => `column_${index + 1}`);
    return rows.map((row) => {
      const values = parseLine(row);
      return Object.fromEntries(generatedHeaders.map((header, index) => [header, values[index] || '']));
    });
  }

  const headers = firstRowValues;
  return rows.slice(1).map((row) => {
    const values = parseLine(row);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

async function extractUploadedData(fileUrl) {
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  const text = await blob.text();

  if (/\.xlsx$/i.test(fileUrl) || blob.type.includes('spreadsheet')) {
    throw new Error('Импорт XLSX без сервера не поддерживается. Используйте JSON или CSV.');
  }

  if (blob.type.includes('json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : parsed.test_cases || [];
  }

  return parseCsv(text);
}

const entities = Object.fromEntries(ENTITY_NAMES.map((entityName) => [entityName, createEntityApi(entityName)]));

const auth = {
  async isAuthenticated() {
    return Boolean(getCurrentUserId());
  },
  async me() {
    return getCurrentUser();
  },
  async loginAs(userId) {
    const users = resolveEntityArray('User');
    const nextUser = users.find((user) => user.id === userId);
    if (!nextUser) {
      throw new Error('Пользователь не найден');
    }

    setCurrentUserId(nextUser.id);
    navigateTo('/Dashboard');
    return cloneValue(nextUser);
  },
  redirectToLogin() {
    setCurrentUserId(defaultUsers[0].id);
    navigateTo('/Dashboard');
  },
  logout() {
    setCurrentUserId(null);
    navigateTo('/Home');
  },
};

const integrations = {
  Core: {
    async InvokeLLM({ prompt = '', response_json_schema: responseJsonSchema }) {
      const properties = responseJsonSchema?.properties || {};

      if (properties.nodes) {
        return buildMindMapNodes();
      }

      if (properties.recommended_test_ids) {
        return buildRiskRecommendation();
      }

      if (properties.success && properties.bug_url) {
        return buildBugDraft();
      }

      if (properties.steps) {
        const title = inferTitleFromPrompt(prompt);
        const result = { steps: buildSteps(title) };
        if (properties.preconditions) {
          result.preconditions = `Открыт сценарий «${title}», подготовлены тестовые данные и окружение.`;
        }
        return result;
      }

      return fillSchema(responseJsonSchema);
    },
    async SendEmail({ to, subject, body }) {
      addAuditEntry('notification', 'WebhookConfig', to || 'email', `Отправлено email-уведомление: ${subject}`);
      return { success: true, to, subject, body };
    },
    async UploadFile({ file }) {
      const fileUrl = await readFileAsDataUrl(file);
      return {
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      };
    },
    async GenerateImage({ prompt = 'TestFlow' }) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="100%" height="100%" fill="#4f46e5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28">${prompt}</text></svg>`;
      return { image_url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` };
    },
    async ExtractDataFromUploadedFile({ file_url: fileUrl }) {
      return {
        status: 'success',
        output: {
          test_cases: await extractUploadedData(fileUrl),
        },
      };
    },
    async CreateFileSignedUrl({ file_url: fileUrl }) {
      return { signed_url: fileUrl };
    },
    async UploadPrivateFile({ file }) {
      return this.UploadFile({ file });
    },
  },
};

export const appClient = {
  auth,
  entities,
  integrations,
};