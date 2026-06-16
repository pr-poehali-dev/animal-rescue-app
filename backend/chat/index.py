import json
import os
import base64
import time
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}


def s3_client():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def upload_image(b64: str, name: str) -> str:
    """Загружает base64-изображение в S3 и возвращает CDN-URL"""
    if ',' in b64:
        b64 = b64.split(',', 1)[1]
    data = base64.b64decode(b64)
    key = f'chat/{name}'
    s3_client().put_object(Bucket='files', Key=key, Body=data, ContentType='image/jpeg')
    project_id = os.environ['AWS_ACCESS_KEY_ID']
    return f'https://cdn.poehali.dev/projects/{project_id}/files/{key}'


def esc(v: str) -> str:
    return str(v).replace("'", "''")


def fmt_msg(r) -> dict:
    return {
        'id': r['id'], 'sender': r['sender'],
        'body': r['body'], 'image_url': r['image_url'],
        'created_at': r['created_at'].isoformat() if r['created_at'] else None,
    }


def handler(event: dict, context) -> dict:
    """
    Чат: общий (section=community) и личные сообщения (section=private).
    GET  /?section=community              — список сообщений общего чата
    POST /?section=community              — отправить сообщение в общий чат
    GET  /?section=private&chat_id=N      — сообщения личного чата
    POST /?section=private&chat_id=N      — отправить в личный чат
    GET  /?section=chats&user=NAME        — список личных чатов пользователя
    POST /?section=chats                  — создать / найти личный чат
    """
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    section = params.get('section', 'community')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        # ── COMMUNITY ──
        if section == 'community':
            if method == 'GET':
                limit = min(int(params.get('limit', 80)), 200)
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"SELECT id, sender, body, image_url, created_at "
                        f"FROM community_messages ORDER BY created_at ASC LIMIT {limit}"
                    )
                    rows = cur.fetchall()
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'messages': [fmt_msg(r) for r in rows]}, ensure_ascii=False)}

            if method == 'POST':
                body = json.loads(event.get('body') or '{}')
                sender = (body.get('sender') or 'Аноним').strip()[:100]
                text = (body.get('body') or '').strip()[:2000]
                image_url = ''
                if body.get('image_b64'):
                    image_url = upload_image(body['image_b64'], f'comm_{int(time.time()*1000)}.jpg')
                if not text and not image_url:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'Пустое сообщение'}, ensure_ascii=False)}
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"INSERT INTO community_messages (sender, body, image_url) "
                        f"VALUES ('{esc(sender)}', '{esc(text)}', '{esc(image_url)}') "
                        f"RETURNING id, sender, body, image_url, created_at"
                    )
                    r = cur.fetchone()
                    conn.commit()
                return {'statusCode': 201, 'headers': CORS,
                        'body': json.dumps({'message': fmt_msg(r)}, ensure_ascii=False)}

        # ── PRIVATE MESSAGES ──
        if section == 'private':
            chat_id = int(params.get('chat_id', 0))
            if method == 'GET':
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"SELECT id, sender, body, image_url, created_at "
                        f"FROM messages WHERE chat_id={chat_id} ORDER BY created_at ASC LIMIT 200"
                    )
                    rows = cur.fetchall()
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'messages': [fmt_msg(r) for r in rows]}, ensure_ascii=False)}

            if method == 'POST':
                body = json.loads(event.get('body') or '{}')
                sender = (body.get('sender') or 'Аноним').strip()[:100]
                text = (body.get('body') or '').strip()[:2000]
                image_url = ''
                if body.get('image_b64'):
                    image_url = upload_image(body['image_b64'], f'pm_{chat_id}_{int(time.time()*1000)}.jpg')
                if not text and not image_url:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'Пустое сообщение'}, ensure_ascii=False)}
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"INSERT INTO messages (chat_id, sender, body, image_url) "
                        f"VALUES ({chat_id}, '{esc(sender)}', '{esc(text)}', '{esc(image_url)}') "
                        f"RETURNING id, sender, body, image_url, created_at"
                    )
                    r = cur.fetchone()
                    conn.commit()
                return {'statusCode': 201, 'headers': CORS,
                        'body': json.dumps({'message': fmt_msg(r)}, ensure_ascii=False)}

        # ── CHATS LIST / CREATE ──
        if section == 'chats':
            if method == 'GET':
                user = esc(params.get('user', ''))
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"SELECT c.id, c.ad_id, c.user_a, c.user_b, c.created_at, "
                        f"a.name as ad_name "
                        f"FROM chats c LEFT JOIN ads a ON c.ad_id = a.id "
                        f"WHERE c.user_a='{user}' OR c.user_b='{user}' "
                        f"ORDER BY c.created_at DESC LIMIT 50"
                    )
                    rows = cur.fetchall()
                chats = [{'id': r['id'], 'ad_id': r['ad_id'], 'ad_name': r['ad_name'],
                           'user_a': r['user_a'], 'user_b': r['user_b'],
                           'created_at': r['created_at'].isoformat() if r['created_at'] else None}
                          for r in rows]
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'chats': chats}, ensure_ascii=False)}

            if method == 'POST':
                body = json.loads(event.get('body') or '{}')
                ad_id = body.get('ad_id')
                user_a = esc((body.get('user_a') or '').strip()[:100])
                user_b = esc((body.get('user_b') or '').strip()[:100])
                if not user_a or not user_b:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'Укажите пользователей'}, ensure_ascii=False)}
                ad_clause = str(int(ad_id)) if ad_id else 'NULL'
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"SELECT id FROM chats WHERE "
                        f"(user_a='{user_a}' AND user_b='{user_b}') OR "
                        f"(user_a='{user_b}' AND user_b='{user_a}')"
                    )
                    existing = cur.fetchone()
                    if existing:
                        chat_id = existing['id']
                    else:
                        cur.execute(
                            f"INSERT INTO chats (ad_id, user_a, user_b) "
                            f"VALUES ({ad_clause}, '{user_a}', '{user_b}') RETURNING id"
                        )
                        chat_id = cur.fetchone()['id']
                        conn.commit()
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'chat_id': chat_id}, ensure_ascii=False)}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Unknown section'})}
    finally:
        conn.close()
