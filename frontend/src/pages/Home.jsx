import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { 
  TestTube2,
  FolderTree, 
  PlayCircle, 
  BarChart3, 
  Link2,
  CheckCircle2,
  Zap,
  Users,
  ArrowRight,
  LogIn,
  LogOut,
  Sparkles,
  Shield,
  Clock,
  Target,
  GitBranch,
  Brain
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await appClient.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const currentUser = await appClient.auth.me();
          setUser(currentUser);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    appClient.auth.redirectToLogin();
  };

  const handleLogout = () => {
    appClient.auth.logout();
  };

  const features = [
    {
      icon: FolderTree,
      title: 'Репозиторий тест-кейсов',
      description: 'Организуйте тесты в папки, добавляйте теги, приоритеты и требования',
      page: 'Repository',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Brain,
      title: 'AI Risk-Based Testing',
      description: 'Умный анализ рисков и приоритизация тестов на основе истории',
      page: 'Execution',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: GitBranch,
      title: 'Mind Map редактор',
      description: 'Визуализируйте структуру тестов и процессы тестирования',
      page: 'MindMap',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: PlayCircle,
      title: 'Выполнение тестов',
      description: 'Создавайте тест-планы, назначайте задачи и отслеживайте прогресс',
      page: 'Execution',
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Отчеты и аналитика',
      description: 'Анализируйте результаты, создавайте релизы и публичные отчеты',
      page: 'Reports',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      icon: Target,
      title: 'Трассировка требований',
      description: 'Отслеживайте покрытие требований и находите нестабильные тесты',
      page: 'Management',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { icon: Sparkles, label: 'AI-powered', value: 'Умный анализ', gradient: 'from-purple-500 to-pink-500' },
    { icon: Shield, label: 'Enterprise Ready', value: 'Надежность', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Clock, label: 'Экономия времени', value: 'До 70%', gradient: 'from-emerald-500 to-teal-500' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ 
        backgroundImage: `
          linear-gradient(to right, #000 1px, transparent 1px),
          linear-gradient(to bottom, #000 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <div className="relative max-w-7xl mx-auto px-8 pt-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="text-xl font-semibold text-slate-900">TestFlow</span>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{user?.full_name || user?.email}</span>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900"
              >
                <LogOut className="w-4 h-4 mr-2" /> Выход
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleLogin}
              className="bg-slate-900 hover:bg-slate-800 rounded-full"
            >
              <LogIn className="w-4 h-4 mr-2" /> Вход
            </Button>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-8 pt-16 pb-20">
        <div className="mb-12">
          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-4 tracking-tight">
            TestFlow
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl">
            Современная платформа управления тестированием с AI-аналитикой
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          {/* Large Hero Card - Main CTA */}
          <Link to={createPageUrl('Dashboard')} className="md:col-span-4 md:row-span-2">
            <div className="group relative h-full min-h-[400px] bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[32px] p-10 overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                    <span className="text-white font-bold text-3xl">TF</span>
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-3">Начните тестировать<br/>умнее</h2>
                  <p className="text-indigo-100 text-lg max-w-md">AI-powered платформа для современных QA команд</p>
                </div>
                <div className="flex items-center text-white font-semibold group-hover:gap-2 transition-all">
                  Открыть Dashboard <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-full h-full opacity-10">
                <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
              </div>
            </div>
          </Link>

          {/* Stats Card 1 */}
          <div className="md:col-span-2 bg-white rounded-[32px] p-8 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stats[0].gradient} flex items-center justify-center mb-4`}>
              {React.createElement(stats[0].icon, { className: "w-6 h-6 text-white" })}
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stats[0].value}</p>
            <p className="text-slate-600 text-sm font-medium">{stats[0].label}</p>
          </div>

          {/* Stats Card 2 */}
          <div className="md:col-span-2 bg-white rounded-[32px] p-8 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stats[1].gradient} flex items-center justify-center mb-4`}>
              {React.createElement(stats[1].icon, { className: "w-6 h-6 text-white" })}
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stats[1].value}</p>
            <p className="text-slate-600 text-sm font-medium">{stats[1].label}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Feature Cards - First 3 */}
          {features.slice(0, 3).map((feature, idx) => (
            <Link key={idx} to={createPageUrl(feature.page)}>
              <div className="group h-full min-h-[280px] bg-white rounded-[32px] p-8 border border-slate-200 hover:border-slate-300 hover:scale-[1.02] transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{feature.description}</p>
                <div className="flex items-center text-indigo-600 text-sm font-semibold group-hover:gap-1 transition-all">
                  Подробнее <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          {/* Wide Feature Card */}
          <Link to={createPageUrl(features[3].page)} className="md:col-span-4">
            <div className="group h-full min-h-[220px] bg-slate-900 rounded-[32px] p-8 hover:scale-[1.02] transition-transform duration-300">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${features[3].gradient} flex items-center justify-center mb-4`}>
                {React.createElement(features[3].icon, { className: "w-6 h-6 text-white" })}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{features[3].title}</h3>
              <p className="text-slate-400 leading-relaxed max-w-xl">{features[3].description}</p>
            </div>
          </Link>

          {/* Stats Card 3 */}
          <div className="md:col-span-2 bg-white rounded-[32px] p-8 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stats[2].gradient} flex items-center justify-center mb-4`}>
              {React.createElement(stats[2].icon, { className: "w-6 h-6 text-white" })}
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stats[2].value}</p>
            <p className="text-slate-600 text-sm font-medium">{stats[2].label}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Remaining Feature Cards */}
          {features.slice(4).map((feature, idx) => (
            <Link key={idx} to={createPageUrl(feature.page)}>
              <div className="group h-full min-h-[260px] bg-white rounded-[32px] p-8 border border-slate-200 hover:border-slate-300 hover:scale-[1.02] transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{feature.description}</p>
                <div className="flex items-center text-indigo-600 text-sm font-semibold group-hover:gap-1 transition-all">
                  Подробнее <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}