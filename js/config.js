// ============================================
// SICOF - CONFIGURACIÓN CON SUPABASE AUTH
// ============================================

// 🔐 CLAVES SUPABASE ACTUALIZADAS
const SUPABASE_URL = "https://rytpgbfbeeuqzcgeujzy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHBnYmZiZWV1cXpjZ2V1anp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjUwMDcsImV4cCI6MjA4NDA0MTAwN30.dQ2WlMBAVqLg8hUWUPxpLMMw3XO7-PRTn9gxf9Bslac";

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
// USUARIOS AUTORIZADOS EN SICOF
// ============================================

const USUARIOS_METADATA = {
    'digitador.chacalluta@carabineros.cl': { nombre: 'Digitador Chacalluta', rol: 'digitador', cuartel_codigo: 'CHA' },
    'digitador.visviri@carabineros.cl': { nombre: 'Digitador Visviri', rol: 'digitador', cuartel_codigo: 'VIS' },
    'digitador.chungara@carabineros.cl': { nombre: 'Digitador Chungara', rol: 'digitador', cuartel_codigo: 'CHU' },

    'jefe.chacalluta@carabineros.cl': { nombre: 'Jefe Chacalluta', rol: 'jefe', cuartel_codigo: 'CHA' },
    'jefe.visviri@carabineros.cl': { nombre: 'Jefe Visviri', rol: 'jefe', cuartel_codigo: 'VIS' },
    'jefe.chungara@carabineros.cl': { nombre: 'Jefe Chungara', rol: 'jefe', cuartel_codigo: 'CHU' },

    'jefatura@carabineros.cl': { nombre: 'Jefatura Regional', rol: 'jefatura', cuartel_codigo: null },
    'admin@carabineros.cl': { nombre: 'Administrador', rol: 'admin', cuartel_codigo: null }
};

// ============================================
// LOGIN CON ALERTAS OBLIGATORIAS
// ============================================

window.loginUsuario = async function (email, password) {
    email = email.toLowerCase().trim();

    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email,
            password
        });

        // ❌ Error de autenticación
        if (error) {
            alert('El correo no está registrado o la contraseña es incorrecta');
            return null;
        }

        // 🔒 Usuario existe en Supabase pero NO autorizado en SICOF
        const metadata = USUARIOS_METADATA[email];
        if (!metadata) {
            await window.supabase.auth.signOut();
            alert('Usuario no autorizado para ingresar al sistema SICOF');
            return null;
        }

        const usuario = {
            id: data.user.id,
            email: data.user.email,
            nombre: metadata.nombre,
            rol: metadata.rol,
            cuartel_codigo: metadata.cuartel_codigo,
            session: data.session
        };

        localStorage.setItem('sicof_user', JSON.stringify(usuario));
        return usuario;

    } catch (err) {
        console.error('Error login:', err);
        alert('Error inesperado al iniciar sesión');
        return null;
    }
};

// ============================================
// VERIFICAR SESIÓN
// ============================================

window.verificarSesion = async function () {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session || !session.user) return null;

    const metadata = USUARIOS_METADATA[session.user.email.toLowerCase()];
    if (!metadata) return null;

    return {
        id: session.user.id,
        email: session.user.email,
        nombre: metadata.nombre,
        rol: metadata.rol,
        cuartel_codigo: metadata.cuartel_codigo,
        session
    };
};

// ============================================
// PROTEGER PÁGINAS POR ROL
// ============================================

window.protegerPagina = async function (rolRequerido = null) {
    const user = await window.verificarSesion();

    if (!user) {
        window.location.href = '/index.html';
        return null;
    }

    if (rolRequerido && user.rol !== rolRequerido) {
        alert('No tienes permisos para acceder a esta sección');
        window.location.href = '/index.html';
        return null;
    }

    return user;
};

// ============================================
// LOGOUT
// ============================================

window.logout = async function () {
    await window.supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/index.html';
};
