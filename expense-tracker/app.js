// Group Expense Tracker - Main JavaScript

// ==============================================
// Data Storage (using LocalStorage for persistence)
// ==============================================
const STORAGE_KEYS = {
    GROUPS: 'groupExpenseGroups',
    EXPENSES: 'groupExpenseExpenses',
    SETTINGS: 'groupExpenseSettings'
};

// Initialize data if not exists
if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify([]));
}
if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
}
if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
        defaultCurrency: 'INR',
        notificationPreferences: {
            email: false,
            whatsapp: true
        }
    }));
}

// ==============================================
// Utility Functions
// ==============================================
const utils = {
    formatCurrency: (amount, currency = 'INR') => {
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        });
        return formatter.format(amount);
    },

    getCurrencySymbol: (currency) => {
        const symbols = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥'
        };
        return symbols[currency] || '₹';
    },

    // Simple exchange rates (for demo purposes)
    getExchangeRate: (fromCurrency, toCurrency) => {
        const rates = {
            'INR': { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.009, 'JPY': 1.67 },
            'USD': { 'INR': 83.33, 'EUR': 0.92, 'GBP': 0.78, 'JPY': 139.85 },
            'EUR': { 'INR': 91.67, 'USD': 1.09, 'GBP': 0.85, 'JPY': 151.77 },
            'GBP': { 'INR': 111.11, 'USD': 1.28, 'EUR': 1.18, 'JPY': 165.35 },
            'JPY': { 'INR': 0.598, 'USD': 0.00715, 'EUR': 0.0066, 'GBP': 0.00605 }
        };
        
        return rates[fromCurrency]?.[toCurrency] || 1; // Default to 1 if no rate found
    },

    convertCurrency: (amount, fromCurrency, toCurrency) => {
        const rate = utils.getExchangeRate(fromCurrency, toCurrency);
        return amount * rate;
    }
};

// ==============================================
// DOM Elements
// ==============================================
const DOM = {
    // Tabs
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Groups Tab
    groupsList: document.getElementById('groups-list'),
    emptyGroups: document.getElementById('empty-groups'),
    createGroupBtn: document.getElementById('create-group-btn'),
    createGroupModal: document.getElementById('create-group-modal'),
    groupForm: document.getElementById('group-form'),
    groupName: document.getElementById('group-name'),
    groupDescription: document.getElementById('group-description'),
    newMember: document.getElementById('new-member'),
    addMember: document.getElementById('add-member'),
    cancelGroup: document.getElementById('cancel-group'),
    closeModal: document.getElementById('close-modal'),
    
    // Expenses Tab
    expenseForm: document.getElementById('expense-form'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseCurrency: document.getElementById('expense-currency'),
    expenseDescription: document.getElementById('expense-description'),
    expenseDate: document.getElementById('expense-date'),
    paidByButtons: document.querySelectorAll('.member-btn'),
    splitMethodButtons: document.querySelectorAll('.split-method-btn'),
    splitEqual: document.getElementById('split-equal'),
    splitExact: document.getElementById('split-exact'),
    splitPercentage: document.getElementById('split-percentage'),
    equalSplitAmount: document.getElementById('equal-split-amount'),
    exactTotal: document.getElementById('exact-total'),
    percentageTotal: document.getElementById('percentage-total'),
    exactAmountInputs: document.querySelectorAll('.exact-amount'),
    percentageAmountInputs: document.querySelectorAll('.percentage-amount'),
    
    // History Tab
    historyList: document.querySelector('#history-tab .space-y-4'),
    emptyHistory: document.getElementById('empty-history'),
    shareWhatsapp: document.getElementById('share-whatsapp'),
    whatsappModal: document.getElementById('whatsapp-modal'),
    closeWhatsappModal: document.getElementById('close-whatsapp-modal'),
    closeWhatsapp: document.getElementById('close-whatsapp'),
    shareAllWhatsapp: document.getElementById('share-all-whatsapp'),
    
    // Settings Tab
    settingsForm: document.querySelector('#settings-tab form')
};

// ==============================================
// Data Models
// ==============================================
class Group {
    constructor(id, name, description, members = [], createdAt = new Date()) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.members = members;
        this.createdAt = createdAt;
        this.totalExpenses = 0;
    }
}

class Expense {
    constructor(id, groupId, amount, currency, description, date, paidBy, splitMethod, splitDetails = {}, status = 'pending') {
        this.id = id;
        this.groupId = groupId;
        this.amount = amount;
        this.currency = currency;
        this.description = description;
        this.date = date;
        this.paidBy = paidBy;
        this.splitMethod = splitMethod;
        this.splitDetails = splitDetails; // For exact/percent: { member: amount/percent }
        this.status = status; // pending, settled
        this.createdAt = new Date();
    }
}

// ==============================================
// State Management
// ==============================================
const state = {
    currentGroup: null,
    groups: JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS)),
    expenses: JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES)),
    settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS))
};

// ==============================================
// Group Management Functions
// ==============================================
const groupManager = {
    getGroups: () => state.groups,
    
    getGroupById: (groupId) => {
        return state.groups.find(group => group.id === groupId);
    },
    
    createGroup: (groupData) => {
        const newGroup = new Group(
            Date.now().toString(), // Use timestamp as unique ID
            groupData.name,
            groupData.description,
            groupData.members
        );
        
        state.groups.push(newGroup);
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(state.groups));
        return newGroup;
    },
    
    updateGroup: (groupId, updates) => {
        const groupIndex = state.groups.findIndex(g => g.id === groupId);
        if (groupIndex !== -1) {
            Object.assign(state.groups[groupIndex], updates);
            localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(state.groups));
            return state.groups[groupIndex];
        }
        return null;
    },
    
    renderGroups: () => {
        const groups = groupManager.getGroups();
        const groupsList = DOM.groupsList;
        
        // Clear existing groups
        groupsList.innerHTML = '';
        
        if (groups.length === 0) {
            DOM.emptyGroups.style.display = 'block';
            return;
        }
        
        DOM.emptyGroups.style.display = 'none';
        
        // Render each group
        groups.forEach(group => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500';
            groupCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-gray-800">${group.name}</h3>
                        <p class="text-sm text-gray-600">${group.members.length} members | ${expenseManager.getExpensesForGroup(group.id).length} expenses</p>
                    </div>
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Active</span>
                </div>
                <div class="mt-3 flex justify-between items-center">
                    <div class="flex items-center">
                        <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">${utils.formatCurrency(group.totalExpenses)}</span>
                        <span class="text-sm text-gray-600">Total Expenses</span>
                    </div>
                    <button class="text-blue-600 hover:text-blue-800 text-sm view-group-btn" data-group-id="${group.id}">View Details</button>
                </div>
            `;
            
            // Add click event to view group details
            const viewBtn = groupCard.querySelector('.view-group-btn');
            viewBtn.addEventListener('click', () => {
                state.currentGroup = group;
                uiManager.switchToExpensesTab();
                expenseManager.renderCurrentGroupInfo();
            });
            
            groupsList.appendChild(groupCard);
        });
    }
};

// ==============================================
// Expense Management Functions
// ==============================================
const expenseManager = {
    getExpenses: () => state.expenses,
    
    getExpensesForGroup: (groupId) => {
        return state.expenses.filter(expense => expense.groupId === groupId);
    },
    
    createExpense: (expenseData) => {
        const newExpense = new Expense(
            Date.now().toString(),
            expenseData.groupId,
            expenseData.amount,
            expenseData.currency,
            expenseData.description,
            expenseData.date,
            expenseData.paidBy,
            expenseData.splitMethod,
            expenseData.splitDetails
        );
        
        state.expenses.push(newExpense);
        
        // Update group total expenses
        const group = groupManager.getGroupById(expenseData.groupId);
        if (group) {
            group.totalExpenses += expenseData.amount;
            groupManager.updateGroup(expenseData.groupId, group);
        }
        
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses));
        return newExpense;
    },
    
    renderCurrentGroupInfo: () => {
        if (!state.currentGroup) return;
        
        const groupInfoElement = document.querySelector('#expenses-tab .bg-gray-50');
        if (!groupInfoElement) return;
        
        groupInfoElement.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold text-gray-800">${state.currentGroup.name}</h3>
                    <p class="text-sm text-gray-600">Members: ${state.currentGroup.members.join(', ')}</p>
                </div>
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Active</span>
            </div>
        `;
        
        // Update member buttons
        const memberButtonsContainer = document.querySelector('#expenses-tab .flex.flex-wrap.gap-2');
        if (memberButtonsContainer) {
            memberButtonsContainer.innerHTML = '';
            
            state.currentGroup.members.forEach(member => {
                const btn = document.createElement('button');
                btn.className = 'member-btn bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium';
                btn.textContent = member;
                memberButtonsContainer.appendChild(btn);
            });
            
            // Re-add event listeners to new buttons
            expenseManager.setupPaidByButtons();
        }
    },
    
    setupPaidByButtons: () => {
        const memberButtons = document.querySelectorAll('#expenses-tab .member-btn');
        memberButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                memberButtons.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
                memberButtons.forEach(b => b.classList.add('bg-gray-200', 'text-gray-700'));
                
                // Add active class to clicked button
                btn.classList.remove('bg-gray-200', 'text-gray-700');
                btn.classList.add('bg-blue-600', 'text-white');
            });
        });
    },
    
    calculateEqualSplit: (amount, memberCount) => {
        return amount / memberCount;
    },
    
    validateExactSplit: () => {
        let total = 0;
        let isValid = true;
        
        DOM.exactAmountInputs.forEach(input => {
            const amount = parseFloat(input.value) || 0;
            total += amount;
            
            if (isNaN(amount) || amount < 0) {
                isValid = false;
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        });
        
        DOM.exactTotal.textContent = utils.formatCurrency(total);
        return isValid && total === parseFloat(DOM.expenseAmount.value);
    },
    
    validatePercentageSplit: () => {
        let total = 0;
        let isValid = true;
        
        DOM.percentageAmountInputs.forEach(input => {
            const percent = parseInt(input.value) || 0;
            total += percent;
            
            if (isNaN(percent) || percent < 0 || percent > 100) {
                isValid = false;
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        });
        
        DOM.percentageTotal.textContent = `${total}%`;
        return isValid && total === 100;
    },
    
    renderExpenseHistory: () => {
        const historyList = DOM.historyList;
        const expenses = state.expenses;
        
        // Clear existing expenses
        historyList.innerHTML = '';
        
        if (expenses.length === 0) {
            DOM.emptyHistory.style.display = 'block';
            return;
        }
        
        DOM.emptyHistory.style.display = 'none';
        
        // Render each expense
        expenses.slice().reverse().forEach(expense => {
            const group = groupManager.getGroupById(expense.groupId);
            const groupName = group ? group.name : 'Unknown Group';
            
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item bg-gray-50 rounded-lg p-4';
            expenseItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-gray-800">${expense.description || 'Unnamed Expense'}</h3>
                        <p class="text-sm text-gray-600">${utils.formatCurrency(expense.amount, expense.currency)} | ${expense.date} | ${groupName}</p>
                    </div>
                    <span class="bg-${expense.status === 'settled' ? 'green' : 'yellow'}-100 text-${expense.status === 'settled' ? 'green' : 'yellow'}-800 text-xs font-medium px-2.5 py-0.5 rounded">${expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}</span>
                </div>
                <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <h4 class="text-sm font-medium text-gray-700">Paid By</h4>
                        <p class="text-sm">${expense.paidBy}</p>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-700">Split Method</h4>
                        <p class="text-sm">${expense.splitMethod.charAt(0).toUpperCase() + expense.splitMethod.slice(1)}</p>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-700">Settled By</h4>
                        <p class="text-sm">${expense.status === 'settled' ? 'All members' : 'Pending'}</p>
                    </div>
                </div>
                <button class="mt-3 text-blue-600 hover:text-blue-800 text-sm share-expense-btn" data-expense-id="${expense.id}">
                    <i class="fa fa-whatsapp mr-1"></i> Share Split
                </button>
            `;
            
            // Add click event to share button
            const shareBtn = expenseItem.querySelector('.share-expense-btn');
            shareBtn.addEventListener('click', () => {
                uiManager.openWhatsappModal(expense);
            });
            
            historyList.appendChild(expenseItem);
        });
    }
};

// ==============================================
// UI Management Functions
// ==============================================
const uiManager = {
    initTabs: () => {
        // Set up tab navigation
        DOM.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                DOM.tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
                    btn.classList.add('text-gray-500', 'border-transparent');
                });
                
                // Add active class to clicked button
                button.classList.remove('text-gray-500', 'border-transparent');
                button.classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
                
                // Hide all tab contents
                DOM.tabContents.forEach(content => {
                    content.classList.add('hidden');
                });
                
                // Show selected tab content
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.remove('hidden');
                
                // Update content when tab is shown
                if (tabId === 'groups') {
                    groupManager.renderGroups();
                } else if (tabId === 'history') {
                    expenseManager.renderExpenseHistory();
                }
            });
        });
    },
    
    initModals: () => {
        // Create Group Modal
        DOM.createGroupBtn.addEventListener('click', () => {
            DOM.createGroupModal.classList.remove('hidden');
        });
        
        DOM.closeModal.addEventListener('click', () => {
            DOM.createGroupModal.classList.add('hidden');
        });
        
        DOM.cancelGroup.addEventListener('click', () => {
            DOM.createGroupModal.classList.add('hidden');
        });
        
        // Add member functionality
        DOM.addMember.addEventListener('click', () => {
            const memberName = DOM.newMember.value.trim();
            if (memberName) {
                const membersContainer = DOM.addMember.parentElement;
                const memberBtn = document.createElement('button');
                memberBtn.className = 'member-btn bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium';
                memberBtn.textContent = memberName;
                membersContainer.insertBefore(memberBtn, DOM.newMember);
                DOM.newMember.value = '';
                
                // Update group form members array
                const updateMembersArray = () => {
                    const memberBtns = membersContainer.querySelectorAll('.member-btn');
                    const members = Array.from(memberBtns).map(btn => btn.textContent);
                    return members;
                };
                
                // Store members array for form submission
                DOM.groupForm.dataset.members = JSON.stringify(updateMembersArray());
            }
        });
        
        // WhatsApp Modal
        DOM.closeWhatsappModal.addEventListener('click', () => {
            DOM.whatsappModal.classList.add('hidden');
        });
        
        DOM.closeWhatsapp.addEventListener('click', () => {
            DOM.whatsappModal.classList.add('hidden');
        });
        
        DOM.shareAllWhatsapp.addEventListener('click', () => {
            // In a real app, this would send WhatsApp messages
            alert('Sharing expense details with all members via WhatsApp!');
            DOM.whatsappModal.classList.add('hidden');
        });
    },
    
    openWhatsappModal: (expense) => {
        const group = groupManager.getGroupById(expense.groupId);
        const groupName = group ? group.name : 'Group Expense';
        
        // Populate WhatsApp modal with expense details
        const expenseDetailsElement = DOM.whatsappModal.querySelector('.bg-gray-50');
        if (expenseDetailsElement) {
            expenseDetailsElement.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium">${expense.description || 'Expense'}</span>
                    <span class="text-sm font-bold text-blue-600">${utils.formatCurrency(expense.amount, expense.currency)}</span>
                </div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Split Method:</span>
                    <span class="text-sm">${expense.splitMethod.charAt(0).toUpperCase() + expense.splitMethod.slice(1)}</span>
                </div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Paid By:</span>
                    <span class="text-sm">${expense.paidBy}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Group:</span>
                    <span class="text-sm">${groupName}</span>
                </div>
            `;
        }
        
        // Populate members for sharing
        const membersContainer = DOM.whatsappModal.querySelector('.flex.flex-wrap.gap-2');
        if (membersContainer) {
            membersContainer.innerHTML = '';
            
            // Get unique members from expense (paidBy + split details recipients)
            const members = new Set([expense.paidBy]);
            if (expense.splitDetails && expense.splitMethod === 'exact') {
                Object.keys(expense.splitDetails).forEach(member => members.add(member));
            } else if (expense.splitDetails && expense.splitMethod === 'percentage') {
                Object.keys(expense.splitDetails).forEach(member => members.add(member));
            } else if (group) {
                group.members.forEach(member => members.add(member));
            }
            
            members.forEach(member => {
                if (member !== expense.paidBy) { // Don't include payer in recipients
                    const btn = document.createElement('button');
                    btn.className = 'whatsapp-btn bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium';
                    btn.innerHTML = `<i class="fa fa-whatsapp mr-1"></i> ${member}`;
                    membersContainer.appendChild(btn);
                    
                    // Add click event to send WhatsApp message
                    btn.addEventListener('click', () => {
                        const message = `Hey ${member}, check out this expense from ${groupName}:\n\n` +
                            `• Description: ${expense.description || 'Expense'}\n` +
                            `• Amount: ${utils.formatCurrency(expense.amount, expense.currency)}\n` +
                            `• Paid By: ${expense.paidBy}\n` +
                            `• Split Method: ${expense.splitMethod.charAt(0).toUpperCase() + expense.splitMethod.slice(1)}\n` +
                            `• Your share: ${utils.formatCurrency(expense.splitDetails[member] || 0, expense.currency)}\n\n` +
                            `Settle up soon! 😊`;
                        
                        // In a real app, this would open WhatsApp with the message
                        alert(`Sending WhatsApp message to ${member}:\n\n${message}`);
                    });
                }
            });
        }
        
        // Show modal
        DOM.whatsappModal.classList.remove('hidden');
    },
    
    switchToExpensesTab: () => {
        // Switch to expenses tab
        const expensesTabBtn = Array.from(DOM.tabButtons).find(btn => btn.getAttribute('data-tab') === 'expenses');
        if (expensesTabBtn) {
            expensesTabBtn.click();
        }
    }
};

// ==============================================
// Form Handling
// ==============================================
const formHandler = {
    setupGroupForm: () => {
        DOM.groupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const groupName = DOM.groupName.value.trim();
            const groupDescription = DOM.groupDescription.value.trim();
            const members = JSON.parse(DOM.groupForm.dataset.members) || [];
            
            if (!groupName || members.length < 2) {
                alert('Please enter a group name and add at least 2 members');
                return;
            }
            
            // Create group
            const newGroup = groupManager.createGroup({
                name: groupName,
                description: groupDescription,
                members: members
            });
            
            // Set as current group and switch to expenses tab
            state.currentGroup = newGroup;
            uiManager.switchToExpensesTab();
            expenseManager.renderCurrentGroupInfo();
            
            // Reset form and close modal
            DOM.groupForm.reset();
            DOM.createGroupModal.classList.add('hidden');
            
            // Update groups list
            groupManager.renderGroups();
        });
    },
    
    setupExpenseForm: () => {
        // Update equal split amount when amount changes
        DOM.expenseAmount.addEventListener('input', () => {
            const amount = parseFloat(DOM.expenseAmount.value) || 0;
            const memberCount = state.currentGroup ? state.currentGroup.members.length : 1;
            const splitAmount = expenseManager.calculateEqualSplit(amount, memberCount);
            
            DOM.equalSplitAmount.textContent = utils.formatCurrency(splitAmount);
        });
        
        // Update equal split amount when currency changes
        DOM.expenseCurrency.addEventListener('change', () => {
            const amount = parseFloat(DOM.expenseAmount.value) || 0;
            const memberCount = state.currentGroup ? state.currentGroup.members.length : 1;
            const splitAmount = expenseManager.calculateEqualSplit(amount, memberCount);
            const currency = DOM.expenseCurrency.value;
            
            DOM.equalSplitAmount.textContent = utils.formatCurrency(splitAmount, currency);
        });
        
        // Set up split method buttons
        DOM.splitMethodButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                DOM.splitMethodButtons.forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                });
                
                // Add active class to clicked button
                button.classList.remove('bg-gray-200', 'text-gray-700');
                button.classList.add('bg-blue-600', 'text-white');
                
                // Hide all split details
                DOM.splitEqual.classList.add('hidden');
                DOM.splitExact.classList.add('hidden');
                DOM.splitPercentage.classList.add('hidden');
                
                // Show selected split details
                const splitMethod = button.getAttribute('data-split');
                document.getElementById(`split-${splitMethod}`).classList.remove('hidden');
                
                // Update calculations for the selected method
                if (splitMethod === 'equal') {
                    const amount = parseFloat(DOM.expenseAmount.value) || 0;
                    const memberCount = state.currentGroup ? state.currentGroup.members.length : 1;
                    const splitAmount = expenseManager.calculateEqualSplit(amount, memberCount);
                    const currency = DOM.expenseCurrency.value;
                    
                    DOM.equalSplitAmount.textContent = utils.formatCurrency(splitAmount, currency);
                }
            });
        });
        
        // Exact amount inputs - update total when changed
        DOM.exactAmountInputs.forEach(input => {
            input.addEventListener('input', expenseManager.validateExactSplit);
        });
        
        // Percentage amount inputs - update total when changed
        DOM.percentageAmountInputs.forEach(input => {
            input.addEventListener('input', expenseManager.validatePercentageSplit);
        });
        
        // Set up expense form submission
        DOM.expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!state.currentGroup) {
                alert('Please select a group first');
                return;
            }
            
            const amount = parseFloat(DOM.expenseAmount.value);
            const currency = DOM.expenseCurrency.value;
            const description = DOM.expenseDescription.value.trim();
            const date = DOM.expenseDate.value;
            const paidBy = Array.from(DOM.paidByButtons).find(btn => 
                btn.classList.contains('bg-blue-600') && btn.classList.contains('text-white')
            )?.textContent;
            const activeSplitMethod = Array.from(DOM.splitMethodButtons).find(btn => 
                btn.classList.contains('bg-blue-600') && btn.classList.contains('text-white')
            )?.getAttribute('data-split');
            
            // Validate required fields
            if (!amount || !paidBy || !activeSplitMethod) {
                alert('Please fill in all required fields');
                return;
            }
            
            let splitDetails = {};
            let isValid = true;
            
            // Validate and collect split details based on method
            if (activeSplitMethod === 'equal') {
                const memberCount = state.currentGroup.members.length;
                const splitAmount = expenseManager.calculateEqualSplit(amount, memberCount);
                
                state.currentGroup.members.forEach(member => {
                    splitDetails[member] = splitAmount;
                });
            } else if (activeSplitMethod === 'exact') {
                isValid = expenseManager.validateExactSplit();
                
                if (isValid) {
                    DOM.exactAmountInputs.forEach(input => {
                        const member = input.getAttribute('data-member');
                        const amount = parseFloat(input.value) || 0;
                        splitDetails[member] = amount;
                    });
                }
            } else if (activeSplitMethod === 'percentage') {
                isValid = expenseManager.validatePercentageSplit();
                
                if (isValid) {
                    DOM.percentageAmountInputs.forEach(input => {
                        const member = input.getAttribute('data-member');
                        const percent = parseInt(input.value) || 0;
                        const amount = (amount * percent) / 100;
                        splitDetails[member] = amount;
                    });
                }
            }
            
            if (!isValid) {
                alert('Please fix the split details');
                return;
            }
            
            // Create expense
            const newExpense = expenseManager.createExpense({
                groupId: state.currentGroup.id,
                amount: amount,
                currency: currency,
                description: description,
                date: date,
                paidBy: paidBy,
                splitMethod: activeSplitMethod,
                splitDetails: splitDetails
            });
            
            // Reset form
            DOM.expenseForm.reset();
            
            // Update history
            expenseManager.renderExpenseHistory();
            
            // Show success message
            alert(`Expense added successfully! Total: ${utils.formatCurrency(amount, currency)}`);
        });
    }
};

// ==============================================
// Initialize Application
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Group Expense Tracker initialized');
    
    // Initialize UI
    uiManager.initTabs();
    uiManager.initModals();
    
    // Setup forms
    formHandler.setupGroupForm();
    formHandler.setupExpenseForm();
    
    // Setup paid by buttons
    expenseManager.setupPaidByButtons();
    
    // Render initial groups
    groupManager.renderGroups();
    
    // Render initial expense history
    expenseManager.renderExpenseHistory();
    
    // Set default date for expense form
    const today = new Date().toISOString().split('T')[0];
    DOM.expenseDate.value = today;
});