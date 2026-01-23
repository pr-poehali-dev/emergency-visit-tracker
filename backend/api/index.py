"""API для работы с системой учёта посещений МЧС"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    """Подключение к базе данных"""
    return psycopg2.connect(
        os.environ['DATABASE_URL'],
        cursor_factory=RealDictCursor
    )

def handler(event: dict, context) -> dict:
    """Главный обработчик API"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    path = event.get('queryStringParameters', {}).get('action', '')
    
    try:
        if method == 'GET':
            if path == 'objects':
                return get_objects()
            elif path == 'object_visits':
                object_id = event.get('queryStringParameters', {}).get('object_id')
                return get_object_visits(object_id)
            elif path == 'stats':
                return get_stats()
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'login':
                return login(body)
            elif path == 'create_visit':
                return create_visit(body)
            elif path == 'create_object':
                return create_object(body)
            elif path == 'upload_photo':
                return upload_photo(body)
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'update_object':
                return update_object(body)
        
        return error_response('Unknown action', 400)
    
    except Exception as e:
        return error_response(str(e), 500)


def get_objects():
    """Получить список всех объектов"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            o.id,
            o.name,
            o.address,
            COUNT(v.id) as visits_count
        FROM objects o
        LEFT JOIN visits v ON o.id = v.object_id
        GROUP BY o.id, o.name, o.address
        ORDER BY o.name
    """)
    
    objects = cur.fetchall()
    cur.close()
    conn.close()
    
    return success_response([dict(obj) for obj in objects])


def get_object_visits(object_id: str):
    """Получить историю посещений объекта"""
    if not object_id:
        return error_response('object_id required', 400)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            v.id,
            v.visit_date as date,
            v.visit_type as type,
            v.comment,
            v.created_by,
            v.created_at,
            ARRAY_AGG(p.photo_url) FILTER (WHERE p.photo_url IS NOT NULL) as photos
        FROM visits v
        LEFT JOIN photos p ON v.id = p.visit_id
        WHERE v.object_id = %s
        GROUP BY v.id, v.visit_date, v.visit_type, v.comment, v.created_by, v.created_at
        ORDER BY v.created_at DESC
    """, (object_id,))
    
    visits = cur.fetchall()
    cur.close()
    conn.close()
    
    result = []
    for visit in visits:
        visit_dict = dict(visit)
        visit_dict['date'] = str(visit_dict['date'])
        visit_dict['created_at'] = visit_dict['created_at'].isoformat()
        visit_dict['photos'] = visit_dict['photos'] or []
        result.append(visit_dict)
    
    return success_response(result)


def get_stats():
    """Получить статистику для панели директора"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            COUNT(DISTINCT o.id) as total_objects,
            COUNT(v.id) as total_visits,
            COUNT(CASE WHEN v.visit_type = 'planned' THEN 1 END) as planned_visits,
            COUNT(CASE WHEN v.visit_type = 'unplanned' THEN 1 END) as unplanned_visits,
            COUNT(p.id) as total_photos
        FROM objects o
        LEFT JOIN visits v ON o.id = v.object_id
        LEFT JOIN photos p ON v.id = p.visit_id
    """)
    
    stats = cur.fetchone()
    cur.close()
    conn.close()
    
    return success_response(dict(stats))


def login(body: dict):
    """Авторизация пользователя"""
    username = body.get('username', '')
    password = body.get('password', '')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, username, full_name, role
        FROM users
        WHERE username = %s
    """, (username,))
    
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        return error_response('Invalid credentials', 401)
    
    if username == 'tech' and password == 'tech':
        return success_response({
            'user': dict(user),
            'token': 'dummy_token_tech'
        })
    elif username == 'director' and password == 'director':
        return success_response({
            'user': dict(user),
            'token': 'dummy_token_director'
        })
    
    return error_response('Invalid credentials', 401)


def create_visit(body: dict):
    """Создать новое посещение (акт защищён от редактирования)"""
    object_id = body.get('object_id')
    user_id = body.get('user_id', 1)
    visit_date = body.get('date', datetime.now().date().isoformat())
    visit_type = body.get('type')
    comment = body.get('comment')
    photos = body.get('photos', [])
    created_by = body.get('created_by', 'Unknown')
    
    if not all([object_id, visit_type, comment]):
        return error_response('Missing required fields', 400)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO visits (object_id, user_id, visit_date, visit_type, comment, created_by, is_locked)
        VALUES (%s, %s, %s, %s, %s, %s, TRUE)
        RETURNING id
    """, (object_id, user_id, visit_date, visit_type, comment, created_by))
    
    visit_id = cur.fetchone()['id']
    
    for photo_url in photos:
        cur.execute("""
            INSERT INTO photos (visit_id, photo_url)
            VALUES (%s, %s)
        """, (visit_id, photo_url))
    
    cur.execute("""
        INSERT INTO audit_log (table_name, record_id, action, user_id, changed_data)
        VALUES ('visits', %s, 'CREATE', %s, %s)
    """, (visit_id, user_id, json.dumps(body)))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return success_response({'visit_id': visit_id, 'message': 'Visit created successfully'})


def create_object(body: dict):
    """Создать новый объект (только для директора)"""
    name = body.get('name')
    address = body.get('address')
    
    if not all([name, address]):
        return error_response('Missing required fields', 400)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO objects (name, address)
        VALUES (%s, %s)
        RETURNING id
    """, (name, address))
    
    object_id = cur.fetchone()['id']
    
    conn.commit()
    cur.close()
    conn.close()
    
    return success_response({'object_id': object_id, 'message': 'Object created successfully'})


def update_object(body: dict):
    """Обновить объект (только для директора)"""
    object_id = body.get('id')
    name = body.get('name')
    address = body.get('address')
    
    if not all([object_id, name, address]):
        return error_response('Missing required fields', 400)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE objects
        SET name = %s, address = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (name, address, object_id))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return success_response({'message': 'Object updated successfully'})


def upload_photo(body: dict):
    """Загрузить фото (base64)"""
    visit_id = body.get('visit_id')
    photo_base64 = body.get('photo')
    
    if not all([visit_id, photo_base64]):
        return error_response('Missing required fields', 400)
    
    photo_url = f"data:image/jpeg;base64,{photo_base64}"
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO photos (visit_id, photo_url)
        VALUES (%s, %s)
        RETURNING id
    """, (visit_id, photo_url))
    
    photo_id = cur.fetchone()['id']
    
    conn.commit()
    cur.close()
    conn.close()
    
    return success_response({'photo_id': photo_id, 'photo_url': photo_url})


def success_response(data):
    """Успешный ответ"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False)
    }


def error_response(message: str, status_code: int):
    """Ответ с ошибкой"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}, ensure_ascii=False)
    }
