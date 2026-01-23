"""API для загрузки фото в S3 хранилище"""
import json
import os
import base64
import uuid
from datetime import datetime
import boto3

def get_s3_client():
    """Получить S3 клиент"""
    return boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

def handler(event: dict, context) -> dict:
    """Загрузка фото с камеры в S3"""
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return error_response('Method not allowed', 405)
    
    try:
        body = json.loads(event.get('body', '{}'))
        photo_base64 = body.get('photo')
        
        if not photo_base64:
            return error_response('Photo data required', 400)
        
        if photo_base64.startswith('data:image'):
            photo_base64 = photo_base64.split(',')[1]
        
        photo_data = base64.b64decode(photo_base64)
        
        file_extension = 'jpg'
        content_type = 'image/jpeg'
        
        if body.get('type') == 'png':
            file_extension = 'png'
            content_type = 'image/png'
        
        filename = f"visits/{datetime.now().strftime('%Y/%m')}/{uuid.uuid4()}.{file_extension}"
        
        s3 = get_s3_client()
        s3.put_object(
            Bucket='files',
            Key=filename,
            Body=photo_data,
            ContentType=content_type
        )
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
        
        return success_response({
            'photo_url': cdn_url,
            'message': 'Photo uploaded successfully'
        })
    
    except Exception as e:
        return error_response(str(e), 500)


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
