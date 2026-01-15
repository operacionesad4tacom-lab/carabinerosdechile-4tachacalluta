-- ============================================
-- SICOF v3.0 - BASE DE DATOS COMPLETA
-- Supabase desde CERO
-- ============================================
-- 
-- LÓGICA DEL SISTEMA:
-- - DIGITADOR: Registra SERVICIOS POLICIALES (operaciones diarias)
-- - JEFE: Reporta ESTADO DE CUARTELES (infraestructura, recursos)
-- - JEFATURA: Visualiza TODO
-- - ADMIN: Administra TODO
-- ============================================

-- ============================================
-- PASO 1: LIMPIAR TODO
-- ============================================

DROP TABLE IF EXISTS whatsapp_logs CASCADE;
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS estado_cuarteles CASCADE;
DROP TABLE IF EXISTS servicios CASCADE;
DROP TABLE IF EXISTS cuarteles CASCADE;
DROP VIEW IF EXISTS vista_resumen_servicios CASCADE;
DROP VIEW IF EXISTS vista_estado_cuarteles_actual CASCADE;
DROP VIEW IF EXISTS vista_alertas_activas CASCADE;
DROP FUNCTION IF EXISTS crear_alerta_automatica() CASCADE;
DROP FUNCTION IF EXISTS actualizar_updated_at() CASCADE;

-- ============================================
-- PASO 2: TABLA CUARTELES
-- ============================================

CREATE TABLE cuarteles (
    -- Identificación
    codigo TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    
    -- Contacto
    jefe_actual TEXT,
    telefono_jefe TEXT,
    
    -- Metadata
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE cuarteles IS 'Catálogo de cuarteles fronterizos';

-- ============================================
-- PASO 3: TABLA SERVICIOS (DIGITADOR)
-- ============================================
-- Esta tabla registra los SERVICIOS POLICIALES diarios
-- La completa el DIGITADOR

CREATE TABLE servicios (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relación
    cuartel_codigo TEXT NOT NULL REFERENCES cuarteles(codigo),
    
    -- ========================================
    -- DATOS BÁSICOS DEL SERVICIO
    -- ========================================
    fecha DATE NOT NULL,
    nombre_servicio TEXT NOT NULL,
    jefe_servicio TEXT NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_termino TIME NOT NULL,
    
    -- ========================================
    -- CONDICIONES METEOROLÓGICAS
    -- ========================================
    condicion_meteo TEXT,
    -- Valores: despejado, parcialmente_nublado, nublado, lluvia_ligera, 
    -- lluvia_intensa, tormenta, nieve_ligera, nevada_intensa, ventisca,
    -- niebla_densa, helada, viento_fuerte
    
    temperatura DECIMAL(5,2),  -- °C
    visibilidad INTEGER,  -- metros
    viento_velocidad INTEGER,  -- km/h
    observaciones_clima TEXT,
    
    -- ========================================
    -- DEMANDA CIUDADANA
    -- ========================================
    
    -- Controles realizados
    controles_investigativos INTEGER DEFAULT 0,
    controles_preventivos INTEGER DEFAULT 0,
    controles_migratorios INTEGER DEFAULT 0,
    controles_vehiculares INTEGER DEFAULT 0,
    
    -- Infracciones
    infracciones_transito INTEGER DEFAULT 0,
    otras_infracciones INTEGER DEFAULT 0,
    
    -- Detenidos
    detenidos_cantidad INTEGER DEFAULT 0,
    motivo_detencion TEXT,
    -- Valores: robo_hurto, drogas, contrabando, ley_control_armas,
    -- trafico_migrantes, receptacion_vehiculos, otros
    
    -- Denuncias
    denuncias_vulneracion INTEGER DEFAULT 0,
    
    -- Participación ciudadana
    participantes_nna INTEGER DEFAULT 0,
    participantes_adultos INTEGER DEFAULT 0,
    
    -- ========================================
    -- DEMANDA PREVENTIVA
    -- ========================================
    
    -- Hitos
    hitos_planificados INTEGER DEFAULT 0,
    hitos_realizados INTEGER DEFAULT 0,
    
    -- PNH (Patrullaje Preventivo)
    pnh_planificados INTEGER DEFAULT 0,
    pnh_realizados INTEGER DEFAULT 0,
    
    -- Sitios (Puntos críticos)
    sitios_planificados INTEGER DEFAULT 0,
    sitios_realizados INTEGER DEFAULT 0,
    
    -- Observaciones generales
    observaciones TEXT,
    
    -- ========================================
    -- METADATA
    -- ========================================
    digitador_email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE servicios IS 'Servicios policiales diarios registrados por digitadores';

-- ============================================
-- PASO 4: TABLA ESTADO_CUARTELES (JEFE)
-- ============================================
-- Esta tabla registra el ESTADO OPERATIVO del cuartel
-- La completa el JEFE del cuartel

CREATE TABLE estado_cuarteles (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relación
    cuartel_codigo TEXT NOT NULL REFERENCES cuarteles(codigo),
    
    -- Fecha del reporte
    fecha DATE NOT NULL,
    
    -- ========================================
    -- PERSONAL
    -- ========================================
    personal_total INTEGER NOT NULL,
    personal_presente INTEGER NOT NULL,
    personal_ausente INTEGER DEFAULT 0,
    personal_enfermo INTEGER DEFAULT 0,
    personal_permiso INTEGER DEFAULT 0,
    personal_comision INTEGER DEFAULT 0,
    
    -- ========================================
    -- VEHÍCULOS
    -- ========================================
    vehiculos_total INTEGER NOT NULL,
    vehiculos_operativos INTEGER NOT NULL,
    vehiculos_mantencion INTEGER DEFAULT 0,
    vehiculos_inoperativos INTEGER DEFAULT 0,
    
    -- ========================================
    -- ARMAMENTO Y EQUIPAMIENTO
    -- ========================================
    armamento_estado TEXT,
    -- Valores: optimo, bueno, regular, deficiente
    
    equipamiento_estado TEXT,
    -- Valores: optimo, bueno, regular, deficiente
    
    municion_disponible TEXT,
    -- Valores: suficiente, limitada, critica
    
    -- ========================================
    -- COMUNICACIONES
    -- ========================================
    radios_operativas INTEGER,
    radios_total INTEGER,
    comunicacion_estado TEXT,
    -- Valores: optima, buena, regular, deficiente
    
    -- ========================================
    -- INFRAESTRUCTURA
    -- ========================================
    infraestructura_estado TEXT,
    -- Valores: optima, buena, regular, deficiente, critica
    
    agua_disponible BOOLEAN DEFAULT TRUE,
    electricidad_disponible BOOLEAN DEFAULT TRUE,
    calefaccion_funcionando BOOLEAN DEFAULT TRUE,
    
    -- ========================================
    -- COMBUSTIBLE Y SUMINISTROS
    -- ========================================
    combustible_litros DECIMAL(8,2),
    combustible_estado TEXT,
    -- Valores: suficiente, limitado, critico
    
    viveres_estado TEXT,
    -- Valores: suficiente, limitado, critico
    
    -- ========================================
    -- NOVEDADES Y OBSERVACIONES
    -- ========================================
    novedades_importantes TEXT,
    problemas_reportados TEXT,
    solicitudes_urgentes TEXT,
    observaciones TEXT,
    
    -- ========================================
    -- ESTADO GENERAL DEL CUARTEL
    -- ========================================
    estado_operativo_general TEXT NOT NULL,
    -- Valores: optimo, operativo, limitado, critico
    
    requiere_atencion_urgente BOOLEAN DEFAULT FALSE,
    
    -- ========================================
    -- METADATA
    -- ========================================
    jefe_email TEXT NOT NULL,
    jefe_nombre TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: Un reporte por día por cuartel
    UNIQUE(cuartel_codigo, fecha)
);

COMMENT ON TABLE estado_cuarteles IS 'Estado operativo diario de cuarteles reportado por jefes';

-- ============================================
-- PASO 5: TABLA ALERTAS
-- ============================================

CREATE TABLE alertas (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relaciones (puede venir de servicio o estado_cuartel)
    servicio_id UUID REFERENCES servicios(id) ON DELETE CASCADE,
    estado_cuartel_id UUID REFERENCES estado_cuarteles(id) ON DELETE CASCADE,
    cuartel_codigo TEXT REFERENCES cuarteles(codigo),
    
    -- Tipo y origen
    origen TEXT NOT NULL,
    -- Valores: servicio, estado_cuartel, manual
    
    tipo TEXT NOT NULL,
    -- Valores: detencion, clima_adverso, falta_personal, 
    -- falta_vehiculos, falta_suministros, infraestructura_critica,
    -- comunicacion_deficiente, incidente_grave
    
    prioridad TEXT NOT NULL,
    -- Valores: baja, media, alta, critica
    
    -- Contenido
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    nivel_riesgo TEXT,
    -- Valores: bajo, medio, alto, muy_alto
    
    -- Estado
    estado TEXT DEFAULT 'activa',
    -- Valores: activa, en_proceso, resuelta, cerrada
    
    leida BOOLEAN DEFAULT FALSE,
    
    -- WhatsApp
    enviado_whatsapp BOOLEAN DEFAULT FALSE,
    destinatarios TEXT[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE alertas IS 'Alertas del sistema (servicios y estado de cuarteles)';

-- ============================================
-- PASO 6: TABLA WHATSAPP_LOGS
-- ============================================

CREATE TABLE whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relaciones
    alerta_id UUID REFERENCES alertas(id) ON DELETE SET NULL,
    servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
    estado_cuartel_id UUID REFERENCES estado_cuarteles(id) ON DELETE SET NULL,
    
    -- Tipo
    tipo_mensaje TEXT,
    -- Valores: alerta_detencion, alerta_clima, alerta_cuartel,
    -- resumen_diario, notificacion_general
    
    -- Destinatarios
    destinatarios TEXT[] NOT NULL,
    mensaje TEXT NOT NULL,
    
    -- Resultados
    resultados JSONB,
    total_enviados INTEGER DEFAULT 0,
    total_fallidos INTEGER DEFAULT 0,
    
    -- Estado
    estado TEXT DEFAULT 'enviado',
    modo TEXT DEFAULT 'simulacion',
    -- Valores: simulacion, produccion
    
    -- Metadata
    enviado_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_logs IS 'Registro de mensajes WhatsApp';

-- ============================================
-- PASO 7: ÍNDICES
-- ============================================

-- Índices para servicios
CREATE INDEX idx_servicios_fecha ON servicios(fecha DESC);
CREATE INDEX idx_servicios_cuartel ON servicios(cuartel_codigo);
CREATE INDEX idx_servicios_digitador ON servicios(digitador_email);
CREATE INDEX idx_servicios_created ON servicios(created_at DESC);
CREATE INDEX idx_servicios_condicion_meteo ON servicios(condicion_meteo);
CREATE INDEX idx_servicios_detenidos ON servicios(detenidos_cantidad) WHERE detenidos_cantidad > 0;

-- Índices para estado_cuarteles
CREATE INDEX idx_estado_cuarteles_fecha ON estado_cuarteles(fecha DESC);
CREATE INDEX idx_estado_cuarteles_cuartel ON estado_cuarteles(cuartel_codigo);
CREATE INDEX idx_estado_cuarteles_jefe ON estado_cuarteles(jefe_email);
CREATE INDEX idx_estado_cuarteles_urgente ON estado_cuarteles(requiere_atencion_urgente) WHERE requiere_atencion_urgente = TRUE;
CREATE INDEX idx_estado_cuarteles_operativo ON estado_cuarteles(estado_operativo_general);

-- Índices para alertas
CREATE INDEX idx_alertas_servicio ON alertas(servicio_id);
CREATE INDEX idx_alertas_estado_cuartel ON alertas(estado_cuartel_id);
CREATE INDEX idx_alertas_cuartel ON alertas(cuartel_codigo);
CREATE INDEX idx_alertas_tipo ON alertas(tipo);
CREATE INDEX idx_alertas_prioridad ON alertas(prioridad);
CREATE INDEX idx_alertas_estado ON alertas(estado);
CREATE INDEX idx_alertas_created ON alertas(created_at DESC);
CREATE INDEX idx_alertas_leida ON alertas(leida) WHERE leida = FALSE;

-- Índices para whatsapp_logs
CREATE INDEX idx_whatsapp_logs_alerta ON whatsapp_logs(alerta_id);
CREATE INDEX idx_whatsapp_logs_enviado ON whatsapp_logs(enviado_at DESC);
CREATE INDEX idx_whatsapp_logs_tipo ON whatsapp_logs(tipo_mensaje);

-- ============================================
-- PASO 8: DESACTIVAR RLS
-- ============================================

ALTER TABLE cuarteles DISABLE ROW LEVEL SECURITY;
ALTER TABLE servicios DISABLE ROW LEVEL SECURITY;
ALTER TABLE estado_cuarteles DISABLE ROW LEVEL SECURITY;
ALTER TABLE alertas DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 9: FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER trigger_actualizar_servicios
    BEFORE UPDATE ON servicios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_actualizar_estado_cuarteles
    BEFORE UPDATE ON estado_cuarteles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_actualizar_alertas
    BEFORE UPDATE ON alertas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- PASO 10: FUNCIÓN ALERTAS AUTOMÁTICAS SERVICIOS
-- ============================================

CREATE OR REPLACE FUNCTION crear_alertas_servicio()
RETURNS TRIGGER AS $$
BEGIN
    -- Alerta por detenidos
    IF NEW.detenidos_cantidad > 0 THEN
        INSERT INTO alertas (
            servicio_id, cuartel_codigo, origen, tipo, prioridad,
            titulo, mensaje, nivel_riesgo, enviado_whatsapp
        )
        VALUES (
            NEW.id,
            NEW.cuartel_codigo,
            'servicio',
            'detencion',
            CASE 
                WHEN NEW.detenidos_cantidad >= 5 THEN 'critica'
                WHEN NEW.detenidos_cantidad >= 3 THEN 'alta'
                ELSE 'media'
            END,
            format('DETENCIÓN: %s persona(s)', NEW.detenidos_cantidad),
            format('🚨 %s persona(s) detenida(s) por %s en %s. Servicio: %s',
                   NEW.detenidos_cantidad,
                   COALESCE(NEW.motivo_detencion, 'motivo no especificado'),
                   NEW.cuartel_codigo,
                   NEW.nombre_servicio),
            CASE 
                WHEN NEW.detenidos_cantidad >= 5 THEN 'muy_alto'
                WHEN NEW.detenidos_cantidad >= 3 THEN 'alto'
                ELSE 'medio'
            END,
            TRUE
        );
    END IF;
    
    -- Alerta por clima adverso
    IF NEW.condicion_meteo IN ('lluvia_intensa', 'nevada_intensa', 'ventisca', 'tormenta', 'niebla_densa') THEN
        INSERT INTO alertas (
            servicio_id, cuartel_codigo, origen, tipo, prioridad,
            titulo, mensaje, nivel_riesgo, enviado_whatsapp
        )
        VALUES (
            NEW.id,
            NEW.cuartel_codigo,
            'servicio',
            'clima_adverso',
            CASE 
                WHEN NEW.condicion_meteo IN ('ventisca', 'tormenta') THEN 'critica'
                ELSE 'alta'
            END,
            format('CLIMA ADVERSO: %s', REPLACE(NEW.condicion_meteo, '_', ' ')),
            format('⛈️ %s en %s. Temp: %s°C, Visibilidad: %sm',
                   REPLACE(NEW.condicion_meteo, '_', ' '),
                   NEW.cuartel_codigo,
                   COALESCE(NEW.temperatura::TEXT, 'N/A'),
                   COALESCE(NEW.visibilidad::TEXT, 'N/A')),
            CASE 
                WHEN NEW.condicion_meteo IN ('ventisca', 'tormenta') THEN 'muy_alto'
                ELSE 'alto'
            END,
            TRUE
        );
    END IF;
    
    -- Alerta por temperatura extrema
    IF NEW.temperatura IS NOT NULL AND NEW.temperatura < -10 THEN
        INSERT INTO alertas (
            servicio_id, cuartel_codigo, origen, tipo, prioridad,
            titulo, mensaje, nivel_riesgo, enviado_whatsapp
        )
        VALUES (
            NEW.id,
            NEW.cuartel_codigo,
            'servicio',
            'clima_adverso',
            'critica',
            format('TEMPERATURA EXTREMA: %s°C', NEW.temperatura),
            format('🌡️ CRÍTICO: Temperatura de %s°C en %s. Riesgo hipotermia',
                   NEW.temperatura, NEW.cuartel_codigo),
            'muy_alto',
            TRUE
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alertas_servicio
    AFTER INSERT ON servicios
    FOR EACH ROW
    EXECUTE FUNCTION crear_alertas_servicio();

-- ============================================
-- PASO 11: FUNCIÓN ALERTAS ESTADO CUARTEL
-- ============================================

CREATE OR REPLACE FUNCTION crear_alertas_estado_cuartel()
RETURNS TRIGGER AS $$
BEGIN
    -- Alerta por falta de personal crítica
    IF NEW.personal_presente < (NEW.personal_total * 0.5) THEN
        INSERT INTO alertas (
            estado_cuartel_id, cuartel_codigo, origen, tipo, prioridad,
            titulo, mensaje, nivel_riesgo, enviado_whatsapp
        )
        VALUES (
            NEW.id,
            NEW.cuartel_codigo,
            'estado_cuartel',
            'falta_personal',
            'alta',
            'FALTA DE PERSONAL CRÍTICA',
            format('⚠️ Solo %s de %s efectivos presentes en %s (%.0f%%)',
                   NEW.personal_presente, NEW.personal_total,
                   NEW.cuartel_codigo,
                   (NEW.personal_presente::DECIMAL / NEW.personal_total * 100)),
            'alto',
            TRUE
        );
    END IF;
    
    -- Alerta por vehículos insuficientes
    IF NEW.vehiculos_operativos < (NEW.vehiculos_total * 0.5) THEN
        INSERT INTO alertas (
            estado_cuartel_id, cuartel_codigo, origen, tipo, prioridad,
            titulo, mensaje, nivel_riesgo, enviado_whatsapp
        )
        VALUES (
            NEW.id,
            NEW.cuartel_codigo,
            'estado_cuartel',
            'falta_vehiculos',
            'alta',
            'FALTA DE VEHÍCULOS OPERATIVOS',
            format('🚗 Solo %s de %s vehículos operativos en %s',
                   NEW.vehiculos_operativos, NEW.vehiculos_total,
                   NEW.cuartel_codigo),
            'alto',
            TRUE
        );
    END IF;
    
    -- Alerta por combustible crítico
    IF NEW.combustible_estado = 'critico' THEN
        INSERT INTO alertas (
            estado_cuartel_id, cuartel_codigo, origen, tipo, prioridad,
            titulo, mensaje, nivel_riesgo, enviado_whatsapp
        )
        VALUES (
            NEW.id,
            NEW.cuartel_codigo,
            'estado_cuartel',
            'falta_suministros',
            'critica',
            'COMBUSTIBLE EN ESTADO CRÍTICO',
            format('⛽ Combustible crítico en %s: %s litros',
                   NEW.cuartel_codigo,
                   COALESCE(NEW.combustible_litros::TEXT, 'desconocido')),
            'muy_alto',
            TRUE
        );
    END IF;
    
    -- Alerta por infraestructura crítica
    IF NEW.infraestructura_estado = 'critica' THEN
        INSERT INTO alertas (
            estado_cuartel_id, cuartel_codigo, origen, tipo, prioridad,
            titulo, mensaje, nivel_riesgo, enviado_whatsapp
        )
        VALUES (
            NEW.id,
            NEW.cuartel_codigo,
            'estado_cuartel',
            'infraestructura_critica',
            'critica',
            'INFRAESTRUCTURA EN ESTADO CRÍTICO',
            format('🏢 Infraestructura crítica en %s. Agua: %s, Electricidad: %s',
                   NEW.cuartel_codigo,
                   CASE WHEN NEW.agua_disponible THEN 'Sí' ELSE 'NO' END,
                   CASE WHEN NEW.electricidad_disponible THEN 'Sí' ELSE 'NO' END),
            'muy_alto',
            TRUE
        );
    END IF;
    
    -- Alerta si requiere atención urgente
    IF NEW.requiere_atencion_urgente = TRUE THEN
        INSERT INTO alertas (
            estado_cuartel_id, cuartel_codigo, origen, tipo, prioridad,
            titulo, mensaje, nivel_riesgo, enviado_whatsapp
        )
        VALUES (
            NEW.id,
            NEW.cuartel_codigo,
            'estado_cuartel',
            'incidente_grave',
            'critica',
            'ATENCIÓN URGENTE REQUERIDA',
            format('🚨 URGENTE en %s: %s',
                   NEW.cuartel_codigo,
                   COALESCE(NEW.novedades_importantes, 'Ver detalles del reporte')),
            'muy_alto',
            TRUE
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alertas_estado_cuartel
    AFTER INSERT ON estado_cuarteles
    FOR EACH ROW
    EXECUTE FUNCTION crear_alertas_estado_cuartel();

-- ============================================
-- PASO 12: VISTAS ÚTILES
-- ============================================

-- Vista resumen de servicios
CREATE OR REPLACE VIEW vista_resumen_servicios AS
SELECT 
    s.fecha,
    s.cuartel_codigo,
    c.nombre as cuartel_nombre,
    COUNT(s.id) as total_servicios,
    SUM(s.controles_investigativos + s.controles_preventivos + 
        s.controles_migratorios + s.controles_vehiculares) as total_controles,
    SUM(s.detenidos_cantidad) as total_detenidos,
    SUM(s.infracciones_transito + s.otras_infracciones) as total_infracciones,
    COUNT(CASE WHEN s.condicion_meteo IN ('lluvia_intensa', 'nevada_intensa', 'ventisca', 'tormenta') 
          THEN 1 END) as servicios_clima_adverso
FROM servicios s
LEFT JOIN cuarteles c ON s.cuartel_codigo = c.codigo
GROUP BY s.fecha, s.cuartel_codigo, c.nombre
ORDER BY s.fecha DESC;

-- Vista estado actual de cuarteles
CREATE OR REPLACE VIEW vista_estado_cuarteles_actual AS
SELECT DISTINCT ON (ec.cuartel_codigo)
    ec.cuartel_codigo,
    c.nombre as cuartel_nombre,
    ec.fecha,
    ec.personal_presente,
    ec.personal_total,
    ROUND((ec.personal_presente::DECIMAL / ec.personal_total * 100), 0) as personal_pct,
    ec.vehiculos_operativos,
    ec.vehiculos_total,
    ec.combustible_estado,
    ec.estado_operativo_general,
    ec.requiere_atencion_urgente,
    ec.jefe_nombre
FROM estado_cuarteles ec
LEFT JOIN cuarteles c ON ec.cuartel_codigo = c.codigo
ORDER BY ec.cuartel_codigo, ec.fecha DESC, ec.created_at DESC;

-- Vista alertas activas
CREATE OR REPLACE VIEW vista_alertas_activas AS
SELECT 
    a.id,
    a.cuartel_codigo,
    c.nombre as cuartel_nombre,
    a.origen,
    a.tipo,
    a.prioridad,
    a.titulo,
    a.mensaje,
    a.estado,
    a.leida,
    a.created_at
FROM alertas a
LEFT JOIN cuarteles c ON a.cuartel_codigo = c.codigo
WHERE a.estado IN ('activa', 'en_proceso')
ORDER BY 
    CASE a.prioridad
        WHEN 'critica' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'media' THEN 3
        ELSE 4
    END,
    a.created_at DESC;

-- ============================================
-- PASO 13: INSERTAR CUARTELES
-- ============================================

INSERT INTO cuarteles (codigo, nombre, ubicacion, jefe_actual, telefono_jefe) VALUES
('CHA', '4ta. Com. Chacalluta (F)', 'Frontera Chacalluta', 'Capitán Juan Pérez', '+56912345678'),
('VIS', 'Tcia Visviri (F)', 'Frontera Visviri', 'Teniente María González', '+56912345679'),
('CHU', 'Tcia Chungara (F)', 'Frontera Chungara', 'Sargento Pedro López', '+56912345680'),
('ALC', 'R. Alcerreca (F)', 'Frontera Alcerreca', NULL, NULL),
('TAC', 'R. Tacora (F)', 'Frontera Tacora', NULL, NULL),
('CAQ', 'R. Caquena (F)', 'Frontera Caquena', NULL, NULL),
('CHUY', 'R. Chucuyo (F)', 'Frontera Chucuyo', NULL, NULL),
('GUA', 'R. Guallatire (F)', 'Frontera Guallatire', NULL, NULL),
('CHIL', 'R. Chilcaya (F)', 'Frontera Chilcaya', NULL, NULL);

-- ============================================
-- PASO 14: DATOS DE PRUEBA - SERVICIOS
-- ============================================

INSERT INTO servicios (
    fecha, cuartel_codigo, nombre_servicio, jefe_servicio,
    horario_inicio, horario_termino,
    condicion_meteo, temperatura, visibilidad,
    controles_investigativos, controles_preventivos,
    controles_migratorios, controles_vehiculares,
    infracciones_transito, detenidos_cantidad, motivo_detencion,
    hitos_planificados, hitos_realizados,
    pnh_planificados, pnh_realizados,
    sitios_planificados, sitios_realizados,
    digitador_email
) VALUES
-- Servicio normal
(CURRENT_DATE - 3, 'CHU', 'Patrullaje Rutinario', 'Sargento Pedro López',
 '06:00', '18:00',
 'parcialmente_nublado', 12.0, 1000,
 7, 15, 20, 18, 5, 0, NULL,
 5, 4, 4, 3, 3, 3,
 'digitador.chungara@carabineros.cl'),

-- Servicio con clima adverso
(CURRENT_DATE - 1, 'CHA', 'Patrullaje Norte', 'Capitán Juan Pérez',
 '08:00', '16:00',
 'lluvia_intensa', -2.5, 150,
 5, 12, 8, 15, 3, 2, 'contrabando',
 4, 4, 3, 2, 2, 2,
 'digitador.chacalluta@carabineros.cl'),

-- Servicio con detenidos
(CURRENT_DATE, 'VIS', 'Control Fronterizo', 'Teniente María González',
 '07:00', '15:00',
 'despejado', 15.0, 2000,
 8, 10, 15, 12, 2, 3, 'drogas',
 3, 3, 2, 2, 1, 1,
 'digitador.visviri@carabineros.cl');

-- ============================================
-- PASO 15: DATOS DE PRUEBA - ESTADO CUARTELES
-- ============================================

INSERT INTO estado_cuarteles (
    cuartel_codigo, fecha,
    personal_total, personal_presente, personal_enfermo, personal_permiso,
    vehiculos_total, vehiculos_operativos, vehiculos_mantencion,
    armamento_estado, equipamiento_estado, municion_disponible,
    radios_operativas, radios_total, comunicacion_estado,
    infraestructura_estado,
    agua_disponible, electricidad_disponible, calefaccion_funcionando,
    combustible_litros, combustible_estado,
    viveres_estado,
    estado_operativo_general,
    jefe_email, jefe_nombre
) VALUES
-- Cuartel en buen estado
(
    'CHA', CURRENT_DATE,
    25, 23, 1, 1,
    6, 5, 1,
    'bueno', 'bueno', 'suficiente',
    8, 10, 'buena',
    'buena',
    TRUE, TRUE, TRUE,
    450.50, 'suficiente',
    'suficiente',
    'operativo',
    'jefe.chacalluta@carabineros.cl', 'Capitán Juan Pérez'
),

-- Cuartel con problemas
(
    'VIS', CURRENT_DATE,
    18, 10, 3, 5,
    4, 2, 2,
    'regular', 'deficiente', 'limitada',
    5, 8, 'regular',
    'regular',
    TRUE, FALSE, FALSE,
    85.00, 'critico',
    'limitado',
    'limitado',
    'jefe.visviri@carabineros.cl', 'Teniente María González'
),

-- Cuartel operativo normal
(
    'CHU', CURRENT_DATE,
    20, 18, 2, 0,
    5, 4, 1,
    'optimo', 'bueno', 'suficiente',
    7, 8, 'optima',
    'optima',
    TRUE, TRUE, TRUE,
    320.00, 'suficiente',
    'suficiente',
    'optimo',
    'jefe.chungara@carabineros.cl', 'Sargento Pedro López'
);

-- ============================================
-- PASO 16: VERIFICACIÓN
-- ============================================

SELECT '✅ TABLAS CREADAS' as status;
SELECT '  - cuarteles' as tabla, COUNT(*) as registros FROM cuarteles;
SELECT '  - servicios' as tabla, COUNT(*) as registros FROM servicios;
SELECT '  - estado_cuarteles' as tabla, COUNT(*) as registros FROM estado_cuarteles;
SELECT '  - alertas' as tabla, COUNT(*) as registros FROM alertas;
SELECT '  - whatsapp_logs' as tabla, COUNT(*) as registros FROM whatsapp_logs;

SELECT '' as espacio;
SELECT '✅ ALERTAS GENERADAS AUTOMÁTICAMENTE' as status;
SELECT tipo, prioridad, COUNT(*) as cantidad
FROM alertas
GROUP BY tipo, prioridad
ORDER BY 
    CASE prioridad
        WHEN 'critica' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'media' THEN 3
        ELSE 4
    END;

SELECT '' as espacio;
SELECT '✅ VISTAS DISPONIBLES' as status;
SELECT '  - vista_resumen_servicios' as vista;
SELECT '  - vista_estado_cuarteles_actual' as vista;
SELECT '  - vista_alertas_activas' as vista;

SELECT '' as espacio;
SELECT '✅ TRIGGERS ACTIVOS' as status;
SELECT '  - trigger_alertas_servicio' as trigger;
SELECT '  - trigger_alertas_estado_cuartel' as trigger;
SELECT '  - trigger_actualizar_* (3 triggers)' as trigger;

-- ============================================
-- ✅ INSTALACIÓN COMPLETADA
-- ============================================

/*
╔════════════════════════════════════════════════╗
║  SICOF v3.0 - BASE DE DATOS COMPLETA          ║
╚════════════════════════════════════════════════╝

ESTRUCTURA:
✅ 5 tablas principales
✅ 3 vistas útiles
✅ 6 triggers automáticos
✅ 20+ índices optimizados

DATOS DE PRUEBA:
✅ 9 cuarteles
✅ 3 servicios (con alertas automáticas)
✅ 3 estados de cuartel (con alertas automáticas)

SIGUIENTE PASO:
→ Crear usuarios en Supabase Auth:
   1. digitador.chacalluta@carabineros.cl
   2. digitador.visviri@carabineros.cl
   3. digitador.chungara@carabineros.cl
   4. jefe.chacalluta@carabineros.cl
   5. jefe.visviri@carabineros.cl
   6. jefe.chungara@carabineros.cl
   7. jefatura@carabineros.cl
   8. admin@carabineros.cl

   Password: Montañaofrontera2026

¡LISTO PARA USAR!
*/
