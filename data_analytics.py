import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from db_connection import get_db_connection

def create_analytical_views():
    conn = get_db_connection()
    
    # Create aggregated sales view
    conn.cursor().execute('''
    CREATE OR REPLACE VIEW daily_sales AS
    SELECT 
        t.merchant_id,
        DATE(t.timestamp) as sale_date,
        SUM(ti.quantity * i.price) as total_sales,
        COUNT(DISTINCT t.transaction_id) as transaction_count
    FROM transactions t
    JOIN transaction_items ti ON t.transaction_id = ti.transaction_id
    JOIN items i ON ti.item_id = i.item_id
    GROUP BY t.merchant_id, DATE(t.timestamp)
    ''')
    
    # Create product performance view
    conn.cursor().execute('''
    CREATE OR REPLACE VIEW product_performance AS
    SELECT 
        t.merchant_id,
        i.item_id,
        i.name as item_name,
        i.category,
        SUM(ti.quantity) as total_quantity,
        SUM(ti.quantity * i.price) as total_revenue
    FROM transactions t
    JOIN transaction_items ti ON t.transaction_id = ti.transaction_id
    JOIN items i ON ti.item_id = i.item_id
    GROUP BY t.merchant_id, i.item_id, i.name, i.category
    ''')
    
    conn.commit()
    conn.close()
    
    print("Analytical views created successfully!")

def generate_sample_reports():
    """Generate sample reports and visualizations"""
    conn = get_db_connection()
    
    # Example: Get sales data for a specific merchant
    query = """
    SELECT sale_date, total_sales
    FROM daily_sales
    WHERE merchant_id = 1
    ORDER BY sale_date
    """
    
    sales_data = pd.read_sql(query, conn)
    
    # Plot sales trend
    if not sales_data.empty:
        plt.figure(figsize=(10, 6))
        plt.plot(sales_data['sale_date'], sales_data['total_sales'])
        plt.title('Sales Trend for Merchant #1')
        plt.xlabel('Date')
        plt.ylabel('Total Sales')
        plt.tight_layout()
        plt.savefig('./static/sales_trend.png')
        plt.close()
    
    # Example: Get top products for a merchant
    query = """
    SELECT item_name, total_revenue
    FROM product_performance
    WHERE merchant_id = 1
    ORDER BY total_revenue DESC
    LIMIT 5
    """
    
    top_products = pd.read_sql(query, conn)
    
    # Plot top products
    if not top_products.empty:
        plt.figure(figsize=(10, 6))
        sns.barplot(x='total_revenue', y='item_name', data=top_products)
        plt.title('Top 5 Products by Revenue for Merchant #1')
        plt.xlabel('Total Revenue')
        plt.ylabel('Product')
        plt.tight_layout()
        plt.savefig('./static/top_products.png')
        plt.close()
    
    conn.close()
    
    print("Sample reports generated successfully!")

if __name__ == "__main__":
    create_analytical_views()
    generate_sample_reports()