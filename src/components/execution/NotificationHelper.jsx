import { appClient } from '@/api/client';

export async function sendTestAssignedNotification(testRun, assignedTo) {
  try {
    const webhooks = await appClient.entities.WebhookConfig.filter({ 
      enabled: true 
    });

    const relevantWebhooks = webhooks.filter(
      w => w.trigger_on === 'test_assigned' || w.trigger_on === 'all'
    );

    for (const webhook of relevantWebhooks) {
      const message = `🎯 *Назначен новый тест*\n\n` +
        `Тестировщик: ${assignedTo}\n` +
        `Тест: ${testRun.snapshot?.title || 'N/A'}\n` +
        `Приоритет: ${testRun.snapshot?.priority || 'N/A'}\n` +
        `Тип: ${testRun.snapshot?.type || 'Manual'}`;

      if (webhook.type === 'email') {
        await appClient.integrations.Core.SendEmail({
          to: webhook.webhook_url,
          subject: '🎯 Новый тест назначен вам',
          body: `<h2>Назначен новый тест</h2>
                 <p><strong>Тестировщик:</strong> ${assignedTo}</p>
                 <p><strong>Тест:</strong> ${testRun.snapshot?.title || 'N/A'}</p>
                 <p><strong>Приоритет:</strong> ${testRun.snapshot?.priority || 'N/A'}</p>
                 <p><strong>Тип:</strong> ${testRun.snapshot?.type || 'Manual'}</p>
                 <p>Откройте TestFlow для выполнения теста.</p>`
        });
      } else if (webhook.type === 'slack') {
        await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });
      } else if (webhook.type === 'telegram') {
        await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function sendPlanCompletedNotification(testPlan, stats, pdfUrl = null) {
  try {
    const webhooks = await appClient.entities.WebhookConfig.filter({ 
      enabled: true 
    });

    const relevantWebhooks = webhooks.filter(
      w => w.trigger_on === 'plan_completed' || w.trigger_on === 'all'
    );

    const passRate = stats.total > 0 
      ? Math.round((stats.pass / stats.total) * 100) 
      : 0;

    for (const webhook of relevantWebhooks) {
      const message = `✅ *Тест-план завершен*\n\n` +
        `План: ${testPlan.name}\n` +
        `Pass Rate: ${passRate}%\n` +
        `Пройдено: ${stats.pass} из ${stats.total}\n` +
        `Провалено: ${stats.fail}`;

      if (webhook.type === 'email') {
        const emailBody = `<h2>✅ Тест-план завершен</h2>
          <p><strong>План:</strong> ${testPlan.name}</p>
          <p><strong>Pass Rate:</strong> ${passRate}%</p>
          <p><strong>Пройдено:</strong> ${stats.pass} из ${stats.total}</p>
          <p><strong>Провалено:</strong> ${stats.fail}</p>
          ${pdfUrl ? `<p><a href="${pdfUrl}">Скачать PDF отчет</a></p>` : ''}
          <p>Откройте TestFlow для просмотра детальных результатов.</p>`;

        await appClient.integrations.Core.SendEmail({
          to: webhook.webhook_url,
          subject: `✅ Тест-план "${testPlan.name}" завершен`,
          body: emailBody
        });
      } else if (webhook.type === 'slack') {
        await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });
      } else if (webhook.type === 'telegram') {
        await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}