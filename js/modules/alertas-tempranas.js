// ============================================
// SICOF - MÓDULO DE ALERTAS TEMPRANAS
// Incluye: Clima, Riesgos, Notificaciones WhatsApp
// ============================================

window.AlertasTempranasModule = {
    
    // Condiciones meteorológicas disponibles
    condicionesMeteorologicas: [
        { id: 'despejado', label: '☀️ Despejado', riesgo: 'bajo', color: '#27ae60' },
        { id: 'parcialmente_nublado', label: '⛅ Parcialmente Nublado', riesgo: 'bajo', color: '#3498db' },
        { id: 'nublado', label: '☁️ Nublado', riesgo: 'medio', color: '#95a5a6' },
        { id: 'lluvia_ligera', label: '🌧️ Lluvia Ligera', riesgo: 'medio', color: '#3498db' },
        { id: 'lluvia_intensa', label: '⛈️ Lluvia Intensa', riesgo: 'alto', color: '#e67e22' },
        { id: 'tormenta', label: '⚡ Tormenta Eléctrica', riesgo: 'muy_alto', color: '#c0392b' },
        { id: 'nieve_ligera', label: '🌨️ Nieve Ligera', riesgo: 'medio', color: '#3498db' },
        { id: 'nevada_intensa', label: '❄️ Nevada Intensa', riesgo: 'alto', color: '#e67e22' },
        { id: 'ventisca', label: '🌬️ Ventisca', riesgo: 'muy_alto', color: '#c0392b' },
        { id: 'niebla_densa', label: '🌫️ Niebla Densa', riesgo: 'alto', color: '#e67e22' },
        { id: 'helada', label: '🧊 Helada', riesgo: 'medio', color: '#3498db' },
        { id: 'viento_fuerte', label: '💨 Viento Fuerte', riesgo: 'medio', color: '#95a5a6' }
    ],
    
    // Niveles de riesgo operacional
    nivelesRiesgo: {
        'bajo': { 
            label: 'Bajo', 
            color: '#27ae60', 
            icon: '✅',
            recomendacion: 'Condiciones normales de operación'
        },
        'medio': { 
            label: 'Medio', 
            color: '#f39c12', 
            icon: '⚠️',
            recomendacion: 'Extremar precauciones. Equipamiento adicional requerido.'
        },
        'alto': { 
            label: 'Alto', 
            color: '#e67e22', 
            icon: '🚨',
            recomendacion: 'Condiciones adversas. Considerar suspensión de patrullajes.'
        },
        'muy_alto': { 
            label: 'Muy Alto', 
            color: '#c0392b', 
            icon: '🔴',
            recomendacion: 'PELIGRO CRÍTICO. Suspender operaciones no esenciales.'
        }
    },
    
    // Tipos de alertas
    tiposAlerta: [
        { id: 'detencion', label: '👮 Detención', prioridad: 'alta', whatsapp: true },
        { id: 'incidente_grave', label: '🚨 Incidente Grave', prioridad: 'alta', whatsapp: true },
        { id: 'clima_adverso', label: '⛈️ Clima Adverso', prioridad: 'media', whatsapp: true },
        { id: 'falta_recursos', label: '⚠️ Falta de Recursos', prioridad: 'media', whatsapp: false },
        { id: 'exceso_demanda', label: '📈 Exceso de Demanda', prioridad: 'baja', whatsapp: false },
        { id: 'equipamiento_dañado', label: '🔧 Equipo Dañado', prioridad: 'media', whatsapp: false }
    ],
    
    // Obtener condición por ID
    getCondicion: function(id) {
        return this.condicionesMeteorologicas.find(c => c.id === id);
    },
    
    // Obtener nivel de riesgo
    getNivelRiesgo: function(riesgoId) {
        return this.nivelesRiesgo[riesgoId];
    },
    
    // Evaluar riesgo operacional
    evaluarRiesgoOperacional: function(condicionMeteo, detenidos = 0, controles = 0) {
        const condicion = this.getCondicion(condicionMeteo);
        let riesgoBase = condicion ? condicion.riesgo : 'bajo';
        
        // Aumentar riesgo si hay muchos detenidos
        if (detenidos >= 5) {
            if (riesgoBase === 'bajo') riesgoBase = 'medio';
            else if (riesgoBase === 'medio') riesgoBase = 'alto';
        }
        
        // Aumentar riesgo si hay muchos controles
        if (controles >= 50) {
            if (riesgoBase === 'bajo') riesgoBase = 'medio';
        }
        
        return this.getNivelRiesgo(riesgoBase);
    },
    
    // Generar recomendaciones
    generarRecomendaciones: function(condicionMeteo, temperatura, visibilidad) {
        const recomendaciones = [];
        const condicion = this.getCondicion(condicionMeteo);
        
        if (!condicion) return recomendaciones;
        
        // Recomendaciones por clima
        if (condicion.id.includes('lluvia') || condicion.id.includes('nieve')) {
            recomendaciones.push('🧥 Usar equipo impermeable');
            recomendaciones.push('👢 Calzado antideslizante obligatorio');
        }
        
        if (condicion.id.includes('nieve') || condicion.id.includes('ventisca')) {
            recomendaciones.push('❄️ Equipamiento para frío extremo');
            recomendaciones.push('🚗 Cadenas para vehículos');
        }
        
        if (condicion.id === 'niebla_densa') {
            recomendaciones.push('💡 Luces de emergencia activadas');
            recomendaciones.push('📻 Mantener comunicación constante');
        }
        
        if (condicion.id === 'tormenta' || condicion.id === 'ventisca') {
            recomendaciones.push('🏠 Evaluar refugio en cuartel');
            recomendaciones.push('📞 Comunicación permanente con jefatura');
        }
        
        // Recomendaciones por temperatura
        if (temperatura !== null && temperatura !== undefined) {
            if (temperatura < 0) {
                recomendaciones.push('🌡️ Riesgo de hipotermia - Equipamiento térmico');
            }
            if (temperatura < -10) {
                recomendaciones.push('🔴 PELIGRO: Temperatura extrema - Limitar tiempo de exposición');
            }
            if (temperatura > 30) {
                recomendaciones.push('☀️ Hidratación constante - Riesgo de insolación');
            }
        }
        
        // Recomendaciones por visibilidad
        if (visibilidad !== null && visibilidad !== undefined) {
            if (visibilidad < 100) {
                recomendaciones.push('👁️ Visibilidad crítica - Reducir velocidad');
            }
            if (visibilidad < 50) {
                recomendaciones.push('🚨 Visibilidad extremadamente baja - Suspender patrullajes');
            }
        }
        
        return recomendaciones;
    },
    
    // Determinar si requiere WhatsApp
    requiereWhatsApp: function(condicionMeteo, detenidos = 0, tipoAlerta = null) {
        const condicion = this.getCondicion(condicionMeteo);
        
        // Siempre enviar WhatsApp si hay detenidos
        if (detenidos > 0) return true;
        
        // Enviar si clima es riesgo alto o muy alto
        if (condicion && (condicion.riesgo === 'alto' || condicion.riesgo === 'muy_alto')) {
            return true;
        }
        
        // Enviar según tipo de alerta
        if (tipoAlerta) {
            const tipo = this.tiposAlerta.find(t => t.id === tipoAlerta);
            if (tipo && tipo.whatsapp) return true;
        }
        
        return false;
    },
    
    // Generar mensaje para WhatsApp
    generarMensajeWhatsApp: function(servicio, alerta = null) {
        const condicion = this.getCondicion(servicio.condicion_meteo);
        const riesgo = this.evaluarRiesgoOperacional(
            servicio.condicion_meteo, 
            servicio.detenidos_cantidad || 0
        );
        
        let mensaje = `🎖️ *SICOF - Alerta Automática*\n\n`;
        
        // Tipo de alerta
        if (alerta) {
            const tipo = this.tiposAlerta.find(t => t.id === alerta.tipo);
            mensaje += `${tipo.label}\n`;
            mensaje += `Prioridad: ${alerta.prioridad.toUpperCase()}\n\n`;
        }
        
        // Información del servicio
        mensaje += `📍 *Cuartel:* ${servicio.cuartel_nombre}\n`;
        mensaje += `📅 *Fecha:* ${servicio.fecha}\n`;
        mensaje += `⏰ *Horario:* ${servicio.horario_inicio} - ${servicio.horario_termino}\n`;
        mensaje += `👮 *Jefe:* ${servicio.jefe_servicio}\n\n`;
        
        // Condición meteorológica
        if (condicion) {
            mensaje += `🌤️ *Condición:* ${condicion.label}\n`;
            mensaje += `${riesgo.icon} *Riesgo:* ${riesgo.label}\n\n`;
        }
        
        // Temperatura
        if (servicio.temperatura !== null && servicio.temperatura !== undefined) {
            mensaje += `🌡️ *Temperatura:* ${servicio.temperatura}°C\n`;
        }
        
        // Visibilidad
        if (servicio.visibilidad !== null && servicio.visibilidad !== undefined) {
            mensaje += `👁️ *Visibilidad:* ${servicio.visibilidad}m\n\n`;
        }
        
        // Datos operacionales
        if (servicio.detenidos_cantidad > 0) {
            mensaje += `🚨 *DETENIDOS:* ${servicio.detenidos_cantidad}\n`;
            if (servicio.motivo_detencion) {
                mensaje += `   Motivo: ${servicio.motivo_detencion}\n`;
            }
            mensaje += `\n`;
        }
        
        mensaje += `📊 *Controles:* ${servicio.controles_total || 0}\n`;
        mensaje += `🚗 *Vehículos:* ${servicio.controles_vehiculares || 0}\n\n`;
        
        // Recomendaciones
        const recomendaciones = this.generarRecomendaciones(
            servicio.condicion_meteo,
            servicio.temperatura,
            servicio.visibilidad
        );
        
        if (recomendaciones.length > 0) {
            mensaje += `⚠️ *Recomendaciones:*\n`;
            recomendaciones.slice(0, 3).forEach(rec => {
                mensaje += `   ${rec}\n`;
            });
        }
        
        mensaje += `\n---\n`;
        mensaje += `_Generado automáticamente por SICOF_\n`;
        mensaje += `_${new Date().toLocaleString('es-CL')}_`;
        
        return mensaje;
    },
    
    // Guardar alerta en BD
    guardarAlerta: async function(alerta) {
        try {
            const { data, error } = await window.supabase
                .from('alertas')
                .insert({
                    servicio_id: alerta.servicio_id,
                    tipo: alerta.tipo,
                    prioridad: alerta.prioridad,
                    mensaje: alerta.mensaje,
                    enviado_whatsapp: alerta.enviado_whatsapp || false,
                    destinatarios: alerta.destinatarios || [],
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error guardando alerta:', error);
            throw error;
        }
    },
    
    // Renderizar selector de condiciones
    renderSelectorCondiciones: function(containerId, selectedId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const html = this.condicionesMeteorologicas.map(condicion => {
            const riesgo = this.getNivelRiesgo(condicion.riesgo);
            const selected = selectedId === condicion.id ? 'selected' : '';
            
            return `
                <option value="${condicion.id}" ${selected} 
                        data-riesgo="${condicion.riesgo}"
                        data-color="${condicion.color}">
                    ${condicion.label} (Riesgo: ${riesgo.label})
                </option>
            `;
        }).join('');
        
        container.innerHTML = html;
    },
    
    // Renderizar indicador de riesgo
    renderIndicadorRiesgo: function(containerId, condicionId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const condicion = this.getCondicion(condicionId);
        if (!condicion) return;
        
        const riesgo = this.getNivelRiesgo(condicion.riesgo);
        
        container.innerHTML = `
            <div class="alerta-riesgo" style="
                background: ${riesgo.color}; 
                color: white; 
                padding: 1rem; 
                border-radius: 8px;
                margin: 1rem 0;
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                    ${riesgo.icon}
                </div>
                <div style="font-weight: bold; font-size: 1.2rem;">
                    Riesgo ${riesgo.label}
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.9rem;">
                    ${riesgo.recomendacion}
                </div>
            </div>
        `;
    }
};

// Inicializar módulo
console.log('✅ Módulo de Alertas Tempranas cargado');
