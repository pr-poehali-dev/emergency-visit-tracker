import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface ExportTabProps {
  objects: SiteObject[];
}

export default function ExportTab({ objects }: ExportTabProps) {
  const totalVisits = objects.reduce((sum, obj) => sum + obj.visits.length, 0);

  const handleExport = () => {
    alert('Экспорт в ЛКИР МЧС запущен. Требуется электронная подпись.');
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Icon name="FileDown" size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Выгрузка в ЛКИР МЧС</h2>
              <p className="text-slate-400">
                Экспорт всех актов посещений в формате для загрузки в систему МЧС. 
                Требуется электронная подпись директора.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Период</span>
              <span className="text-white font-medium">Январь 2026</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Объектов</span>
              <span className="text-white font-medium">{objects.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Актов посещений</span>
              <span className="text-white font-medium">{totalVisits}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <span className="text-slate-300">Фотографий</span>
              <span className="text-white font-medium">
                {objects.reduce((sum, obj) => 
                  sum + obj.visits.reduce((s, v) => s + v.photos.length, 0), 0
                )}
              </span>
            </div>
          </div>

          <Button 
            onClick={handleExport}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12"
          >
            <Icon name="FileDown" size={18} className="mr-2" />
            Начать экспорт с ЭП
          </Button>

          <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Icon name="Info" size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-200 font-medium mb-1">Требования МЧС</p>
              <p className="text-amber-300/80">
                Для выгрузки необходима квалифицированная электронная подпись директора. 
                Акты экспортируются в формате XML для ЛКИР МЧС.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
