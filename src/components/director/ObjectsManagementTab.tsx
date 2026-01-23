import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SiteObject } from '@/pages/Index';

interface ObjectsManagementTabProps {
  objects: SiteObject[];
  onUpdateObjects: (objects: SiteObject[]) => void;
}

export default function ObjectsManagementTab({ objects, onUpdateObjects }: ObjectsManagementTabProps) {
  const [isAddingObject, setIsAddingObject] = useState(false);
  const [editingObject, setEditingObject] = useState<SiteObject | null>(null);
  
  const [newObject, setNewObject] = useState({
    name: '',
    address: '',
    description: '',
    contactName: '',
    contactPhone: '',
    objectPhoto: '',
    objectType: 'regular' as 'regular' | 'installation'
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (isEditing && editingObject) {
        setEditingObject({ ...editingObject, objectPhoto: base64 });
      } else {
        setNewObject({ ...newObject, objectPhoto: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddObject = () => {
    if (!newObject.name || !newObject.address) {
      alert('Заполните название и адрес объекта');
      return;
    }

    const object: SiteObject = {
      id: Date.now().toString(),
      ...newObject,
      visits: [],
      installationDays: newObject.objectType === 'installation' ? [] : undefined
    };

    onUpdateObjects([...objects, object]);
    setNewObject({ name: '', address: '', description: '', contactName: '', contactPhone: '', objectPhoto: '', objectType: 'regular' });
    setIsAddingObject(false);
  };

  const handleUpdateObject = () => {
    if (!editingObject) return;

    if (!editingObject.name || !editingObject.address) {
      alert('Заполните название и адрес объекта');
      return;
    }

    onUpdateObjects(objects.map(obj => obj.id === editingObject.id ? editingObject : obj));
    setEditingObject(null);
  };

  const handleDeleteObject = (objectId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот объект? Будут удалены все акты посещений.')) {
      onUpdateObjects(objects.filter(obj => obj.id !== objectId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-white">Управление объектами</h2>
        <div className="flex gap-3">
          <Button 
            onClick={() => {
              setNewObject({ name: '', address: '', description: '', contactName: '', contactPhone: '', objectPhoto: '', objectType: 'regular' });
              setIsAddingObject(true);
            }}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Icon name="PlusCircle" size={18} className="mr-2" />
            Добавить объект
          </Button>
          <Button 
            onClick={() => {
              setNewObject({ name: '', address: '', description: '', contactName: '', contactPhone: '', objectPhoto: '', objectType: 'installation' });
              setIsAddingObject(true);
            }}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-90"
          >
            <Icon name="HardHat" size={18} className="mr-2" />
            Добавить монтаж
          </Button>
        </div>
      </div>

      {isAddingObject && (
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {newObject.objectType === 'installation' ? 'Новый монтаж' : 'Новый объект'}
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-200 mb-2 block">Название объекта *</Label>
                <Input
                  placeholder='ТЦ "Галерея"'
                  value={newObject.name}
                  onChange={(e) => setNewObject({...newObject, name: e.target.value})}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-200 mb-2 block">Адрес *</Label>
                <Input
                  placeholder="ул. Ленина, 45"
                  value={newObject.address}
                  onChange={(e) => setNewObject({...newObject, address: e.target.value})}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-200 mb-2 block">Описание объекта</Label>
                <textarea
                  placeholder="Краткое описание объекта..."
                  value={newObject.description}
                  onChange={(e) => setNewObject({...newObject, description: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-md px-3 py-2 min-h-[80px] resize-y"
                />
              </div>
              <div>
                <Label className="text-slate-200 mb-2 block">ФИО ответственного</Label>
                <Input
                  placeholder="Иванов Иван Иванович"
                  value={newObject.contactName}
                  onChange={(e) => setNewObject({...newObject, contactName: e.target.value})}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-200 mb-2 block">Телефон ответственного</Label>
                <Input
                  placeholder="+7 (999) 123-45-67"
                  value={newObject.contactPhone}
                  onChange={(e) => setNewObject({...newObject, contactPhone: e.target.value})}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-200 mb-2 block">Фото объекта</Label>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, false)}
                    className="bg-slate-900/50 border-slate-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer hover:file:opacity-90"
                  />
                  {newObject.objectPhoto && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-700">
                      <img 
                        src={newObject.objectPhoto} 
                        alt="Предпросмотр" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleAddObject}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  <Icon name="Check" size={18} className="mr-2" />
                  Создать
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsAddingObject(false);
                    setNewObject({ name: '', address: '', description: '', contactName: '', contactPhone: '', objectPhoto: '', objectType: 'regular' });
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {objects.map((object) => (
          <Card key={object.id} className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              {editingObject?.id === object.id ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-200 mb-2 block">Название объекта *</Label>
                    <Input
                      value={editingObject.name}
                      onChange={(e) => setEditingObject({...editingObject, name: e.target.value})}
                      className="bg-slate-900/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200 mb-2 block">Адрес *</Label>
                    <Input
                      value={editingObject.address}
                      onChange={(e) => setEditingObject({...editingObject, address: e.target.value})}
                      className="bg-slate-900/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200 mb-2 block">Описание объекта</Label>
                    <textarea
                      value={editingObject.description || ''}
                      onChange={(e) => setEditingObject({...editingObject, description: e.target.value})}
                      className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-md px-3 py-2 min-h-[80px] resize-y"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200 mb-2 block">ФИО ответственного</Label>
                    <Input
                      value={editingObject.contactName || ''}
                      onChange={(e) => setEditingObject({...editingObject, contactName: e.target.value})}
                      className="bg-slate-900/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200 mb-2 block">Телефон ответственного</Label>
                    <Input
                      value={editingObject.contactPhone || ''}
                      onChange={(e) => setEditingObject({...editingObject, contactPhone: e.target.value})}
                      className="bg-slate-900/50 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200 mb-2 block">Фото объекта</Label>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, true)}
                        className="bg-slate-900/50 border-slate-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer hover:file:opacity-90"
                      />
                      {editingObject.objectPhoto && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-700">
                          <img 
                            src={editingObject.objectPhoto} 
                            alt="Фото объекта" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUpdateObject}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Icon name="Check" size={16} className="mr-1" />
                      Сохранить
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingObject(null)}
                      className="border-slate-600 text-slate-300"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  {object.objectPhoto && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                      <img 
                        src={object.objectPhoto} 
                        alt={object.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium text-lg">{object.name}</h3>
                          {object.objectType === 'installation' && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <Icon name="HardHat" size={12} className="mr-1" />
                              Монтаж
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{object.address}</p>
                        {object.description && (
                          <p className="text-sm text-slate-500 mt-1">{object.description}</p>
                        )}
                      </div>
                      <Badge 
                        variant="secondary"
                        className={
                          (object.visits?.length || 0) > 0 
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600'
                        }
                      >
                        {object.objectType === 'installation' ? 'Дней' : 'Актов'}: {object.objectType === 'installation' ? (object.installationDays?.length || 0) : (object.visits?.length || 0)}
                      </Badge>
                    </div>
                    {(object.contactName || object.contactPhone) && (
                      <div className="space-y-1 mb-3">
                        {object.contactName && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="User" size={14} className="text-slate-500" />
                            <span className="text-slate-300">{object.contactName}</span>
                          </div>
                        )}
                        {object.contactPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="Phone" size={14} className="text-slate-500" />
                            <span className="text-slate-300">{object.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingObject(object)}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        <Icon name="Edit" size={16} className="mr-1" />
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteObject(object.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Icon name="Trash2" size={16} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}