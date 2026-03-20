import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Upload } from 'lucide-react';
import { appClient } from '@/api/client';

export default function ImportExportButtons({ testCases, onImportComplete }) {
  const fileInputRef = useRef(null);

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

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);
        await importTestCases(data);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        // Upload file first
        const { file_url } = await appClient.integrations.Core.UploadFile({ file });
        
        // Extract data using AI
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

        if (result.status === 'success' && result.output?.test_cases) {
          await importTestCases(result.output.test_cases);
        } else {
          alert('Ошибка извлечения данных из файла');
        }
      }
    } catch (error) {
      alert('Ошибка импорта: ' + error.message);
    }

    e.target.value = '';
  };

  const importTestCases = async (data) => {
    const cases = data.map(tc => ({
      title: tc.title,
      priority: tc.priority || 'P3',
      type: tc.type || 'Manual',
      tags: typeof tc.tags === 'string' ? tc.tags.split(',').map(t => t.trim()) : (tc.tags || []),
      preconditions: tc.preconditions || '',
      steps: typeof tc.steps === 'string' ? JSON.parse(tc.steps) : (tc.steps || []),
      requirements: typeof tc.requirements === 'string' ? JSON.parse(tc.requirements) : (tc.requirements || []),
      is_flaky: tc.is_flaky || false
    }));

    await appClient.entities.TestCase.bulkCreate(cases);
    onImportComplete();
    alert(`Импортировано ${cases.length} тест-кейсов`);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" /> Экспорт
      </Button>
      <Button 
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" /> Импорт
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,.xlsx"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}