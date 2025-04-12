from flask import Flask, request, jsonify
import pandas as pd
from db_connection import get_db_connection
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Merchant Assistant API is running"})

@app.route('/api/merchants', methods=['GET'])
def list_merchants():
    conn = get_db_connection()
    try:
        query = "SELECT merchant_id, merchant_name FROM merchants LIMIT 100"
        df = pd.read_sql(query, conn)
        return jsonify({"merchants": df.to_dict(orient='records')})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/merchant/<merchant_id>/insights', methods=['GET'])
def generate_insights(merchant_id):
    conn = get_db_connection()
    try:
        # Prepare insight containers
        recommendations = []
        performance_flags = []

        # Time window for current period (30 days)
        today = datetime(2024, 4, 1)  # use fixed date due to synthetic dataset
        past_30 = today - timedelta(days=30)
        past_60 = today - timedelta(days=60)

        # Fetch sales trend data
        trend_query = """
            SELECT DATE(order_time) AS day, SUM(order_value) AS revenue
            FROM transaction_data
            WHERE merchant_id = %s AND order_time BETWEEN %s AND %s
            GROUP BY DATE(order_time) ORDER BY day
        """
        sales_data = pd.read_sql(trend_query, conn, params=(merchant_id, past_60, today))

        # Compare last 30 days with previous 30 days
        sales_data['day'] = pd.to_datetime(sales_data['day'])
        recent = sales_data[sales_data['day'] >= past_30]['revenue'].sum()
        previous = sales_data[sales_data['day'] < past_30]['revenue'].sum()

        if previous > 0:
            growth_rate = (recent - previous) / previous * 100
            if growth_rate < -10:
                recommendations.append("📉 Sales dropped over the last month. Consider offering promotions or discounts.")
            elif growth_rate > 10:
                recommendations.append("📈 Great! Sales have increased this month. Maintain momentum with targeted ads.")
        else:
            recommendations.append("ℹ️ Not enough data from the previous month to calculate sales growth.")

        # Analyze delivery performance
        delivery_query = """
            SELECT
                AVG(EXTRACT(EPOCH FROM (delivery_time - order_time)) / 60) AS delivery_avg,
                AVG(EXTRACT(EPOCH FROM (driver_arrival_time - order_time)) / 60) AS arrival_avg,
                AVG(EXTRACT(EPOCH FROM (driver_pickup_time - driver_arrival_time)) / 60) AS prep_avg
            FROM transaction_data
            WHERE merchant_id = %s
                AND delivery_time IS NOT NULL AND driver_arrival_time IS NOT NULL AND driver_pickup_time IS NOT NULL
        """
        delivery = pd.read_sql(delivery_query, conn, params=(merchant_id,))
        if delivery.iloc[0]['delivery_avg'] and delivery.iloc[0]['delivery_avg'] > 45:
            performance_flags.append("⚠️ Average delivery time exceeds 45 minutes. Review logistics operations.")
        if delivery.iloc[0]['prep_avg'] and delivery.iloc[0]['prep_avg'] > 15:
            performance_flags.append("⚠️ Preparation time is relatively long. Re-evaluate kitchen workflows.")

        # Analyze item performance
        item_query = """
            SELECT i.item_name, COUNT(ti.order_id) AS total_orders
            FROM items i
            LEFT JOIN transaction_items ti ON i.item_id = ti.item_id
            WHERE i.merchant_id = %s
            GROUP BY i.item_name
            ORDER BY total_orders DESC
            LIMIT 5
        """
        top_items = pd.read_sql(item_query, conn, params=(merchant_id,))

        if len(top_items) > 0:
            top_product = top_items.iloc[0]['item_name']
            recommendations.append(f"🔥 Your top selling item is: {top_product}. Consider bundling or promoting it more.")

        # Analyze repeat customer behavior
        repeat_query = """
            SELECT COUNT(DISTINCT td.eater_id) AS total,
                   COUNT(DISTINCT CASE WHEN count_tbl.order_count > 1 THEN td.eater_id END) AS repeat
            FROM transaction_data td
            JOIN (SELECT eater_id, COUNT(*) AS order_count FROM transaction_data WHERE merchant_id = %s GROUP BY eater_id) count_tbl
              ON td.eater_id = count_tbl.eater_id
            WHERE td.merchant_id = %s
        """
        repeat_result = pd.read_sql(repeat_query, conn, params=(merchant_id, merchant_id))
        total = repeat_result.iloc[0]['total'] or 0
        repeat = repeat_result.iloc[0]['repeat'] or 0
        if total > 0:
            repeat_rate = repeat / total * 100
            if repeat_rate < 20:
                recommendations.append("👤 Low repeat customer rate. Implement loyalty programs or feedback surveys.")
            elif repeat_rate > 50:
                recommendations.append("💚 Excellent customer retention. Keep up the good service!")

        # Cuisine tag popularity
        cuisine_query = """
            SELECT cuisine_tag, COUNT(*) AS orders
            FROM items i
            JOIN transaction_items ti ON i.item_id = ti.item_id
            WHERE i.merchant_id = %s AND i.cuisine_tag IS NOT NULL
            GROUP BY cuisine_tag
            ORDER BY orders DESC LIMIT 3
        """
        cuisine_tags = pd.read_sql(cuisine_query, conn, params=(merchant_id,))

        response = {
            "sales_insight": {
                "recent_30_day_sales": recent,
                "previous_30_day_sales": previous,
                "growth_rate_percent": growth_rate if previous > 0 else None,
            },
            "delivery_insight": {
                "avg_delivery_time_min": delivery.iloc[0]['delivery_avg'],
                "avg_arrival_time_min": delivery.iloc[0]['arrival_avg'],
                "avg_preparation_time_min": delivery.iloc[0]['prep_avg']
            },
            "top_items": top_items.to_dict(orient='records'),
            "repeat_customers": {
                "total_customers": total,
                "repeat_customers": repeat,
                "repeat_rate_percent": repeat / total * 100 if total > 0 else 0
            },
            "popular_cuisine_tags": cuisine_tags.to_dict(orient='records'),
            "recommendations": recommendations,
            "alerts": performance_flags
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)