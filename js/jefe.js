// ============================================
// MÓDULO JEFE - SICOF
// Gestión de estado de cuarteles
// ============================================

// Guardar estado del cuartel en la base de datos
async function guardarEstadoCuartel(formData) {
    try {
        const user = JSON.parse(localStorage.getItem('sicof_user'));
        
        if (!user) {
            throw new Error('Usuario no autenticado');
        }
        
        // Preparar datos del estado
        const estadoData = {
            cuartel_codigo: user.cuartel_codigo,
            fecha: formData.fecha,
            
            // Personal
            personal_total: parseInt(formData.personal_total) || 0,
            personal_presente: parseInt(formData.personal_presente) || 0,
            personal_ausente: parseInt(formData.personal_ausente) || 0,
            personal_enfermo: parseInt(formData.personal_enfermo) || 0,
            personal_permiso: parseInt(formData.personal_permiso) || 0,
            personal_comision: parseInt(formData.personal_comision) || 0,
            
            // Vehículos
            vehiculos_total: parseInt(formData.vehiculos_total) || 0,
            vehiculos_operativos: parseInt(formData.vehiculos_operativos) || 0,
            vehiculos_mantencion: parseInt(formData.vehiculos_mantencion) || 0,
            vehiculos_inoperativos: parseInt(formData.vehiculos_inoperativos) || 0,
            
            // Armamento y equipamiento
            armamento_estado: formData.armamento_estado,
            equipamiento_estado: formData.equipamiento_estado,
            municion_disponible: formData.municion_disponible,
            
            // Comunicaciones
            radios_operativas: parseInt(formData.radios_operativas) || 0,
            radios_total: parseInt(formData.radios_total) || 0,
            comunicacion_estado: formData.comunicacion_estado,
            
            // Infraestructura
            infraestructura_estado: formData.infraestructura_estado,
            agua_disponible: formData.agua_disponible === 'true' || formData.agua_disponible === true,
            electricidad_disponible: formData.electricidad_disponible === 'true' || formData.electricidad_disponible === true,
            calefaccion_funcionando: formData.calefaccion_funcionando === 'true' || formData.calefaccion_funcionando === true,
            
            // Combustible y suministros
            combustible_litros: parseFloat(formData.combustible_litros) || 0,
            combustible_estado: formData.combustible_estado,
            viveres_estado: formData.viveres_estado,
            
            // Novedades
            novedades_importantes: formData.novedades_importantes || '',
            problemas_reportados: formData.problemas_reportados || '',
            solicitudes_urgentes: formData.solicitudes_urgentes || '',
            observaciones: formData.observaciones || '',
            
            // Estado general
            estado_operativo_general: formData.estado_operativo_general,
            requiere_atencion_urgente: formData.requiere_atencion_urgente === 'true' || formData.requiere_atencion_urgente === true,
            
            // Metadata
            jefe_email: user.email,
            jefe_nombre: user.nombre
        };
        
        console.log('Guardando estado del cuartel:', estadoData);
        
        // Guardar en Supabase
        const { data, error } = await window.supabase
            .from('estado_cuarteles')
            .insert([estadoData])
            .select()
            .single();
        
        if (error) {
            console.error('Error de Supabase:', error);
            throw error;
        }
        
        console.log('Estado guardado exitosamente:', data);
        return data;
        
    } catch (error) {
        console.error('Error guardando estado del cuartel:', error);
        throw error;
    }
}

// Obtener último estado del cuartel
async function obtenerUltimoEstado(cuartelCodigo) {
    try {
        const { data, error } = await window.supabase
            .from('estado_cuarteles')
            .select('*')
            .eq('cuartel_codigo', cuartelCodigo)
            .order('fecha', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('Error obteniendo último estado:', error);
        return null;
    }
}

// Obtener estados del cuartel en rango de fechas
async function obtenerEstadosCuartel(cuartelCodigo, fechaInicio, fechaFin) {
    try {
        let query = window.supabase
            .from('estado_cuarteles')
            .select('*')
            .eq('cuartel_codigo', cuartelCodigo)
            .order('fecha', { ascending: false });
        
        if (fechaInicio) {
            query = query.gte('fecha', fechaInicio);
        }
        
        if (fechaFin) {
            query = query.lte('fecha', fechaFin);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error obteniendo estados:', error);
        throw error;
    }
}

// Verificar si ya existe reporte para hoy
async function existeReporteHoy(cuartelCodigo, fecha) {
    try {
        const { data, error } = await window.supabase
            .from('estado_cuarteles')
            .select('id')
            .eq('cuartel_codigo', cuartelCodigo)
            .eq('fecha', fecha)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        return data !== null;
    } catch (error) {
        console.error('Error verificando reporte:', error);
        return false;
    }
}

// Calcular porcentajes automáticamente
function calcularPorcentajePersonal(presente, total) {
    if (!total || total === 0) return 0;
    return Math.round((presente / total) * 100);
}

function calcularPorcentajeVehiculos(operativos, total) {
    if (!total || total === 0) return 0;
    return Math.round((operativos / total) * 100);
}

// Determinar estado automáticamente basado en porcentajes
function determinarEstadoAutomatico(personalPct, vehiculosPct, combustibleEstado) {
    if (personalPct < 50 || vehiculosPct < 50 || combustibleEstado === 'critico') {
        return 'critico';
    } else if (personalPct < 70 || vehiculosPct < 70 || combustibleEstado === 'limitado') {
        return 'limitado';
    } else if (personalPct >= 90 && vehiculosPct >= 90 && combustibleEstado === 'suficiente') {
        return 'optimo';
    } else {
        return 'operativo';
    }
}
