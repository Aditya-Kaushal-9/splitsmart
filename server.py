from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from settlement import minimize_transactions

app = Flask(__name__)
CORS(app)

DATABASE = "splitsmart.db"


def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_database():

    db = get_db()

    db.execute("""
        CREATE TABLE IF NOT EXISTS roommates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            paid_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (paid_by) REFERENCES roommates(id)
        )
    """)

    db.commit()
    db.close()


# =========================
# HOME
# =========================

@app.route("/")
def home():

    return jsonify({
        "app": "SplitSmart",
        "status": "Backend is running"
    })


# =========================
# ROOMMATES
# =========================

@app.route("/api/roommates", methods=["GET"])
def get_roommates():

    db = get_db()

    roommates = db.execute(
        "SELECT * FROM roommates ORDER BY id"
    ).fetchall()

    db.close()

    return jsonify([
        dict(person)
        for person in roommates
    ])


@app.route("/api/roommates", methods=["POST"])
def add_roommate():

    data = request.get_json()

    name = data.get("name", "").strip()

    if not name:
        return jsonify({
            "error": "Name is required"
        }), 400

    db = get_db()

    try:

        cursor = db.execute(
            "INSERT INTO roommates (name) VALUES (?)",
            (name,)
        )

        db.commit()

        roommate_id = cursor.lastrowid

    except sqlite3.IntegrityError:

        db.close()

        return jsonify({
            "error": "Roommate already exists"
        }), 409

    db.close()

    return jsonify({
        "id": roommate_id,
        "name": name
    }), 201


@app.route("/api/roommates/<int:roommate_id>", methods=["DELETE"])
def delete_roommate(roommate_id):

    db = get_db()

    expenses = db.execute(
        "SELECT COUNT(*) AS count FROM expenses WHERE paid_by = ?",
        (roommate_id,)
    ).fetchone()

    if expenses["count"] > 0:

        db.close()

        return jsonify({
            "error":
                "Delete this roommate's expenses first."
        }), 400

    db.execute(
        "DELETE FROM roommates WHERE id = ?",
        (roommate_id,)
    )

    db.commit()
    db.close()

    return jsonify({
        "message": "Roommate deleted"
    })


# =========================
# EXPENSES
# =========================

@app.route("/api/expenses", methods=["GET"])
def get_expenses():

    db = get_db()

    expenses = db.execute("""
        SELECT
            expenses.id,
            expenses.title,
            expenses.amount,
            expenses.paid_by,
            roommates.name AS payer,
            expenses.created_at
        FROM expenses
        JOIN roommates
        ON expenses.paid_by = roommates.id
        ORDER BY expenses.id DESC
    """).fetchall()

    db.close()

    return jsonify([
        dict(expense)
        for expense in expenses
    ])


@app.route("/api/expenses", methods=["POST"])
def add_expense():

    data = request.get_json()

    title = data.get("title", "").strip()
    amount = data.get("amount")
    paid_by = data.get("paidBy")

    if not title or amount is None or not paid_by:

        return jsonify({
            "error": "All expense fields are required"
        }), 400

    try:
        amount = float(amount)
        paid_by = int(paid_by)

    except (ValueError, TypeError):

        return jsonify({
            "error": "Invalid expense data"
        }), 400

    if amount <= 0:

        return jsonify({
            "error": "Amount must be greater than zero"
        }), 400

    db = get_db()

    payer = db.execute(
        "SELECT id FROM roommates WHERE id = ?",
        (paid_by,)
    ).fetchone()

    if payer is None:

        db.close()

        return jsonify({
            "error": "Roommate not found"
        }), 404

    cursor = db.execute("""
        INSERT INTO expenses
        (title, amount, paid_by)
        VALUES (?, ?, ?)
    """, (
        title,
        amount,
        paid_by
    ))

    db.commit()

    expense_id = cursor.lastrowid

    db.close()

    return jsonify({
        "id": expense_id,
        "title": title,
        "amount": amount,
        "paidBy": paid_by
    }), 201


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):

    db = get_db()

    db.execute(
        "DELETE FROM expenses WHERE id = ?",
        (expense_id,)
    )

    db.commit()
    db.close()

    return jsonify({
        "message": "Expense deleted"
    })


# =========================
# BALANCES
# =========================

@app.route("/api/balances", methods=["GET"])
def get_balances():

    db = get_db()

    roommates = db.execute(
        "SELECT * FROM roommates"
    ).fetchall()

    expenses = db.execute(
        "SELECT * FROM expenses"
    ).fetchall()

    db.close()

    balances = {
        person["id"]: 0.0
        for person in roommates
    }

    if not roommates:

        return jsonify({})

    share_count = len(roommates)

    for expense in expenses:

        share = (
            expense["amount"]
            / share_count
        )

        for person in roommates:

            balances[person["id"]] -= share

        balances[
            expense["paid_by"]
        ] += expense["amount"]

    result = {}

    for person in roommates:

        result[
            person["name"]
        ] = round(
            balances[person["id"]],
            2
        )

    return jsonify(result)


# =========================
# SMART SETTLEMENT
# =========================

@app.route("/api/settle", methods=["GET"])
def settle():

    db = get_db()

    roommates = db.execute(
        "SELECT * FROM roommates"
    ).fetchall()

    expenses = db.execute(
        "SELECT * FROM expenses"
    ).fetchall()

    db.close()

    balances = {
        person["name"]: 0.0
        for person in roommates
    }

    count = len(roommates)

    if count == 0:

        return jsonify({
            "transactions": [],
            "count": 0
        })

    for expense in expenses:

        share = (
            expense["amount"]
            / count
        )

        for person in roommates:

            balances[
                person["name"]
            ] -= share

        payer = next(
            person["name"]
            for person in roommates
            if person["id"] == expense["paid_by"]
        )

        balances[payer] += expense["amount"]

    transactions = minimize_transactions(
        balances
    )

    return jsonify({
        "transactions": transactions,
        "count": len(transactions)
    })


# =========================
# START SERVER
# =========================

if __name__ == "__main__":

    init_database()

    print("==============================")
    print("       SPLITSMART BACKEND")
    print("==============================")
    print("Database: splitsmart.db")
    print("Server: http://127.0.0.1:5000")

    import os

app.run(
    host="0.0.0.0",
    port=int(os.environ.get("PORT", 5000)),
    debug=False
)