import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def create_database():
    # Connect to the default postgres database first
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="5558",
        host="localhost",
        port="5432"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    # Check if the database exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'grademind';")
    exists = cursor.fetchone()

    if not exists:
        print("Creating database 'grademind'...")
        cursor.execute("CREATE DATABASE grademind;")
        print("Database 'grademind' created successfully.")
    else:
        print("Database 'grademind' already exists.")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    create_database()
