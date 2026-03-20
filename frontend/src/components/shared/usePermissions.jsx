import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/client';

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
    staleTime: Infinity
  });

  const role = user?.qa_role || 'Tester';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    role,
    isAdmin,
    
    // Viewer: только просмотр
    canView: true,
    
    // Tester: выполнение тестов, создание багов
    canExecuteTests: role === 'Tester' || role === 'QA Lead' || isAdmin,
    canCreateBugs: role === 'Tester' || role === 'QA Lead' || isAdmin,
    canEditTestRuns: role === 'Tester' || role === 'QA Lead' || isAdmin,
    
    // QA Lead: полный доступ
    canManageStructure: role === 'QA Lead' || isAdmin,
    canCreateTestCases: role === 'QA Lead' || isAdmin,
    canDeleteTestCases: role === 'QA Lead' || isAdmin,
    canCreateTestPlans: role === 'QA Lead' || isAdmin,
    canManageReleases: role === 'QA Lead' || isAdmin,
    canManageIntegrations: role === 'QA Lead' || isAdmin,
  };
}