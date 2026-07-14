import psycopg
conn = psycopg.connect(host='localhost', port=5433, dbname='postgres', user='admin', password='admin123')
conn.autocommit = True
cur = conn.cursor()
cur.execute("""
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'movie_picker'
  AND pid <> pg_backend_pid()
""")
cur.execute('ALTER DATABASE movie_picker RENAME TO swipeflix')
print('Database renamed successfully')
cur.close()
conn.close()
