"use strict";

// Data

const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-05-27T17:01:17.194Z',
    '2020-07-11T23:36:17.929Z',
    '2020-07-12T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const numLogoutTime = 300_000;

const arrayDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", 
    "Friday", "Saturday"];

const arrayMonths = ['January', "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"];

const accounts = [account1, account2];

let timeoutLogout;
let intervalTimer;

// Elements
const body = document.querySelector("body");
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

console.log("Welcome to Bankist, a minimalist Banking application!");

// CREATING DOM ELEMENTS

let currentAccount = null;
let beginSortEvent;

const displayMovements = function(movementsArray, sorted=false, sortString)
{
    containerMovements.innerHTML = '';
    const sortMovementsArrayFunction = sortString === "ascend" ? 
        (currentMovementNumber, nextMovementNumber) => 
            nextMovementNumber - currentMovementNumber :
        (currentMovementNumber, nextMovementNumber) => 
            currentMovementNumber - nextMovementNumber;

    const displayArray = 
    sorted ? movementsArray.slice(0).sort(sortMovementsArrayFunction) : 
        [...movementsArray];
    
    currentAccount.arrayMovementTimes = null;
    currentAccount.arrayMovementTimes = currentAccount.movementDateArray
        .map(funcGenerateAddTimestampFunction());

    let currencyOptions = 
    {
        "style": "currency", 
        "currency": currentAccount.currency
    };

    let dateFormatter = Intl.DateTimeFormat(currentAccount.locale);

    displayArray.forEach((movementNumber, index) => 
    {  
        
        let outputTime = currentAccount.arrayMovementTimes[index];
        if (outputTime === 1)
        {
            outputTime = "yesterday.";
        }
        else if (outputTime === 0)
        {
            outputTime = "today.";
        }
        else 
        {
            outputTime = 
            `${dateFormatter.format(currentAccount.movementDateArray[index])}`;
        }
        let movementTypeString = movementNumber > 0 ? "deposit" : "withdrawal";
        const htmlTemplateString = `
        <div class="movements__row">
            <div class="movements__type movements__type--${movementTypeString}"`
            + `>${index + 1} ${movementTypeString}</div>
            <div class="movements__date">${outputTime}</div> 
            <div class="movements__value">${currentAccount.numFormatter
                .format(movementNumber.toFixed(2))}</div>
        </div>
        `;
        containerMovements.insertAdjacentHTML("afterbegin", htmlTemplateString);
    });
};

const mapOwnerToUsername = function(accountObject, indexNumber)
{
    const ownerString = accountObject.owner.toLowerCase();
    const wordArray = ownerString.split(" ");

    const mapWordToFirstLetter = (word) => word[0];
    const firstLetterArray = wordArray.map(mapWordToFirstLetter);

    const usernameString = firstLetterArray.join("");
    accountObject["username"] = usernameString;
    return usernameString;
};

const usernameArray = accounts.map(mapOwnerToUsername);
console.log(usernameArray);

// CALCULATE ACCOUNT BALANCE 

const calculateAccountBalance = 
    (accountBalance, movementNumber) => accountBalance += movementNumber;

const generateAccountBalance = function(account)
{
    const totalBalanceNumber = 
        account.movements.reduce(calculateAccountBalance);
    account.balance = totalBalanceNumber;
};

// CALCULATE ACCOUNT SUMMARY 

const filterForDeposits = (movementNumber) => 
    movementNumber > 0;

const filterForWithdrawals = (movementNumber) => 
    movementNumber < 0;

const calculateInterests = function(depositNumber)
{
    return depositNumber * (currentAccount.interestRate / 100);
};

const filterInterestsByOne = (interestNumber) => 
    interestNumber > 1;

const calculateMovementSum = (movementSumNumber, movementNumber) => 
    movementSumNumber += movementNumber;

const calculateInterestsSum = (interestSumNumber, interestNumber) => 
    interestSumNumber += interestNumber;

const calculateAccountSummaries = function(account)
{
    const accountDepositTotalNumber = 
        account.movements.filter(filterForDeposits)
            .reduce(calculateMovementSum, 0);

    const accountWithdrawalTotalNumber = 
        account.movements.filter(filterForWithdrawals)
            .reduce(calculateMovementSum, 0);

    account.calculateInterests = calculateInterests.bind(account);

    const interestsTotalNumber = account.movements.filter(filterForDeposits)
        .map(calculateInterests).filter(filterInterestsByOne)
        .reduce(calculateInterestsSum, 0);

    account.interestTotal = interestsTotalNumber;
    account.depositTotal = accountDepositTotalNumber;
    account.withdrawalTotal = accountWithdrawalTotalNumber;
};

// IMPLEMENT LOGIN PAGE

const generateFields = function()
{
    displayMovements(currentAccount.movements);
    generateAccountBalance(currentAccount);
    labelBalance.textContent = `${currentAccount.numFormatter
        .format(currentAccount.balance.toFixed(2))}`;

    calculateAccountSummaries(currentAccount);
    labelSumIn.textContent = 
        currentAccount.numFormatter.format(currentAccount.depositTotal.toFixed(2));
    labelSumOut.textContent = currentAccount.numFormatter.format(
        Math.abs(currentAccount.withdrawalTotal.toFixed(2)));

    labelSumInterest.textContent = currentAccount.numFormatter.format(
        currentAccount.interestTotal.toFixed(2));

    inputLoginUsername.value = inputLoginPin.value = "";
    inputLoginUsername.blur();
    inputLoginPin.blur();

    let dateCurrent = new Date();

    const optionsObj = 
    {
        "hour": "numeric",
        "minute": "numeric", 
        "day": "numeric", 
        "month": "long", 
        "year": "2-digit", 
        "weekday": "short"
    };

    // We can receive our language code with navigator.language.
    const locale = navigator.language;

    let intlFormatter = 
        new Intl.DateTimeFormat(currentAccount.locale, optionsObj);

    labelDate.textContent = intlFormatter.format(dateCurrent);

    const generateSortEventFunction = function()
    {
        let sortString = "ascend";
        return function(event)
        {
            event.preventDefault();
            resetTimer();
            displayMovements(currentAccount.movements, true, sortString);
            sortString = sortString === "ascend" ? "descend" : "ascend";
        }
    }

    beginSortEvent = generateSortEventFunction();

    btnSort.addEventListener("click", beginSortEvent);

    labelWelcome.textContent = `Welcome ${currentAccount.owner.split(" ")[0]}!`;
    containerApp.style["opacity"] = 1;
};

const logoutCurrentUser = function()
{
    clearInterval(intervalTimer);
    clearTimeout(timeoutLogout);
    currentAccount = null;
    containerApp.style["opacity"] = 0;
    containerMovements.innerHTML = "";
    labelWelcome.textContent = "";
    labelBalance.textContent = "";
    labelSumIn.textContent = "";
    labelSumInterest.textContent = "";
    labelSumInterest.textContent = "";
};

const signinUser = function(event)
{
    event.preventDefault();
    clearInterval(intervalTimer);
    clearTimeout(timeoutLogout);
    const usernameString = inputLoginUsername.value;
    const passwordString = !isNaN(inputLoginPin.value) ? 
        + (inputLoginPin.value) : "";
    const findAccountByUsername = 
        (account) => account.username === usernameString;

    const accountChecked = accounts.find(findAccountByUsername);

    if (passwordString === accountChecked?.pin)
    {
        console.log("Logging in.");
        currentAccount = accountChecked;
        generateFields();
        beginLogoutTimer();
    }
    else 
    {
        console.log("Invalid credentials.");
    }
};

btnLogin.addEventListener("click", signinUser);
accounts.forEach((account) => console.log(account));

// IMPLEMENTING TRANSFERS

const transferFunds = function(transferAccountString, amountNumber)
{
    const funcImplTransfer = function()
    {    
        const findAccountByUsername = 
            (account) => account.username === transferAccountString;

        const transferAccount = accounts.find(findAccountByUsername);
        console.log(transferAccount);

        if (amountNumber > 0 && transferAccount)
        {
            this.movements.push(0 - amountNumber);
            this.movementDateArray.push(new Date());
            transferAccount.movements.push(amountNumber);
            transferAccount.movementDateArray.push(new Date());
            generateFields();
        }
        else 
        {
            console.log("Error: Invalid transfer.");
        }
    };

    setTimeout(function()
    {
        funcImplTransfer.call(currentAccount)
    }, 5000);
    
};

const beginTransferEvent = function(event)
{
    event.preventDefault();
    resetTimer();
    const usernameString = inputTransferTo.value;
    const amountNumber = +(inputTransferAmount.value);
    
    inputTransferTo.value = inputTransferAmount.value = "";

    inputTransferTo.blur();
    inputTransferAmount.blur();

    if (!usernameString || usernameString === currentAccount.username || 
        !amountNumber || amountNumber > currentAccount.balance)
    {
        console.log("Error, invalid transfer.")
    }
    else 
    { 
        transferFunds.call(currentAccount, usernameString, amountNumber);
    }
};

btnTransfer.addEventListener("click", beginTransferEvent);

// CLOSING ACCOUNTS 

const closeAccountEvent = function(event)
{
    event.preventDefault();
    resetTimer();

    const inputUsernameString = inputCloseUsername.value;
    const inputPasswordString = inputClosePin.value;

    const findAccountIndex = 
        (account) => account === currentAccount 
            && account.username === inputUsernameString 
            && account.pin === + inputPasswordString;

    const accountIndex = accounts.findIndex(findAccountIndex);

    if (accountIndex > -1)
    {
        accounts.splice(accountIndex, 1);
        console.log(accounts);
        logoutCurrentUser();
    }  
    else 
    {
        console.log("Cannot delete account.");
    }

    inputCloseUsername.value = inputClosePin.value = "";
    inputClosePin.blur();
    inputCloseUsername.blur();
};

btnClose.addEventListener("click", closeAccountEvent);

// IMPLEMENTING LOAN 

function beginLoanEvent(event)
{
    event.preventDefault();
    resetTimer();
    const numRequest = Math.floor(inputLoanAmount.value);

    function funcImplLoan(requestedLoanNumber)
    {
        if (requestedLoanNumber && requestedLoanNumber > 0)
        {
        const anyDepositGreaterThanLoan = (movementNumber) => 
            movementNumber >= requestedLoanNumber / 10;
        
        const hasHighDeposit = 
            currentAccount.movements.some(anyDepositGreaterThanLoan);
        
        if (hasHighDeposit)
        {
            currentAccount.movements.push(requestedLoanNumber);
            currentAccount.movementDateArray.push(new Date());
            generateFields();
        }
        else 
        {
            console.log("Error: Insufficient funds.");
        }
        }
        else 
        {
            console.log("Error requesting loan.");
        }
        inputLoanAmount.value = "";
        inputLoanAmount.blur();
    }
    setTimeout(funcImplLoan, 3000, numRequest);
}

btnLoan.addEventListener("click", beginLoanEvent);


// CREATING DATES FOR ACCOUNTS

const funcParseDateStringIntoDateObjectForAccounts = 
    function(accountObj, indexNum)
{
    const funcParseStringIntoDate = (strDate) =>
        new Date(strDate);

    accountObj["movementDateArray"] = 
        accountObj.movementsDates.map(funcParseStringIntoDate);
};

accounts.forEach(funcParseDateStringIntoDateObjectForAccounts);

// IMPLEMENTING ACCURATE TIMESTAMPS 

function funcGenerateAddTimestampFunction()
{
    return function(dateValue, indexNum, arrayDates)
    {
        let timeMovement = dateValue.getTime();
        let currentDate = Date.now();
        let timeDifference = currentDate - timeMovement;
        return Math.floor(timeDifference / 1000 / 60 / 60 / 24);
    }
};

accounts.forEach((accountObj, indexNum) => 
{
    let arrayMovementTimeDifferences = accountObj.movementDateArray
        .map(funcGenerateAddTimestampFunction());

    accountObj.arrayMovementTimes = arrayMovementTimeDifferences;
});

// GENERATE NUMBER FORMATTER FOR ACCOUNTS 

accounts.forEach((accountObj) => 
{
    let formatNumOptions = 
    {
        "style": "currency", 
        "currency": accountObj.currency
    };
    accountObj.numFormatter = 
        Intl.NumberFormat(accountObj.locale, formatNumOptions);
});

// IMPLEMENT LOGOUT TIMER 

function beginLogoutTimer()
{
    let timeStart = Date.now();
    let timeFuture = timeStart + (60000 * 5);

    function funcUpdateTimer()
    {
        let timeCurrent = Date.now();
        let timeRemaining = (timeFuture - timeCurrent) / 1000;

        let timeMinutes = Math.floor(timeRemaining / 60);
        let timeSeconds = Math.round(timeRemaining % 60);

        labelTimer.textContent = `${String(timeMinutes).padStart(2, "0")}`
        + `:${String(timeSeconds).padStart(2, "0")}`;
    };

    intervalTimer = setInterval(funcUpdateTimer, 1000);
    timeoutLogout = setTimeout(() => 
    {
        logoutCurrentUser();
    }, numLogoutTime);
}

// RESET TIMER 

function resetTimer()
{
    console.log(intervalTimer);
    console.log('Clearing timer...');

    intervalTimer != undefined ? clearInterval(intervalTimer) : null;
    timeoutLogout != undefined ? clearTimeout(timeoutLogout) : null;
    beginLogoutTimer();
}