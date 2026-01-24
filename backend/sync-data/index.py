import json
import os
from typing import Any, Dict, List, Tuple, Optional
import boto3
import base64
import copy

def upload_media(s3, bucket: str, data_uri: str, file_id: str, prefix: str) -> Tuple[str, Optional[str]]:
    """Загружает медиафайл (фото/видео) в S3 и возвращает ключ и CDN URL"""
    try:
        mime_type = data_uri.split(';')[0].split(':')[1]
        base64_data = data_uri.split(',')[1]
        file_bytes = base64.b64decode(base64_data)
        
        if mime_type.startswith('video/'):
            ext = mime_type.split('/')[1]
            file_key = f"{prefix}{file_id}.{ext}"
        else:
            file_key = f"{prefix}{file_id}.jpg"
        
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

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """API для синхронизации всех данных приложения с сервером profire23.store"""
    
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
    data_key = 'profire_data/database.json'
    photos_prefix = 'profire_data/photos/'
    videos_prefix = 'profire_data/videos/'
    
    if method == 'GET':
        try:
            response = s3.get_object(Bucket=bucket, Key=data_key)
            data = json.loads(response['Body'].read().decode('utf-8'))
            
            active_objects = [obj for obj in data.get('objects', []) if not obj.get('deleted')]
            print(f"GET: Returning {len(active_objects)} active objects (filtered {len(data.get('objects', [])) - len(active_objects)} deleted), {len(data.get('users', []))} users")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'success',
                    'data': {
                        'objects': active_objects,
                        'users': data.get('users', [])
                    }
                }),
                'isBase64Encoded': False
            }
        except Exception:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'success',
                    'data': {'objects': [], 'users': []}
                }),
                'isBase64Encoded': False
            }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'sync':
                local_objects = body.get('objects', [])
                local_users = body.get('users', [])
                is_first_batch = len(local_users) > 0
                
                print(f"SYNC: Received {len(local_objects)} objects, {len(local_users)} users, is_first_batch={is_first_batch}")
                
                try:
                    response = s3.get_object(Bucket=bucket, Key=data_key)
                    server_data = json.loads(response['Body'].read().decode('utf-8'))
                    server_objects = server_data.get('objects', [])
                except Exception:
                    server_objects = []
                    server_data = {'objects': [], 'users': []}
                
                if is_first_batch:
                    merged_objects = copy.deepcopy(local_objects)
                    print(f"First batch: Using {len(merged_objects)} local objects")
                else:
                    merged_objects = merge_objects(server_objects, local_objects)
                    print(f"Merge result: {len(merged_objects)} objects")
                
                uploaded_files = []
                for obj in merged_objects:
                    if obj.get('objectPhoto') and obj['objectPhoto'].startswith('data:'):
                        file_key, cdn_url = upload_media(s3, bucket, obj['objectPhoto'], f"obj_{obj['id']}", photos_prefix)
                        if cdn_url:
                            obj['objectPhoto'] = cdn_url
                            uploaded_files.append(file_key)
                    
                    for visit in obj.get('visits', []):
                        for i, media in enumerate(visit.get('photos', [])):
                            if media.startswith('data:'):
                                prefix = videos_prefix if media.startswith('data:video') else photos_prefix
                                file_key, cdn_url = upload_media(s3, bucket, media, f"visit_{visit['id']}_{i}", prefix)
                                if cdn_url:
                                    visit['photos'][i] = cdn_url
                                    uploaded_files.append(file_key)
                
                if is_first_batch:
                    updated_data = {
                        'objects': merged_objects,
                        'users': local_users
                    }
                else:
                    updated_data = {
                        'objects': merged_objects,
                        'users': server_data.get('users', [])
                    }
                
                s3.put_object(
                    Bucket=bucket,
                    Key=data_key,
                    Body=json.dumps(updated_data, ensure_ascii=False),
                    ContentType='application/json'
                )
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'status': 'success',
                        'message': f'Синхронизировано {len(merged_objects)} объектов',
                        'data': updated_data,
                        'uploaded_photos': len(uploaded_files)
                    }),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Неизвестное действие'
                    }),
                    'isBase64Encoded': False
                }
        
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Ошибка синхронизации: {str(e)}'
                }),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': 'Метод не поддерживается'
        }),
        'isBase64Encoded': False
    }


def merge_objects(server_objects: List[Dict], local_objects: List[Dict]) -> List[Dict]:
    """Объединяет объекты с сервера и локальные. Локальные объекты имеют приоритет."""
    
    local_dict = {obj['id']: obj for obj in local_objects}
    server_dict = {obj['id']: copy.deepcopy(obj) for obj in server_objects}
    
    result = []
    all_ids = set(local_dict.keys()) | set(server_dict.keys())
    
    for obj_id in all_ids:
        local_obj = local_dict.get(obj_id)
        server_obj = server_dict.get(obj_id)
        
        if local_obj and local_obj.get('deleted'):
            result.append(copy.deepcopy(local_obj))
            continue
        
        if local_obj and server_obj:
            server_obj['name'] = local_obj.get('name', server_obj.get('name'))
            server_obj['address'] = local_obj.get('address', server_obj.get('address'))
            server_obj['description'] = local_obj.get('description', server_obj.get('description'))
            server_obj['contactName'] = local_obj.get('contactName', server_obj.get('contactName'))
            server_obj['contactPhone'] = local_obj.get('contactPhone', server_obj.get('contactPhone'))
            server_obj['objectType'] = local_obj.get('objectType', server_obj.get('objectType'))
            
            if local_obj.get('objectPhoto'):
                server_obj['objectPhoto'] = local_obj['objectPhoto']
            
            server_visits = {v['id']: v for v in server_obj.get('visits', [])}
            local_visits = {v['id']: v for v in local_obj.get('visits', [])}
            
            for visit_id, local_visit in local_visits.items():
                server_visits[visit_id] = local_visit
            
            all_visits = list(server_visits.values())
            all_visits.sort(key=lambda v: v.get('createdAt', ''))
            server_obj['visits'] = all_visits
            
            if local_obj.get('installationDays'):
                server_obj['installationDays'] = local_obj['installationDays']
            
            result.append(server_obj)
        elif local_obj:
            result.append(copy.deepcopy(local_obj))
        elif server_obj and not server_obj.get('deleted'):
            result.append(copy.deepcopy(server_obj))
    
    return result