import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SiteObject } from '@/pages/Index';

interface ObjectsTabProps {
  objects: SiteObject[];
}

export default function ObjectsTab({ objects }: ObjectsTabProps) {
  return (
    <div className="space-y-4">
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Объекты под контролем</h2>
          <div className="space-y-3">
            {objects.map((obj) => (
              <div 
                key={obj.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
              >
                <div>
                  <h3 className="text-white font-medium mb-1">{obj.name}</h3>
                  <p className="text-sm text-slate-400">{obj.address}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Актов посещений</p>
                    <p className="text-lg font-semibold text-white">{obj.visits.length}</p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={
                      obj.visits.length > 0 
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-slate-700/50 text-slate-400 border-slate-600'
                    }
                  >
                    {obj.visits.length > 0 ? 'Активный' : 'Новый'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
