// ============================================
// MÓDULO DIGITADOR - SICOF
// ============================================

// Guardar servicio completo en la base de datos
async function guardarServicio(paso1, paso2, paso3) {
    try {
        const user = JSON.parse(localStorage.getItem('sicof_user'));
        
        if (!user) {
            throw new Error('Usuario no autenticado');
        }
        
        // Preparar datos del servicio
        const servicioData = {
            // Paso 1: Datos básicos
            fecha: paso1.fecha,
            cuartel_codigo: paso1.cuartel_codigo,
            nombre_servicio: paso1.nombre_servicio,
            jefe_servicio: paso1.jefe_servicio,
            horario_inicio: paso1.horario_inicio,
            horario_termino: paso1.horario_termino,
            
            // Paso 2: Demanda ciudadana
            controles_investigativos: paso2.controles_investigativos,
            controles_preventivos: paso2.controles_preventivos,
            controles_migratorios: paso2.controles_migratorios,
            controles_vehiculares: paso2.controles_vehiculares,
            infracciones_transito: paso2.infracciones_transito,
            otras_infracciones: paso2.otras_infracciones,
            detenidos_cantidad: paso2.detenidos_cantidad,
            motivo_detencion: paso2.motivo_detencion,
            denuncias_vulneracion: paso2.denuncias_vulneracion,
            participantes_nna: paso2.participantes_nna,
            participantes_adultos: paso2.participantes_adultos,
            
            // Paso 3: Demanda preventiva
            hitos_planificados: paso3.hitos_planificados,
            pnh_planificados: paso3.pnh_planificados,
            sitios_planificados: paso3.sitios_planificados,
            hitos_realizados: paso3.hitos_realizados,
            pnh_realizados: paso3.pnh_realizados,
            sitios_realizados: paso3.sitios_realizados,
            observaciones: paso3.observaciones,
            
            // Metadata
            digitador_email: user.email,
            created_at: new Date().toISOString()
        };
        
        // Guardar en Supabase
        const { data, error } = await window.supabase
            .from('servicios')
            .insert([servicioData])
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error guardando servicio:', error);
        throw error;
    }
}

// Limpiar datos de sesión
function limpiarDatosServicio() {
    localStorage.removeItem('servicio_paso1');
    localStorage.removeItem('servicio_paso2');
    localStorage.removeItem('servicio_paso3');
}

// Obtener servicios del digitador
async function obtenerServiciosDigitador(cuartelCodigo, fechaInicio, fechaFin) {
    try {
        let query = window.supabase
            .from('servicios')
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
        console.error('Error obteniendo servicios:', error);
        throw error;
    }
}

// Calcular estadísticas del servicio
function calcularEstadisticasServicio(paso2, paso3) {
    // Total de controles
    const totalControles = 
        paso2.controles_investigativos +
        paso2.controles_preventivos +
        paso2.controles_migratorios +
        paso2.controles_vehiculares;
    
    // Total de infracciones
    const totalInfracciones = 
        paso2.infracciones_transito +
        paso2.otras_infracciones;
    
    // Cumplimiento de planificación
    const cumplimientoHitos = paso3.hitos_planificados > 0 
        ? Math.round((paso3.hitos_realizados / paso3.hitos_planificados) * 100) 
        : 0;
    
    const cumplimientoPNH = paso3.pnh_planificados > 0 
        ? Math.round((paso3.pnh_realizados / paso3.pnh_planificados) * 100) 
        : 0;
    
    const cumplimientoSitios = paso3.sitios_planificados > 0 
        ? Math.round((paso3.sitios_realizados / paso3.sitios_planificados) * 100) 
        : 0;
    
    const cumplimientoPromedio = Math.round(
        (cumplimientoHitos + cumplimientoPNH + cumplimientoSitios) / 3
    );
    
    return {
        totalControles,
        totalInfracciones,
        totalDetenidos: paso2.detenidos_cantidad,
        totalDenuncias: paso2.denuncias_vulneracion,
        cumplimientoHitos,
        cumplimientoPNH,
        cumplimientoSitios,
        cumplimientoPromedio
    };
}

// Validar datos de servicio
function validarDatosServicio(paso1, paso2, paso3) {
    const errores = [];
    
    // Validar paso 1
    if (!paso1.fecha) errores.push('Fecha es requerida');
    if (!paso1.cuartel_codigo) errores.push('Cuartel es requerido');
    if (!paso1.nombre_servicio) errores.push('Nombre del servicio es requerido');
    if (!paso1.jefe_servicio) errores.push('Jefe del servicio es requerido');
    if (!paso1.horario_inicio) errores.push('Horario de inicio es requerido');
    if (!paso1.horario_termino) errores.push('Horario de término es requerido');
    
    if (paso1.horario_inicio >= paso1.horario_termino) {
        errores.push('El horario de término debe ser posterior al de inicio');
    }
    
    // Validar paso 2
    if (paso2.detenidos_cantidad > 0 && !paso2.motivo_detencion) {
        errores.push('Si hay detenidos, debe especificar el motivo');
    }
    
    // Validar paso 3
    if (paso3.hitos_realizados > paso3.hitos_planificados) {
        errores.push('No puede realizar más hitos de los planificados');
    }
    
    if (paso3.pnh_realizados > paso3.pnh_planificados) {
        errores.push('No puede realizar más PNH de los planificados');
    }
    
    if (paso3.sitios_realizados > paso3.sitios_planificados) {
        errores.push('No puede realizar más sitios de los planificados');
    }
    
    return errores;
}
