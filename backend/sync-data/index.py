import json
import os
import psycopg2
import boto3
import base64
from typing import Any, Dict, List, Tuple, Optional

def upload_media(s3, bucket: str, data_uri: str, file_id: str, prefix: str) -> Tuple[str, Optional[str]]:
    '''Загружает медиафайл в S3 и возвращает CDN URL'''
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
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
        return file_key, cdn_url
    except Exception as e:
        print(f"Error uploading media: {e}")
        return "", None

def get_db_connection():
    '''Подключение к PostgreSQL'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''API для синхронизации данных с PostgreSQL базой'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # GET - получить все данные из БД
    if method == 'GET':
        try:
            print('GET: Starting database connection...')
            conn = get_db_connection()
            cursor = conn.cursor()
            print('GET: Connection successful')
            
            # Получаем объекты с дополнительными полями
            cursor.execute('''
                SELECT id, name, address, created_at, updated_at, object_photo, description, 
                       contact_name, contact_phone, object_type
                FROM t_p32730230_emergency_visit_trac.objects_v2
                WHERE is_archived IS NULL OR is_archived = FALSE
                ORDER BY id
            ''')
            objects_rows = cursor.fetchall() or []
            
            # Получаем визиты (только неархивные)
            cursor.execute('''
                SELECT id, object_id, visit_date, visit_type, comment, created_by, created_at, is_locked,
                       task_description, task_completed, task_completed_by, task_completed_at, created_by_role,
                       task_recipient
                FROM t_p32730230_emergency_visit_trac.visits_v2
                WHERE is_archived IS NULL OR is_archived = FALSE
                ORDER BY object_id, visit_date DESC
            ''')
            visits_rows = cursor.fetchall()
            
            # Получаем фото
            cursor.execute('''
                SELECT visit_id, photo_url
                FROM t_p32730230_emergency_visit_trac.photos_v2
                ORDER BY visit_id
            ''')
            photos_rows = cursor.fetchall()
            
            # Получаем пользователей
            cursor.execute('''
                SELECT id, username, password_hash, full_name, role, phone, created_at
                FROM t_p32730230_emergency_visit_trac.users
                ORDER BY id
            ''')
            users_rows = cursor.fetchall() or []
            
            cursor.close()
            conn.close()
            
            # Собираем фото по визитам
            photos_by_visit = {}
            for photo_row in photos_rows:
                visit_id = photo_row[0]
                if visit_id not in photos_by_visit:
                    photos_by_visit[visit_id] = []
                photos_by_visit[visit_id].append(photo_row[1])
            
            # Собираем визиты по объектам
            visits_by_object = {}
            for visit_row in visits_rows:
                object_id = visit_row[1]
                visit = {
                    'id': str(visit_row[0]),
                    'date': visit_row[2].isoformat() if visit_row[2] else '',
                    'type': visit_row[3] or 'planned',
                    'comment': visit_row[4] or '',
                    'photos': photos_by_visit.get(visit_row[0], []),
                    'createdBy': visit_row[5] or '',
                    'createdAt': visit_row[6].isoformat() if visit_row[6] else '2024-01-01T00:00:00',
                    'isLocked': visit_row[7] if visit_row[7] is not None else True
                }
                # Добавляем поля задач если они есть
                if visit_row[8]:  # task_description
                    visit['taskDescription'] = visit_row[8]
                if visit_row[9] is not None:  # task_completed
                    visit['taskCompleted'] = visit_row[9]
                if visit_row[10]:  # task_completed_by
                    visit['taskCompletedBy'] = visit_row[10]
                if visit_row[11]:  # task_completed_at
                    visit['taskCompletedAt'] = visit_row[11].isoformat()
                if visit_row[12]:  # created_by_role
                    visit['createdByRole'] = visit_row[12]
                if visit_row[13]:  # task_recipient
                    visit['taskRecipient'] = visit_row[13]
                
                if object_id not in visits_by_object:
                    visits_by_object[object_id] = []
                visits_by_object[object_id].append(visit)
            
            # Собираем объекты
            objects = []
            for obj_row in objects_rows:
                obj = {
                    'id': str(obj_row[0]),
                    'name': obj_row[1],
                    'address': obj_row[2],
                    'visits': visits_by_object.get(obj_row[0], []),
                    'deleted': False
                }
                # Добавляем дополнительные поля если они не NULL
                if obj_row[5]:  # object_photo
                    obj['objectPhoto'] = obj_row[5]
                if obj_row[6]:  # description
                    obj['description'] = obj_row[6]
                if obj_row[7]:  # contact_name
                    obj['contactName'] = obj_row[7]
                if obj_row[8]:  # contact_phone
                    obj['contactPhone'] = obj_row[8]
                if obj_row[9]:  # object_type
                    obj['objectType'] = obj_row[9]
                else:
                    obj['objectType'] = 'regular'
                
                objects.append(obj)
            
            # Собираем пользователей из БД
            users = []
            for user_row in users_rows:
                users.append({
                    'id': str(user_row[0]),
                    'username': user_row[1],
                    'password': user_row[2],  # password_hash хранится в БД
                    'fullName': user_row[3],
                    'role': user_row[4],
                    'phone': user_row[5] or '',
                    'createdAt': user_row[6].isoformat() if user_row[6] else '2024-01-01T00:00:00'
                })
            
            print(f"GET: Returning {len(objects)} objects, {len(users)} users")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'success',
                    'data': {
                        'objects': objects,
                        'users': users
                    }
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
            
        except Exception as e:
            import traceback
            print(f"GET error: {e}")
            print(f"GET error traceback: {traceback.format_exc()}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Ошибка загрузки: {str(e)}'
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
    
    # POST - сохранить данные в БД
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action != 'sync':
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Неизвестное действие'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            local_objects = body.get('objects', [])
            local_users = body.get('users', [])
            
            print(f"SYNC: Received {len(local_objects)} objects, {len(local_users)} users")
            
            # Инициализация S3 клиента для загрузки фото
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            bucket = 'files'
            photos_prefix = 'mchs_photos/'
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            uploaded_files = []
            saved_count = 0
            
            # Сохраняем объекты
            for obj in local_objects:
                obj_id = str(obj['id'])
                
                # Загружаем фото объекта в S3 если это base64
                if obj.get('objectPhoto') and obj['objectPhoto'].startswith('data:'):
                    file_key, cdn_url = upload_media(s3, bucket, obj['objectPhoto'], f"obj_{obj_id}", photos_prefix)
                    if cdn_url:
                        obj['objectPhoto'] = cdn_url
                        uploaded_files.append(file_key)
                
                # Проверяем существование объекта
                cursor.execute('''
                    SELECT id FROM t_p32730230_emergency_visit_trac.objects_v2 WHERE id = %s
                ''', (obj_id,))
                exists = cursor.fetchone()
                
                if exists:
                    # Проверяем флаг deleted - если true, помечаем как архивный
                    is_deleted = obj.get('deleted', False)
                    cursor.execute('''
                        UPDATE t_p32730230_emergency_visit_trac.objects_v2
                        SET name = %s, address = %s, object_photo = %s, description = %s,
                            contact_name = %s, contact_phone = %s, object_type = %s,
                            is_archived = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (
                        obj['name'], 
                        obj['address'], 
                        obj.get('objectPhoto'),
                        obj.get('description'),
                        obj.get('contactName'),
                        obj.get('contactPhone'),
                        obj.get('objectType'),
                        is_deleted,
                        obj_id
                    ))
                else:
                    cursor.execute('''
                        INSERT INTO t_p32730230_emergency_visit_trac.objects_v2 
                        (id, name, address, object_photo, description, contact_name, contact_phone, object_type)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ''', (
                        obj_id, 
                        obj['name'], 
                        obj['address'],
                        obj.get('objectPhoto'),
                        obj.get('description'),
                        obj.get('contactName'),
                        obj.get('contactPhone'),
                        obj.get('objectType')
                    ))
                
                # Сохраняем визиты
                for visit in obj.get('visits', []):
                    visit_id = str(visit['id'])
                    is_deleted = visit.get('deleted', False)
                    
                    print(f"Processing visit {visit_id}: deleted={is_deleted}")
                    
                    cursor.execute('''
                        SELECT id FROM t_p32730230_emergency_visit_trac.visits_v2 WHERE id = %s
                    ''', (visit_id,))
                    visit_exists = cursor.fetchone()
                    
                    print(f"Visit {visit_id} exists in DB: {visit_exists is not None}")
                    
                    # Если визит помечен как удалённый и уже существует в БД - обновляем is_archived
                    if is_deleted and visit_exists:
                        print(f"✅ Marking visit {visit_id} as archived (deleted=True, exists=True)")
                        cursor.execute('''
                            UPDATE t_p32730230_emergency_visit_trac.visits_v2
                            SET is_archived = TRUE
                            WHERE id = %s
                        ''', (visit_id,))
                        print(f"✅ Visit {visit_id} marked as archived")
                        continue
                    
                    # Пропускаем создание удалённых визитов
                    if is_deleted and not visit_exists:
                        print(f"Skipping creation of deleted visit {visit_id}")
                        continue
                    
                    if not visit_exists:
                        # Создаём новый визит с флагом is_archived если он помечен deleted
                        cursor.execute('''
                            INSERT INTO t_p32730230_emergency_visit_trac.visits_v2 
                            (id, object_id, user_id, visit_date, visit_type, comment, created_by, created_at, is_locked,
                             task_description, task_completed, task_completed_by, task_completed_at, is_archived, created_by_role, task_recipient)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, %s, %s, %s, %s, %s, %s, %s, %s)
                        ''', (
                            visit_id,
                            obj_id,
                            1,
                            visit.get('date', '2024-01-01')[:10],
                            visit.get('type', 'planned'),
                            visit.get('comment', ''),
                            visit.get('createdBy', 'Unknown'),
                            visit.get('isLocked', True),
                            visit.get('taskDescription'),
                            visit.get('taskCompleted'),
                            visit.get('taskCompletedBy'),
                            visit.get('taskCompletedAt'),
                            is_deleted,
                            visit.get('createdByRole'),
                            visit.get('taskRecipient')
                        ))
                    else:
                        # Обновляем визит если он уже существует (для завершения задач и удаления)
                        is_deleted = visit.get('deleted', False)
                        cursor.execute('''
                            UPDATE t_p32730230_emergency_visit_trac.visits_v2
                            SET comment = %s, task_completed = %s, task_completed_by = %s, 
                                task_completed_at = %s, is_archived = %s, created_by_role = %s, task_recipient = %s
                            WHERE id = %s
                        ''', (
                            visit.get('comment', ''),
                            visit.get('taskCompleted'),
                            visit.get('taskCompletedBy'),
                            visit.get('taskCompletedAt'),
                            is_deleted,
                            visit.get('createdByRole'),
                            visit.get('taskRecipient'),
                            visit_id
                        ))
                    
                    # Загружаем фото визита в S3 и сохраняем в БД
                    for i, photo in enumerate(visit.get('photos', [])):
                        if photo.startswith('data:'):
                            file_key, cdn_url = upload_media(s3, bucket, photo, f"visit_{visit_id}_{i}", photos_prefix)
                            if cdn_url:
                                photo = cdn_url
                                uploaded_files.append(file_key)
                        
                        # Проверяем существование фото
                        cursor.execute('''
                            SELECT photo_url FROM t_p32730230_emergency_visit_trac.photos_v2 
                            WHERE visit_id = %s AND photo_url = %s
                        ''', (visit_id, photo))
                        photo_exists = cursor.fetchone()
                        
                        if not photo_exists and photo:
                            cursor.execute('''
                                INSERT INTO t_p32730230_emergency_visit_trac.photos_v2 (visit_id, photo_url)
                                VALUES (%s, %s)
                            ''', (visit_id, photo))
                
                saved_count += 1
            
            # Сохраняем пользователей
            users_saved = 0
            for user in local_users:
                user_id = user.get('id')
                username = user.get('username')
                password = user.get('password')
                full_name = user.get('fullName')
                role = user.get('role')
                phone = user.get('phone', '')
                
                if not username or not password or not full_name:
                    continue
                
                # Проверяем существование пользователя
                cursor.execute('''
                    SELECT id FROM t_p32730230_emergency_visit_trac.users WHERE username = %s
                ''', (username,))
                existing = cursor.fetchone()
                
                if existing:
                    # Обновляем существующего пользователя
                    cursor.execute('''
                        UPDATE t_p32730230_emergency_visit_trac.users
                        SET password_hash = %s, full_name = %s, role = %s, phone = %s
                        WHERE username = %s
                    ''', (password, full_name, role, phone, username))
                else:
                    # Создаём нового пользователя
                    cursor.execute('''
                        INSERT INTO t_p32730230_emergency_visit_trac.users 
                        (username, password_hash, full_name, role, phone, created_at)
                        VALUES (%s, %s, %s, %s, %s, NOW())
                    ''', (username, password, full_name, role, phone))
                
                users_saved += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"SYNC: Saved {saved_count} objects, {users_saved} users, uploaded {len(uploaded_files)} files")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'success',
                    'message': f'Синхронизировано {saved_count} объектов и {users_saved} пользователей',
                    'uploaded_photos': len(uploaded_files)
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
            
        except Exception as e:
            print(f"POST error: {e}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Ошибка синхронизации: {str(e)}'
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Метод не поддерживается'}, ensure_ascii=False),
        'isBase64Encoded': False
    }