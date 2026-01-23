import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface SmsStatsTabProps {
  objects: SiteObject[];
}

interface SmsStats {
  totalSent: number;
  lastMonth: number;
  byObject: { name: string; count: number }[];
  recentMessages: { date: string; object: string; recipients: number }[];
}

export default function SmsStatsTab({ objects }: SmsStatsTabProps) {
  const [stats, setStats] = useState<SmsStats>({
    totalSent: 0,
    lastMonth: 0,
    byObject: [],
    recentMessages: []
  });

  useEffect(() => {
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    let totalSent = 0;
    let lastMonthCount = 0;
    const objectCounts: Record<string, number> = {};
    const recentMessages: { date: string; object: string; recipients: number }[] = [];

    objects.forEach(obj => {
      obj.visits.forEach(visit => {
        if (visit.smsNotifications && visit.smsNotifications.length > 0) {
          const visitDate = new Date(visit.date);
          const sentCount = visit.smsNotifications.filter(n => n.status === 'sent').length;
          
          totalSent += sentCount;
          
          if (visitDate >= lastMonthDate) {
            lastMonthCount += sentCount;
          }
          
          if (!objectCounts[obj.name]) {
            objectCounts[obj.name] = 0;
          }
          objectCounts[obj.name] += sentCount;
          
          if (sentCount > 0) {
            recentMessages.push({
              date: visit.date,
              object: obj.name,
              recipients: sentCount
            });
          }
        }
      });
    });

    const byObject = Object.entries(objectCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const sortedRecent = recentMessages
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    setStats({
      totalSent,
      lastMonth: lastMonthCount,
      byObject,
      recentMessages: sortedRecent
    });
  }, [objects]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const estimatedCost = stats.totalSent * 2;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Всего отправлено</p>
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Icon name="MessageSquare" size={20} className="text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalSent}</p>
            <p className="text-xs text-slate-500 mt-1">SMS уведомлений</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">За последний месяц</p>
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Icon name="Calendar" size={20} className="text-secondary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.lastMonth}</p>
            <p className="text-xs text-slate-500 mt-1">SMS уведомлений</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Ориентировочные расходы</p>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Icon name="CreditCard" size={20} className="text-accent" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">~{estimatedCost} ₽</p>
            <p className="text-xs text-slate-500 mt-1">~2 ₽ за SMS</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="BarChart3" size={20} className="text-primary" />
            Статистика по объектам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.byObject.length > 0 ? (
            <div className="space-y-3">
              {stats.byObject.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">SMS уведомлений отправлено</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <p className="text-2xl font-bold text-primary">{item.count}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Icon name="MessageSquare" size={48} className="mx-auto mb-3 opacity-50" />
              <p>SMS уведомления ещё не отправлялись</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="Clock" size={20} className="text-secondary" />
            Последние отправки
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentMessages.length > 0 ? (
            <div className="space-y-2">
              {stats.recentMessages.map((msg, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{msg.object}</p>
                    <p className="text-xs text-slate-400">{formatDate(msg.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Icon name="Users" size={16} className="text-primary" />
                    <span className="text-white font-semibold">{msg.recipients}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-50" />
              <p>История отправок пуста</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
