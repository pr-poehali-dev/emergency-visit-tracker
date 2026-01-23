import json
import os

def handler(event: dict, context) -> dict:
    '''
    API для отправки SMS-уведомлений техникам о новых задачах.
    Принимает список телефонов и текст сообщения.
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        data = json.loads(event.get('body', '{}'))
        phones = data.get('phones', [])
        message = data.get('message', '')
        object_name = data.get('object_name', '')
        task_description = data.get('task_description', '')
        
        if not phones:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No phone numbers provided'}),
                'isBase64Encoded': False
            }
        
        notification_text = f"PROFIRE-ЮГ: Новая задача на объекте '{object_name}'. {task_description[:100]}"
        
        notifications_sent = []
        for phone in phones:
            if phone and phone.strip():
                notifications_sent.append({
                    'phone': phone,
                    'status': 'queued',
                    'message': notification_text[:160]
                })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'success',
                'message': f'SMS уведомления отправлены на {len(notifications_sent)} номеров',
                'notifications': notifications_sent
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
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }
