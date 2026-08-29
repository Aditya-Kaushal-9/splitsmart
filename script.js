/* =========================================================
   SPLITSMART
   Roommate Expense Tracker
   Frontend + Flask Backend + SQLite
   ========================================================= */


/* =========================================================
   BACKEND URL
   ========================================================= */

const API_URL =
    "https://splitsmart-1-8wbx.onrender.com/api";


/* =========================================================
   APPLICATION DATA
   ========================================================= */

let roommates = [];
let expenses = [];


/* =========================================================
   CURRENT SELECTED CATEGORY
   ========================================================= */

let selectedCategory = "Other";


/* =========================================================
   EXPENSE CATEGORY SELECTOR
   ========================================================= */

function selectExpenseCategory(category) {

    const expenseTitle =
        document.getElementById("expenseTitle");

    if (!expenseTitle) {
        return;
    }

    /* Store selected category */
    selectedCategory = category;

    /* Put category into expense name */
    expenseTitle.value = category;

    /* Remove previous selection */
    document
        .querySelectorAll(".category")
        .forEach(button => {
            button.classList.remove("selected");
        });

    /* Highlight selected category */
    document
        .querySelectorAll(".category")
        .forEach(button => {

            if (
                button.dataset.category === category
            ) {
                button.classList.add("selected");
            }

        });

    expenseTitle.focus();
}


/* =========================================================
   CATEGORY SLIDER
   ========================================================= */

function slideCategories(distance) {

    const slider =
        document.getElementById(
            "categoryScroll"
        );

    if (!slider) {
        return;
    }

    slider.scrollBy({
        left: distance,
        behavior: "smooth"
    });
}


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        setupCategoryButtons();

        await loadRoommates();

        await loadExpenses();

        updatePaidBy();

        updateStats();

        updateAnalytics();

    }
);


/* =========================================================
   CATEGORY BUTTON SETUP
   ========================================================= */

function setupCategoryButtons() {

    const buttons =
        document.querySelectorAll(
            ".category"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const category =
                    button.dataset.category;

                if (category) {

                    selectExpenseCategory(
                        category
                    );

                }

            }
        );

    });
}


/* =========================================================
   LOAD ROOMMATES
   ========================================================= */

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

        const data =
            await response.json();

        roommates =
            Array.isArray(data)
                ? data
                : [];

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


/* =========================================================
   LOAD EXPENSES
   ========================================================= */

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

        const data =
            await response.json();

        expenses =
            Array.isArray(data)
                ? data
                : [];

        updateExpenseList();

        updateStats();

        updateAnalytics();

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


/* =========================================================
   ADD ROOMMATE
   ========================================================= */

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

        input.focus();

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


/* =========================================================
   REMOVE ROOMMATE
   ========================================================= */

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


/* =========================================================
   UPDATE ROOMMATE LIST
   ========================================================= */

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

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "roommate";


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "person-info";


            const circle =
                document.createElement(
                    "div"
                );

            circle.className =
                "person-circle";

            circle.textContent =
                String(person.name)
                    .charAt(0)
                    .toUpperCase();


            const name =
                document.createElement(
                    "strong"
                );

            name.textContent =
                person.name;


            info.appendChild(circle);

            info.appendChild(name);


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

                    removeRoommate(index);

                }
            );


            row.appendChild(info);

            row.appendChild(deleteButton);

            list.appendChild(row);

        }
    );
}


/* =========================================================
   UPDATE PAID-BY DROPDOWN
   ========================================================= */

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
                String(person.id);

            option.textContent =
                person.name;

            select.appendChild(option);

        }
    );
}


/* =========================================================
   ADD EXPENSE
   ========================================================= */

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

        console.error(
            "Expense form elements are missing."
        );

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


    /*
     * Make sure a category is available.
     * If the user didn't select one,
     * use Other.
     */

    const category =
        selectedCategory || "Other";


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

                        category:
                            category,

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


        /* Clear form */

        titleInput.value = "";

        amountInput.value = "";

        paidByInput.value = "";


        /* Clear selected category */

        document
            .querySelectorAll(".category")
            .forEach(button => {

                button.classList.remove(
                    "selected"
                );

            });


        selectedCategory =
            "Other";


        /* Reload from backend */

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


/* =========================================================
   REMOVE EXPENSE
   ========================================================= */

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


/* =========================================================
   UPDATE EXPENSE LIST
   ========================================================= */

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


            const category =
                document.createElement(
                    "div"
                );

            category.className =
                "expense-info";

            category.textContent =
                `${expense.category || "Other"} • Paid by ${expense.payer}`;


            info.appendChild(title);

            info.appendChild(category);


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

            right.appendChild(
                deleteButton
            );


            row.appendChild(info);

            row.appendChild(right);


            list.appendChild(row);

        }
    );
}


/* =========================================================
   CLEAR EXPENSES
   ========================================================= */

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

        const expensesToDelete =
            [...expenses];


        for (
            const expense
            of expensesToDelete
        ) {

            await fetch(
                `${API_URL}/expenses/${expense.id}`,
                {
                    method: "DELETE"
                }
            );

        }


        await loadExpenses();

        resetCalculationDisplay();


    } catch (error) {

        console.error(
            "Clear expenses error:",
            error
        );


        alert(
            "Could not clear expenses."
        );

    }
}


/* =========================================================
   UPDATE STATISTICS
   ========================================================= */

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


/* =========================================================
   SPENDING ANALYTICS
   ========================================================= */

function updateAnalytics() {

    const analyticsTotal =
        document.getElementById(
            "analyticsTotal"
        );


    const analyticsAverage =
        document.getElementById(
            "analyticsAverage"
        );


    const analyticsCount =
        document.getElementById(
            "analyticsCount"
        );


    const categoryStats =
        document.getElementById(
            "categoryStats"
        );


    const categoryChart =
        document.getElementById(
            "categoryChart"
        );


    if (
        !analyticsTotal ||
        !analyticsAverage ||
        !analyticsCount ||
        !categoryStats ||
        !categoryChart
    ) {

        return;
    }


    const total =
        expenses.reduce(
            (sum, expense) =>
                sum +
                Number(expense.amount),
            0
        );


    const count =
        expenses.length;


    const average =
        count > 0
            ? total / count
            : 0;


    analyticsTotal.textContent =
        `₹${total.toFixed(2)}`;


    analyticsAverage.textContent =
        `₹${average.toFixed(2)}`;


    analyticsCount.textContent =
        count;


    if (expenses.length === 0) {

        categoryStats.innerHTML = `
            <p class="empty">
                Add expenses to see
                category analytics.
            </p>
        `;


        categoryChart.innerHTML = `
            <p class="empty">
                No data yet.
            </p>
        `;


        return;
    }


    /* Group by real category */

    const categoryTotals = {};


    expenses.forEach(
        expense => {

            const category =
                expense.category ||
                "Other";


            const amount =
                Number(
                    expense.amount
                ) || 0;


            categoryTotals[category] =
                (
                    categoryTotals[category]
                    || 0
                ) + amount;

        }
    );


    const entries =
        Object.entries(
            categoryTotals
        ).sort(
            (a, b) =>
                b[1] - a[1]
        );


    const maxAmount =
        entries.length > 0
            ? entries[0][1]
            : 1;


    categoryStats.innerHTML = "";

    categoryChart.innerHTML = "";


    entries.forEach(
        ([category, amount]) => {

            const percentage =
                maxAmount > 0
                    ? (
                        amount /
                        maxAmount
                    ) * 100
                    : 0;


            /* Category statistics */

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "analytics-row";


            row.innerHTML = `

                <div class="analytics-row-top">

                    <span>
                        ${category}
                    </span>

                    <strong>
                        ₹${amount.toFixed(2)}
                    </strong>

                </div>

                <div class="analytics-progress">

                    <div
                        class="analytics-progress-fill"
                        style="width:${percentage}%"
                    ></div>

                </div>

            `;


            categoryStats.appendChild(
                row
            );


            /* Chart */

            const chartItem =
                document.createElement(
                    "div"
                );

            chartItem.className =
                "chart-item";


            chartItem.innerHTML = `

                <div class="chart-label">
                    ${category}
                </div>

                <div class="chart-bar">

                    <div
                        class="chart-bar-fill"
                        style="width:${percentage}%"
                    ></div>

                </div>

            `;


            categoryChart.appendChild(
                chartItem
            );

        }
    );
}


/* =========================================================
   CALCULATE SETTLEMENT
   ========================================================= */

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


        updatePaymentList(
            data.transactions || []
        );


    } catch (error) {

        console.error(
            "Settlement error:",
            error
        );


        alert(
            "Could not calculate settlement from the backend."
        );

    }
}


/* =========================================================
   LOAD BALANCES
   ========================================================= */

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


/* =========================================================
   SHOW BALANCES
   ========================================================= */

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
        balances || {}
    ).forEach(
        ([person, balance]) => {

            const roundedBalance =
                Math.round(
                    Number(balance) * 100
                ) / 100;


            let status =
                "Settled";


            let className =
                "";


            if (
                roundedBalance >
                0.01
            ) {

                status =
                    `Gets ₹${roundedBalance.toFixed(2)}`;

                className =
                    "gets";

            }

            else if (
                roundedBalance <
                -0.01
            ) {

                status =
                    `Owes ₹${Math.abs(
                        roundedBalance
                    ).toFixed(2)}`;

                className =
                    "owes";

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


/* =========================================================
   SHOW SETTLEMENT
   ========================================================= */

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


    const safeTransactions =
        Array.isArray(
            transactions
        )
            ? transactions
            : [];


    if (transactionCount) {

        transactionCount.textContent =
            safeTransactions.length;

    }


    if (
        safeTransactions.length === 0
    ) {

        result.innerHTML = `

            <div class="transaction">

                🎉 Everyone is already settled!

            </div>

        `;

        return;
    }


    result.innerHTML = "";


    safeTransactions.forEach(
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


/* =========================================================
   UPI PAYMENT LIST
   ========================================================= */

function updatePaymentList(
    transactions
) {

    const paymentList =
        document.getElementById(
            "paymentList"
        );


    if (!paymentList) {
        return;
    }


    const safeTransactions =
        Array.isArray(
            transactions
        )
            ? transactions
            : [];


    if (
        safeTransactions.length === 0
    ) {

        paymentList.innerHTML = `
            <p class="empty">
                No payments required.
            </p>
        `;

        return;
    }


    paymentList.innerHTML = "";


    safeTransactions.forEach(
        transaction => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "payment-row";


            const text =
                document.createElement(
                    "div"
                );


            text.innerHTML = `

                <strong>
                    ${transaction.from}
                </strong>

                owes

                <strong>
                    ${transaction.to}
                </strong>

                <br>

                <span>
                    ₹${Number(
                        transaction.amount
                    ).toFixed(2)}
                </span>

            `;


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "upi-button";


            button.textContent =
                "Pay via UPI";


            button.addEventListener(
                "click",
                function () {

                    const amount =
                        Number(
                            transaction.amount
                        ).toFixed(2);


                    alert(
                        `UPI payment of ₹${amount} to ${transaction.to} can be initiated here.`
                    );

                }
            );


            row.appendChild(text);

            row.appendChild(button);


            paymentList.appendChild(row);

        }
    );
}


/* =========================================================
   RESET CALCULATION DISPLAY
   ========================================================= */

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


    const paymentList =
        document.getElementById(
            "paymentList"
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


    if (paymentList) {

        paymentList.innerHTML = `

            <p class="empty">

                Settlement payments will appear here.

            </p>

        `;

    }


    if (transactionCount) {

        transactionCount.textContent =
            "0";

    }

}