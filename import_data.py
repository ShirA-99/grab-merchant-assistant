from flask import Flask, request, jsonify
import pandas as pd
from db_connection import get_db_connection
from flask_cors import CORS  # To handle cross-origin requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple endpoint to check if API is running"""
    return jsonify({"status": "ok", "message": "Merchant Assistant API is running"})

@app.route('/api/merchant/<merchant_id>/summary', methods=['GET'])
def merchant_summary(merchant_id):
    """Get merchant summary information"""
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
       
        summary = {
            "merchant_id": merchant_id,
            "name": merchant_info.iloc[0]['merchant_name'],
            "join_date": merchant_info.iloc[0]['join_date'],
            "city_id": int(merchant_info.iloc[0]['city_id']),
            "total_sales": float(sales_summary.iloc[0]['total_sales']) if not pd.isna(sales_summary.iloc[0]['total_sales']) else 0,
            "transaction_count": int(sales_summary.iloc[0]['transaction_count']) if not pd.isna(sales_summary.iloc[0]['transaction_count']) else 0,
            "active_days": int(sales_summary.iloc[0]['active_days']) if not pd.isna(sales_summary.iloc[0]['active_days']) else 0,
            "avg_transaction_value": float(sales_summary.iloc[0]['avg_transaction_value']) if not pd.isna(sales_summary.iloc[0]['avg_transaction_value']) else 0
        }
       
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/merchant/<merchant_id>/sales/daily', methods=['GET'])
def daily_sales(merchant_id):
    """Get daily sales data for the last 30 days"""
    conn = get_db_connection()
   
    try:
        query = """
        SELECT
            DATE(td.order_time) as sale_date,
            SUM(td.order_value) as daily_sales,
            COUNT(DISTINCT td.order_id) as transaction_count
        FROM transaction_data td
        WHERE td.merchant_id = %s
        AND td.order_time >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(td.order_time)
        ORDER BY sale_date
        """
       
        sales_data = pd.read_sql(query, conn, params=(merchant_id,))
       
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
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/merchant/<merchant_id>/products/top', methods=['GET'])
def top_products(merchant_id):
    """Get top selling products"""
    conn = get_db_connection()
   
    try:
        query = """
        SELECT
            i.item_id,
            i.item_name,
            i.cuisine_tag as category,
            COUNT(ti.id) as total_quantity,
            SUM(td.order_value) as total_revenue
        FROM transaction_data td
        JOIN transaction_items ti ON td.order_id = ti.order_id
        JOIN items i ON ti.item_id = i.item_id
        WHERE td.merchant_id = %s
        GROUP BY i.item_id, i.item_name, i.cuisine_tag
        ORDER BY total_revenue DESC
        LIMIT 10
        """
       
        top_products = pd.read_sql(query, conn, params=(merchant_id,))
       
        # Convert to JSON safe format
        result = []
        for _, row in top_products.iterrows():
            result.append({
                "item_id": int(row['item_id']),
                "name": row['item_name'],
                "category": row['category'],
                "quantity_sold": int(row['total_quantity']),
                "revenue": float(row['total_revenue'])
            })
       
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/merchant/<merchant_id>/insights', methods=['GET'])
def merchant_insights(merchant_id):
    """Generate business insights for merchant"""
    conn = get_db_connection()
   
    try:
        # Check if merchant exists
        merchant_query = "SELECT merchant_name FROM merchants WHERE merchant_id = %s"
        merchant_info = pd.read_sql(merchant_query, conn, params=(merchant_id,))
       
        if merchant_info.empty:
            return jsonify({"error": "Merchant not found"}), 404
       
        # Get sales trend (last 7 days vs previous 7 days)
        trend_query = """
        WITH current_week AS (
            SELECT SUM(order_value) as current_sales
            FROM transaction_data
            WHERE merchant_id = %s
            AND order_time >= NOW() - INTERVAL '7 days'
        ),
        previous_week AS (
            SELECT SUM(order_value) as previous_sales
            FROM transaction_data
            WHERE merchant_id = %s
            AND order_time >= NOW() - INTERVAL '14 days'
            AND order_time < NOW() - INTERVAL '7 days'
        )
        SELECT
            current_sales,
            previous_sales,
            CASE
                WHEN previous_sales = 0 OR previous_sales IS NULL THEN 0
                ELSE ((current_sales - previous_sales) / previous_sales) * 100
            END as percentage_change
        FROM current_week, previous_week
        """
       
        trend_data = pd.read_sql(trend_query, conn, params=(merchant_id, merchant_id))
       
        # Get best selling category
        category_query = """
        SELECT
            i.cuisine_tag as category,
            SUM(td.order_value) as category_sales
        FROM transaction_data td
        JOIN transaction_items ti ON td.order_id = ti.order_id
        JOIN items i ON ti.item_id = i.item_id
        WHERE td.merchant_id = %s
        GROUP BY i.cuisine_tag
        ORDER BY category_sales DESC
        LIMIT 1
        """
       
        category_data = pd.read_sql(category_query, conn, params=(merchant_id,))
       
        # Get peak business hours
        hours_query = """
        SELECT
            EXTRACT(HOUR FROM order_time) as hour_of_day,
            COUNT(order_id) as transaction_count
        FROM transaction_data
        WHERE merchant_id = %s
        GROUP BY hour_of_day
        ORDER BY transaction_count DESC
        LIMIT 1
        """
       
        hours_data = pd.read_sql(hours_query, conn, params=(merchant_id,))
       
        # Generate insights
        insights = []
       
        # Sales trend insight
        if not trend_data.empty and not pd.isna(trend_data.iloc[0]['percentage_change']):
            percentage_change = float(trend_data.iloc[0]['percentage_change'])
            if percentage_change > 15:
                insights.append({
                    "type": "positive",
                    "title": "Strong Sales Growth",
                    "description": f"Your sales increased by {percentage_change:.1f}% compared to last week."
                })
            elif percentage_change > 5:
                insights.append({
                    "type": "positive",
                    "title": "Moderate Sales Growth",
                    "description": f"Your sales increased by {percentage_change:.1f}% compared to last week."
                })
            elif percentage_change < -15:
                insights.append({
                    "type": "negative",
                    "title": "Significant Sales Drop",
                    "description": f"Your sales decreased by {abs(percentage_change):.1f}% compared to last week."
                })
            elif percentage_change < -5:
                insights.append({
                    "type": "warning",
                    "title": "Sales Decrease",
                    "description": f"Your sales decreased by {abs(percentage_change):.1f}% compared to last week."
                })
       
        # Category insight
        if not category_data.empty and not pd.isna(category_data.iloc[0]['category']):
            best_category = category_data.iloc[0]['category']
            insights.append({
                "type": "info",
                "title": "Top Selling Category",
                "description": f"Your best selling category is '{best_category}'. Consider expanding this category."
            })
       
        # Peak hour insight
        if not hours_data.empty and not pd.isna(hours_data.iloc[0]['hour_of_day']):
            peak_hour = int(hours_data.iloc[0]['hour_of_day'])
            next_hour = (peak_hour + 1) % 24
            peak_period = f"{peak_hour}:00-{next_hour}:00"
            insights.append({
                "type": "info",
                "title": "Peak Business Hours",
                "description": f"Your busiest time is around {peak_period}. Consider optimizing staffing during this period."
            })
       
        return jsonify({
            "merchant_name": merchant_info.iloc[0]['merchant_name'],
            "insights": insights
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/chat', methods=['POST'])
def chat():
    """Process chat messages from merchant"""
    data = request.json
    user_message = data.get('message', '')
    merchant_id = data.get('merchant_id', '')
   
    if not merchant_id:
        return jsonify({"error": "merchant_id is required"}), 400
   
    conn = get_db_connection()
    try:
        # Get merchant name for personalization
        merchant_query = "SELECT merchant_name FROM merchants WHERE merchant_id = %s"
        merchant_info = pd.read_sql(merchant_query, conn, params=(merchant_id,))
        
        if merchant_info.empty:
            return jsonify({"error": "Merchant not found"}), 404
            
        merchant_name = merchant_info.iloc[0]['merchant_name']
       
        # Process user query based on keywords
        if any(word in user_message.lower() for word in ['sales', 'revenue', 'earning']):
            # Get recent sales trend
            sales_query = """
            SELECT
                SUM(order_value) as total_recent_sales
            FROM transaction_data
            WHERE merchant_id = %s
            AND order_time >= NOW() - INTERVAL '7 days'
            """
            sales_data = pd.read_sql(sales_query, conn, params=(merchant_id,))
            total_recent_sales = float(sales_data.iloc[0]['total_recent_sales']) if not pd.isna(sales_data.iloc[0]['total_recent_sales']) else 0
           
            response = {
                "text": f"Hi {merchant_name}, your sales in the past 7 days amount to ${total_recent_sales:.2f}. Would you like to see a detailed breakdown?",
                "action": "view_sales_report"
            }
       
        elif any(word in user_message.lower() for word in ['product', 'item', 'inventory']):
            # Get top product
            product_query = """
            SELECT
                i.item_name,
                COUNT(ti.id) as total_quantity
            FROM transaction_data td
            JOIN transaction_items ti ON td.order_id = ti.order_id
            JOIN items i ON ti.item_id = i.item_id
            WHERE td.merchant_id = %s
            GROUP BY i.item_name
            ORDER BY total_quantity DESC
            LIMIT 1
            """
            product_data = pd.read_sql(product_query, conn, params=(merchant_id,))
           
            if not product_data.empty and not pd.isna(product_data.iloc[0]['item_name']):
                top_product = product_data.iloc[0]['item_name']
                quantity = int(product_data.iloc[0]['total_quantity'])
               
                response = {
                    "text": f"Your best-selling product is '{top_product}' with {quantity} orders. Would you like to see your top 5 products?",
                    "action": "view_product_report"
                }
            else:
                response = {
                    "text": "I don't see any product sales data yet. Let me know when you start selling and I'll provide insights on your best products.",
                    "action": None
                }
       
        elif any(word in user_message.lower() for word in ['busy', 'peak', 'customer', 'traffic']):
            # Get peak hours
            hours_query = """
            SELECT
                EXTRACT(HOUR FROM order_time) as hour_of_day,
                COUNT(order_id) as transaction_count
            FROM transaction_data
            WHERE merchant_id = %s
            GROUP BY hour_of_day
            ORDER BY transaction_count DESC
            LIMIT 1
            """
            hours_data = pd.read_sql(hours_query, conn, params=(merchant_id,))
           
            if not hours_data.empty and not pd.isna(hours_data.iloc[0]['hour_of_day']):
                peak_hour = int(hours_data.iloc[0]['hour_of_day'])
                next_hour = (peak_hour + 1) % 24
               
                response = {
                    "text": f"Your busiest time is between {peak_hour}:00 and {next_hour}:00. You might want to ensure you're fully staffed during these hours.",
                    "action": "view_traffic_report"
                }
            else:
                response = {
                    "text": "I don't have enough data yet to determine your peak business hours. I'll analyze this once you have more transactions.",
                    "action": None
                }
       
        elif any(word in user_message.lower() for word in ['insight', 'tip', 'advice', 'recommend']):
            # Fetch insights
            import json
            from flask import Response
            
            insights_endpoint = f"/api/merchant/{merchant_id}/insights"
            with app.test_client() as client:
                insights_response = client.get(insights_endpoint)
                insights_data = json.loads(insights_response.data)
            
            if 'insights' in insights_data and insights_data['insights']:
                # Get the first insight
                first_insight = insights_data['insights'][0]
               
                response = {
                    "text": f"Here's an insight for you: {first_insight['title']} - {first_insight['description']} Would you like to see more insights?",
                    "action": "view_insights"
                }
            else:
                response = {
                    "text": "I'm still gathering data to generate meaningful insights for your business. Check back soon!",
                    "action": None
                }
       
        else:
            # Default response
            response = {
                "text": f"Hello {merchant_name}! I'm your Grab Merchant Assistant. You can ask me about your sales, products, busy hours, or for business insights.",
                "action": None
            }
       
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)