from flask import Flask, request, jsonify
from flask_cors import CORS
from settlement import minimize_transactions

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "message": "SplitSmart API is running!"
    })


@app.route("/settle", methods=["POST"])
def settle():

    data = request.get_json()

    if not data or "balances" not in data:
        return jsonify({
            "error": "Balances are required"
        }), 400

    balances = data["balances"]

    transactions = minimize_transactions(
        balances
    )

    return jsonify({
        "transactions": transactions,
        "count": len(transactions)
    })


if __name__ == "__main__":

    print("==============================")
    print("       SPLITSMART API")
    print("==============================")
    print("Server running on port 5000")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )