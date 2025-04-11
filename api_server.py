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
    print(f"Requesting summary for merchant_id: {merchant_id}")
    conn = get_db_connection()
   
    try:
        # Get merchant info
        merchant_query = "SELECT * FROM merchants WHERE merchant_id = %s"
        merchant_info = pd.read_sql(merchant_query, conn, params=(merchant_id,))
        
        print(f"Query returned {len(merchant_info)} rows")
       
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
       
        # Print available columns for debugging
        print(f"Merchant columns: {merchant_info.columns.tolist()}")
        
        summary = {
            "merchant_id": merchant_id,
            "name": merchant_info.iloc[0]['merchant_name'],
            "join_date": merchant_info.iloc[0]['join_date'],
            "city_id": int(merchant_info.iloc[0]['city_id']) if not pd.isna(merchant_info.iloc[0]['city_id']) else None,
            "total_sales": float(sales_summary.iloc[0]['total_sales']) if not pd.isna(sales_summary.iloc[0]['total_sales']) else 0,
            "transaction_count": int(sales_summary.iloc[0]['transaction_count']) if not pd.isna(sales_summary.iloc[0]['transaction_count']) else 0,
            "active_days": int(sales_summary.iloc[0]['active_days']) if not pd.isna(sales_summary.iloc[0]['active_days']) else 0,
            "avg_transaction_value": float(sales_summary.iloc[0]['avg_transaction_value']) if not pd.isna(sales_summary.iloc[0]['avg_transaction_value']) else 0
        }
        
        print(f"Successfully created summary for merchant {merchant_id}")
        return jsonify(summary)
    except Exception as e:
        print(f"Error in merchant_summary: {str(e)}")
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
        print(f"Error in daily_sales: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

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

# Add this route to check specific database values
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