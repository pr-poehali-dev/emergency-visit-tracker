import json
import base64
import os
from typing import Any, Dict
import boto3

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """API для синхронизации фотографий с сервером Beget через S3"""
    
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
            
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            
            if action == 'upload':
                photos_data = body.get('photos', [])
                
                uploaded_files = []
                for photo in photos_data:
                    photo_id = photo.get('id')
                    photo_base64 = photo.get('data', '')
                    
                    if photo_base64.startswith('data:image'):
                        photo_base64 = photo_base64.split(',')[1]
                    
                    photo_bytes = base64.b64decode(photo_base64)
                    
                    s3_key = f'mchs_photos/{photo_id}.jpg'
                    s3.put_object(
                        Bucket='files',
                        Key=s3_key,
                        Body=photo_bytes,
                        ContentType='image/jpeg'
                    )
                    
                    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
                    
                    uploaded_files.append({
                        'id': photo_id,
                        'url': cdn_url,
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
                        'message': f'Загружено {len(uploaded_files)} фотографий на сервер',
                        'uploaded': uploaded_files
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'download':
                try:
                    response = s3.list_objects_v2(Bucket='files', Prefix='mchs_photos/')
                    
                    if 'Contents' not in response:
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
                    for obj in response['Contents']:
                        if obj['Key'].endswith('.jpg'):
                            file_obj = s3.get_object(Bucket='files', Key=obj['Key'])
                            photo_bytes = file_obj['Body'].read()
                            photo_base64 = base64.b64encode(photo_bytes).decode('utf-8')
                            
                            photo_id = obj['Key'].replace('mchs_photos/', '').replace('.jpg', '')
                            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{obj['Key']}"
                            
                            photos.append({
                                'id': photo_id,
                                'data': f'data:image/jpeg;base64,{photo_base64}',
                                'url': cdn_url
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
                except Exception as e:
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