/* =========================================================
   SPLITSMART
   Roommate Expense Tracker
   Browser Storage + Smart Settlement
   ========================================================= */


/* =========================
   LOAD SAVED DATA
   ========================= */

let roommates =
    JSON.parse(localStorage.getItem("splitsmart_roommates")) || [];

let expenses =
    JSON.parse(localStorage.getItem("splitsmart_expenses")) || [];


/* =========================
   SAVE DATA
   ========================= */

function saveData() {

    localStorage.setItem(
        "splitsmart_roommates",
        JSON.stringify(roommates)
    );

    localStorage.setItem(
        "splitsmart_expenses",
        JSON.stringify(expenses)
    );
}


/* =========================
   PAGE STARTUP
   ========================= */

document.addEventListener("DOMContentLoaded", function () {

    updateRoommateList();
    updatePaidBy();
    updateExpenseList();
    updateStats();

});


/* =========================
   ADD ROOMMATE
   ========================= */

function addRoommate() {

    const input =
        document.getElementById("roommateName");

    const name =
        input.value.trim();


    if (name === "") {

        alert("Please enter a roommate name!");

        return;
    }


    if (roommates.includes(name)) {

        alert("This roommate already exists!");

        return;
    }


    roommates.push(name);

    saveData();

    input.value = "";

    updateRoommateList();
    updatePaidBy();
    updateStats();

}


/* =========================
   REMOVE ROOMMATE
   ========================= */

function removeRoommate(index) {

    const person =
        roommates[index];


    /* Check whether this roommate
       is connected to an expense */

    const usedInExpense =
        expenses.some(
            expense =>
                expense.paidBy === person
        );


    if (usedInExpense) {

        alert(
            `${person} cannot be removed because they have paid an expense. Delete their expense first.`
        );

        return;
    }


    const confirmRemove =
        confirm(
            `Remove ${person} from the roommates list?`
        );


    if (!confirmRemove) {
        return;
    }


    roommates.splice(index, 1);

    saveData();

    updateRoommateList();
    updatePaidBy();
    updateStats();

    resetCalculationDisplay();
}


/* =========================
   UPDATE ROOMMATE LIST
   ========================= */

function updateRoommateList() {

    const list =
        document.getElementById("roommateList");


    if (roommates.length === 0) {

        list.innerHTML = `
            <p class="empty">
                No roommates added yet.
            </p>
        `;

        return;
    }


    list.innerHTML = "";


    roommates.forEach(
        (person, index) => {

            list.innerHTML += `

                <div class="roommate">

                    <div class="person-info">

                        <div class="person-circle">
                            ${person
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <strong>
                            ${person}
                        </strong>

                    </div>


                    <button
                        class="delete-button"
                        onclick="removeRoommate(${index})"
                    >
                        🗑️
                    </button>

                </div>

            `;
        }
    );
}


/* =========================
   UPDATE PAID BY
   ========================= */

function updatePaidBy() {

    const select =
        document.getElementById("paidBy");


    select.innerHTML =
        `<option value="">
            Who paid?
        </option>`;


    roommates.forEach(person => {

        select.innerHTML += `

            <option value="${person}">
                ${person}
            </option>

        `;

    });
}


/* =========================
   ADD EXPENSE
   ========================= */

function addExpense() {

    if (roommates.length < 2) {

        alert(
            "Please add at least 2 roommates!"
        );

        return;
    }


    const title =
        document
            .getElementById("expenseTitle")
            .value
            .trim();


    const amount =
        Number(
            document
                .getElementById("expenseAmount")
                .value
        );


    const paidBy =
        document
            .getElementById("paidBy")
            .value;


    if (
        title === "" ||
        amount <= 0 ||
        paidBy === ""
    ) {

        alert(
            "Please fill all expense details!"
        );

        return;
    }


    expenses.push({

        title: title,

        amount: amount,

        paidBy: paidBy

    });


    saveData();


    document
        .getElementById("expenseTitle")
        .value = "";


    document
        .getElementById("expenseAmount")
        .value = "";


    document
        .getElementById("paidBy")
        .value = "";


    updateExpenseList();
    updateStats();

    resetCalculationDisplay();
}


/* =========================
   REMOVE EXPENSE
   ========================= */

function removeExpense(index) {

    const expense =
        expenses[index];


    const confirmRemove =
        confirm(
            `Delete "${expense.title}"?`
        );


    if (!confirmRemove) {
        return;
    }


    expenses.splice(index, 1);

    saveData();

    updateExpenseList();
    updateStats();

    resetCalculationDisplay();
}


/* =========================
   UPDATE EXPENSE LIST
   ========================= */

function updateExpenseList() {

    const list =
        document.getElementById("expenseList");


    if (expenses.length === 0) {

        list.innerHTML = `
            <p class="empty">
                No expenses added yet.
            </p>
        `;

        return;
    }


    list.innerHTML = "";


    expenses.forEach(
        (expense, index) => {

            list.innerHTML += `

                <div class="expense">

                    <div>

                        <div class="expense-title">
                            ${expense.title}
                        </div>

                        <div class="expense-info">
                            Paid by ${expense.paidBy}
                        </div>

                    </div>


                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:12px;
                        "
                    >

                        <div class="expense-amount">
                            ₹${expense.amount.toFixed(2)}
                        </div>


                        <button
                            class="delete-button"
                            onclick="removeExpense(${index})"
                        >
                            🗑️
                        </button>

                    </div>

                </div>

            `;
        }
    );
}


/* =========================
   CLEAR ALL EXPENSES
   ========================= */

function clearExpenses() {

    if (expenses.length === 0) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to clear all expenses?"
        );


    if (!confirmed) {
        return;
    }


    expenses = [];

    saveData();

    updateExpenseList();
    updateStats();

    resetCalculationDisplay();
}


/* =========================
   UPDATE STATISTICS
   ========================= */

function updateStats() {

    const total =
        expenses.reduce(
            (sum, expense) =>
                sum + expense.amount,
            0
        );


    document.getElementById(
        "totalExpenses"
    ).textContent =
        `₹${total.toFixed(2)}`;


    document.getElementById(
        "totalRoommates"
    ).textContent =
        roommates.length;
}


/* =========================
   CALCULATE SETTLEMENT
   ========================= */

function calculateSettlement() {

    if (roommates.length < 2) {

        alert(
            "Please add at least 2 roommates!"
        );

        return;
    }


    if (expenses.length === 0) {

        alert(
            "Please add at least one expense!"
        );

        return;
    }


    let balances = {};


    roommates.forEach(person => {

        balances[person] = 0;

    });


    expenses.forEach(expense => {

        const share =
            expense.amount /
            roommates.length;


        roommates.forEach(person => {

            balances[person] -=
                share;

        });


        balances[expense.paidBy] +=
            expense.amount;

    });


    showBalances(balances);


    const transactions =
        minimizeTransactions(
            balances
        );


    showSettlement(
        transactions
    );

}


/* =========================
   SHOW BALANCES
   ========================= */

function showBalances(balances) {

    const balanceList =
        document.getElementById(
            "balanceList"
        );


    balanceList.innerHTML = "";


    Object.entries(balances).forEach(
        ([person, balance]) => {

            const roundedBalance =
                Math.round(
                    balance * 100
                ) / 100;


            let status = "";
            let className = "";


            if (roundedBalance > 0.01) {

                status =
                    `Gets ₹${roundedBalance.toFixed(2)}`;

                className = "gets";

            }

            else if (roundedBalance < -0.01) {

                status =
                    `Owes ₹${Math.abs(
                        roundedBalance
                    ).toFixed(2)}`;

                className = "owes";

            }

            else {

                status = "Settled";

            }


            balanceList.innerHTML += `

                <div class="balance">

                    <div class="balance-name">
                        ${person}
                    </div>

                    <div class="${className}">
                        ${status}
                    </div>

                </div>

            `;

        }
    );

}


/* =========================
   MINIMUM TRANSACTION
   ALGORITHM
   ========================= */

function minimizeTransactions(
    balances
) {

    let debtors = [];
    let creditors = [];


    Object.entries(
        balances
    ).forEach(
        ([person, amount]) => {

            amount =
                Math.round(
                    amount * 100
                ) / 100;


            if (amount < -0.01) {

                debtors.push({

                    name: person,

                    amount:
                        Math.abs(amount)

                });

            }


            else if (amount > 0.01) {

                creditors.push({

                    name: person,

                    amount: amount

                });

            }

        }
    );


    let transactions = [];


    let debtorIndex = 0;
    let creditorIndex = 0;


    while (

        debtorIndex <
            debtors.length &&

        creditorIndex <
            creditors.length

    ) {

        const payment =
            Math.min(

                debtors[
                    debtorIndex
                ].amount,

                creditors[
                    creditorIndex
                ].amount

            );


        transactions.push({

            from:
                debtors[
                    debtorIndex
                ].name,

            to:
                creditors[
                    creditorIndex
                ].name,

            amount:
                Math.round(
                    payment * 100
                ) / 100

        });


        debtors[
            debtorIndex
        ].amount -= payment;


        creditors[
            creditorIndex
        ].amount -= payment;


        if (
            debtors[
                debtorIndex
            ].amount < 0.01
        ) {

            debtorIndex++;

        }


        if (
            creditors[
                creditorIndex
            ].amount < 0.01
        ) {

            creditorIndex++;

        }

    }


    return transactions;
}


/* =========================
   SHOW SETTLEMENT
   ========================= */

function showSettlement(
    transactions
) {

    const result =
        document.getElementById(
            "settlementResult"
        );


    document.getElementById(
        "transactionCount"
    ).textContent =
        transactions.length;


    if (
        transactions.length === 0
    ) {

        result.innerHTML = `

            <div class="transaction">

                🎉 Everyone is already settled!

            </div>

        `;

        return;
    }


    result.innerHTML = "";


    transactions.forEach(
        transaction => {

            result.innerHTML += `

                <div class="transaction">

                    <strong>
                        ${transaction.from}
                    </strong>

                    pays

                    <strong>
                        ${transaction.to}
                    </strong>

                    <span class="amount">
                        →
                        ₹${transaction.amount.toFixed(2)}
                    </span>

                </div>

            `;

        }
    );
}


/* =========================
   RESET CALCULATION DISPLAY
   ========================= */

function resetCalculationDisplay() {

    document.getElementById(
        "balanceList"
    ).innerHTML = `

        <p class="empty">
            Add expenses to calculate balances.
        </p>

    `;


    document.getElementById(
        "settlementResult"
    ).innerHTML = `

        <div class="empty settlement-empty">

            Add expenses and click
            <b>Calculate</b>
            to generate the optimal
            settlement plan.

        </div>

    `;


    document.getElementById(
        "transactionCount"
    ).textContent = "0";
}