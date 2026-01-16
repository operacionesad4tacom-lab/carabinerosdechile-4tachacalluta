// ============================================
// SICOF - CONFIGURACIÓN UNIFICADA v3.0
// ============================================

// 🔐 CLAVES SUPABASE
const SUPABASE_URL = "https://rytpgbfbeeuqzcgeujzy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHBnYmZiZWV1cXpjZ2V1anp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjUwMDcsImV4cCI6MjA4NDA0MTAwN30.dQ2WlMBAVqLg8hUWUPxpLMMw3XO7-PRTn9gxf9Bslac";

// ============================================
// CONFIGURACIÓN PRINCIPAL
// ============================================
window.SICOF_CONFIG = {
    version: '3.0.0',
    
    // Cliente Supabase unificado
    supabase: null,
    
    // Cuarteles (deben coincidir con tu tabla 'cuarteles' en Supabase)
    cuarteles: [
        { codigo: 'CHA', nombre: '4ta. Com. Chacalluta (F)' },
        { codigo: 'VIS', nombre: 'Tcia Visviri (F)' },
        { codigo: 'ALC', nombre: 'R. Alcerreca (F)' },
        { codigo: 'CAQ', nombre: 'R. Caquena (F)' },
        { codigo: 'CHI', nombre: 'R. Chilcaya (F)' },
        { codigo: 'CHU', nombre: 'Tcia Chungara (F)' },
        { codigo: 'CHU2', nombre: 'R. Chucuyo (F)' },
        { codigo: 'GUA', nombre: 'R. Guallatire (F)' },
        { codigo: 'TAC', nombre: 'R. Tacora (F)' }
    ],
    
    // Configuración de roles
    roles: {
        digitador: {
            redirect: 'servicios/datos-servicio.html',
            pages: ['servicios/']
        },
        jefe: {
            redirect: 'cuarteles/estado-operativo.html',
            pages: ['cuarteles/']
        },
        admin: {
            redirect: 'admin/admin-panel.html',
            pages: ['admin/', 'dashboard.html', 'reportes/']
        },
        jefatura: {
            redirect: 'dashboard.html',
            pages: ['dashboard.html', 'reportes/']
        }
    },
    
    // Inicializar Supabase
    initSupabase: function() {
        if (!window.supabase) {
            console.error('Supabase SDK no cargado');
            return null;
        }
        
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase inicializado correctamente');
        return this.supabase;
    },
    
    // Obtener configuración de rol
    getRoleConfig: function(rol) {
        return this.roles[rol] || this.roles.jefatura;
    }
};

// ============================================
// FUNCIONES DE AUTENTICACIÓN CORREGIDAS
// ============================================

// Login unificado
window.loginUsuario = async function(email, password) {
    try {
        console.log('🔐 Iniciando autenticación:', email);
        
        // Inicializar Supabase si no está listo
        if (!SICOF_CONFIG.supabase) {
            SICOF_CONFIG.initSupabase();
        }
        
        if (!SICOF_CONFIG.supabase) {
            throw new Error('No se pudo inicializar Supabase');
        }
        
        // Intentar login
        const { data, error } = await SICOF_CONFIG.supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password: password
        });
        
        if (error) {
            console.error('❌ Error de autenticación:', error.message);
            
            // Errores específicos
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('Usuario o contraseña incorrectos');
            }
            if (error.message.includes('Email logins are disabled')) {
                throw new Error('Autenticación por email deshabilitada. Contacte al administrador.');
            }
            
            throw new Error(`Error de autenticación: ${error.message}`);
        }
        
        if (!data.user) {
            throw new Error('No se recibieron datos del usuario');
        }
        
        console.log('✅ Login exitoso:', data.user.email);
        
        // Obtener datos adicionales del usuario desde tabla 'usuarios'
        const { data: usuarioDB, error: errorUsuario } = await SICOF_CONFIG.supabase
            .from('usuarios')
            .select('rol, cuartel_codigo, nombre_completo')
            .eq('email', data.user.email)
            .single();
        
        if (errorUsuario && errorUsuario.code !== 'PGRST116') {
            console.warn('⚠️ Usuario no encontrado en tabla usuarios:', errorUsuario.message);
        }
        
        // Crear objeto usuario unificado
        const usuario = {
            id: data.user.id,
            email: data.user.email,
            nombre: usuarioDB?.nombre_completo || email.split('@')[0],
            rol: usuarioDB?.rol || 'usuario',
            cuartel_codigo: usuarioDB?.cuartel_codigo || null,
            session: data.session,
            timestamp: new Date().toISOString()
        };
        
        // Guardar en localStorage
        localStorage.setItem('sicof_user', JSON.stringify(usuario));
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
        
        console.log('👤 Usuario guardado:', usuario);
        return usuario;
        
    } catch (error) {
        console.error('🔥 Error en loginUsuario:', error);
        throw error;
    }
};

// Verificar sesión
window.verificarSesion = async function() {
    try {
        console.log('🔍 Verificando sesión...');
        
        if (!SICOF_CONFIG.supabase) {
            SICOF_CONFIG.initSupabase();
        }
        
        const { data: { session }, error } = await SICOF_CONFIG.supabase.auth.getSession();
        
        if (error) {
            console.error('Error obteniendo sesión:', error);
            return null;
        }
        
        if (!session?.user) {
            console.log('📭 No hay sesión activa');
            return null;
        }
        
        // Obtener datos actualizados del usuario
        const { data: usuarioDB } = await SICOF_CONFIG.supabase
            .from('usuarios')
            .select('rol, cuartel_codigo, nombre_completo')
            .eq('email', session.user.email)
            .single();
        
        const usuario = {
            id: session.user.id,
            email: session.user.email,
            nombre: usuarioDB?.nombre_completo || session.user.email.split('@')[0],
            rol: usuarioDB?.rol || 'usuario',
            cuartel_codigo: usuarioDB?.cuartel_codigo || null,
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

// Proteger página por rol
window.protegerPagina = async function(rolRequerido = null) {
    try {
        const usuario = await verificarSesion();
        
        if (!usuario) {
            alert('⚠️ Debes iniciar sesión para acceder');
            window.location.href = '../index.html';
            return null;
        }
        
        if (rolRequerido && usuario.rol !== rolRequerido) {
            alert(`⛔ Acceso denegado. Tu rol (${usuario.rol}) no tiene permiso.`);
            window.location.href = '../index.html';
            return null;
        }
        
        return usuario;
        
    } catch (error) {
        console.error('Error en protegerPagina:', error);
        window.location.href = '../index.html';
        return null;
    }
};

// Logout
window.logout = async function() {
    try {
        if (!SICOF_CONFIG.supabase) {
            SICOF_CONFIG.initSupabase();
        }
        
        await SICOF_CONFIG.supabase.auth.signOut();
        localStorage.removeItem('sicof_user');
        localStorage.removeItem('supabase_session');
        console.log('👋 Sesión cerrada');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error en logout:', error);
        alert('Error al cerrar sesión');
    }
};

// ============================================
// FUNCIONES DE UTILIDAD PARA BASE DE DATOS
// ============================================

// Verificar existencia de cuartel
window.verificarCuartel = async function(codigoCuartel) {
    try {
        if (!SICOF_CONFIG.supabase) {
            SICOF_CONFIG.initSupabase();
        }
        
        const { data, error } = await SICOF_CONFIG.supabase
            .from('cuarteles')
            .select('codigo, nombre')
            .eq('codigo', codigoCuartel)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return { existe: false, mensaje: `El cuartel ${codigoCuartel} no existe en la base de datos` };
            }
            throw error;
        }
        
        return { existe: true, data: data };
        
    } catch (error) {
        console.error('Error verificando cuartel:', error);
        return { existe: false, mensaje: `Error al verificar cuartel: ${error.message}` };
    }
};

// Obtener cuarteles disponibles
window.obtenerCuarteles = async function() {
    try {
        if (!SICOF_CONFIG.supabase) {
            SICOF_CONFIG.initSupabase();
        }
        
        const { data, error } = await SICOF_CONFIG.supabase
            .from('cuarteles')
            .select('codigo, nombre')
            .order('nombre');
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        console.error('Error obteniendo cuarteles:', error);
        // Usar lista local como fallback
        return SICOF_CONFIG.cuarteles || [];
    }
};

// ============================================
// FUNCIONES DE DIAGNÓSTICO
// ============================================

// Verificar conexión a Supabase
window.verificarConexionSupabase = async function() {
    console.log('🔧 Verificando conexión a Supabase...');
    
    try {
        if (!SICOF_CONFIG.supabase) {
            SICOF_CONFIG.initSupabase();
        }
        
        // Test simple a la API REST
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        console.log('📡 Status REST API:', response.status, response.ok ? '✅ OK' : '❌ ERROR');
        
        // Test con Supabase SDK
        const { data, error } = await SICOF_CONFIG.supabase
            .from('cuarteles')
            .select('count')
            .limit(1);
        
        if (error) {
            console.log('🔌 Supabase SDK:', '❌ Error:', error.message);
        } else {
            console.log('🔌 Supabase SDK:', '✅ Conexión establecida');
        }
        
        return {
            restApi: response.ok,
            sdk: !error,
            status: error ? `Error: ${error.message}` : 'Conectado'
        };
        
    } catch (error) {
        console.error('❌ Error en verificación:', error);
        return {
            restApi: false,
            sdk: false,
            status: `Error: ${error.message}`
        };
    }
};

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Supabase
    SICOF_CONFIG.initSupabase();
    
    console.log('🚀 SICOF Config v3.0 inicializado');
    console.log('📊 Cuarteles configurados:', SICOF_CONFIG.cuarteles.length);
    
    // Verificar conexión (solo en modo desarrollo)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(() => {
            verificarConexionSupabase();
        }, 1000);
    }
});

// Exportar para uso global
window.SICOF_CONFIG = SICOF_CONFIG;
