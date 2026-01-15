// ============================================
// UTILIDADES GENERALES - SICOF
// ============================================

// Formatear fecha para display
function formatFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha + 'T00:00:00');
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('es-CL', options);
}

// Formatear hora para display
function formatHora(hora) {
    if (!hora) return '-';
    return hora.substring(0, 5); // HH:MM
}

// Formatear número con separador de miles
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Formatear porcentaje
function formatPorcentaje(valor) {
    if (valor === null || valor === undefined) return '0%';
    return `${Math.round(valor)}%`;
}

// Obtener color según porcentaje
function getColorByPercentage(percentage) {
    if (percentage >= 80) return 'var(--verde-exito)';
    if (percentage >= 60) return 'var(--naranja-advertencia)';
    return 'var(--rojo-alerta)';
}

// Obtener badge según porcentaje
function getBadgeByPercentage(percentage) {
    if (percentage >= 80) return 'badge-success';
    if (percentage >= 60) return 'badge-warning';
    return 'badge-danger';
}

// Generar ID único
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Debounce para búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Copiar al portapapeles
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado al portapapeles', 'success');
        return true;
    } catch (err) {
        console.error('Error copiando:', err);
        showToast('Error al copiar', 'danger');
        return false;
    }
}

// Mostrar toast notification
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Descargar datos como CSV
function downloadCSV(data, filename) {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Convertir array de objetos a CSV
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            let cell = row[header] ?? '';
            // Escapar comillas y envolver en comillas si contiene coma
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                cell = `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// Descargar datos como JSON
function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Capitalizar primera letra
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Obtener rango de fechas
function getDateRange(period) {
    const today = new Date();
    const startDate = new Date();
    
    switch(period) {
        case 'hoy':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'semana':
            startDate.setDate(today.getDate() - 7);
            break;
        case 'mes':
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'trimestre':
            startDate.setMonth(today.getMonth() - 3);
            break;
        case 'semestre':
            startDate.setMonth(today.getMonth() - 6);
            break;
        case 'ano':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        default:
            startDate.setMonth(today.getMonth() - 1);
    }
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
    };
}

// Loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-spinner" style="margin: 2rem auto;"></div>';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}
