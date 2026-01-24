import Icon from '@/components/ui/icon';

interface PhotoModalProps {
  photoUrl: string;
  onClose: () => void;
}

export default function PhotoModal({ photoUrl, onClose }: PhotoModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
      >
        <Icon name="X" size={24} className="text-white" />
      </button>
      <img 
        src={photoUrl} 
        alt="Фото в полном размере" 
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
