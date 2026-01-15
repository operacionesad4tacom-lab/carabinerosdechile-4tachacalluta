// ============================================
// SICOF - CONFIGURACIÓN CORREGIDA
// ============================================

// 🔐 CLAVES SUPABASE
const SUPABASE_URL = "https://rytpgbfbeeuqzcgeujzy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHBnYmZiZWV1cXpjZ2V1anp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjUwMDcsImV4cCI6MjA4NDA0MTAwN30.dQ2WlMBAVqLg8hUWUPxpLMMw3XO7-PRTn9gxf9Bslac";

// Inicializar Supabase
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// CONFIGURACIÓN DE REDIRECCIÓN
// ============================================
window.SICOF_CONFIG = {
    version: '2.1.1',
    redirectUrls: {
        digitador: 'servicios/datos-servicio.html',
        jefe: 'cuarteles/estado-operativo.html',
        admin: 'admin/admin-panel.html',
        jefatura: 'dashboard.html',
        usuario: 'dashboard.html' // rol por defecto
    }
};

// ============================================
// LOGIN - CON MANEJO DE ERRORES ESPECÍFICO
// ============================================
window.loginUsuario = async function (email, password) {
    console.log('🔐 Intentando autenticar:', email);
    
    try {
        // 1. LIMPIAR CUALQUIER SESIÓN PREVIA
        await window.supabase.auth.signOut();
        
        // 2. INTENTAR AUTENTICACIÓN
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password: password
        });

        // 3. MANEJAR ERRORES ESPECÍFICOS
        if (error) {
            console.error('❌ Error Supabase:', error.message);
            
            // ERROR CRÍTICO: Email logins disabled
            if (error.message.includes('Email logins are disabled')) {
                throw new Error('ACCESO BLOQUEADO: Contacta al administrador. El login por email está deshabilitado en Supabase.');
            }
            // Error de credenciales
            else if (error.message.includes('Invalid login credentials')) {
                throw new Error('Usuario o contraseña incorrectos');
            }
            // Otros errores
            else {
                throw new Error('Error de autenticación: ' + error.message);
            }
        }

        // 4. LOGIN EXITOSO
        console.log('✅ Login exitoso:', data.user.email);
        const user = data.user;
        
        // 5. OBTENER METADATOS (de Supabase o valores por defecto)
        const metadata = user.user_metadata || {};
        
        // 6. CREAR OBJETO USUARIO
        const usuario = {
            id: user.id,
            email: user.email,
            nombre: metadata.nombre || extraerNombreDesdeEmail(user.email),
            rol: metadata.rol || 'usuario',
            cuartel_codigo: metadata.cuartel_codigo || null,
            session: data.session,
            timestamp: new Date().toISOString()
        };

        console.log('👤 Usuario creado:', usuario);
        
        // 7. GUARDAR EN LOCALSTORAGE
        localStorage.setItem('sicof_user', JSON.stringify(usuario));
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
        
        return usuario;

    } catch (error) {
        console.error('🔥 Error en loginUsuario:', error);
        throw error;
    }
};

// Función auxiliar para extraer nombre del email
function extraerNombreDesdeEmail(email) {
    const partes = email.split('@')[0].split('.');
    const nombre = partes.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    return nombre;
}

// ============================================
// VERIFICAR SESIÓN
// ============================================
window.verificarSesion = async function () {
    try {
        console.log('🔍 Verificando sesión...');
        
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('Error obteniendo sesión:', error);
            return null;
        }
        
        if (!session?.user) {
            console.log('📭 No hay sesión activa');
            return null;
        }
        
        const user = session.user;
        const metadata = user.user_metadata || {};
        
        const usuario = {
            id: user.id,
            email: user.email,
            nombre: metadata.nombre || extraerNombreDesdeEmail(user.email),
            rol: metadata.rol || 'usuario',
            cuartel_codigo: metadata.cuartel_codigo || null,
            session: session
        };
        
        // Actualizar localStorage
        localStorage.setItem('sicof_user', JSON.stringify(usuario));
        localStorage.setItem('supabase_session', JSON.stringify(session));
        
        return usuario;
        
    } catch (error) {
        console.error('❌ Error en verificarSesion:', error);
        return null;
    }
};

// ============================================
// PROTEGER PÁGINAS
// ============================================
window.protegerPagina = async function (rolRequerido = null) {
    try {
        const usuario = await window.verificarSesion();
        
        if (!usuario) {
            alert('⚠️ Debes iniciar sesión para acceder');
            window.location.href = 'index.html';
            return null;
        }
        
        if (rolRequerido && usuario.rol !== rolRequerido) {
            alert(`⛔ Acceso denegado. Tu rol (${usuario.rol}) no tiene permiso.`);
            window.location.href = 'index.html';
            return null;
        }
        
        return usuario;
        
    } catch (error) {
        console.error('Error en protegerPagina:', error);
        window.location.href = 'index.html';
        return null;
    }
};

// ============================================
// LOGOUT
// ============================================
window.logout = async function () {
    try {
        await window.supabase.auth.signOut();
        localStorage.removeItem('sicof_user');
        localStorage.removeItem('supabase_session');
        console.log('👋 Sesión cerrada');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error en logout:', error);
        alert('Error al cerrar sesión');
    }
};

// ============================================
// FUNCIONES DE DIAGNÓSTICO
// ============================================

// Verificar configuración de Supabase
window.verificarConfigSupabase = function() {
    console.log('🔧 Configuración actual:');
    console.log('- Supabase URL:', SUPABASE_URL);
    console.log('- Clave anónima:', SUPABASE_ANON_KEY ? '✅ Presente' : '❌ Ausente');
    
    // Probar conexión básica
    fetch(SUPABASE_URL + '/rest/v1/', {
        headers: {
            'apikey': SUPABASE_ANON_KEY
        }
    })
    .then(res => console.log('- Conexión a REST API:', res.ok ? '✅ OK' : '❌ Falló'))
    .catch(err => console.log('- Conexión a REST API: ❌ Error', err.message));
};

// ============================================
// INICIALIZACIÓN
// ============================================
console.log('🚀 SICOF Config v2.1.1 cargado');
console.log('⚠️ IMPORTANTE: Verifica que "Email Provider" esté HABILITADO en Supabase');

// Ejecutar verificación al cargar
window.addEventListener('DOMContentLoaded', () => {
    window.verificarConfigSupabase();
});
