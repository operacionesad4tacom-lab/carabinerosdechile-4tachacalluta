// ============================================
// SICOF - CONFIGURACIÓN CON SUPABASE AUTH
// ============================================

const SUPABASE_URL = "https://pmvzwppxoyspnhnpbyzg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdnp3cHB4b3lzcG5obnBieXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTM0NDIsImV4cCI6MjA4Mzk4OTQ0Mn0.81nbc_HtRTQygDTjec7QFkalfGpB_lk2J7-EotC0a-Q";

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Contraseña genérica para TODOS los usuarios
const PASSWORD_GENERICA = 'Montañaofrontera2026';

// Configuración
window.SICOF_CONFIG = {
    version: '2.0.0',
    
    cuarteles: [
        { codigo: 'CHA', nombre: '4ta. Com. Chacalluta (F)' },
        { codigo: 'VIS', nombre: 'Tcia Visviri (F)' },
        { codigo: 'CHU', nombre: 'Tcia Chungara (F)' },
        { codigo: 'ALC', nombre: 'R. Alcerreca (F)' },
        { codigo: 'TAC', nombre: 'R. Tacora (F)' },
        { codigo: 'CAQ', nombre: 'R. Caquena (F)' },
        { codigo: 'CHUY', nombre: 'R. Chucuyo (F)' },
        { codigo: 'GUA', nombre: 'R. Guallatire (F)' },
        { codigo: 'CHIL', nombre: 'R. Chilcaya (F)' }
    ],
    
    motivosDetencion: [
        { value: 'robo_hurto', label: 'Robo/Hurto' },
        { value: 'drogas', label: 'Drogas' },
        { value: 'contrabando', label: 'Contrabando' },
        { value: 'ley_control_armas', label: 'Ley Control de Armas' },
        { value: 'trafico_migrantes', label: 'Tráfico de Migrantes' },
        { value: 'receptacion_vehiculos', label: 'Receptación de Vehículos' },
        { value: 'otros', label: 'Otros' }
    ],
    
    redirectUrls: {
        digitador: 'servicios/datos-servicio.html',
        jefe: 'cuarteles/estado-operativo.html',
        admin: 'admin/admin-panel.html',
        jefatura: 'dashboard.html'
    }
};

// Mapeo de usuarios (email → metadata)
const USUARIOS_METADATA = {
    'digitador.chacalluta@carabineros.cl': { nombre: 'Digitador Chacalluta', rol: 'digitador', cuartel_codigo: 'CHA' },
    'digitador.visviri@carabineros.cl': { nombre: 'Digitador Visviri', rol: 'digitador', cuartel_codigo: 'VIS' },
    'digitador.chungara@carabineros.cl': { nombre: 'Digitador Chungara', rol: 'digitador', cuartel_codigo: 'CHU' },
    'jefe.chacalluta@carabineros.cl': { nombre: 'Jefe Chacalluta', rol: 'jefe', cuartel_codigo: 'CHA' },
    'jefe.visviri@carabineros.cl': { nombre: 'Jefe Visviri', rol: 'jefe', cuartel_codigo: 'VIS' },
    'jefatura@carabineros.cl': { nombre: 'Jefatura Regional', rol: 'jefatura', cuartel_codigo: null },
    'admin@carabineros.cl': { nombre: 'Administrador', rol: 'admin', cuartel_codigo: null }
};

// Login usando Supabase Auth
window.loginUsuario = async function(email, password) {
    try {
        // Intentar login con Supabase Auth
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw new Error('Email o contraseña incorrectos');
        }
        
        // Obtener metadata del usuario
        const metadata = USUARIOS_METADATA[email.toLowerCase()];
        
        if (!metadata) {
            throw new Error('Usuario no autorizado en el sistema');
        }
        
        return {
            id: data.user.id,
            email: data.user.email,
            nombre: metadata.nombre,
            rol: metadata.rol,
            cuartel_codigo: metadata.cuartel_codigo,
            session: data.session
        };
        
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
};

// Logout
window.logout = async function() {
    await window.supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/index.html';
};

// Verificar sesión
window.verificarSesion = async function() {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) return null;
    
    const metadata = USUARIOS_METADATA[session.user.email.toLowerCase()];
    
    if (!metadata) return null;
    
    return {
        id: session.user.id,
        email: session.user.email,
        nombre: metadata.nombre,
        rol: metadata.rol,
        cuartel_codigo: metadata.cuartel_codigo,
        session: session
    };
};

// Proteger página
window.protegerPagina = async function(rolRequerido = null) {
    const user = await window.verificarSesion();
    
    if (!user) {
        window.location.href = '/index.html';
        return null;
    }
    
    if (rolRequerido && user.rol !== rolRequerido) {
        alert('No tienes permiso para acceder a esta página');
        window.location.href = '/index.html';
        return null;
    }
    
    return user;
};
