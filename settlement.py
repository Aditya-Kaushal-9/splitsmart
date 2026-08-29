def minimize_transactions(balances):

    debtors = []
    creditors = []

    # Separate people who owe money
    # from people who should receive money

    for person, balance in balances.items():

        balance = round(balance, 2)

        if balance < 0:
            debtors.append([
                person,
                abs(balance)
            ])

        elif balance > 0:
            creditors.append([
                person,
                balance
            ])


    transactions = []

    debtor_index = 0
    creditor_index = 0


    # Match debtors with creditors

    while (
        debtor_index < len(debtors)
        and creditor_index < len(creditors)
    ):

        debtor = debtors[debtor_index]
        creditor = creditors[creditor_index]


        payment = min(
            debtor[1],
            creditor[1]
        )


        transactions.append({
            "from": debtor[0],
            "to": creditor[0],
            "amount": round(payment, 2)
        })


        debtor[1] -= payment
        creditor[1] -= payment


        if debtor[1] < 0.01:
            debtor_index += 1


        if creditor[1] < 0.01:
            creditor_index += 1


    return transactions


# Test the algorithm

if __name__ == "__main__":

    balances = {

        "Aditya": 500,
        "Rahul": -200,
        "Aman": -300

    }


    transactions = minimize_transactions(
        balances
    )


    print("\n==============================")
    print("      SMART SETTLEMENT")
    print("==============================")


    for transaction in transactions:

        print(
            f"{transaction['from']} pays "
            f"{transaction['to']} "
            f"₹{transaction['amount']}"
        )