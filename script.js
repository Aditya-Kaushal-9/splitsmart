/* =========================================================
   SPLITSMART
   Roommate Expense Tracker
   Frontend + Flask Backend + SQLite
   ========================================================= */


/* =========================
   BACKEND URL
   ========================= */

const API_URL =
    "https://splitsmart-1-8wbx.onrender.com/api";


/* =========================
   APPLICATION DATA
   ========================= */

let roommates = [];
let expenses = [];


/* =========================
   CATEGORY SELECTOR
   ========================= */

function selectExpenseCategory(category) {

    const expenseTitle =
        document.getElementById("expenseTitle");

    if (!expenseTitle) {
        return;
    }

    expenseTitle.value = category;

    expenseTitle.focus();
}


/* =========================
   CATEGORY SLIDER
   ========================= */

function slideCategories(distance) {

    const slider =
        document.getElementById("categoryScroll");

    if (!slider) {
        return;
    }

    slider.scrollBy({
        left: distance,
        behavior: "smooth"
    });
}


/* =========================
   PAGE STARTUP
   ========================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await loadRoommates();

        await loadExpenses();

        updatePaidBy();

        updateStats();

    }
);


/* =========================
   LOAD ROOMMATES
   ========================= */

async function loadRoommates() {

    try {

        const response =
            await fetch(
                `${API_URL}/roommates`
            );


        if (!response.ok) {

            throw new Error(
                "Could not load roommates."
            );

        }


        roommates =
            await response.json();


        updateRoommateList();

        updatePaidBy();

        updateStats();


    } catch (error) {

        console.error(
            "Load roommates error:",
            error
        );


        const list =
            document.getElementById(
                "roommateList"
            );


        if (list) {

            list.innerHTML = `
                <p class="empty">
                    Could not load roommates.
                </p>
            `;

        }

    }
}


/* =========================
   LOAD EXPENSES
   ========================= */

async function loadExpenses() {

    try {

        const response =
            await fetch(
                `${API_URL}/expenses`
            );


        if (!response.ok) {

            throw new Error(
                "Could not load expenses."
            );

        }


        expenses =
            await response.json();


        updateExpenseList();

        updateStats();


    } catch (error) {

        console.error(
            "Load expenses error:",
            error
        );


        const list =
            document.getElementById(
                "expenseList"
            );


        if (list) {

            list.innerHTML = `
                <p class="empty">
                    Could not load expenses.
                </p>
            `;

        }

    }
}


/* =========================
   ADD ROOMMATE
   ========================= */

async function addRoommate() {

    const input =
        document.getElementById(
            "roommateName"
        );


    if (!input) {
        return;
    }


    const name =
        input.value.trim();


    if (name === "") {

        alert(
            "Please enter a roommate name."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/roommates`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name: name
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Could not add roommate."
            );

            return;
        }


        input.value = "";


        await loadRoommates();


    } catch (error) {

        console.error(
            "Add roommate error:",
            error
        );


        alert(
            "Could not connect to the SplitSmart backend."
        );

    }

}


/* =========================
   REMOVE ROOMMATE
   ========================= */

async function removeRoommate(index) {

    const person =
        roommates[index];


    if (!person) {
        return;
    }


    const confirmed =
        confirm(
            `Remove ${person.name} from the roommates list?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/roommates/${person.id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Could not remove roommate."
            );

            return;
        }


        await loadRoommates();

        await loadExpenses();

        resetCalculationDisplay();


    } catch (error) {

        console.error(
            "Remove roommate error:",
            error
        );


        alert(
            "Could not connect to the SplitSmart backend."
        );

    }

}


/* =========================
   UPDATE ROOMMATE LIST
   ========================= */

function updateRoommateList() {

    const list =
        document.getElementById(
            "roommateList"
        );


    if (!list) {
        return;
    }


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

            const safeName =
                String(person.name)
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");


            list.innerHTML += `

                <div class="roommate">

                    <div class="person-info">

                        <div class="person-circle">

                            ${safeName
                                .charAt(0)
                                .toUpperCase()}

                        </div>

                        <strong>
                            ${safeName}
                        </strong>

                    </div>


                    <button
                        type="button"
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
   UPDATE PAID-BY DROPDOWN
   ========================= */

function updatePaidBy() {

    const select =
        document.getElementById(
            "paidBy"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Who paid?
        </option>
    `;


    roommates.forEach(
        person => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                person.id;


            option.textContent =
                person.name;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================
   ADD EXPENSE
   ========================= */

async function addExpense() {

    if (roommates.length < 2) {

        alert(
            "Please add at least 2 roommates!"
        );

        return;
    }


    const titleInput =
        document.getElementById(
            "expenseTitle"
        );


    const amountInput =
        document.getElementById(
            "expenseAmount"
        );


    const paidByInput =
        document.getElementById(
            "paidBy"
        );


    if (
        !titleInput ||
        !amountInput ||
        !paidByInput
    ) {

        return;

    }


    const title =
        titleInput.value.trim();


    const amount =
        Number(
            amountInput.value
        );


    const paidBy =
        Number(
            paidByInput.value
        );


    if (
        title === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !paidBy
    ) {

        alert(
            "Please fill all expense details correctly."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/expenses`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title:
                            title,

                        amount:
                            amount,

                        paidBy:
                            paidBy

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Could not add expense."
            );

            return;
        }


        titleInput.value = "";

        amountInput.value = "";

        paidByInput.value = "";


        await loadExpenses();


        resetCalculationDisplay();


    } catch (error) {

        console.error(
            "Add expense error:",
            error
        );


        alert(
            "Could not connect to the SplitSmart backend."
        );

    }

}


/* =========================
   REMOVE EXPENSE
   ========================= */

async function removeExpense(index) {

    const expense =
        expenses[index];


    if (!expense) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${expense.title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/expenses/${expense.id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Could not delete expense."
            );

            return;
        }


        await loadExpenses();


        resetCalculationDisplay();


    } catch (error) {

        console.error(
            "Remove expense error:",
            error
        );


        alert(
            "Could not connect to the SplitSmart backend."
        );

    }

}


/* =========================
   UPDATE EXPENSE LIST
   ========================= */

function updateExpenseList() {

    const list =
        document.getElementById(
            "expenseList"
        );


    if (!list) {
        return;
    }


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

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "expense";


            const info =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "expense-title";


            title.textContent =
                expense.title;


            const payer =
                document.createElement(
                    "div"
                );


            payer.className =
                "expense-info";


            payer.textContent =
                `Paid by ${expense.payer}`;


            info.appendChild(title);

            info.appendChild(payer);


            const right =
                document.createElement(
                    "div"
                );


            right.style.display =
                "flex";

            right.style.alignItems =
                "center";

            right.style.gap =
                "12px";


            const amount =
                document.createElement(
                    "div"
                );


            amount.className =
                "expense-amount";


            amount.textContent =
                `₹${Number(
                    expense.amount
                ).toFixed(2)}`;


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "delete-button";


            deleteButton.textContent =
                "🗑️";


            deleteButton.addEventListener(
                "click",
                function () {
                    removeExpense(index);
                }
            );


            right.appendChild(amount);

            right.appendChild(deleteButton);


            row.appendChild(info);

            row.appendChild(right);


            list.appendChild(row);

        }
    );

}


/* =========================
   CLEAR ALL EXPENSES
   ========================= */

async function clearExpenses() {

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


    try {

        for (
            const expense
            of [...expenses]
        ) {

            const response =
                await fetch(
                    `${API_URL}/expenses/${expense.id}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!response.ok) {

                console.error(
                    `Could not delete expense ${expense.id}`
                );

            }

        }


        await loadExpenses();

        resetCalculationDisplay();


    } catch (error) {

        console.error(
            "Clear expenses error:",
            error
        );


        alert(
            "Could not clear all expenses."
        );

    }

}


/* =========================
   UPDATE STATISTICS
   ========================= */

function updateStats() {

    const total =
        expenses.reduce(
            (sum, expense) =>
                sum +
                Number(expense.amount),
            0
        );


    const totalExpenses =
        document.getElementById(
            "totalExpenses"
        );


    const totalRoommates =
        document.getElementById(
            "totalRoommates"
        );


    if (totalExpenses) {

        totalExpenses.textContent =
            `₹${total.toFixed(2)}`;

    }


    if (totalRoommates) {

        totalRoommates.textContent =
            roommates.length;

    }

}


/* =========================
   CALCULATE SETTLEMENT
   ========================= */

async function calculateSettlement() {

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


    try {

        const response =
            await fetch(
                `${API_URL}/settle`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not calculate settlement."
            );

        }


        await loadBalances();


        showSettlement(
            data.transactions || []
        );


    } catch (error) {

        console.error(
            "Calculate settlement error:",
            error
        );


        alert(
            "Could not calculate settlement from the backend."
        );

    }

}


/* =========================
   LOAD BALANCES
   ========================= */

async function loadBalances() {

    try {

        const response =
            await fetch(
                `${API_URL}/balances`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not load balances."
            );

        }


        showBalances(data);


    } catch (error) {

        console.error(
            "Load balances error:",
            error
        );


        alert(
            "Could not load balances."
        );

    }

}


/* =========================
   SHOW BALANCES
   ========================= */

function showBalances(balances) {

    const balanceList =
        document.getElementById(
            "balanceList"
        );


    if (!balanceList) {
        return;
    }


    balanceList.innerHTML = "";


    Object.entries(
        balances
    ).forEach(
        ([person, balance]) => {

            const roundedBalance =
                Math.round(
                    Number(balance) * 100
                ) / 100;


            let status = "";

            let className = "";


            if (roundedBalance > 0.01) {

                status =
                    `Gets ₹${roundedBalance.toFixed(2)}`;

                className =
                    "gets";

            }

            else if (
                roundedBalance < -0.01
            ) {

                status =
                    `Owes ₹${Math.abs(
                        roundedBalance
                    ).toFixed(2)}`;

                className =
                    "owes";

            }

            else {

                status =
                    "Settled";

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
   SHOW SETTLEMENT
   ========================= */

function showSettlement(
    transactions
) {

    const result =
        document.getElementById(
            "settlementResult"
        );


    const transactionCount =
        document.getElementById(
            "transactionCount"
        );


    if (!result) {
        return;
    }


    if (transactionCount) {

        transactionCount.textContent =
            transactions.length;

    }


    if (
        !transactions ||
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
                        ₹${Number(
                            transaction.amount
                        ).toFixed(2)}

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

    const balanceList =
        document.getElementById(
            "balanceList"
        );


    const settlementResult =
        document.getElementById(
            "settlementResult"
        );


    const transactionCount =
        document.getElementById(
            "transactionCount"
        );


    if (balanceList) {

        balanceList.innerHTML = `

            <p class="empty">

                Add expenses to calculate balances.

            </p>

        `;

    }


    if (settlementResult) {

        settlementResult.innerHTML = `

            <div class="empty settlement-empty">

                Add expenses and click
                <b>Calculate</b>
                to generate the optimal
                settlement plan.

            </div>

        `;

    }


    if (transactionCount) {

        transactionCount.textContent =
            "0";

    }

}