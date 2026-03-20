import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Check, 
  CreditCard, 
  Users, 
  Zap, 
  Shield, 
  BarChart3,
  Crown,
  Sparkles,
  Building2
} from 'lucide-react';
import { cn } from "@/lib/utils";

const plans = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Для пет-проектов и фрилансеров',
    price: 0,
    period: 'навсегда',
    icon: Sparkles,
    color: 'slate',
    features: [
      { text: 'До 3 проектов', included: true },
      { text: '1 пользователь', included: true },
      { text: 'До 100 тест-кейсов', included: true },
      { text: 'Базовые тест-планы и прогоны', included: true },
      { text: 'Базовая отчетность', included: true },
      { text: 'Экспресс-тестирование (AI)', included: true },
      { text: 'Mind Map редактор', included: false },
      { text: 'AI Risk-Based Testing', included: false },
      { text: 'Экспорт в PDF', included: false },
      { text: 'Интеграции', included: false },
      { text: 'История изменений', included: false },
    ],
    cta: 'Текущий план',
    highlighted: false,
  },
  {
    id: 'team',
    name: 'Team',
    subtitle: 'Для небольших команд и стартапов',
    price: 1500,
    period: 'за пользователя в месяц',
    icon: Users,
    color: 'indigo',
    features: [
      { text: 'Безлимитное количество проектов', included: true },
      { text: 'Безлимитное количество тест-кейсов', included: true },
      { text: 'До 10 активных пользователей (Tester, QA Lead)', included: true },
      { text: 'Безлимит Viewer (только просмотр)', included: true },
      { text: 'Общие шаги (Shared Steps)', included: true },
      { text: 'Mind Map редактор', included: true },
      { text: 'AI Risk-Based Testing', included: true },
      { text: 'AI-генерация тест-кейсов', included: true },
      { text: 'Интеграция с Jira/YouTrack/GitHub', included: true },
      { text: 'Automation API', included: true },
      { text: 'Трассируемость требований', included: true },
      { text: 'История изменений (30 дней)', included: true },
      { text: 'Экспорт в PDF', included: true },
      { text: 'Приоритетная поддержка', included: true },
    ],
    cta: 'Начать пробный период',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Business / Enterprise',
    subtitle: 'Для крупных компаний',
    price: null,
    priceText: 'Индивидуально',
    period: 'от 50 000 руб./мес',
    icon: Building2,
    color: 'purple',
    features: [
      { text: 'Всё из тарифа Team', included: true },
      { text: 'Безлимитное количество пользователей', included: true },
      { text: 'AI-ассистент для анализа багов', included: true },
      { text: 'Advanced Analytics и прогнозы', included: true },
      { text: 'Audit Log (полный лог доступа)', included: true },
      { text: 'Управление командой (Workload)', included: true },
      { text: 'SSO / SAML (Google, Okta, AD)', included: true },
      { text: 'Self-hosted версия', included: true },
      { text: 'Webhooks и кастомные интеграции', included: true },
      { text: 'История изменений (безлимит)', included: true },
      { text: 'Персональный менеджер', included: true },
      { text: 'SLA гарантии', included: true },
    ],
    cta: 'Связаться с нами',
    highlighted: false,
  },
];

export default function Billing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // monthly or annual

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          Выберите подходящий тариф
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Начните с бесплатного плана и масштабируйтесь по мере роста команды
        </p>
      </div>

      {/* Current Plan Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Crown className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Вы используете план Free</h3>
                <p className="text-sm text-muted-foreground">
                  2 из 3 проектов • 45 из 100 тест-кейсов использовано
                </p>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              Улучшить план
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isHighlighted = plan.highlighted;
          
          return (
            <Card 
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                isHighlighted && "border-2 border-primary shadow-xl scale-105"
              )}
            >
              {isHighlighted && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-bl-lg rounded-tr-xl bg-primary">
                    Популярный
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-8 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    plan.color === 'slate' && "bg-slate-100 dark:bg-slate-800",
                    plan.color === 'indigo' && "bg-indigo-100 dark:bg-indigo-900/50",
                    plan.color === 'purple' && "bg-purple-100 dark:bg-purple-900/50"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      plan.color === 'slate' && "text-slate-600 dark:text-slate-400",
                      plan.color === 'indigo' && "text-indigo-600 dark:text-indigo-400",
                      plan.color === 'purple' && "text-purple-600 dark:text-purple-400"
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-sm">{plan.subtitle}</CardDescription>
                
                <div className="mt-6">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price.toLocaleString('ru-RU')}
                      </span>
                      <span className="text-lg text-muted-foreground">₽</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-foreground">
                      {plan.priceText}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button 
                  className={cn(
                    "w-full",
                    isHighlighted && "bg-primary hover:bg-primary/90"
                  )}
                  variant={isHighlighted ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>

                <div className="space-y-3 pt-4 border-t border-border">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        feature.included 
                          ? "bg-emerald-100 dark:bg-emerald-900/30" 
                          : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        {feature.included ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <div className="w-2 h-0.5 bg-slate-400 dark:bg-slate-600" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm",
                        feature.included 
                          ? "text-foreground" 
                          : "text-muted-foreground line-through"
                      )}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Сравнение тарифов</CardTitle>
          <CardDescription>Подробное сравнение возможностей каждого плана</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">
                    Возможность
                  </th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-4">
                      <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Количество проектов</td>
                  <td className="py-4 px-4 text-center text-sm text-muted-foreground">До 3</td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">Безлимит</td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">Безлимит</td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Активные пользователи (Tester, QA Lead)</td>
                  <td className="py-4 px-4 text-center text-sm text-muted-foreground">1</td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">До 10</td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">Безлимит</td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Viewer (только просмотр)</td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">Безлимит</td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">Безлимит</td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Тест-кейсов</td>
                  <td className="py-4 px-4 text-center text-sm text-muted-foreground">До 100</td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">Безлимит</td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">Безлимит</td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Интеграции (Jira, GitHub)</td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Mind Map редактор</td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">AI Risk-Based Testing</td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Экспресс-тестирование (AI)</td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">История изменений</td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center text-sm text-muted-foreground">30 дней</td>
                  <td className="py-4 px-4 text-center text-sm text-foreground font-medium">Безлимит</td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Управление командой</td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">SSO / SAML</td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                </tr>
                <tr className="hover:bg-accent">
                  <td className="py-4 px-4 text-sm text-foreground">Self-hosted версия</td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-2 h-0.5 bg-slate-300 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ / Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Нужна помощь с выбором?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-accent">
              <h4 className="font-semibold text-foreground mb-2">Связаться с отделом продаж</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Обсудим ваши задачи и подберем оптимальное решение
              </p>
              <Button variant="outline" size="sm">
                sales@testflow.ru
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-accent">
              <h4 className="font-semibold text-foreground mb-2">Техническая поддержка</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Поможем с настройкой и ответим на вопросы
              </p>
              <Button variant="outline" size="sm">
                support@testflow.ru
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">Мы принимаем</p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">Банковские карты</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm">Счет для юр. лиц</span>
          </div>
        </div>
      </div>
    </div>
  );
}