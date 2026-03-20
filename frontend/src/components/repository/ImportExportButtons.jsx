import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2, Upload } from 'lucide-react';
import { appClient } from '@/api/client';
import { useModal } from '@/components/shared/ModalProvider';
import { plainTextFromMarkdown } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PROJECT_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

export default function ImportExportButtons({
  testCases,
  onImportComplete,
  defaultFolderId = null,
  defaultProjectId = null,
}) {
  const fileInputRef = useRef(null);
  const { showAlert } = useModal();
  const [isImporting, setIsImporting] = useState(false);
  const [importStage, setImportStage] = useState('Подготавливаем импорт...');

  const normalizeSuiteCases = (input) => {
    if (!Array.isArray(input?.suites)) {
      return null;
    }

    const extractedCases = [];

    const walkSuite = (suite, trail = [], rootSuite = null) => {
      const currentTrail = suite?.title ? [...trail, suite.title] : trail;
      const effectiveRootSuite = rootSuite || suite;

      for (const testCase of suite?.cases || []) {
        extractedCases.push({
          ...testCase,
          suite_path: currentTrail,
          suite_root_title: effectiveRootSuite?.title || '',
          suite_root_description: effectiveRootSuite?.description || '',
        });
      }

      for (const childSuite of suite?.suites || []) {
        walkSuite(childSuite, currentTrail, effectiveRootSuite);
      }
    };

    for (const suite of input.suites) {
      walkSuite(suite);
    }

    return extractedCases;
  };

  const normalizeKey = (key) => String(key || '')
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, '')
    .replace(/\s+/g, '')
    .replace(/[_-]+/g, '');

  const getFieldValue = (row, aliases) => {
    if (!row || typeof row !== 'object') {
      return undefined;
    }

    const entries = Object.entries(row);
    for (const alias of aliases) {
      const normalizedAlias = normalizeKey(alias);
      const match = entries.find(([key]) => normalizeKey(key) === normalizedAlias);
      if (match && match[1] !== undefined && match[1] !== null && String(match[1]).trim() !== '') {
        return match[1];
      }
    }

    return undefined;
  };

  const parseBoolean = (value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    const normalizedValue = String(value || '').trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 'да', 'истина'].includes(normalizedValue);
  };

  const parseTextList = (value) => {
    if (Array.isArray(value)) {
      return value
        .filter(Boolean)
        .map((item) => {
          if (typeof item === 'string') {
            return item.trim();
          }

          return item?.name || item?.title || item?.value || '';
        })
        .filter(Boolean);
    }

    if (typeof value !== 'string' || !value.trim()) {
      return [];
    }

    return value
      .split(/[;,\n|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const normalizeImportedData = (input) => {
    const suiteCases = normalizeSuiteCases(input);
    if (suiteCases) {
      return suiteCases;
    }

    if (Array.isArray(input)) {
      return input;
    }

    if (Array.isArray(input?.test_cases)) {
      return input.test_cases;
    }

    if (Array.isArray(input?.items)) {
      return input.items;
    }

    if (input && typeof input === 'object') {
      return [input];
    }

    throw new Error('Файл не содержит список тест-кейсов');
  };

  const parseJsonField = (value, fallback = []) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== 'string' || !value.trim()) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const parseStepsField = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') {
            return { step: item.trim(), expected: '' };
          }

          return {
            step: item?.step || item?.action || item?.title || '',
            expected: item?.expected || item?.result || item?.expected_result || ''
          };
        })
        .filter((item) => item.step);
    }

    const parsedJson = parseJsonField(value, null);
    if (Array.isArray(parsedJson)) {
      return parseStepsField(parsedJson);
    }

    if (typeof value !== 'string' || !value.trim()) {
      return [];
    }

    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ step: line.replace(/^\d+[.)-]?\s*/, ''), expected: '' }));
  };

  const parseRequirementsField = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') {
            return { name: item.trim(), type: 'Feature', link: '' };
          }

          return {
            name: item?.name || item?.title || item?.requirement || '',
            type: item?.type || 'Feature',
            link: item?.link || item?.url || ''
          };
        })
        .filter((item) => item.name);
    }

    const parsedJson = parseJsonField(value, null);
    if (Array.isArray(parsedJson)) {
      return parseRequirementsField(parsedJson);
    }

    return parseTextList(value).map((item) => ({ name: item, type: 'Feature', link: '' }));
  };

  const normalizeType = (value) => {
    const normalizedValue = String(value || '').trim().toLowerCase();
    if (['авто', 'автоматизированный', 'автоматический', 'automated', 'auto', 'is-automated'].includes(normalizedValue)) {
      return 'Automated';
    }

    return 'Manual';
  };

  const normalizePriority = (value) => {
    const normalizedValue = String(value || '').trim().toUpperCase();
    if (['P1', 'P2', 'P3', 'P4'].includes(normalizedValue)) {
      return normalizedValue;
    }

    const priorityMap = {
      HIGH: 'P1',
      CRITICAL: 'P1',
      MEDIUM: 'P2',
      NORMAL: 'P3',
      LOW: 'P4',
      UNDEFINED: 'P3',
    };

    return priorityMap[normalizedValue] || 'P3';
  };

  const normalizeStatus = (value) => {
    const normalizedValue = String(value || '').trim().toLowerCase();
    const statusMap = {
      draft: 'Draft',
      черновик: 'Draft',
      approved: 'Approved',
      утвержден: 'Approved',
      утверждён: 'Approved',
      actual: 'Approved',
      active: 'Approved',
      'underreview': 'Under Review',
      'under review': 'Under Review',
      наревью: 'Under Review',
      'напроверке': 'Under Review'
    };

    return statusMap[normalizedValue] || 'Draft';
  };

  const getFolderCacheKey = (name, parentId) => `${parentId || 'root'}::${normalizeKey(name)}`;
  const getProjectCacheKey = (name) => normalizeKey(name);
  const getCaseDuplicateKey = (testCase) => [
    testCase.project_id || 'no-project',
    testCase.folder_id || 'no-folder',
    normalizeKey(testCase.title),
  ].join('::');

  const buildFolderCache = (folders = []) => {
    const cache = new Map();
    for (const folder of folders) {
      cache.set(getFolderCacheKey(folder.name, folder.parent_id), folder);
    }
    return cache;
  };

  const buildProjectCache = (projects = []) => {
    const cache = new Map();
    for (const project of projects) {
      cache.set(getProjectCacheKey(project.name), project);
    }
    return cache;
  };

  const buildCaseCache = (cases = []) => {
    const cache = new Set();
    for (const testCase of cases) {
      if (testCase?.title) {
        cache.add(getCaseDuplicateKey(testCase));
      }
    }
    return cache;
  };

  const generateProjectKey = (name, existingProjects = []) => {
    const words = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const baseKey = (words.length > 1
      ? words.map((word) => word[0]).join('')
      : String(name || '').replace(/[^A-Za-zА-Яа-я0-9]/g, '').slice(0, 6)
    ).toUpperCase() || 'PRJ';

    const existingKeys = new Set(existingProjects.map((project) => String(project.key || '').toUpperCase()));
    if (!existingKeys.has(baseKey)) {
      return baseKey;
    }

    let suffix = 2;
    while (existingKeys.has(`${baseKey}${suffix}`)) {
      suffix += 1;
    }

    return `${baseKey}${suffix}`;
  };

  const ensureProject = async (projectName, projectDescription, projectCache, existingProjects, stats) => {
    const normalizedName = String(projectName || '').trim();
    if (!normalizedName) {
      return '';
    }

    const cacheKey = getProjectCacheKey(normalizedName);
    let project = projectCache.get(cacheKey);

    if (!project) {
      project = await appClient.entities.Project.create({
        name: normalizedName,
        key: generateProjectKey(normalizedName, existingProjects),
        description: String(projectDescription || '').trim(),
        color: PROJECT_COLORS[existingProjects.length % PROJECT_COLORS.length],
        status: 'active',
      });
      existingProjects.push(project);
      projectCache.set(cacheKey, project);
      stats.projectsCreated += 1;
    }

    return project.id;
  };

  const ensureFolderPath = async (suitePath = [], folderCache, parentFolderId = null, stats = null) => {
    if (!Array.isArray(suitePath) || suitePath.length === 0) {
      return parentFolderId || '';
    }

    let currentParentId = parentFolderId;

    for (const segment of suitePath) {
      const folderName = String(segment || '').trim();
      if (!folderName) {
        continue;
      }

      const cacheKey = getFolderCacheKey(folderName, currentParentId);
      let folder = folderCache.get(cacheKey);

      if (!folder) {
        folder = await appClient.entities.Folder.create({
          name: folderName,
          parent_id: currentParentId,
        });
        folderCache.set(cacheKey, folder);
        if (stats) {
          stats.foldersCreated += 1;
        }
      }

      currentParentId = folder.id;
    }

    return currentParentId || '';
  };

  const mapImportedTestCase = (row, options = {}) => {
    const { resolvedFolderId = null, resolvedProjectId = null } = options;
    const values = Object.values(row || {}).map((value) => String(value || '').trim());
    const title = getFieldValue(row, ['title', 'name', 'название', 'тесткейс', 'тест-кейс', 'кейc', 'кейс', 'testcase', 'testcasename']);
    const priority = getFieldValue(row, ['priority', 'приоритет']);
    const type = getFieldValue(row, ['type', 'тип']);
    const status = getFieldValue(row, ['status', 'статус']);
    const tags = getFieldValue(row, ['tags', 'теги', 'метки']);
    const preconditions = getFieldValue(row, ['preconditions', 'precondition', 'предусловия', 'предусловие']);
    const steps = getFieldValue(row, ['steps', 'step', 'шаги', 'шаг', 'сценарий']);
    const requirements = getFieldValue(row, ['requirements', 'requirement', 'требования', 'требование']);
    const isFlaky = getFieldValue(row, ['is_flaky', 'flaky', 'нестабильный']);
    const description = getFieldValue(row, ['description', 'описание']);
    const postconditions = getFieldValue(row, ['postconditions', 'postcondition', 'постусловия', 'постусловие']);
    const automation = getFieldValue(row, ['automation', 'автоматизация']);
    const suitePath = Array.isArray(row?.suite_path) ? row.suite_path : [];
    const suiteRootTitle = getFieldValue(row, ['suite_root_title']) || row?.suite_root_title;

    const positionalTitle = values[1] || values.find((value) => value && !/^tc[-\s]?\d+/i.test(value) && !/^p[1-4]$/i.test(value));
    const positionalStatus = values.find((value) => ['draft', 'approved', 'under review', 'черновик', 'утвержден', 'утверждён', 'на проверке'].includes(value.toLowerCase()));
    const positionalPriority = values.find((value) => /^p[1-4]$/i.test(value));
    const positionalType = values.find((value) => ['manual', 'automated', 'ручной', 'автоматизированный'].includes(value.toLowerCase()));
    const positionalSteps = values.length > 5 ? values.slice(5).filter(Boolean).join('\n') : '';

    const resolvedTitle = (typeof title === 'string' ? title.trim() : title) || positionalTitle;

    return {
      title: resolvedTitle,
      project_id: resolvedProjectId || getFieldValue(row, ['project_id', 'projectid', 'project', 'проект']) || defaultProjectId || '',
      folder_id: resolvedFolderId ?? (getFieldValue(row, ['folder_id', 'folderid', 'folder', 'папка', 'модуль']) || defaultFolderId || ''),
      priority: normalizePriority(priority || positionalPriority),
      type: normalizeType(type || automation || positionalType),
      status: normalizeStatus(status || positionalStatus),
      tags: [...new Set([...parseTextList(tags), ...suitePath, ...(suiteRootTitle ? [suiteRootTitle] : [])])],
      preconditions: [preconditions, description, postconditions].filter(Boolean).join('\n\n'),
      steps: parseStepsField(steps || positionalSteps),
      requirements: parseRequirementsField(requirements),
      is_flaky: parseBoolean(isFlaky)
    };
  };

  const handleExport = () => {
    const exportData = testCases.map(tc => ({
      title: tc.title,
      priority: tc.priority,
      type: tc.type,
      tags: tc.tags?.join(', ') || '',
      preconditions: tc.preconditions || '',
      steps: JSON.stringify(tc.steps || []),
      requirements: JSON.stringify(tc.requirements || []),
      is_flaky: tc.is_flaky || false
    }));

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStage('Читаем файл импорта...');

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        setImportStage('Проверяем и подготавливаем кейсы...');
        const data = normalizeImportedData(JSON.parse(text));
        await importTestCases(data);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        // Upload file first
        setImportStage('Загружаем файл...');
        const { file_url } = await appClient.integrations.Core.UploadFile({ file });
        
        // Extract data using AI
        setImportStage('Извлекаем кейсы из файла...');
        const result = await appClient.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              test_cases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    priority: { type: "string" },
                    type: { type: "string" },
                    tags: { type: "string" },
                    preconditions: { type: "string" },
                    steps: { type: "string" }
                  }
                }
              }
            }
          }
        });

        if (result.status === 'success' && result.output) {
          setImportStage('Подготавливаем данные к импорту...');
          await importTestCases(normalizeImportedData(result.output));
        } else {
          await showAlert({
            title: 'Ошибка импорта',
            description: 'Ошибка извлечения данных из файла',
            confirmLabel: 'Понятно',
          });
        }
      }
    } catch (error) {
      await showAlert({
        title: 'Ошибка импорта',
        description: `Ошибка импорта: ${error.message}`,
        confirmLabel: 'Понятно',
      });
    } finally {
      setIsImporting(false);
      setImportStage('Подготавливаем импорт...');
    }

    e.target.value = '';
  };

  const importTestCases = async (data) => {
    setImportStage('Получаем текущие проекты и папки...');
    const normalizedData = normalizeImportedData(data);

    const existingProjects = await appClient.entities.Project.list();
    const existingFolders = await appClient.entities.Folder.list();
    const existingCases = await appClient.entities.TestCase.list();
    const projectCache = buildProjectCache(existingProjects);
    const folderCache = buildFolderCache(existingFolders);
    const caseCache = buildCaseCache(existingCases);

    const stats = {
      totalRows: normalizedData.length,
      projectsCreated: 0,
      foldersCreated: 0,
      casesCreated: 0,
      duplicatesSkipped: 0,
    };

    const cases = [];

    setImportStage(`Обрабатываем кейсы: 0 из ${normalizedData.length}`);

    for (let index = 0; index < normalizedData.length; index += 1) {
      const row = normalizedData[index];
      setImportStage(`Обрабатываем кейсы: ${index + 1} из ${normalizedData.length}`);

      const explicitProjectId = getFieldValue(row, ['project_id', 'projectid', 'project', 'проект']);
      const rootSuiteTitle = getFieldValue(row, ['suite_root_title']) || row?.suite_root_title;
      const rootSuiteDescription = getFieldValue(row, ['suite_root_description']) || row?.suite_root_description;
      const resolvedProjectId = explicitProjectId
        || defaultProjectId
        || await ensureProject(rootSuiteTitle, rootSuiteDescription, projectCache, existingProjects, stats);

      const explicitFolderId = getFieldValue(row, ['folder_id', 'folderid', 'folder', 'папка', 'модуль']);
      const suitePath = Array.isArray(row?.suite_path) ? row.suite_path : [];
      const resolvedFolderId = explicitFolderId
        || (suitePath.length > 0 ? await ensureFolderPath(suitePath, folderCache, defaultFolderId, stats) : defaultFolderId || '');

      if (!explicitFolderId && suitePath.length > 0) {
        const mappedCase = mapImportedTestCase(row, {
          resolvedFolderId,
          resolvedProjectId,
        });

        if (!mappedCase.title) {
          continue;
        }

        const duplicateKey = getCaseDuplicateKey(mappedCase);
        if (caseCache.has(duplicateKey)) {
          stats.duplicatesSkipped += 1;
          continue;
        }

        cases.push(mappedCase);
        caseCache.add(duplicateKey);
        continue;
      }

      const mappedCase = mapImportedTestCase(row, {
        resolvedFolderId,
        resolvedProjectId,
      });

      if (!mappedCase.title) {
        continue;
      }

      const duplicateKey = getCaseDuplicateKey(mappedCase);
      if (caseCache.has(duplicateKey)) {
        stats.duplicatesSkipped += 1;
        continue;
      }

      cases.push(mappedCase);
      caseCache.add(duplicateKey);
    }

    if (cases.length === 0) {
      if (stats.duplicatesSkipped > 0) {
        await showAlert({
          title: 'Импорт завершён',
          description: `Импорт завершён без новых кейсов.\n\nПропущено дублей: ${stats.duplicatesSkipped}`,
          confirmLabel: 'OK',
        });
        onImportComplete?.({ ...stats, casesCreated: 0 });
        return;
      }

      throw new Error('Не удалось найти корректные тест-кейсы для импорта');
    }

    setImportStage(`Сохраняем ${cases.length} тест-кейсов...`);
    await appClient.entities.TestCase.bulkCreate(cases);
    stats.casesCreated = cases.length;
    onImportComplete?.(stats);
    await showAlert({
      title: 'Импорт завершён',
      description: [
        `Создано проектов: ${stats.projectsCreated}`,
        `Создано папок: ${stats.foldersCreated}`,
        `Импортировано тест-кейсов: ${stats.casesCreated}`,
        `Пропущено дублей: ${stats.duplicatesSkipped}`,
      ].join('\n'),
      confirmLabel: 'OK',
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport} disabled={isImporting}>
        <Download className="w-4 h-4 mr-2" /> Экспорт
        </Button>
        <Button 
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {isImporting ? 'Импортируем...' : 'Импорт'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.xlsx"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      <Dialog open={isImporting}>
        <DialogContent className="max-w-md" showCloseButton={false} onInteractOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
              Импорт тест-кейсов
            </DialogTitle>
            <DialogDescription>
              {importStage}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-indigo-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Пожалуйста, подождите. Во время импорта создаются проекты, папки и тест-кейсы.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}