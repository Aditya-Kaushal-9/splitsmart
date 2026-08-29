# =========================================================
# SPLITSMART
# Flask Backend + SQLite
# =========================================================

import os
import sqlite3

from flask import Flask, request, jsonify
from flask_cors import CORS


# =========================================================
# APP
# =========================================================

app = Flask(__name__)

CORS(app)


# =========================================================
# DATABASE
# =========================================================

DATABASE = "splitsmart.db"


def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db


# =========================================================
# DATABASE SETUP
# =========================================================

def init_database():

    db = get_db()

    # Roommates table
    db.execute("""
        CREATE TABLE IF NOT EXISTS roommates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """)

    # Expenses table
    db.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Other',
            amount REAL NOT NULL,
            paid_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (paid_by) REFERENCES roommates(id)
        )
    """)

    # Add category column to old databases
    columns = db.execute(
        "PRAGMA table_info(expenses)"
    ).fetchall()

    column_names = [
        column["name"] for column in columns
    ]

    if "category" not in column_names:
        try:
            db.execute("""
                ALTER TABLE expenses
                ADD COLUMN category TEXT NOT NULL DEFAULT 'Other'
            """)
        except sqlite3.OperationalError:
            pass

    db.commit()
    db.close()


# =========================================================
# HOME
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "app": "SplitSmart",
        "status": "Backend is running",
        "version": "2.0"
    })


# =========================================================
# ROOMMATES - GET
# =========================================================

@app.route("/api/roommates", methods=["GET"])
def get_roommates():

    db = get_db()

    rows = db.execute("""
        SELECT id, name
        FROM roommates
        ORDER BY id
    """).fetchall()

    db.close()

    return jsonify([
        dict(row) for row in rows
    ])


# =========================================================
# ROOMMATES - POST
# =========================================================

@app.route("/api/roommates", methods=["POST"])
def add_roommate():

    data = request.get_json(silent=True) or {}

    name = str(
        data.get("name", "")
    ).strip()

    if not name:
        return jsonify({
            "error": "Roommate name is required."
        }), 400

    if len(name) > 50:
        return jsonify({
            "error": "Roommate name is too long."
        }), 400

    db = get_db()

    try:

        cursor = db.execute(
            """
            INSERT INTO roommates (name)
            VALUES (?)
            """,
            (name,)
        )

        db.commit()

        roommate_id = cursor.lastrowid

    except sqlite3.IntegrityError:

        db.close()

        return jsonify({
            "error": "This roommate already exists."
        }), 409

    db.close()

    return jsonify({
        "id": roommate_id,
        "name": name
    }), 201


# =========================================================
# ROOMMATES - DELETE
# =========================================================

@app.route(
    "/api/roommates/<int:roommate_id>",
    methods=["DELETE"]
)
def delete_roommate(roommate_id):

    db = get_db()

    expense_count = db.execute(
        """
        SELECT COUNT(*) AS count
        FROM expenses
        WHERE paid_by = ?
        """,
        (roommate_id,)
    ).fetchone()["count"]

    if expense_count > 0:

        db.close()

        return jsonify({
            "error":
                "This roommate has expenses. Delete those expenses first."
        }), 400

    cursor = db.execute(
        """
        DELETE FROM roommates
        WHERE id = ?
        """,
        (roommate_id,)
    )

    if cursor.rowcount == 0:

        db.close()

        return jsonify({
            "error": "Roommate not found."
        }), 404

    db.commit()
    db.close()

    return jsonify({
        "message": "Roommate deleted successfully."
    })


# =========================================================
# EXPENSES - GET
# =========================================================

@app.route("/api/expenses", methods=["GET"])
def get_expenses():

    db = get_db()

    rows = db.execute("""
        SELECT
            expenses.id,
            expenses.title,
            expenses.category,
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
        dict(row) for row in rows
    ])


# =========================================================
# EXPENSES - POST
# =========================================================

@app.route("/api/expenses", methods=["POST"])
def add_expense():

    data = request.get_json(silent=True) or {}

    title = str(
        data.get("title", "")
    ).strip()

    category = str(
        data.get("category", "Other")
    ).strip()

    amount = data.get("amount")
    paid_by = data.get("paidBy")

    if not title:
        return jsonify({
            "error": "Expense title is required."
        }), 400

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Amount must be a valid number."
        }), 400

    if amount <= 0:
        return jsonify({
            "error": "Amount must be greater than zero."
        }), 400

    try:
        paid_by = int(paid_by)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Please select who paid."
        }), 400

    allowed_categories = {
        "Food",
        "Groceries",
        "Transport",
        "Rent",
        "Utilities",
        "WiFi",
        "Entertainment",
        "Medical",
        "Household",
        "Other"
    }

    if category not in allowed_categories:
        category = "Other"

    db = get_db()

    payer = db.execute(
        """
        SELECT id, name
        FROM roommates
        WHERE id = ?
        """,
        (paid_by,)
    ).fetchone()

    if payer is None:

        db.close()

        return jsonify({
            "error": "Selected roommate was not found."
        }), 404

    cursor = db.execute(
        """
        INSERT INTO expenses
        (
            title,
            category,
            amount,
            paid_by
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?
        )
        """,
        (
            title,
            category,
            amount,
            paid_by
        )
    )

    db.commit()

    expense_id = cursor.lastrowid

    db.close()

    return jsonify({
        "id": expense_id,
        "title": title,
        "category": category,
        "amount": amount,
        "paidBy": paid_by,
        "payer": payer["name"]
    }), 201


# =========================================================
# EXPENSES - DELETE
# =========================================================

@app.route(
    "/api/expenses/<int:expense_id>",
    methods=["DELETE"]
)
def delete_expense(expense_id):

    db = get_db()

    cursor = db.execute(
        """
        DELETE FROM expenses
        WHERE id = ?
        """,
        (expense_id,)
    )

    if cursor.rowcount == 0:

        db.close()

        return jsonify({
            "error": "Expense not found."
        }), 404

    db.commit()
    db.close()

    return jsonify({
        "message": "Expense deleted successfully."
    })


# =========================================================
# BALANCE CALCULATION
# =========================================================

def calculate_balances():

    db = get_db()

    roommates = db.execute(
        """
        SELECT id, name
        FROM roommates
        ORDER BY id
        """
    ).fetchall()

    expenses = db.execute(
        """
        SELECT amount, paid_by
        FROM expenses
        """
    ).fetchall()

    db.close()

    if not roommates:
        return {}

    roommate_count = len(roommates)

    balances = {
        person["name"]: 0.0
        for person in roommates
    }

    for expense in expenses:

        amount = float(
            expense["amount"]
        )

        share = amount / roommate_count

        # Everyone owes their share
        for person in roommates:
            balances[person["name"]] -= share

        # Payer gets credit for full payment
        for person in roommates:

            if person["id"] == expense["paid_by"]:

                balances[person["name"]] += amount

                break

    return {
        person: round(amount, 2)
        for person, amount in balances.items()
    }


# =========================================================
# BALANCES API
# =========================================================

@app.route("/api/balances", methods=["GET"])
def get_balances():

    return jsonify(
        calculate_balances()
    )


# =========================================================
# MINIMUM TRANSACTION ALGORITHM
# =========================================================

def minimize_transactions(balances):

    debtors = []
    creditors = []

    for person, amount in balances.items():

        amount = round(
            float(amount),
            2
        )

        if amount < -0.01:

            debtors.append({
                "name": person,
                "amount": abs(amount)
            })

        elif amount > 0.01:

            creditors.append({
                "name": person,
                "amount": amount
            })

    transactions = []

    debtor_index = 0
    creditor_index = 0

    while (
        debtor_index < len(debtors)
        and creditor_index < len(creditors)
    ):

        debtor = debtors[debtor_index]
        creditor = creditors[creditor_index]

        payment = min(
            debtor["amount"],
            creditor["amount"]
        )

        payment = round(
            payment,
            2
        )

        if payment > 0:

            transactions.append({
                "from": debtor["name"],
                "to": creditor["name"],
                "amount": payment
            })

        debtor["amount"] = round(
            debtor["amount"] - payment,
            2
        )

        creditor["amount"] = round(
            creditor["amount"] - payment,
            2
        )

        if debtor["amount"] < 0.01:
            debtor_index += 1

        if creditor["amount"] < 0.01:
            creditor_index += 1

    return transactions


# =========================================================
# SETTLEMENT API
# =========================================================

@app.route("/api/settle", methods=["GET"])
def settlement():

    balances = calculate_balances()

    transactions = minimize_transactions(
        balances
    )

    return jsonify({
        "balances": balances,
        "transactions": transactions,
        "count": len(transactions)
    })


# =========================================================
# ANALYTICS API
# =========================================================

@app.route("/api/analytics", methods=["GET"])
def analytics():

    db = get_db()

    rows = db.execute(
        """
        SELECT category, amount
        FROM expenses
        """
    ).fetchall()

    db.close()

    total = 0.0

    category_totals = {}

    for row in rows:

        category = (
            row["category"]
            or "Other"
        )

        amount = float(
            row["amount"]
        )

        total += amount

        category_totals[category] = (
            category_totals.get(
                category,
                0.0
            ) + amount
        )

    count = len(rows)

    average = (
        total / count
        if count > 0
        else 0.0
    )

    category_totals = {
        category: round(amount, 2)
        for category, amount
        in category_totals.items()
    }

    return jsonify({
        "total": round(total, 2),
        "average": round(average, 2),
        "count": count,
        "categories": category_totals
    })


# =========================================================
# START SERVER
# =========================================================

init_database()


if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    print(
        "================================"
    )

    print(
        "       SPLITSMART BACKEND"
    )

    print(
        "================================"
    )

    print(
        f"Running on port {port}"
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )