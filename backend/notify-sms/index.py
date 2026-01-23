import json
import os
import urllib.request
import urllib.parse

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
        
        smsc_login = os.environ.get('SMSC_LOGIN')
        smsc_password = os.environ.get('SMSC_PASSWORD')
        
        if not smsc_login or not smsc_password:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'SMSC credentials not configured'}),
                'isBase64Encoded': False
            }
        
        notifications_sent = []
        for phone in phones:
            if not phone or not phone.strip():
                continue
                
            clean_phone = phone.strip().replace('+', '').replace('-', '').replace(' ', '')
            
            params = {
                'login': smsc_login,
                'psw': smsc_password,
                'phones': clean_phone,
                'mes': notification_text[:160],
                'charset': 'utf-8',
                'fmt': '3'
            }
            
            try:
                url = 'https://smsc.ru/sys/send.php?' + urllib.parse.urlencode(params)
                req = urllib.request.Request(url)
                response = urllib.request.urlopen(req, timeout=10)
                result = json.loads(response.read().decode('utf-8'))
                
                if 'id' in result:
                    notifications_sent.append({
                        'phone': phone,
                        'status': 'sent',
                        'message_id': result.get('id'),
                        'cost': result.get('cost', 0)
                    })
                else:
                    notifications_sent.append({
                        'phone': phone,
                        'status': 'failed',
                        'error': result.get('error', 'Unknown error')
                    })
            except Exception as e:
                notifications_sent.append({
                    'phone': phone,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'success',
                'message': f'SMS отправлено на {len([n for n in notifications_sent if n["status"] == "sent"])} из {len(notifications_sent)} номеров',
                'notifications': notifications_sent
            }, ensure_ascii=False),
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