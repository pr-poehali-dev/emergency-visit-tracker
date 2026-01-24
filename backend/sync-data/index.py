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
    
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    bucket = 'files'
    photos_prefix = 'mchs_photos/'
    
    # GET - получить все данные из БД
    if method == 'GET':
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Получаем объекты
            cursor.execute('''
                SELECT id, name, address, created_at, updated_at
                FROM t_p32730230_emergency_visit_trac.objects
                ORDER BY id
            ''')
            objects_rows = cursor.fetchall()
            
            # Получаем визиты
            cursor.execute('''
                SELECT id, object_id, visit_date, visit_type, comment, created_by, created_at, is_locked
                FROM t_p32730230_emergency_visit_trac.visits
                ORDER BY object_id, visit_date DESC
            ''')
            visits_rows = cursor.fetchall()
            
            # Получаем фото
            cursor.execute('''
                SELECT visit_id, photo_url
                FROM t_p32730230_emergency_visit_trac.photos
                ORDER BY visit_id
            ''')
            photos_rows = cursor.fetchall()
            
            # Получаем пользователей
            cursor.execute('''
                SELECT id, username, full_name, phone, role, created_at
                FROM t_p32730230_emergency_visit_trac.users
            ''')
            users_rows = cursor.fetchall()
            
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
                    'createdAt': visit_row[6].isoformat() if visit_row[6] else '',
                    'isLocked': visit_row[7] if visit_row[7] is not None else True
                }
                if object_id not in visits_by_object:
                    visits_by_object[object_id] = []
                visits_by_object[object_id].append(visit)
            
            # Собираем объекты
            objects = []
            for obj_row in objects_rows:
                objects.append({
                    'id': str(obj_row[0]),
                    'name': obj_row[1],
                    'address': obj_row[2],
                    'visits': visits_by_object.get(obj_row[0], []),
                    'deleted': False,
                    'objectType': 'regular'
                })
            
            # Собираем пользователей
            users = []
            for user_row in users_rows:
                users.append({
                    'id': str(user_row[0]),
                    'username': user_row[1],
                    'fullName': user_row[2],
                    'phone': user_row[3] or '',
                    'role': user_row[4],
                    'createdAt': user_row[5].isoformat() if user_row[5] else ''
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
            print(f"GET error: {e}")
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
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            uploaded_files = []
            saved_count = 0
            
            # Сохраняем объекты
            for obj in local_objects:
                obj_id = int(obj['id'])
                
                # Загружаем фото объекта в S3 если это base64
                if obj.get('objectPhoto') and obj['objectPhoto'].startswith('data:'):
                    file_key, cdn_url = upload_media(s3, bucket, obj['objectPhoto'], f"obj_{obj_id}", photos_prefix)
                    if cdn_url:
                        obj['objectPhoto'] = cdn_url
                        uploaded_files.append(file_key)
                
                # Проверяем существование объекта
                cursor.execute('''
                    SELECT id FROM t_p32730230_emergency_visit_trac.objects WHERE id = %s
                ''', (obj_id,))
                exists = cursor.fetchone()
                
                if exists:
                    cursor.execute('''
                        UPDATE t_p32730230_emergency_visit_trac.objects
                        SET name = %s, address = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (obj['name'], obj['address'], obj_id))
                else:
                    cursor.execute('''
                        INSERT INTO t_p32730230_emergency_visit_trac.objects (id, name, address)
                        VALUES (%s, %s, %s)
                    ''', (obj_id, obj['name'], obj['address']))
                
                # Сохраняем визиты
                for visit in obj.get('visits', []):
                    visit_id = int(visit['id'])
                    
                    cursor.execute('''
                        SELECT id FROM t_p32730230_emergency_visit_trac.visits WHERE id = %s
                    ''', (visit_id,))
                    visit_exists = cursor.fetchone()
                    
                    if not visit_exists:
                        cursor.execute('''
                            INSERT INTO t_p32730230_emergency_visit_trac.visits 
                            (id, object_id, user_id, visit_date, visit_type, comment, created_by, is_locked)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ''', (
                            visit_id,
                            obj_id,
                            1,
                            visit.get('date', '2024-01-01')[:10],
                            visit.get('type', 'planned'),
                            visit.get('comment', ''),
                            visit.get('createdBy', 'Unknown'),
                            visit.get('isLocked', True)
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
                            SELECT photo_url FROM t_p32730230_emergency_visit_trac.photos 
                            WHERE visit_id = %s AND photo_url = %s
                        ''', (visit_id, photo))
                        photo_exists = cursor.fetchone()
                        
                        if not photo_exists and photo:
                            cursor.execute('''
                                INSERT INTO t_p32730230_emergency_visit_trac.photos (visit_id, photo_url)
                                VALUES (%s, %s)
                            ''', (visit_id, photo))
                
                saved_count += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"SYNC: Saved {saved_count} objects, uploaded {len(uploaded_files)} files")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'success',
                    'message': f'Синхронизировано {saved_count} объектов',
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
