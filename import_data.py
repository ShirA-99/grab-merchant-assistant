import pandas as pd
import os
from db_connection import get_db_connection

# Define file paths
data_dir = './data'
transaction_data_file = os.path.join(data_dir, 'transaction_data.csv')
merchant_file = os.path.join(data_dir, 'merchant.csv')
items_file = os.path.join(data_dir, 'items.csv')
transaction_items_file = os.path.join(data_dir, 'transaction_items.csv')
keywords_file = os.path.join(data_dir, 'keywords.csv')

# Function to import data to PostgreSQL
def import_to_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    print("Creating database tables...")
    
    # Create tables
    cur.execute('''
    CREATE TABLE IF NOT EXISTS merchants (
        merchant_id VARCHAR(10) PRIMARY KEY,
        merchant_name VARCHAR(100),
        join_date VARCHAR(10),
        city_id INTEGER
    )
    ''')
    
    cur.execute('''
    CREATE TABLE IF NOT EXISTS items (
        item_id INTEGER PRIMARY KEY,
        cuisine_tag VARCHAR(50),
        item_name VARCHAR(100),
        item_price NUMERIC(10, 2),
        merchant_id VARCHAR(10),
        FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id)
    )
    ''')
    
    cur.execute('''
    CREATE TABLE IF NOT EXISTS transaction_data (
        order_id VARCHAR(20) PRIMARY KEY,
        order_time TIMESTAMP,
        driver_arrival_time TIMESTAMP,
        driver_pickup_time TIMESTAMP,
        delivery_time TIMESTAMP,
        order_value NUMERIC(10, 2),
        eater_id BIGINT,
        merchant_id VARCHAR(10),
        FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id)
    )
    ''')
    
    cur.execute('''
    CREATE TABLE IF NOT EXISTS transaction_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(20),
        item_id INTEGER,
        merchant_id VARCHAR(10),
        FOREIGN KEY (order_id) REFERENCES transaction_data (order_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE,
        FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id) ON DELETE CASCADE
    )
    ''')
    
    # Fixed SQL for keywords table - renamed 'order' to 'order_count' to avoid keyword conflict
    cur.execute('''
    CREATE TABLE IF NOT EXISTS keywords (
        id SERIAL PRIMARY KEY,
        keyword VARCHAR(100),
        view INTEGER,
        menu INTEGER,
        checkout INTEGER,
        order_count INTEGER
    )
    ''')
    
    conn.commit()
    print("Tables created successfully.")
    
    # Import merchants first (since they're referenced by other tables)
    print(f"Importing merchant data from {merchant_file}...")
    if os.path.exists(merchant_file):
        merchants = pd.read_csv(merchant_file)
        print(f"Found {len(merchants)} merchants to import.")
        
        # Import merchants data
        count = 0
        for i, row in merchants.iterrows():
            try:
                cur.execute(
                    "INSERT INTO merchants (merchant_id, merchant_name, join_date, city_id) VALUES (%s, %s, %s, %s)",
                    (row['merchant_id'], row['merchant_name'], row['join_date'], row['city_id'])
                )
                count += 1
            except Exception as e:
                print(f"Error importing merchant {row['merchant_id']}: {e}")
        
        conn.commit()
        print(f"Successfully imported {count} merchants.")
    else:
        print(f"Warning: {merchant_file} not found!")
    
    # Import items
    print(f"Importing items data from {items_file}...")
    if os.path.exists(items_file):
        items = pd.read_csv(items_file)
        print(f"Found {len(items)} items to import.")
        
        # Import items data
        count = 0
        for i, row in items.iterrows():
            try:
                cur.execute(
                    "INSERT INTO items (item_id, cuisine_tag, item_name, item_price, merchant_id) VALUES (%s, %s, %s, %s, %s)",
                    (row['item_id'], row['cuisine_tag'], row['item_name'], row['item_price'], row['merchant_id'])
                )
                count += 1
            except Exception as e:
                print(f"Error importing item {row['item_id']}: {e}")
        
        conn.commit()
        print(f"Successfully imported {count} items.")
    else:
        print(f"Warning: {items_file} not found!")
    
    # Modified import for transaction data to handle duplicates
    print(f"Importing transaction data from {transaction_data_file}...")
    if os.path.exists(transaction_data_file):
        # Create a temporary table
        cur.execute('''
        CREATE TEMP TABLE temp_transaction_data (
            order_id VARCHAR(20),
            order_time TIMESTAMP,
            driver_arrival_time TIMESTAMP,
            driver_pickup_time TIMESTAMP,
            delivery_time TIMESTAMP,
            order_value NUMERIC(10, 2),
            eater_id BIGINT,
            merchant_id VARCHAR(10)
        )
        ''')
        
        # Bulk copy data to temp table
        with open(transaction_data_file, 'r') as f:
            cur.copy_expert(f"COPY temp_transaction_data FROM STDIN CSV HEADER", f)
        
        # Insert into final table, discarding duplicates
        cur.execute('''
        INSERT INTO transaction_data
        SELECT DISTINCT ON (order_id) *
        FROM temp_transaction_data
        ''')
        
        # Report the count
        cur.execute("SELECT COUNT(*) FROM transaction_data")
        count = cur.fetchone()[0]
        
        conn.commit()
        print(f"Successfully imported {count} transactions (duplicates removed).")
    else:
        print(f"Warning: {transaction_data_file} not found!")
    
    # Import transaction items
    print(f"Importing transaction items data from {transaction_items_file}...")
    if os.path.exists(transaction_items_file):
        transaction_items = pd.read_csv(transaction_items_file)
        print(f"Found {len(transaction_items)} transaction items to import.")
        
        # Import transaction items
        count = 0
        for i, row in transaction_items.iterrows():
            try:
                cur.execute(
                    "INSERT INTO transaction_items (order_id, item_id, merchant_id) VALUES (%s, %s, %s)",
                    (row['order_id'], row['item_id'], row['merchant_id'])
                )
                count += 1
                
                # Commit every 10000 rows to avoid transaction size issues
                if count % 10000 == 0:
                    conn.commit()
                    print(f"  Progress: {count} transaction items imported.")
                    
            except Exception as e:
                print(f"Error importing transaction item (order: {row['order_id']}, item: {row['item_id']}): {e}")
        
        conn.commit()
        print(f"Successfully imported {count} transaction items.")
    else:
        print(f"Warning: {transaction_items_file} not found!")
    
    # Import keywords data - using the renamed column
    print(f"Importing keywords data from {keywords_file}...")
    if os.path.exists(keywords_file):
        keywords = pd.read_csv(keywords_file)
        print(f"Found {len(keywords)} keywords to import.")
        
        # Import keywords data
        count = 0
        for i, row in keywords.iterrows():
            try:
                cur.execute(
                    "INSERT INTO keywords (keyword, view, menu, checkout, order_count) VALUES (%s, %s, %s, %s, %s)",
                    (row['keyword'], row['view'], row['menu'], row['checkout'], row['order'])
                )
                count += 1
            except Exception as e:
                print(f"Error importing keyword '{row['keyword']}': {e}")
        
        conn.commit()
        print(f"Successfully imported {count} keywords.")
    else:
        print(f"Warning: {keywords_file} not found!")
    
    cur.close()
    conn.close()
    
    print("Data import completed!")

if __name__ == "__main__":
    import_to_db()