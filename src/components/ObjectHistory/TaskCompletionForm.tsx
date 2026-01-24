import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TaskCompletionFormProps {
  taskComment: string;
  taskPhotos: string[];
  isCompleting: boolean;
  onCommentChange: (comment: string) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: (index: number) => void;
  onComplete: () => void;
  onCancel: () => void;
}

export default function TaskCompletionForm({
  taskComment,
  taskPhotos,
  isCompleting,
  onCommentChange,
  onPhotoUpload,
  onPhotoRemove,
  onComplete,
  onCancel
}: TaskCompletionFormProps) {
  return (
    <div className="mt-4 space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <h4 className="text-white font-medium flex items-center gap-2">
        <Icon name="ClipboardCheck" size={18} className="text-green-400" />
        Выполнение задачи
      </h4>
      
      <div>
        <label className="text-slate-200 text-sm mb-2 block">Комментарий к выполнению *</label>
        <textarea
          placeholder="Опишите что было сделано..."
          value={taskComment}
          onChange={(e) => onCommentChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 min-h-[80px] resize-y"
        />
      </div>

      <div>
        <label className="text-slate-200 text-sm mb-2 block">Фото отчёта *</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
          capture="environment"
          onChange={onPhotoUpload}
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-md file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700"
        />
        <p className="text-xs text-slate-500 mt-1">Фото будет сжато до 1280px для надёжной синхронизации</p>
        {taskPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {taskPhotos.map((photo, idx) => (
              <div key={idx} className="relative aspect-video rounded overflow-hidden">
                <img src={photo} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => onPhotoRemove(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                >
                  <Icon name="X" size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onComplete}
          disabled={isCompleting}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {isCompleting ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Icon name="Check" size={16} className="mr-2" />
              Завершить задачу
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isCompleting}
          className="border-slate-600 text-slate-300 disabled:opacity-50"
        >
          Отмена
        </Button>
      </div>
    </div>
  );
}