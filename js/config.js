// ============================================
// CONFIGURACIÓN TEMPORAL PARA PRUEBAS
// ============================================

const SUPABASE_URL = "https://rytpgbfbeeuqzcgeujzy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHBnYmZiZWV1cXpjZ2V1anp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NjUwMDcsImV4cCI6MjA4NDA0MTAwN30.dQ2WlMBAVqLg8hUWUPxpLMMw3XO7-PRTn9gxf9Bslac";

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CONTRASEÑA DE PRUEBA (usa la misma para todos)
const PASSWORD_PRUEBA = 'Montañaofrontera2026';

// ============================================
// FUNCIÓN DE LOGIN SIMPLIFICADA (SOLO PARA PRUEBAS)
// ============================================

window.loginUsuario = async function (email, password) {
    console.log('Intentando login con:', email);
    
    try {
        // 1. Intentar autenticación en Supabase
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password: password
        });

        // 2. Si hay error, mostrar específico
        if (error) {
            console.error('Error Supabase:', error);
            
            if (error.message.includes('Invalid login credentials')) {
                alert('❌ ERROR: El usuario existe pero NO tiene contraseña configurada.\n\nVe a Supabase Dashboard → Users → Reset Password para cada usuario.');
            } else {
                alert('Error: ' + error.message);
            }
            return null;
        }

        // 3. Si login es exitoso
        console.log('Login exitoso:', data.user);
        
        // 4. Definir roles manualmente (temporal)
        let usuarioInfo = {
            id: data.user.id,
            email: data.user.email,
            session: data.session
        };

        // Asignar rol según email
        if (email.includes('admin@')) {
            usuarioInfo.nombre = 'Administrador';
            usuarioInfo.rol = 'admin';
            usuarioInfo.cuartel_codigo = null;
        } else if (email.includes('digitador.')) {
            usuarioInfo.nombre = 'Digitador Chacalluta';
            usuarioInfo.rol = 'digitador';
            usuarioInfo.cuartel_codigo = 'CHA';
        } else if (email.includes('jefe.')) {
            usuarioInfo.nombre = 'Jefe Chacalluta';
            usuarioInfo.rol = 'jefe';
            usuarioInfo.cuartel_codigo = 'CHA';
        }

        // 5. Guardar en localStorage
        localStorage.setItem('sicof_user', JSON.stringify(usuarioInfo));
        
        alert(`✅ Login exitoso!\nBienvenido: ${usuarioInfo.nombre}`);
        
        // 6. Redirigir según rol
        setTimeout(() => {
            if (usuarioInfo.rol === 'admin') {
                window.location.href = 'admin/admin-panel.html';
            } else if (usuarioInfo.rol === 'digitador') {
                window.location.href = 'servicios/datos-servicio.html';
            } else if (usuarioInfo.rol === 'jefe') {
                window.location.href = 'cuarteles/estado-operativo.html';
            }
        }, 1000);

        return usuarioInfo;

    } catch (err) {
        console.error('Error catch:', err);
        alert('Error inesperado: ' + err.message);
        return null;
    }
};

// ============================================
// PRUEBA DIRECTA DESDE CONSOLA
// ============================================

// Para probar inmediatamente, ejecuta en la consola del navegador:
window.probarLogin = async function() {
    console.log('Probando login con admin...');
    await window.loginUsuario('admin@carabineros.cl', 'Montañaofrontera2026');
};
