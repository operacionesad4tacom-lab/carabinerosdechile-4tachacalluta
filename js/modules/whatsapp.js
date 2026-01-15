// ============================================
// SICOF - MÓDULO WHATSAPP INTEGRATION
// Envío de alertas y resúmenes por WhatsApp
// ============================================

window.WhatsAppModule = {
    
    // Configuración (actualizar con tus credenciales de Twilio)
    config: {
        // OPCIÓN 1: Twilio (recomendado)
        provider: 'twilio',  // 'twilio' o 'whatsapp-business-api'
        
        // Credenciales Twilio (obtener en: https://www.twilio.com/console)
        twilioAccountSid: 'TU_ACCOUNT_SID',  // Actualizar
        twilioAuthToken: 'TU_AUTH_TOKEN',    // Actualizar
        twilioWhatsAppNumber: 'whatsapp:+14155238886',  // Número Twilio Sandbox
        
        // Números de destino (actualizar con números reales)
        destinatarios: {
            jefe_chacalluta: '+56912345678',      // Actualizar
            jefe_visviri: '+56912345679',         // Actualizar
            jefatura: '+56912345680',             // Actualizar
            admin: '+56912345681'                 // Actualizar
        }
    },
    
    // Obtener destinatarios por rol
    getDestinatarios: function(rol, cuartelCodigo = null) {
        const destinatarios = [];
        
        switch(rol) {
            case 'jefe':
                // Enviar al jefe del cuartel específico
                if (cuartelCodigo === 'CHA') {
                    destinatarios.push(this.config.destinatarios.jefe_chacalluta);
                } else if (cuartelCodigo === 'VIS') {
                    destinatarios.push(this.config.destinatarios.jefe_visviri);
                }
                break;
                
            case 'jefatura':
                // Enviar a jefatura regional
                destinatarios.push(this.config.destinatarios.jefatura);
                break;
                
            case 'admin':
                // Enviar a administrador
                destinatarios.push(this.config.destinatarios.admin);
                break;
                
            case 'todos':
                // Enviar a todos
                Object.values(this.config.destinatarios).forEach(num => {
                    destinatarios.push(num);
                });
                break;
        }
        
        return destinatarios;
    },
    
    // Enviar mensaje WhatsApp vía Twilio
    enviarViaTwilio: async function(numero, mensaje) {
        try {
            // NOTA: Esto requiere un backend/API intermedio por seguridad
            // NO exponer credenciales de Twilio en frontend
            
            // URL de tu API backend
            const apiUrl = '/api/whatsapp/send';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: numero,
                    message: mensaje
                })
            });
            
            if (!response.ok) {
                throw new Error('Error enviando WhatsApp');
            }
            
            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error('Error en envío WhatsApp:', error);
            return { success: false, error: error.message };
        }
    },
    
    // MODO SIMULACIÓN (para desarrollo sin Twilio)
    enviarSimulado: function(numero, mensaje) {
        console.log('📱 WHATSAPP SIMULADO:');
        console.log('Para:', numero);
        console.log('Mensaje:', mensaje);
        console.log('---');
        
        // Simular delay de red
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ 
                    success: true, 
                    simulado: true,
                    mensaje: 'Mensaje simulado enviado'
                });
            }, 1000);
        });
    },
    
    // Enviar alerta
    enviarAlerta: async function(servicio, tipoAlerta = 'detencion') {
        try {
            // Generar mensaje usando módulo de alertas
            const mensaje = window.AlertasTempranasModule.generarMensajeWhatsApp(
                servicio, 
                { tipo: tipoAlerta, prioridad: 'alta' }
            );
            
            // Determinar destinatarios
            let destinatarios = [];
            
            // Siempre enviar a jefe del cuartel
            destinatarios = destinatarios.concat(
                this.getDestinatarios('jefe', servicio.cuartel_codigo)
            );
            
            // Si es crítico, también a jefatura
            if (servicio.detenidos_cantidad >= 3 || tipoAlerta === 'incidente_grave') {
                destinatarios = destinatarios.concat(
                    this.getDestinatarios('jefatura')
                );
            }
            
            // Enviar a cada destinatario
            const promesas = destinatarios.map(numero => {
                // MODO SIMULACIÓN (cambiar a enviarViaTwilio en producción)
                return this.enviarSimulado(numero, mensaje);
            });
            
            const resultados = await Promise.all(promesas);
            
            // Guardar registro de envío
            await this.guardarRegistroEnvio({
                servicio_id: servicio.id,
                tipo_alerta: tipoAlerta,
                destinatarios: destinatarios,
                mensaje: mensaje,
                resultados: resultados
            });
            
            return {
                success: true,
                enviados: resultados.filter(r => r.success).length,
                total: destinatarios.length
            };
            
        } catch (error) {
            console.error('Error enviando alerta:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Enviar resumen diario
    enviarResumenDiario: async function(cuartelCodigo, fecha = null) {
        try {
            if (!fecha) {
                fecha = new Date().toISOString().split('T')[0];
            }
            
            // Obtener servicios del día
            const { data: servicios, error } = await window.supabase
                .from('servicios')
                .select('*')
                .eq('cuartel_codigo', cuartelCodigo)
                .eq('fecha', fecha);
            
            if (error) throw error;
            
            // Generar mensaje de resumen
            const mensaje = this.generarMensajeResumen(servicios, cuartelCodigo, fecha);
            
            // Enviar a jefe del cuartel
            const destinatarios = this.getDestinatarios('jefe', cuartelCodigo);
            
            const promesas = destinatarios.map(numero => {
                return this.enviarSimulado(numero, mensaje);
            });
            
            await Promise.all(promesas);
            
            return { success: true, servicios: servicios.length };
            
        } catch (error) {
            console.error('Error enviando resumen:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Generar mensaje de resumen
    generarMensajeResumen: function(servicios, cuartelCodigo, fecha) {
        const cuartel = window.SICOF_CONFIG.cuarteles.find(c => c.codigo === cuartelCodigo);
        
        let mensaje = `🎖️ *RESUMEN DIARIO - SICOF*\n\n`;
        mensaje += `📍 *Cuartel:* ${cuartel ? cuartel.nombre : cuartelCodigo}\n`;
        mensaje += `📅 *Fecha:* ${fecha}\n\n`;
        
        if (servicios.length === 0) {
            mensaje += `ℹ️ No se registraron servicios este día.\n`;
        } else {
            // Estadísticas
            const totalControles = servicios.reduce((sum, s) => 
                sum + (s.controles_investigativos || 0) + 
                (s.controles_preventivos || 0) + 
                (s.controles_migratorios || 0) + 
                (s.controles_vehiculares || 0), 0
            );
            
            const totalDetenidos = servicios.reduce((sum, s) => 
                sum + (s.detenidos_cantidad || 0), 0
            );
            
            const totalInfracciones = servicios.reduce((sum, s) => 
                sum + (s.infracciones_transito || 0) + 
                (s.otras_infracciones || 0), 0
            );
            
            mensaje += `📊 *ESTADÍSTICAS DEL DÍA:*\n\n`;
            mensaje += `✅ *Servicios Completados:* ${servicios.length}\n`;
            mensaje += `🚔 *Total Controles:* ${totalControles}\n`;
            mensaje += `👮 *Detenidos:* ${totalDetenidos}\n`;
            mensaje += `📋 *Infracciones:* ${totalInfracciones}\n\n`;
            
            // Detalles por servicio
            mensaje += `📝 *SERVICIOS:*\n`;
            servicios.forEach((servicio, idx) => {
                mensaje += `\n${idx + 1}. *${servicio.nombre_servicio}*\n`;
                mensaje += `   Jefe: ${servicio.jefe_servicio}\n`;
                mensaje += `   Horario: ${servicio.horario_inicio} - ${servicio.horario_termino}\n`;
                
                if (servicio.detenidos_cantidad > 0) {
                    mensaje += `   🚨 Detenidos: ${servicio.detenidos_cantidad}\n`;
                }
                
                // Condición meteorológica
                if (servicio.condicion_meteo) {
                    const condicion = window.AlertasTempranasModule.getCondicion(servicio.condicion_meteo);
                    if (condicion) {
                        mensaje += `   ${condicion.label}\n`;
                    }
                }
            });
        }
        
        mensaje += `\n---\n`;
        mensaje += `_Resumen automático generado por SICOF_\n`;
        mensaje += `_${new Date().toLocaleString('es-CL')}_`;
        
        return mensaje;
    },
    
    // Guardar registro de envío
    guardarRegistroEnvio: async function(registro) {
        try {
            const { data, error } = await window.supabase
                .from('whatsapp_logs')
                .insert({
                    servicio_id: registro.servicio_id,
                    tipo_alerta: registro.tipo_alerta,
                    destinatarios: registro.destinatarios,
                    mensaje: registro.mensaje,
                    resultados: registro.resultados,
                    enviado_at: new Date().toISOString()
                });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error guardando log WhatsApp:', error);
            // No lanzar error para no bloquear el flujo principal
            return null;
        }
    },
    
    // Probar envío
    probarEnvio: async function(numero = null) {
        const mensaje = `🎖️ *SICOF - Mensaje de Prueba*\n\n` +
                       `Este es un mensaje de prueba del sistema SICOF.\n\n` +
                       `Si recibiste este mensaje, la integración con WhatsApp está funcionando correctamente.\n\n` +
                       `Fecha: ${new Date().toLocaleString('es-CL')}`;
        
        const numeroDestino = numero || this.config.destinatarios.admin;
        
        const resultado = await this.enviarSimulado(numeroDestino, mensaje);
        return resultado;
    }
};

// Inicializar módulo
console.log('✅ Módulo WhatsApp Integration cargado');
