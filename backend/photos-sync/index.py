import json
import base64
import os
from typing import Any, Dict

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """API для синхронизации фотографий с сервером (загрузка/скачивание)"""
    
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
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'upload':
                photos_data = body.get('photos', [])
                photo_dir = '/tmp/mchs_photos'
                os.makedirs(photo_dir, exist_ok=True)
                
                uploaded_files = []
                for photo in photos_data:
                    photo_id = photo.get('id')
                    photo_base64 = photo.get('data', '')
                    
                    if photo_base64.startswith('data:image'):
                        photo_base64 = photo_base64.split(',')[1]
                    
                    photo_bytes = base64.b64decode(photo_base64)
                    
                    file_path = os.path.join(photo_dir, f'{photo_id}.jpg')
                    with open(file_path, 'wb') as f:
                        f.write(photo_bytes)
                    
                    uploaded_files.append({
                        'id': photo_id,
                        'path': file_path,
                        'size': len(photo_bytes)
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'status': 'success',
                        'message': f'Загружено {len(uploaded_files)} фотографий',
                        'uploaded': uploaded_files
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'download':
                photo_dir = '/tmp/mchs_photos'
                
                if not os.path.exists(photo_dir):
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'status': 'success',
                            'photos': []
                        }),
                        'isBase64Encoded': False
                    }
                
                photos = []
                for filename in os.listdir(photo_dir):
                    if filename.endswith('.jpg'):
                        file_path = os.path.join(photo_dir, filename)
                        with open(file_path, 'rb') as f:
                            photo_bytes = f.read()
                            photo_base64 = base64.b64encode(photo_bytes).decode('utf-8')
                            photos.append({
                                'id': filename.replace('.jpg', ''),
                                'data': f'data:image/jpeg;base64,{photo_base64}'
                            })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'status': 'success',
                        'photos': photos
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
                        'error': 'Неизвестное действие. Используйте action: upload или download'
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
                    'error': f'Ошибка обработки: {str(e)}'
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
