from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import psycopg2
import boto3
import base64
import os
from datetime import datetime

app = FastAPI(title="МЧС Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class Visit(BaseModel):
    id: str
    visitDate: str
    visitType: str
    comment: str = ""
    createdBy: str = "Unknown"
    photos: List[str] = []
    isLocked: bool = True
    taskDescription: Optional[str] = None
    taskCompleted: Optional[bool] = None
    taskCompletedBy: Optional[str] = None
    taskCompletedAt: Optional[str] = None
    deleted: bool = False
    createdByRole: Optional[str] = None

class SiteObject(BaseModel):
    id: str
    name: str
    address: str
    visits: List[Visit] = []
    objectPhoto: Optional[str] = None
    description: Optional[str] = None
    contactName: Optional[str] = None
    contactPhone: Optional[str] = None
    objectType: Optional[str] = None
    deleted: bool = False

class User(BaseModel):
    id: str
    username: str
    password: str
    fullName: str
    role: str
    phone: Optional[str] = None

class SyncRequest(BaseModel):
    action: str
    objects: List[SiteObject] = []
    users: List[User] = []

# Подключение к БД
def get_db():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

# Подключение к S3 (MinIO)
def get_s3():
    return boto3.client('s3',
        endpoint_url=os.environ.get('S3_ENDPOINT', 'http://minio:9000'),
        aws_access_key_id=os.environ.get('S3_ACCESS_KEY', 'minioadmin'),
        aws_secret_access_key=os.environ.get('S3_SECRET_KEY', 'minioadmin'),
    )

# Загрузка медиа в S3
def upload_media(s3, bucket: str, data_uri: str, file_id: str, prefix: str):
    try:
        mime_type = data_uri.split(';')[0].split(':')[1]
        base64_data = data_uri.split(',')[1]
        file_bytes = base64.b64decode(base64_data)
        
        ext = mime_type.split('/')[1] if '/' in mime_type else 'jpg'
        file_key = f"{prefix}{file_id}.{ext}"
        
        s3.put_object(
            Bucket=bucket,
            Key=file_key,
            Body=file_bytes,
            ContentType=mime_type
        )
        
        cdn_url = f"http://localhost:9000/{bucket}/{file_key}"
        return file_key, cdn_url
    except Exception as e:
        print(f"Error uploading media: {e}")
        return "", None

@app.get("/")
async def root():
    return {"status": "ok", "service": "МЧС Tracker API"}

@app.get("/api/sync")
async def get_data():
    """Получить все данные из БД"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Получаем объекты
        cursor.execute('''
            SELECT id, name, address, created_at, updated_at, object_photo, description, 
                   contact_name, contact_phone, object_type
            FROM objects
            WHERE is_archived IS NULL OR is_archived = FALSE
            ORDER BY id
        ''')
        objects_rows = cursor.fetchall() or []
        
        # Получаем визиты
        cursor.execute('''
            SELECT id, object_id, visit_date, visit_type, comment, created_by, created_at, is_locked,
                   task_description, task_completed, task_completed_by, task_completed_at, created_by_role
            FROM visits
            WHERE is_archived IS NULL OR is_archived = FALSE
            ORDER BY object_id, visit_date DESC
        ''')
        visits_rows = cursor.fetchall()
        
        # Получаем фото
        cursor.execute('''
            SELECT visit_id, photo_url
            FROM photos
            ORDER BY visit_id
        ''')
        photos_rows = cursor.fetchall()
        
        # Получаем пользователей
        cursor.execute('''
            SELECT id, username, password_hash, full_name, role, phone, created_at
            FROM users
            ORDER BY id
        ''')
        users_rows = cursor.fetchall() or []
        
        cursor.close()
        conn.close()
        
        # Формируем структуру данных
        photos_map = {}
        for photo_row in photos_rows:
            visit_id = photo_row[0]
            if visit_id not in photos_map:
                photos_map[visit_id] = []
            photos_map[visit_id].append(photo_row[1])
        
        visits_map = {}
        for visit_row in visits_rows:
            object_id = visit_row[1]
            if object_id not in visits_map:
                visits_map[object_id] = []
            
            visit = {
                'id': visit_row[0],
                'visitDate': visit_row[2].isoformat() if visit_row[2] else None,
                'visitType': visit_row[3],
                'comment': visit_row[4] or '',
                'createdBy': visit_row[5] or 'Unknown',
                'photos': photos_map.get(visit_row[0], []),
                'isLocked': visit_row[7] if visit_row[7] is not None else True,
                'taskDescription': visit_row[8],
                'taskCompleted': visit_row[9],
                'taskCompletedBy': visit_row[10],
                'taskCompletedAt': visit_row[11].isoformat() if visit_row[11] else None,
                'createdByRole': visit_row[12]
            }
            visits_map[object_id].append(visit)
        
        objects = []
        for obj_row in objects_rows:
            obj = {
                'id': obj_row[0],
                'name': obj_row[1],
                'address': obj_row[2],
                'visits': visits_map.get(obj_row[0], []),
                'objectPhoto': obj_row[5],
                'description': obj_row[6],
                'contactName': obj_row[7],
                'contactPhone': obj_row[8],
                'objectType': obj_row[9]
            }
            objects.append(obj)
        
        users = []
        for user_row in users_rows:
            user = {
                'id': user_row[0],
                'username': user_row[1],
                'password': user_row[2],
                'fullName': user_row[3],
                'role': user_row[4],
                'phone': user_row[5]
            }
            users.append(user)
        
        return {
            'status': 'success',
            'data': {
                'objects': objects,
                'users': users
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync")
async def sync_data(request: SyncRequest):
    """Синхронизация данных в БД"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        s3 = get_s3()
        bucket = 'mchs-tracker'
        
        saved_count = 0
        uploaded_files = []
        
        photos_prefix = "photos/"
        objects_prefix = "objects/"
        
        # Синхронизация объектов
        for obj_dict in request.objects:
            obj = obj_dict.dict() if hasattr(obj_dict, 'dict') else obj_dict
            object_id = obj.get('id')
            
            # Проверяем существование объекта
            cursor.execute('SELECT id FROM objects WHERE id = %s', (object_id,))
            obj_exists = cursor.fetchone()
            
            # Загружаем фото объекта
            object_photo = obj.get('objectPhoto', '')
            if object_photo and object_photo.startswith('data:'):
                file_key, cdn_url = upload_media(s3, bucket, object_photo, f"obj_{object_id}", objects_prefix)
                if cdn_url:
                    object_photo = cdn_url
                    uploaded_files.append(file_key)
            
            is_deleted = obj.get('deleted', False)
            
            if not obj_exists:
                cursor.execute('''
                    INSERT INTO objects (id, name, address, object_photo, description, 
                                       contact_name, contact_phone, object_type, is_archived)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    object_id,
                    obj.get('name', ''),
                    obj.get('address', ''),
                    object_photo,
                    obj.get('description'),
                    obj.get('contactName'),
                    obj.get('contactPhone'),
                    obj.get('objectType'),
                    is_deleted
                ))
            else:
                cursor.execute('''
                    UPDATE objects
                    SET name = %s, address = %s, object_photo = %s, description = %s,
                        contact_name = %s, contact_phone = %s, object_type = %s, 
                        is_archived = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (
                    obj.get('name', ''),
                    obj.get('address', ''),
                    object_photo,
                    obj.get('description'),
                    obj.get('contactName'),
                    obj.get('contactPhone'),
                    obj.get('objectType'),
                    is_deleted,
                    object_id
                ))
            
            # Синхронизация визитов
            for visit in obj.get('visits', []):
                visit_id = visit.get('id')
                
                cursor.execute('SELECT id FROM visits WHERE id = %s', (visit_id,))
                visit_exists = cursor.fetchone()
                
                if not visit_exists:
                    is_deleted = visit.get('deleted', False)
                    cursor.execute('''
                        INSERT INTO visits (id, object_id, visit_date, visit_type, comment, 
                                          created_by, is_locked, task_description, task_completed,
                                          task_completed_by, task_completed_at, is_archived, created_by_role)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ''', (
                        visit_id,
                        object_id,
                        visit.get('visitDate'),
                        visit.get('visitType'),
                        visit.get('comment', ''),
                        visit.get('createdBy', 'Unknown'),
                        visit.get('isLocked', True),
                        visit.get('taskDescription'),
                        visit.get('taskCompleted'),
                        visit.get('taskCompletedBy'),
                        visit.get('taskCompletedAt'),
                        is_deleted,
                        visit.get('createdByRole')
                    ))
                else:
                    is_deleted = visit.get('deleted', False)
                    cursor.execute('''
                        UPDATE visits
                        SET comment = %s, task_completed = %s, task_completed_by = %s, 
                            task_completed_at = %s, is_archived = %s, created_by_role = %s
                        WHERE id = %s
                    ''', (
                        visit.get('comment', ''),
                        visit.get('taskCompleted'),
                        visit.get('taskCompletedBy'),
                        visit.get('taskCompletedAt'),
                        is_deleted,
                        visit.get('createdByRole'),
                        visit_id
                    ))
                
                # Загружаем фото визита
                for i, photo in enumerate(visit.get('photos', [])):
                    if photo.startswith('data:'):
                        file_key, cdn_url = upload_media(s3, bucket, photo, f"visit_{visit_id}_{i}", photos_prefix)
                        if cdn_url:
                            photo = cdn_url
                            uploaded_files.append(file_key)
                    
                    cursor.execute('''
                        SELECT photo_url FROM photos 
                        WHERE visit_id = %s AND photo_url = %s
                    ''', (visit_id, photo))
                    photo_exists = cursor.fetchone()
                    
                    if not photo_exists and photo:
                        cursor.execute('''
                            INSERT INTO photos (visit_id, photo_url)
                            VALUES (%s, %s)
                        ''', (visit_id, photo))
            
            saved_count += 1
        
        # Сохраняем пользователей
        for user_dict in request.users:
            user = user_dict.dict() if hasattr(user_dict, 'dict') else user_dict
            user_id = user.get('id')
            
            cursor.execute('SELECT id FROM users WHERE id = %s', (user_id,))
            user_exists = cursor.fetchone()
            
            if not user_exists:
                cursor.execute('''
                    INSERT INTO users (id, username, password_hash, full_name, role, phone)
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (
                    user_id,
                    user.get('username'),
                    user.get('password'),
                    user.get('fullName'),
                    user.get('role'),
                    user.get('phone')
                ))
            else:
                cursor.execute('''
                    UPDATE users
                    SET username = %s, password_hash = %s, full_name = %s, role = %s, phone = %s
                    WHERE id = %s
                ''', (
                    user.get('username'),
                    user.get('password'),
                    user.get('fullName'),
                    user.get('role'),
                    user.get('phone'),
                    user_id
                ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'status': 'success',
            'message': f'Синхронизировано {saved_count} объектов',
            'uploaded_photos': len(uploaded_files)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
