// ============================================
// SICOF - CONFIGURACIÓN SIMPLIFICADA
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
    version: '2.1.0',
    redirectUrls: {
        // Los roles se determinarán por metadata de Supabase
        digitador: 'servicios/datos-servicio.html',
        jefe: 'cuarteles/estado-operativo.html',
        admin: 'admin/admin-panel.html',
        jefatura: 'dashboard.html'
    }
};

// ============================================
// LOGIN - SOLO AUTENTICA CON SUPABASE
// ============================================
window.loginUsuario = async function (email, password) {
    console.log('🔐 Intentando autenticar:', email);
    
    try {
        // 1. LIMPIAR SESIONES ANTERIORES (importante)
        await window.supabase.auth.signOut();
        
        // 2. AUTENTICACIÓN CON SUPABASE
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password: password
        });

        // 3. MANEJAR ERRORES
        if (error) {
            console.error('❌ Error de autenticación:', error.message);
            
            // Mensajes más amigables
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('Correo o contraseña incorrectos');
            } else if (error.message.includes('Email not confirmed')) {
                throw new Error('Debes confirmar tu correo primero');
            } else {
                throw new Error('Error de conexión: ' + error.message);
            }
        }

        // 4. OBTENER INFORMACIÓN DEL USUARIO AUTENTICADO
        const user = data.user;
        console.log('✅ Usuario autenticado:', user.email);
        
        // 5. OBTENER METADATOS DE SUPABASE
        // Supabase guarda los metadatos en user_metadata
        const userMetadata = user.user_metadata || {};
        
        // 6. CREAR OBJETO USUARIO CON METADATOS DE SUPABASE
        const usuarioSICOF = {
            id: user.id,
            email: user.email,
            // Usar metadata de Supabase o valores por defecto
            nombre: userMetadata.nombre || user.email.split('@')[0],
            rol: userMetadata.rol || 'usuario', // Si no tiene rol, poner 'usuario'
            cuartel_codigo: userMetadata.cuartel_codigo || null,
            session: data.session,
            auth_timestamp: new Date().toISOString()
        };

        console.log('👤 Datos del usuario:', usuarioSICOF);
        
        // 7. GUARDAR EN LOCALSTORAGE (opcional, para persistencia)
        localStorage.setItem('sicof_user', JSON.stringify(usuarioSICOF));
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
        
        return usuarioSICOF;

    } catch (error) {
        console.error('🔥 Error crítico en login:', error);
        throw error; // Re-lanzar el error para manejarlo en el HTML
    }
};

// ============================================
// VERIFICAR SESIÓN - SOLO SUPABASE
// ============================================
window.verificarSesion = async function () {
    try {
        console.log('🔍 Verificando sesión en Supabase...');
        
        // 1. OBTENER SESIÓN DE SUPABASE
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('Error obteniendo sesión:', error);
            return null;
        }
        
        // 2. SI NO HAY SESIÓN, SALIR
        if (!session || !session.user) {
            console.log('📭 No hay usuario autenticado');
            localStorage.removeItem('sicof_user');
            localStorage.removeItem('supabase_session');
            return null;
        }
        
        // 3. OBTENER USER DE LA SESIÓN
        const user = session.user;
        console.log('✅ Sesión activa para:', user.email);
        
        // 4. OBTENER METADATOS DE SUPABASE
        const userMetadata = user.user_metadata || {};
        
        // 5. CONSTRUIR OBJETO USUARIO
        const usuario = {
            id: user.id,
            email: user.email,
            nombre: userMetadata.nombre || user.email.split('@')[0],
            rol: userMetadata.rol || 'usuario',
            cuartel_codigo: userMetadata.cuartel_codigo || null,
            session: session
        };
        
        // 6. ACTUALIZAR LOCALSTORAGE
        localStorage.setItem('sicof_user', JSON.stringify(usuario));
        localStorage.setItem('supabase_session', JSON.stringify(session));
        
        return usuario;
        
    } catch (error) {
        console.error('❌ Error verificando sesión:', error);
        return null;
    }
};

// ============================================
// PROTEGER PÁGINAS
// ============================================
window.protegerPagina = async function (rolRequerido = null) {
    try {
        // 1. VERIFICAR SESIÓN
        const usuario = await window.verificarSesion();
        
        if (!usuario) {
            alert('⚠️ Debes iniciar sesión');
            window.location.href = '/index.html';
            return null;
        }
        
        // 2. VERIFICAR ROL SI SE ESPECIFICA
        if (rolRequerido && usuario.rol !== rolRequerido) {
            alert(`⛔ Acceso denegado. Tu rol es: ${usuario.rol}`);
            window.location.href = '/index.html';
            return null;
        }
        
        // 3. REDIRIGIR SEGÚN ROL SI ESTÁ EN PÁGINA INCORRECTA
        const paginaActual = window.location.pathname;
        const paginaEsperada = window.SICOF_CONFIG.redirectUrls[usuario.rol];
        
        if (paginaEsperada && !paginaActual.includes(paginaEsperada)) {
            console.log(`🔀 Redirigiendo a: ${paginaEsperada}`);
            window.location.href = paginaEsperada;
            return null;
        }
        
        return usuario;
        
    } catch (error) {
        console.error('Error en protegerPagina:', error);
        window.location.href = '/index.html';
        return null;
    }
};

// ============================================
// LOGOUT
// ============================================
window.logout = async function () {
    try {
        // 1. CERRAR SESIÓN EN SUPABASE
        const { error } = await window.supabase.auth.signOut();
        
        if (error) {
            console.error('Error cerrando sesión en Supabase:', error);
        }
        
        // 2. LIMPIAR LOCALSTORAGE
        localStorage.removeItem('sicof_user');
        localStorage.removeItem('supabase_session');
        
        // 3. REDIRIGIR AL LOGIN
        console.log('👋 Sesión cerrada correctamente');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Error en logout:', error);
        alert('Error al cerrar sesión');
    }
};

// ============================================
// FUNCIONES DE PRUEBA
// ============================================
window.probarConexionSupabase = async function () {
    console.log('🧪 Probando conexión con Supabase...');
    
    try {
        const { data, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Error de conexión:', error.message);
            return false;
        }
        
        console.log('✅ Conexión OK. Estado:', data.session ? 'Con sesión' : 'Sin sesión');
        return true;
        
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
};

// ============================================
// INICIALIZACIÓN
// ============================================
console.log('🚀 SICOF Config v2.1.0 cargado');
console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('📊 Modo: Solo autenticación Supabase');

// Verificar conexión al cargar
window.addEventListener('DOMContentLoaded', async () => {
    const conexionOK = await window.probarConexionSupabase();
    if (!conexionOK) {
        console.warn('⚠️ Problema de conexión con Supabase');
    }
});
