import time
from flask import Flask, request, redirect, jsonify
from flask_cors import CORS
import sqlite3 as sql
import praw
import json
from os import environ

app = Flask(__name__)
CORS(app)

db = 'database.db'

reddit = praw.Reddit(
    client_id=environ.get('REDDIT_CLIENT_ID'),
    client_secret=environ.get('REDDIT_CLIENT_SECRET'),
    user_agent="web:com.readit:1.0",
)

def get_db_connection():
    conn = sql.connect('database.db')
    conn.row_factory = sql.Row
    return conn

@app.route('/')
def base_route():
    return 'Server running on ' + request.base_url

@app.route('/time')
def get_current_time():
    return {'time': time.time()}

@app.route('/test')
def test():
    return {'test': reddit.read_only}

@app.route('/subreddit/<sub>')
def subreddit_posts(sub):
    conn = get_db_connection()
    res = []
    subreddit = reddit.subreddit(sub)
    for submission in subreddit.new(limit=10):
        post = {
            "title": submission.title,
            "link": submission.permalink,
            "id": submission.id,
            "content": submission.selftext
        }
        res.append(post)
        conn.execute('INSERT OR IGNORE INTO posts (title, content, url, permalink, uuid, subreddit) VALUES (?, ?, ?, ?, ?, ?)',
                    (str(submission.title), str(submission.selftext), str(submission.url), str(submission.permalink), str(submission.id), str(submission.subreddit.display_name)))

    conn.commit()
    conn.close()
    return {'posts': res}

@app.route('/posts', methods = ['POST', 'PUT', 'GET'])
def posts():
    conn = get_db_connection()
    if request.method == 'GET':
        subreddits = request.args.getlist('subreddits[]')
        res = []
        
        if len(subreddits) == 1:
            cursor = conn.execute('SELECT * FROM posts WHERE new = 0 AND subreddit = ?', (subreddits[0],))
            rows = cursor.fetchall()
            columns = [column[0] for column in cursor.description]
            for row in rows:
                res.append(dict(zip(columns, row)))
        else:
            cursor = conn.execute('SELECT * FROM posts WHERE new = 0 AND subreddit IN {};'.format(tuple(subreddits)))
            rows = cursor.fetchall()
            columns = [column[0] for column in cursor.description]
            for row in rows:
                res.append(dict(zip(columns, row)))
        
        conn.close()
        return { 'posts': res }
    elif request.method == 'POST':
        if request.get_json().get('params').get('type') == 'all':
            res = conn.execute ('UPDATE posts SET new = 1')
            conn.commit()
            conn.close()
            return { 'result': 'success' }
        else:
            req_title = request.get_json().get('params').get('title')
            res = conn.execute('UPDATE posts SET new = 1 WHERE title = ?', (req_title,))
            conn.commit()
            conn.close()
            return { 'result': 'success' }
    else:
        return { 'error': 'not implemented '}



