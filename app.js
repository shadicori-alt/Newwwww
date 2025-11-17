// Global variables for data storage
let invoices = [];
let drivers = [];
let stock = [];
let archivedInvoices = [];
let currentTheme = 'light';

// Theme colors
const themes = {
    light: {
        primary: '#2563eb',
        secondary: '#64748b',
        success: '#059669',
        danger: '#dc2626',
        warning: '#d97706',
        info: '#0891b2',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        border: '#e2e8f0'
    },
    dark: {
        primary: '#3b82f6',
        secondary: '#94a3b8',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        border: '#334155'
    }
};

// Load data from JSON files
async function loadData() {
    try {
        const [invoicesResponse, driversResponse, stockResponse] = await Promise.all([
            fetch('./invoices.json'),
            fetch('./drivers.json'),
            fetch('./stock.json')
        ]);
        
        invoices = await invoicesResponse.json();
        drivers = await driversResponse.json();
        stock = await stockResponse.json();
        
        // Load archived invoices from localStorage if exists
        const archivedData = localStorage.getItem('archivedInvoices');
        if (archivedData) {
            archivedInvoices = JSON.parse(archivedData);
        }
        
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            currentTheme = savedTheme;
            applyTheme(currentTheme);
        }
        
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}

// Apply theme
function applyTheme(theme) {
    const root = document.documentElement;
    const colors = themes[theme];
    
    Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
    });
    
    document.body.className = document.body.className.replace(/theme-\w+/, '');
    document.body.classList.add(`theme-${theme}`);
    
    // Update theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'light' ? 
            '<i class=\"bi bi-moon-fill\"></i>' : 
            '<i class=\"bi bi-sun-fill\"></i>';
    }
}

// Toggle theme
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
}

// Statistics functions
function getStatistics() {
    const totalInvoices = invoices.length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'قيد التوصيل').length;
    const deliveredInvoices = invoices.filter(inv => inv.status === 'مسلمة').length;
    const returnedInvoices = invoices.filter(inv => inv.status === 'مرتجعة').length;
    const totalDrivers = drivers.length;
    const totalStockItems = stock.length;
    
    return {
        totalInvoices,
        pendingInvoices,
        deliveredInvoices,
        returnedInvoices,
        totalDrivers,
        totalStockItems
    };
}

// Get recent invoices
function getRecentInvoices(limit = 10) {
    return invoices
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}

// Invoice functions
function addInvoice(invoiceData) {
    const newInvoice = {
        id: `INV${String(invoices.length + 1).padStart(3, '0')}`,
        ...invoiceData,
        date: new Date().toISOString().split('T')[0],
        lastStatusUpdate: new Date().toISOString()
    };
    invoices.push(newInvoice);
    return newInvoice;
}

function updateInvoiceStatus(invoiceId, newStatus) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        invoice.status = newStatus;
        invoice.lastStatusUpdate = new Date().toISOString();
        return true;
    }
    return false;
}

function searchInvoices(query) {
    return invoices.filter(inv => 
        inv.customerName.includes(query) ||
        inv.id.includes(query) ||
        inv.phoneNumber.includes(query) ||
        inv.address.includes(query)
    );
}

function filterInvoicesByStatus(status) {
    return invoices.filter(inv => inv.status === status);
}

function filterInvoicesByDriver(driverId) {
    return invoices.filter(inv => inv.driverId === driverId);
}

// Driver functions
function addDriver(driverData) {
    const newDriver = {
        id: `DRIVER${String(drivers.length + 1).padStart(3, '0')}`,
        ...driverData,
        totalDeliveries: 0,
        totalReturns: 0
    };
    drivers.push(newDriver);
    return newDriver;
}

function getDriverInvoices(driverId) {
    return invoices.filter(inv => inv.driverId === driverId);
}

// Stock functions
function addStockItem(itemData) {
    const newItem = {
        id: `STK${String(stock.length + 1).padStart(3, '0')}`,
        ...itemData
    };
    stock.push(newItem);
    return newItem;
}

function updateStockQuantity(itemId, newQuantity) {
    const item = stock.find(item => item.id === itemId);
    if (item) {
        item.quantity = newQuantity;
        return true;
    }
    return false;
}

function getLowStockItems() {
    return stock.filter(item => item.quantity < item.minQuantity);
}

// Archive functions
function archiveInvoice(invoiceId) {
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
    if (invoiceIndex !== -1) {
        const [archivedInvoice] = invoices.splice(invoiceIndex, 1);
        archivedInvoice.archivedDate = new Date().toISOString();
        archivedInvoices.push(archivedInvoice);
        localStorage.setItem('archivedInvoices', JSON.stringify(archivedInvoices));
        return true;
    }
    return false;
}

function searchArchivedInvoices(query) {
    return archivedInvoices.filter(inv => 
        inv.customerName.includes(query) ||
        inv.id.includes(query) ||
        inv.phoneNumber.includes(query)
    );
}

// Alert functions
function getDelayedInvoices() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    return invoices.filter(inv => {
        const lastUpdate = new Date(inv.lastStatusUpdate);
        return lastUpdate < twentyFourHoursAgo && inv.status === 'قيد التوصيل';
    });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-EG');
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('ar-EG');
}

// Table sorting
function sortTable(data, column, direction = 'asc') {
    return data.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

// Initialize application
async function initializeApp() {
    const loaded = await loadData();
    if (loaded) {
        console.log('Application initialized successfully');
        
        // Trigger custom event for page-specific initialization
        document.dispatchEvent(new CustomEvent('appReady'));
    } else {
        console.error('Failed to initialize application');
        // Show error message to user
        showNotification('فشل في تحميل البيانات. يرجى تحديث الصفحة.', 'error');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Common navigation function
function navigateToPage(page) {
    window.location.href = page;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);