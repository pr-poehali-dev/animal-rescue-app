import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}

ALLOWED_STATUS = {'Пропал', 'Найден', 'Ищет дом'}


def handler(event: dict, context) -> dict:
    '''Управление объявлениями о животных: список (GET) и создание (POST)'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)

    try:
        if method == 'GET':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, name, species, status, city, description, contact, "
                    "image_url, is_urgent, created_at FROM ads ORDER BY created_at DESC LIMIT 100"
                )
                rows = cur.fetchall()
            items = []
            for r in rows:
                items.append({
                    'id': r['id'],
                    'name': r['name'],
                    'species': r['species'],
                    'status': r['status'],
                    'city': r['city'],
                    'description': r['description'],
                    'contact': r['contact'],
                    'image_url': r['image_url'],
                    'is_urgent': r['is_urgent'],
                    'created_at': r['created_at'].isoformat() if r['created_at'] else None,
                })
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'items': items}, ensure_ascii=False)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            name = (body.get('name') or '').strip()
            species = (body.get('species') or '').strip()
            status = (body.get('status') or '').strip()
            city = (body.get('city') or '').strip()
            description = (body.get('description') or '').strip()
            contact = (body.get('contact') or '').strip()
            image_url = (body.get('image_url') or '').strip()
            is_urgent = bool(body.get('is_urgent', False))

            if not name or not species or not city:
                return {'statusCode': 400, 'headers': CORS,
                        'body': json.dumps({'error': 'Заполните имя, вид и город'}, ensure_ascii=False)}
            if status not in ALLOWED_STATUS:
                status = 'Ищет дом'

            def esc(v):
                return v.replace("'", "''")

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "INSERT INTO ads (name, species, status, city, description, contact, image_url, is_urgent) "
                    f"VALUES ('{esc(name)}', '{esc(species)}', '{esc(status)}', '{esc(city)}', "
                    f"'{esc(description)}', '{esc(contact)}', '{esc(image_url)}', {is_urgent}) "
                    "RETURNING id, name, species, status, city, description, contact, image_url, is_urgent, created_at"
                )
                r = cur.fetchone()
                conn.commit()
            item = {
                'id': r['id'], 'name': r['name'], 'species': r['species'], 'status': r['status'],
                'city': r['city'], 'description': r['description'], 'contact': r['contact'],
                'image_url': r['image_url'], 'is_urgent': r['is_urgent'],
                'created_at': r['created_at'].isoformat() if r['created_at'] else None,
            }
            return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'item': item}, ensure_ascii=False)}

        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        conn.close()
