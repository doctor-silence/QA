
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  FolderTree, 
  PlayCircle, 
  BarChart3,
  TestTube2,
  Link2,
  Blocks,
  User,
  CheckSquare,
  Moon,
  Sun,
  CreditCard,
  Folder,
  Database,
  GitBranch
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { usePermissions } from '@/components/shared/usePermissions';
import RoleBadge from '@/components/shared/RoleBadge';
import { useTheme, ThemeProvider } from '@/components/shared/ThemeProvider';
import { Button } from "@/components/ui/button";

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Projects', icon: Folder, page: 'Projects' },
  { name: 'Repository', icon: FolderTree, page: 'Repository' },
  { name: 'Mind Map', icon: GitBranch, page: 'MindMap' },
  { name: 'Test Data', icon: Database, page: 'TestDataStore' },
  { name: 'Shared Steps', icon: Blocks, page: 'SharedSteps' },
  { name: 'Reviews', icon: CheckSquare, page: 'Reviews' },
  { name: 'Execution', icon: PlayCircle, page: 'Execution' },
  { name: 'Automation API', icon: TestTube2, page: 'AutomationAPI' },
  { name: 'Management', icon: User, page: 'Management' },
  { name: 'Reports', icon: BarChart3, page: 'Reports' },
  { name: 'Billing', icon: CreditCard, page: 'Billing' },
];

function LayoutContent({ children, currentPageName }) {
  const permissions = usePermissions();
  const { theme, setTheme } = useTheme();
  
  // Don't render layout for Home page
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur opacity-30"></div>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">TF</span>
              </div>
            </div>
            <div>
              <h1 className="font-semibold text-foreground tracking-tight">TestFlow</h1>
              <p className="text-xs text-muted-foreground">QA Management</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems
            .filter(item => {
              // Only admins and QA Leads can see Billing, Management, MindMap, AutomationAPI
              if (['Billing', 'Management', 'MindMap', 'AutomationAPI'].includes(item.page)) {
                return permissions.isAdmin || permissions.role === 'QA Lead';
              }
              return true;
            })
            .map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-indigo-500")} />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full justify-start gap-2"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Светлая тема</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Темная тема</span>
              </>
            )}
          </Button>
        </div>

        {/* User Info */}
        {permissions.user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {permissions.user.full_name || permissions.user.email}
                </p>
              </div>
            </div>
            <RoleBadge role={permissions.isAdmin ? 'Admin' : permissions.role} size="sm" />
          </div>
        )}
      </aside>
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </ThemeProvider>
  );
}
