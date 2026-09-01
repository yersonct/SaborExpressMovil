-- =============================================================================
-- SaborExpress - Definición de entidades (DDL) COMPLETO
-- =============================================================================
-- Proyecto: Sistema de gestión de restaurante (app móvil + panel web)
-- Dialecto: MySQL / MariaDB.
-- Datos: SIN DATOS (Solo estructura limpia para iniciar la API)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. branches  (sedes / sucursales)
-- -----------------------------------------------------------------------------
CREATE TABLE branches (
    id            INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único de la sede.
    name          VARCHAR(100) NOT NULL,            -- Nombre de la sede (ej. "Sede Principal").
    address       VARCHAR(255),                     -- Dirección física de la sede.
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. roles y permissions (Seguridad y Control de Accesos - RBAC)
--    Agregados según tu MER original para hacer el sistema escalable.
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(50) UNIQUE NOT NULL,      -- Ej: 'ADMIN', 'CAJERO', 'MESERO', 'COCINERO', 'REPARTIDOR'
    description   VARCHAR(255),
    status        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) UNIQUE NOT NULL,     -- Ej: 'CREATE_ORDER', 'VIEW_REPORTS', 'CLOSE_SHIFT'
    module        VARCHAR(50) NOT NULL,             -- Ej: 'CAJA', 'COCINA', 'INVENTARIO'
    description   VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id       INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 3. users  (cuentas de acceso global)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) UNIQUE,
    email         VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    role_id       INT NOT NULL,                     -- Vinculado a la tabla de roles reales
    token         VARCHAR(255),                     -- Token de sesión (JWT)
    branch_id     INT,                              -- Sede a la que pertenece
    status        BOOLEAN DEFAULT TRUE,             -- Activo / Inactivo
    last_login    TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_user_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- -----------------------------------------------------------------------------
-- 4. employees  (personal / talento humano)
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNIQUE,                       -- Vínculo opcional con users
    full_name     VARCHAR(120) NOT NULL,
    document      VARCHAR(20) NOT NULL UNIQUE,      -- Cédula
    email         VARCHAR(120) UNIQUE,
    phone         VARCHAR(20),
    address       VARCHAR(255),
    photo         VARCHAR(255),
    role_name     VARCHAR(50) NOT NULL,             -- Cargo nominal (para mostrar rápido)
    branch_id     INT,
    status        VARCHAR(15) NOT NULL DEFAULT 'Activo', 
    base_pay      DECIMAL(10,2) DEFAULT 0,          -- Pago base del turno
    start_time    TIME,                             -- Inicio de jornada
    end_time      TIME,                             -- Fin de jornada
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_employee_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT chk_employee_status CHECK (status IN ('Activo','Inactivo'))
);

-- -----------------------------------------------------------------------------
-- 5. categories  (categorías del menú)
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    type          VARCHAR(20) DEFAULT 'COCINA',     -- 'COCINA' o 'SOLO_PASAR'
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_category_type CHECK (type IN ('COCINA','SOLO_PASAR'))
);

-- -----------------------------------------------------------------------------
-- 6. products  (ítems del menú / catálogo)
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    description   TEXT,
    price         DECIMAL(10,2) NOT NULL,
    image         VARCHAR(255),
    stock         INT DEFAULT 0,
    category_id   INT,
    branch_id     INT,
    active        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_product_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- -----------------------------------------------------------------------------
-- 7. tables  (mesas físicas)
-- -----------------------------------------------------------------------------
CREATE TABLE tables (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(50) NOT NULL,
    branch_id     INT,
    status        VARCHAR(20) DEFAULT 'LIBRE',      -- 'LIBRE' u 'OCUPADA'
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_table_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT chk_table_status CHECK (status IN ('LIBRE','OCUPADA'))
);

-- -----------------------------------------------------------------------------
-- 8. customers  (clientes / destinatarios de domicilio)
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNIQUE,                       -- Vínculo si el cliente crea cuenta en la app
    full_name     VARCHAR(120),
    phone         VARCHAR(30),
    address       VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 9. orders  (pedidos - encabezado)
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id            VARCHAR(30) PRIMARY KEY,          -- Ej. 'ORD-101'
    type          VARCHAR(20) NOT NULL,             -- 'mesa', 'llevar', 'Domicilio'
    status        VARCHAR(25) NOT NULL DEFAULT 'PENDIENTE', 
    table_id      INT,                              -- Mesa asociada
    waiter_id     INT,                              -- Mesero responsable
    customer_id   INT,                              -- Destinatario (domicilios)
    subtotal      DECIMAL(10,2) DEFAULT 0,
    total         DECIMAL(10,2) NOT NULL,
    time_label    VARCHAR(20),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_table FOREIGN KEY (table_id) REFERENCES tables(id),
    CONSTRAINT fk_order_waiter FOREIGN KEY (waiter_id) REFERENCES employees(id),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT chk_order_type CHECK (type IN ('mesa','llevar','Domicilio')),
    CONSTRAINT chk_order_status CHECK (status IN ('PENDIENTE','PREPARANDO','LISTO','EN_RUTA','ENTREGADO'))
);

-- -----------------------------------------------------------------------------
-- 10. order_items  (detalle de pedido)
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_id      VARCHAR(30) NOT NULL,
    product_id    INT,
    name          VARCHAR(150) NOT NULL,
    quantity      INT NOT NULL DEFAULT 1,
    unit_price    DECIMAL(10,2) NOT NULL,
    note          TEXT,                             -- Instrucciones (ej. "Sin cebolla")
    takeaway      BOOLEAN DEFAULT FALSE,            -- ¿Se empaca para llevar?
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 11. payments  (transacciones de pago)
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_id      VARCHAR(30) NOT NULL UNIQUE,
    method        VARCHAR(20),                      -- 'Efectivo', 'Datáfono', 'Transferencia', 'wompi'
    status        VARCHAR(15) DEFAULT 'Pendiente',  -- 'Pendiente', 'Pagado'
    proof_url     VARCHAR(255),                     -- Foto comprobante Nequi/Banco
    paid_at       TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_method CHECK (method IS NULL OR method IN ('Efectivo','Datáfono','Transferencia','wompi')),
    CONSTRAINT chk_payment_status CHECK (status IN ('Pendiente','Pagado'))
);

-- -----------------------------------------------------------------------------
-- 12. deliveries  (asignación a repartidor)
-- -----------------------------------------------------------------------------
CREATE TABLE deliveries (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_id      VARCHAR(30) NOT NULL UNIQUE,
    driver_id     INT,                              -- Repartidor asignado
    fee           DECIMAL(10,2) DEFAULT 0,          -- Tarifa domicilio
    driver_status VARCHAR(15) DEFAULT 'Pendiente',  -- 'Pendiente' o 'Aceptado'
    assigned_at   TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_driver FOREIGN KEY (driver_id) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT chk_delivery_driver_status CHECK (driver_status IN ('Pendiente','Aceptado'))
);

-- -----------------------------------------------------------------------------
-- 13. cash_closures  (cierre de caja maestro)
-- -----------------------------------------------------------------------------
CREATE TABLE cash_closures (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    cashier_id    INT NOT NULL,
    branch_id     INT,
    shift         VARCHAR(50),                      -- Ej: 'Tarde (14:00 - 22:00)'
    closure_date  DATE DEFAULT (CURRENT_DATE),
    expected_cash DECIMAL(12,2) DEFAULT 0,
    physical_cash DECIMAL(12,2) DEFAULT 0,
    difference    DECIMAL(12,2) DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'ABIERTO',    -- 'ABIERTO', 'CERRADO', 'CUADRADO'
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_closure_cashier FOREIGN KEY (cashier_id) REFERENCES employees(id),
    CONSTRAINT fk_closure_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT chk_closure_status CHECK (status IN ('ABIERTO','CERRADO','CUADRADO'))
);

-- -----------------------------------------------------------------------------
-- 14. cash_movements  (líneas de historial de caja)
-- -----------------------------------------------------------------------------
CREATE TABLE cash_movements (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    closure_id    INT NOT NULL,
    time_label    VARCHAR(10),
    reference     VARCHAR(30),
    concept       VARCHAR(120),
    responsible   VARCHAR(120),
    method        VARCHAR(20),                      -- 'Efectivo', 'Transferencia', 'Físico'
    amount        DECIMAL(12,2) DEFAULT 0,
    audit_status  VARCHAR(20) DEFAULT 'OK',         -- 'OK', 'Bco.', 'Pendiente', 'Reclamado'
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movement_closure FOREIGN KEY (closure_id) REFERENCES cash_closures(id) ON DELETE CASCADE,
    CONSTRAINT chk_movement_method CHECK (method IN ('Efectivo','Transferencia','Físico')),
    CONSTRAINT chk_movement_audit CHECK (audit_status IN ('OK','Bco.','Pendiente','Reclamado'))
);

-- -----------------------------------------------------------------------------
-- 15. settings  (NUEVA: Configuraciones globales / por usuario)
--     Para manejar el Modo Oscuro, Idioma y Sonidos que ya tienes en React.
-- -----------------------------------------------------------------------------
CREATE TABLE settings (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT,                              -- Opcional, si es global se deja NULL
    setting_key   VARCHAR(50) NOT NULL,             -- Ej: 'theme', 'language', 'auto_print', 'sound_alerts'
    setting_value VARCHAR(255) NOT NULL,            -- Ej: 'dark', 'es', 'true'
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_setting_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 16. audit_logs  (NUEVA: Historial de acciones críticas del sistema)
--     Obligatorio en un software empresarial para rastrear quién borró qué.
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT,                              -- Quién hizo la acción
    action        VARCHAR(50) NOT NULL,             -- Ej: 'DELETE_ORDER', 'UPDATE_INVENTORY'
    table_name    VARCHAR(50) NOT NULL,             -- Tabla afectada (ej: 'orders')
    record_id     VARCHAR(50),                      -- ID del registro afectado
    details       TEXT,                             -- JSON con los cambios realizados
    ip_address    VARCHAR(45),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- Índices para optimizar velocidad de la API
-- =============================================================================
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_type        ON orders(type);
CREATE INDEX idx_orders_waiter      ON orders(waiter_id);
CREATE INDEX idx_orders_table       ON orders(table_id);
CREATE INDEX idx_orders_customer    ON orders(customer_id);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_payments_order     ON payments(order_id);
CREATE INDEX idx_deliveries_driver  ON deliveries(driver_id);
CREATE INDEX idx_cash_movements_cls ON cash_movements(closure_id);
CREATE INDEX idx_employees_branch   ON employees(branch_id);
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_users_role         ON users(role_id);