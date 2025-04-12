from flask import Flask, request, jsonify
import pandas as pd
from db_connection import get_db_connection
from flask_cors import CORS  # To handle cross-origin requests
import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple endpoint to check if API is running"""
    return jsonify({"status": "ok", "message": "Merchant Assistant API is running"})

# HOME SCREEN ENDPOINTS
@app.route('/api/merchant/<merchant_id>/summary', methods=['GET'])
def merchant_summary(merchant_id):
    """Get merchant summary information"""
    print(f"Requesting summary for merchant_id: {merchant_id}")
    conn = get_db_connection()
   
    try:
        # Get merchant info
        merchant_query = "SELECT * FROM merchants WHERE merchant_id = %s"
        merchant_info = pd.read_sql(merchant_query, conn, params=(merchant_id,))
        
        if merchant_info.empty:
            return jsonify({"error": "Merchant not found"}), 404
       
        # Get sales summary
        sales_query = """
        SELECT
            SUM(td.order_value) as total_sales,
            COUNT(DISTINCT td.order_id) as transaction_count,
            COUNT(DISTINCT DATE(td.order_time)) as active_days,
            AVG(td.order_value) as avg_transaction_value
        FROM transaction_data td
        WHERE td.merchant_id = %s
        """
        sales_summary = pd.read_sql(sales_query, conn, params=(merchant_id,))
       
        # Get today's sales
        today_sales_query = """
        SELECT
            SUM(td.order_value) as today_sales,
            COUNT(DISTINCT td.order_id) as today_orders
        FROM transaction_data td
        WHERE td.merchant_id = %s
        AND DATE(td.order_time) = CURRENT_DATE
        """
        today_sales = pd.read_sql(today_sales_query, conn, params=(merchant_id,))
        
        summary = {
            "merchant_id": merchant_id,
            "name": merchant_info.iloc[0]['merchant_name'],
            "join_date": merchant_info.iloc[0]['join_date'],
            "city_id": int(merchant_info.iloc[0]['city_id']) if not pd.isna(merchant_info.iloc[0]['city_id']) else None,
            "total_sales": float(sales_summary.iloc[0]['total_sales']) if not pd.isna(sales_summary.iloc[0]['total_sales']) else 0,
            "transaction_count": int(sales_summary.iloc[0]['transaction_count']) if not pd.isna(sales_summary.iloc[0]['transaction_count']) else 0,
            "active_days": int(sales_summary.iloc[0]['active_days']) if not pd.isna(sales_summary.iloc[0]['active_days']) else 0,
            "avg_transaction_value": float(sales_summary.iloc[0]['avg_transaction_value']) if not pd.isna(sales_summary.iloc[0]['avg_transaction_value']) else 0,
            "today_sales": float(today_sales.iloc[0]['today_sales']) if not pd.isna(today_sales.iloc[0]['today_sales']) else 0,
            "today_orders": int(today_sales.iloc[0]['today_orders']) if not pd.isna(today_sales.iloc[0]['today_orders']) else 0
        }
        
        return jsonify(summary)
    except Exception as e:
        print(f"Error in merchant_summary: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# SALES REPORT SCREEN ENDPOINTS
@app.route('/api/merchant/<merchant_id>/sales/daily', methods=['GET'])
def daily_sales(merchant_id):
    """Get daily sales data for the last 30 days"""
    conn = get_db_connection()
    
    # Get optional date range from query parameters
    days = request.args.get('days', default=30, type=int)
   
    try:
        query = """
        SELECT
            DATE(td.order_time) as sale_date,
            SUM(td.order_value) as daily_sales,
            COUNT(DISTINCT td.order_id) as transaction_count
        FROM transaction_data td
        WHERE td.merchant_id = %s
        AND td.order_time >= NOW() - INTERVAL '%s days'
        GROUP BY DATE(td.order_time)
        ORDER BY sale_date
        """
       
        sales_data = pd.read_sql(query, conn, params=(merchant_id, days))
       
        # Convert to JSON safe format
        result = []
        for _, row in sales_data.iterrows():
            result.append({
                "date": row['sale_date'].strftime('%Y-%m-%d'),
                "sales": float(row['daily_sales']),
                "transactions": int(row['transaction_count'])
            })
       
        return jsonify(result)
    except Exception as e:
        print(f"Error in daily_sales: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/merchant/<merchant_id>/sales/hourly', methods=['GET'])
def hourly_sales(merchant_id):
    """Get hourly sales distribution"""
    conn = get_db_connection()
   
    try:
        query = """
        SELECT
            EXTRACT(HOUR FROM td.order_time) as hour_of_day,
            SUM(td.order_value) as hourly_sales,
            COUNT(DISTINCT td.order_id) as order_count
        FROM transaction_data td
        WHERE td.merchant_id = %s
        GROUP BY EXTRACT(HOUR FROM td.order_time)
        ORDER BY hour_of_day
        """
       
        sales_data = pd.read_sql(query, conn, params=(merchant_id,))
       
        # Convert to JSON safe format
        result = []
        for _, row in sales_data.iterrows():
            result.append({
                "hour": int(row['hour_of_day']),
                "sales": float(row['hourly_sales']),
                "orders": int(row['order_count'])
            })
       
        return jsonify(result)
    except Exception as e:
        print(f"Error in hourly_sales: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/merchant/<merchant_id>/sales/metrics', methods=['GET'])
def sales_metrics(merchant_id):
    """Get key sales metrics with period comparison"""
    conn = get_db_connection()
    
    # Get period from query parameters (default to 7 days)
    period = request.args.get('period', default=7, type=int)
   
    try:
        # Current period
        current_query = """
        SELECT
            SUM(td.order_value) as total_sales,
            COUNT(DISTINCT td.order_id) as order_count,
            AVG(td.order_value) as avg_order_value
        FROM transaction_data td
        WHERE td.merchant_id = %s
        AND td.order_time >= NOW() - INTERVAL '%s days'
        """
        
        # Previous period
        previous_query = """
        SELECT
            SUM(td.order_value) as total_sales,
            COUNT(DISTINCT td.order_id) as order_count,
            AVG(td.order_value) as avg_order_value
        FROM transaction_data td
        WHERE td.merchant_id = %s
        AND td.order_time >= NOW() - INTERVAL '%s days'
        AND td.order_time < NOW() - INTERVAL '%s days'
        """
        
        current_data = pd.read_sql(current_query, conn, params=(merchant_id, period))
        previous_data = pd.read_sql(previous_query, conn, params=(merchant_id, period*2, period))
        
        # Calculate changes
        current_sales = float(current_data.iloc[0]['total_sales']) if not pd.isna(current_data.iloc[0]['total_sales']) else 0
        previous_sales = float(previous_data.iloc[0]['total_sales']) if not pd.isna(previous_data.iloc[0]['total_sales']) else 0
        
        current_orders = int(current_data.iloc[0]['order_count']) if not pd.isna(current_data.iloc[0]['order_count']) else 0
        previous_orders = int(previous_data.iloc[0]['order_count']) if not pd.isna(previous_data.iloc[0]['order_count']) else 0
        
        current_aov = float(current_data.iloc[0]['avg_order_value']) if not pd.isna(current_data.iloc[0]['avg_order_value']) else 0
        previous_aov = float(previous_data.iloc[0]['avg_order_value']) if not pd.isna(previous_data.iloc[0]['avg_order_value']) else 0
        
        # Calculate percentage changes
        sales_change = ((current_sales - previous_sales) / previous_sales * 100) if previous_sales > 0 else 0
        order_change = ((current_orders - previous_orders) / previous_orders * 100) if previous_orders > 0 else 0
        aov_change = ((current_aov - previous_aov) / previous_aov * 100) if previous_aov > 0 else 0
        
        result = {
            "total_sales": current_sales,
            "sales_change": sales_change,
            "total_orders": current_orders,
            "orders_change": order_change,
            "avg_order_value": current_aov,
            "aov_change": aov_change,
            "period_days": period
        }
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in sales_metrics: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# PRODUCTS SCREEN ENDPOINTS
@app.route('/api/merchant/<merchant_id>/items', methods=['GET'])
def merchant_items(merchant_id):
    """Get all items for a merchant"""
    conn = get_db_connection()
   
    try:
        query = """
        SELECT 
            i.item_id, 
            i.item_name, 
            i.item_price, 
            i.cuisine_tag
        FROM items i
        WHERE i.merchant_id = %s
        """
       
        items = pd.read_sql(query, conn, params=(merchant_id,))
       
        if items.empty:
            return jsonify({"message": "No items found for this merchant"}), 404
       
        result = []
        for _, row in items.iterrows():
            result.append({
                "item_id": int(row['item_id']),
                "name": row['item_name'],
                "price": float(row['item_price']),
                "cuisine_tag": row['cuisine_tag']
            })
       
        return jsonify({"items": result})
    except Exception as e:
        print(f"Error in merchant_items: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/merchant/<merchant_id>/items/performance', methods=['GET'])
def item_performance(merchant_id):
    """Get item sales performance"""
    conn = get_db_connection()
    
    # Optional period parameter
    days = request.args.get('days', default=30, type=int)
   
    try:
        query = """
        SELECT 
            i.item_id,
            i.item_name,
            i.item_price,
            COUNT(ti.order_id) as order_count
        FROM items i
        LEFT JOIN transaction_items ti ON i.item_id = ti.item_id
        LEFT JOIN transaction_data td ON ti.order_id = td.order_id
        WHERE i.merchant_id = %s
        AND (td.order_time IS NULL OR td.order_time >= NOW() - INTERVAL '%s days')
        GROUP BY i.item_id, i.item_name, i.item_price
        ORDER BY order_count DESC
        """
       
        items = pd.read_sql(query, conn, params=(merchant_id, days))
       
        result = []
        for _, row in items.iterrows():
            result.append({
                "item_id": int(row['item_id']),
                "name": row['item_name'],
                "price": float(row['item_price']),
                "order_count": int(row['order_count']),
                "revenue": float(row['item_price']) * int(row['order_count'])
            })
       
        return jsonify({"items": result})
    except Exception as e:
        print(f"Error in item_performance: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# INSIGHTS SCREEN ENDPOINTS
@app.route('/api/merchant/<merchant_id>/insights', methods=['GET'])
def merchant_insights(merchant_id):
    """Get business insights for merchant"""
    conn = get_db_connection()
   
    try:
        # Get delivery time metrics
        delivery_query = """
        SELECT
            AVG(EXTRACT(EPOCH FROM (td.delivery_time - td.order_time))/60) as avg_delivery_time,
            AVG(EXTRACT(EPOCH FROM (td.driver_arrival_time - td.order_time))/60) as avg_arrival_time,
            AVG(EXTRACT(EPOCH FROM (td.driver_pickup_time - td.driver_arrival_time))/60) as avg_preparation_time
        FROM transaction_data td
        WHERE td.merchant_id = %s
        AND td.delivery_time IS NOT NULL 
        AND td.driver_arrival_time IS NOT NULL
        AND td.driver_pickup_time IS NOT NULL
        """
        
        delivery_metrics = pd.read_sql(delivery_query, conn, params=(merchant_id,))
        
        # Get repeat customer rate
        repeat_query = """
        SELECT
            COUNT(DISTINCT td.eater_id) as total_customers,
            COUNT(DISTINCT CASE WHEN customer_count > 1 THEN td.eater_id END) as repeat_customers
        FROM transaction_data td
        JOIN (
            SELECT eater_id, COUNT(order_id) as customer_count
            FROM transaction_data
            WHERE merchant_id = %s
            GROUP BY eater_id
        ) as customer_counts ON td.eater_id = customer_counts.eater_id
        WHERE td.merchant_id = %s
        """
        
        customer_metrics = pd.read_sql(repeat_query, conn, params=(merchant_id, merchant_id))
        
        # Get top cuisine tags
        cuisine_query = """
        SELECT
            i.cuisine_tag,
            COUNT(ti.order_id) as order_count
        FROM items i
        JOIN transaction_items ti ON i.item_id = ti.item_id
        WHERE i.merchant_id = %s
        GROUP BY i.cuisine_tag
        ORDER BY order_count DESC
        LIMIT 5
        """
        
        cuisine_data = pd.read_sql(cuisine_query, conn, params=(merchant_id,))
        
        # Build insights
        avg_delivery = float(delivery_metrics.iloc[0]['avg_delivery_time']) if not pd.isna(delivery_metrics.iloc[0]['avg_delivery_time']) else 0
        avg_arrival = float(delivery_metrics.iloc[0]['avg_arrival_time']) if not pd.isna(delivery_metrics.iloc[0]['avg_arrival_time']) else 0
        avg_prep = float(delivery_metrics.iloc[0]['avg_preparation_time']) if not pd.isna(delivery_metrics.iloc[0]['avg_preparation_time']) else 0
        
        total_customers = int(customer_metrics.iloc[0]['total_customers']) if not pd.isna(customer_metrics.iloc[0]['total_customers']) else 0
        repeat_customers = int(customer_metrics.iloc[0]['repeat_customers']) if not pd.isna(customer_metrics.iloc[0]['repeat_customers']) else 0
        repeat_rate = (repeat_customers / total_customers * 100) if total_customers > 0 else 0
        
        cuisine_tags = []
        for _, row in cuisine_data.iterrows():
            cuisine_tags.append({
                "tag": row['cuisine_tag'],
                "order_count": int(row['order_count'])
            })
        
        insights = {
            "delivery_metrics": {
                "avg_delivery_time_min": avg_delivery,
                "avg_arrival_time_min": avg_arrival,
                "avg_preparation_time_min": avg_prep
            },
            "customer_metrics": {
                "total_unique_customers": total_customers,
                "repeat_customers": repeat_customers,
                "repeat_rate_percent": repeat_rate
            },
            "top_cuisine_tags": cuisine_tags
        }
        
        return jsonify(insights)
    except Exception as e:
        print(f"Error in merchant_insights: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# CHAT SCREEN ENDPOINTS
@app.route('/api/merchant/<merchant_id>/keywords', methods=['GET'])
def merchant_keywords(merchant_id):
    """Get keyword performance data"""
    conn = get_db_connection()
   
    try:
        # This is a simplified approach since your schema doesn't have merchant_id in keywords table
        # In a real application, you'd want to filter keywords by merchant
        keyword_query = """
        SELECT keyword, view, menu, checkout, order_count
        FROM keywords
        ORDER BY order_count DESC
        LIMIT 20
        """
        
        keywords = pd.read_sql(keyword_query, conn)
        
        result = []
        for _, row in keywords.iterrows():
            result.append({
                "keyword": row['keyword'],
                "views": int(row['view']),
                "menu_views": int(row['menu']),
                "checkouts": int(row['checkout']),
                "orders": int(row['order_count']),
                "conversion_rate": (int(row['order_count']) / int(row['view']) * 100) if int(row['view']) > 0 else 0
            })
        
        return jsonify({"keywords": result})
    except Exception as e:
        print(f"Error in merchant_keywords: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# UTILITY ENDPOINTS
@app.route('/api/merchants', methods=['GET'])
def list_merchants():
    """List all available merchants"""
    conn = get_db_connection()
    
    try:
        query = "SELECT merchant_id, merchant_name FROM merchants LIMIT 100"
        merchants = pd.read_sql(query, conn)
        
        if merchants.empty:
            return jsonify({"message": "No merchants found in database"}), 404
        
        result = []
        for _, row in merchants.iterrows():
            result.append({
                "merchant_id": row['merchant_id'],
                "name": row['merchant_name']
            })
        
        return jsonify({"merchants": result})
    except Exception as e:
        print(f"Error listing merchants: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/debug/merchant/<merchant_id>', methods=['GET'])
def debug_merchant(merchant_id):
    """Get raw merchant data for debugging"""
    conn = get_db_connection()
    
    try:
        # Get merchant info
        merchant_query = "SELECT * FROM merchants WHERE merchant_id = %s"
        merchant_info = pd.read_sql(merchant_query, conn, params=(merchant_id,))
        
        if merchant_info.empty:
            return jsonify({"error": "Merchant not found", "id_requested": merchant_id}), 404
        
        # Convert to dict
        merchant_dict = merchant_info.iloc[0].to_dict()
        
        # Check available tables
        tables_query = """
        SELECT tablename FROM pg_catalog.pg_tables
        WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
        """
        tables = pd.read_sql(tables_query, conn)
        
        return jsonify({
            "merchant_data": merchant_dict,
            "available_tables": tables['tablename'].tolist()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)