// ============================================
// SICOF - CONFIGURACIÓN CON SUPABASE AUTH
// ============================================

// 🔐 CLAVES SUPABASE
const SUPABASE_URL = "https://rytpgbfbeeuqzcgeujzy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHBnYmZiZWV1cXpjZ2V1anp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjUwMDcsImV4cCI6MjA4NDA0MTAwN30.dQ2WlMBAVqLg8hUWUPxpLMMw3XO7-PRTn9gxf9Bslac";

// Inicializar Supabase CORRECTAMENTE
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// CONFIGURACIÓN GENERAL
// ============================================

const PASSWORD_GENERICA = 'Montañaofrontera2026';

window.SICOF_CONFIG = {
    version: '2.0.0',
    redirectUrls: {
        digitador: 'servicios/datos-servicio.html',
        jefe: 'cuarteles/estado-operativo.html',
        admin: 'admin/admin-panel.html',
        jefatura: 'dashboard.html'
    }
};

// ============================================
// USUARIOS AUTORIZADOS (ACTUALIZADO)
// ============================================

const USUARIOS_METADATA = {
    'digitador.chacalluta@carabineros.cl': { 
        nombre: 'Digitador Chacalluta', 
        rol: 'digitador', 
        cuartel_codigo: 'CHA' 
    },
    'digitador.visviri@carabineros.cl': { 
        nombre: 'Digitador Visviri', 
        rol: 'digitador', 
        cuartel_codigo: 'VIS' 
    },
    'digitador.chungara@carabineros.cl': { 
        nombre: 'Digitador Chungara', 
        rol: 'digitador', 
        cuartel_codigo: 'CHU' 
    },
    'jefe.chacalluta@carabineros.cl': { 
        nombre: 'Jefe Chacalluta', 
        rol: 'jefe', 
        cuartel_codigo: 'CHA' 
    },
    'jefe.visviri@carabineros.cl': { 
        nombre: 'Jefe Visviri', 
        rol: 'jefe', 
        cuartel_codigo: 'VIS' 
    },
    'jefe.chungara@carabineros.cl': { 
        nombre: 'Jefe Chungara', 
        rol: 'jefe', 
        cuartel_codigo: 'CHU' 
    },
    'jefatura@carabineros.cl': { 
        nombre: 'Jefatura Regional', 
        rol: 'jefatura', 
        cuartel_codigo: null 
    },
    'admin@carabineros.cl': { 
        nombre: 'Administrador', 
        rol: 'admin', 
        cuartel_codigo: null 
    }
};

// ============================================
// LOGIN MEJORADO CON MANEJO DE ERRORES
// ============================================

window.loginUsuario = async function (email, password) {
    console.log('🔐 Iniciando login para:', email);
    
    // Normalizar email
    email = email.toLowerCase().trim();
    
    try {
        // 1. Intentar autenticación con Supabase
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        // 2. Manejar errores de Supabase
        if (error) {
            console.error('❌ Error Supabase:', error);
            
            let mensajeError = 'Error desconocido';
            if (error.message.includes('Invalid login credentials')) {
                mensajeError = 'Usuario o contraseña incorrectos';
            } else if (error.message.includes('Email not confirmed')) {
                mensajeError = 'Debes confirmar tu email primero';
            } else {
                mensajeError = error.message;
            }
            
            throw new Error(mensajeError);
        }

        console.log('✅ Supabase login exitoso:', data.user.email);

        // 3. Verificar si el usuario está autorizado en SICOF
        const metadata = USUARIOS_METADATA[email];
        if (!metadata) {
            console.warn('⚠️ Usuario no autorizado en SICOF:', email);
            // Cerrar sesión de Supabase
            await window.supabase.auth.signOut();
            throw new Error('Usuario no autorizado para acceder al sistema SICOF');
        }

        // 4. Crear objeto usuario con metadata
        const usuario = {
            id: data.user.id,
            email: data.user.email,
            nombre: metadata.nombre,
            rol: metadata.rol,
            cuartel_codigo: metadata.cuartel_codigo,
            session: data.session,
            timestamp: new Date().toISOString()
        };

        console.log('👤 Usuario autenticado:', usuario.nombre, '- Rol:', usuario.rol);
        return usuario;

    } catch (err) {
        console.error('🔥 Error en loginUsuario:', err);
        
        // Re-lanzar el error para que lo maneje el HTML
        if (err instanceof Error) {
            throw err;
        } else {
            throw new Error('Error inesperado en el servidor');
        }
    }
};

// ============================================
// VERIFICAR SESIÓN (CORREGIDO - UNA "S")
// ============================================

window.verificarSesion = async function () {
    try {
        console.log('🔍 Verificando sesión activa...');
        
        // Obtener sesión de Supabase
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (!session || !session.user) {
            console.log('📭 No hay sesión activa en Supabase');
            return null;
        }

        const email = session.user.email.toLowerCase();
        console.log('📧 Email de sesión:', email);

        // Verificar si está en usuarios autorizados
        const metadata = USUARIOS_METADATA[email];
        if (!metadata) {
            console.warn('⚠️ Sesión activa pero usuario no autorizado en SICOF');
            return null;
        }

        const usuario = {
            id: session.user.id,
            email: session.user.email,
            nombre: metadata.nombre,
            rol: metadata.rol,
            cuartel_codigo: metadata.cuartel_codigo,
            session: session
        };

        console.log('✅ Sesión válida para:', usuario.nombre);
        return usuario;

    } catch (error) {
        console.error('❌ Error en verificarSesion:', error);
        return null;
    }
};

// ============================================
// PROTEGER PÁGINAS POR ROL
// ============================================

window.protegerPagina = async function (rolRequerido = null) {
    try {
        const user = await window.verificarSesion();

        if (!user) {
            alert('⚠️ Debes iniciar sesión para acceder a esta página');
            window.location.href = '/index.html';
            return null;
        }

        if (rolRequerido && user.rol !== rolRequerido) {
            alert(`⛔ Acceso denegado.\n\nTu rol: ${user.rol}\nRol requerido: ${rolRequerido}`);
            window.location.href = '/index.html';
            return null;
        }

        return user;
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
        await window.supabase.auth.signOut();
        localStorage.removeItem('sicof_user');
        console.log('👋 Sesión cerrada correctamente');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error en logout:', error);
        alert('Error al cerrar sesión');
    }
};

// ============================================
// FUNCIONES DE DIAGNÓSTICO
// ============================================

// Para probar desde consola del navegador
window.probarLoginDirecto = async function(email = 'admin@carabineros.cl', password = 'Montañaofrontera2026') {
    console.log('🧪 Probando login directo...');
    
    try {
        const result = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (result.error) {
            console.error('❌ Error:', result.error.message);
            
            // ERROR ESPECÍFICO: Usuario sin contraseña
            if (result.error.message.includes('Invalid login credentials')) {
                console.log('\n🔧 SOLUCIÓN:');
                console.log('1. Ve a Supabase Dashboard → Authentication → Users');
                console.log('2. Encuentra el usuario:', email);
                console.log('3. Haz clic en "Reset Password"');
                console.log('4. O ejecuta este SQL en el editor SQL:');
                console.log(`
UPDATE auth.users 
SET encrypted_password = crypt('Montañaofrontera2026', gen_salt('bf'))
WHERE email = '${email}';
                `);
            }
            return false;
        }
        
        console.log('✅ Login exitoso!');
        console.log('Usuario:', result.data.user);
        console.log('Session:', result.data.session);
        
        // Verificar metadata
        const emailLower = email.toLowerCase();
        if (USUARIOS_METADATA[emailLower]) {
            console.log('✅ Usuario autorizado en SICOF');
        } else {
            console.warn('⚠️ Usuario NO está en USUARIOS_METADATA');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error catch:', error);
        return false;
    }
};

// Limpiar todo
window.limpiarTodo = function() {
    localStorage.clear();
    supabase.auth.signOut();
    console.log('🧹 Todo limpiado');
    alert('Sesión limpiada. Recarga la página.');
};

// ============================================
// INICIALIZACIÓN
// ============================================

console.log('🚀 SICOF Config v2.0.0 cargado');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Usuarios disponibles:', Object.keys(USUARIOS_METADATA));
