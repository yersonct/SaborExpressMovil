-- =============================================================================
-- SaborExpress - Definición de entidades (DDL)
-- =============================================================================
-- Proyecto: sistema de gestión de restaurante (app móvil + panel web)
-- Generado a partir del análisis del código fuente del repositorio.
--
-- Convención de nombres: se conservan los nombres de tablas y columnas en
--   inglés porque el código TypeScript ya usa tipos en inglés
--   (Order, Employee, Product, OrderItem, User).
-- Valores de datos (estados, roles, métodos de pago): se mantienen EXACTAMENTE
--   igual que los emite el código, para que el esquema coincida con el
--   comportamiento en tiempo de ejecución.
--
-- Principio de Responsabilidad Única aplicado:
--   * La "tabla dios" pedidos se dividió en: orders, order_items, customers,
--     payments, deliveries.
--   * La caja se dividió en: cash_closures (encabezado) y cash_movements (log).
--   * Cada tabla tiene UNA única responsabilidad.
--
-- Dialecto: MySQL / MariaDB.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. branches  (sedes / sucursales)
--    Origen: employees-view.tsx (branch: 'Sede Principal Centro',
--            'Sede Norte', 'Sede Sur')
--    Responsabilidad: almacenar solo los datos de ubicación física.
-- -----------------------------------------------------------------------------
CREATE TABLE branches (
    id          INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único de la sede. Clave primaria que la identifica en todo el sistema.
    name        VARCHAR(100) NOT NULL,            -- Nombre de la sede (ej. "Sede Principal Centro"). Sirve para mostrar y filtrar por sucursal.
    address     VARCHAR(255),                     -- Dirección física de la sede. Útil para logística y domicilios.
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Fecha y hora en que se registró la sede. Sirve para auditoría.
);


-- -----------------------------------------------------------------------------
-- 2. users  (cuentas de acceso)
--    Origen móvil: auth/types/index.ts -> { id, username, role, name }
--    Origen web:     auth.types.ts -> LoginCredentials { email, password },
--                    UserSession { id, email, token }
--    Responsabilidad: autenticación y autorización únicamente.
--    Valores de role (del código): 'repartidor' | 'cocinero' | 'mesero'
--                                  | 'cajero' | 'cliente' | 'admin'
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único del usuario. Clave primaria de la cuenta.
    username      VARCHAR(50) UNIQUE,               -- Nombre de usuario para iniciar sesión. Debe ser único.
    email         VARCHAR(120) UNIQUE NOT NULL,     -- Correo electrónico del usuario. Se usa para login y debe ser único.
    password_hash VARCHAR(255) NOT NULL,            -- Contraseña encriptada (hash). Nunca se guarda en texto plano por seguridad.
    full_name     VARCHAR(120) NOT NULL,            -- Nombre completo real de la persona. Para mostrar en la interfaz.
    role          VARCHAR(20) NOT NULL,             -- Rol del usuario (repartidor, cocinero, mesero, cajero, cliente, admin). Define sus permisos.
    token         VARCHAR(255),                     -- Token de sesión (JWT u otro). Permite mantener la sesión iniciada.
    branch_id     INT,                              -- Sede a la que pertenece el usuario. Relaciona la cuenta con una sucursal.
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación de la cuenta. Para auditoría.
    CONSTRAINT fk_user_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT chk_user_role CHECK (
        role IN ('repartidor','cocinero','mesero','cajero','cliente','admin')
    )
);


-- -----------------------------------------------------------------------------
-- 3. employees  (personal / talento humano)
--    Origen móvil (cajero): { id, name, role, startTime, endTime,
--                            basePay, status }
--    Origen web (empleados): { id, name, email, phone, document, role,
--                             branch, status, address, photo }
--    Responsabilidad: datos de recursos humanos / nómina del personal.
--    role (web): 'CAJERO' | 'COCINERO' | 'REPARTIDOR' | 'MESERO' | 'ADMIN'
--    status:     'Activo' | 'Inactivo'
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id            INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único del empleado. Clave primaria del registro de personal.
    user_id       INT UNIQUE,                       -- Vínculo opcional con una cuenta de usuario (users). Permite login del empleado.
    full_name     VARCHAR(120) NOT NULL,            -- Nombre completo del empleado. Se muestra en directorio y pedidos.
    document      VARCHAR(20) NOT NULL UNIQUE,      -- Documento de identidad (cédula). Único, identifica legalmente al empleado.
    email         VARCHAR(120) UNIQUE,              -- Correo del empleado. Para contacto y envío de credenciales.
    phone         VARCHAR(20),                      -- Teléfono de contacto del empleado.
    address       VARCHAR(255),                     -- Dirección de residencia del empleado.
    photo         VARCHAR(255),                      -- Ruta o URL de la foto del empleado. Para su perfil y directorio.
    role          VARCHAR(20) NOT NULL,             -- Cargo del empleado (CAJERO, COCINERO, REPARTIDOR, MESERO, ADMIN). Define función.
    branch_id     INT,                              -- Sede donde trabaja el empleado. Relaciona con branches.
    status        VARCHAR(15) NOT NULL DEFAULT 'Activo', -- Estado laboral (Activo/Inactivo). Permite suspensión lógica sin borrar.
    base_pay      DECIMAL(10,2) DEFAULT 0,          -- Pago base del turno (basePay). Sirve para cálculo de nómina.
    start_time    TIME,                             -- Hora de inicio del turno (startTime). Para control de jornada.
    end_time      TIME,                             -- Hora de fin del turno (endTime). Para control de jornada.
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de registro del empleado. Auditoría.
    CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_employee_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT chk_employee_role CHECK (
        role IN ('CAJERO','COCINERO','REPARTIDOR','MESERO','ADMIN')
    ),
    CONSTRAINT chk_employee_status CHECK (status IN ('Activo','Inactivo'))
);


-- -----------------------------------------------------------------------------
-- 4. categories  (categorías del menú)
--    Origen: ClientData.ts -> ['Todos','Hamburguesas','Pizzas','Bebidas','Extras']
--            OrderTakingView.tsx -> category: 'COCINA' | 'SOLO_PASAR'
--    Responsabilidad: clasificación del menú únicamente.
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,     -- Identificador único de la categoría. Clave primaria.
    name        VARCHAR(100) NOT NULL,              -- Nombre de la categoría (ej. "Hamburguesas"). Agrupa productos en el menú.
    type        VARCHAR(20) DEFAULT 'COCINA',       -- Tipo de preparación: 'COCINA' (se cocina) o 'SOLO_PASAR' (no requiere cocina).
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación de la categoría. Auditoría.
    CONSTRAINT chk_category_type CHECK (type IN ('COCINA','SOLO_PASAR'))
);


-- -----------------------------------------------------------------------------
-- 5. products  (ítems del menú / cartelera)
--    Origen móvil (cajero): { id, name, price }
--    Origen móvil (cliente): { id, name, category, price, desc, image }
--    Origen móvil (mesero):  { id, name, price, desc, category }
--    Origen web (productos): { id, nombre, precio, descripcion, imagen,
--                              stock, active }
--    Responsabilidad: catálogo de productos (sin lógica de pedidos).
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id            INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único del producto. Clave primaria del catálogo.
    name          VARCHAR(150) NOT NULL,            -- Nombre del producto (ej. "Hamburguesa Sabor"). Se muestra al cliente.
    description   TEXT,                              -- Descripción o ingredientes del producto. Informa al cliente.
    price         DECIMAL(10,2) NOT NULL,           -- Precio de venta en COP. Valor que se cobra por unidad.
    image         VARCHAR(255),                     -- Emoji o URL de la imagen ilustrativa del producto.
    stock         INT DEFAULT 0,                    -- Cantidad disponible en inventario. Controla disponibilidad.
    category_id   INT,                              -- Categoría a la que pertenece el producto. Relaciona con categories.
    branch_id     INT,                              -- Sede que ofrece el producto. Relaciona con branches.
    active        BOOLEAN DEFAULT TRUE,             -- Indica si el producto está visible/activo para los clientes.
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación del producto. Auditoría.
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_product_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
);


-- -----------------------------------------------------------------------------
-- 6. tables  (mesas físicas)
--    Origen móvil (mesero): tables -> { id, name }; activeTableForOrder.name
--    Responsabilidad: estado de la mesa física únicamente.
-- -----------------------------------------------------------------------------
CREATE TABLE tables (
    id          INT AUTO_INCREMENT PRIMARY KEY,     -- Identificador único de la mesa. Clave primaria.
    name        VARCHAR(50) NOT NULL,               -- Nombre o número de la mesa (ej. "Mesa 4"). Para ubicar al cliente.
    branch_id   INT,                                -- Sede a la que pertenece la mesa. Relaciona con branches.
    status      VARCHAR(20) DEFAULT 'LIBRE',        -- Estado de la mesa: 'LIBRE' u 'OCUPADA'. Para disponibilidad en salón.
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de registro de la mesa. Auditoría.
    CONSTRAINT fk_table_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT chk_table_status CHECK (status IN ('LIBRE','OCUPADA'))
);


-- -----------------------------------------------------------------------------
-- 7. customers  (clientes / destinatarios de domicilio)
--    Origen móvil (repartidor / cliente): customerName, customerPhone, address
--    Responsabilidad: datos de contacto y dirección del cliente. Un cliente
--    registrado puede vincularse a users; los domicilios de invitado no.
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    id          INT AUTO_INCREMENT PRIMARY KEY,     -- Identificador único del cliente/destinatario. Clave primaria.
    user_id     INT UNIQUE,                         -- Vínculo opcional con una cuenta de usuario (cliente registrado).
    full_name   VARCHAR(120),                       -- Nombre del cliente o destinatario del domicilio.
    phone       VARCHAR(30),                        -- Teléfono de contacto del cliente. Para coordinar entrega.
    address     VARCHAR(255),                       -- Dirección de entrega del domicilio.
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de registro del cliente. Auditoría.
    CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(id)
);


-- -----------------------------------------------------------------------------
-- 8. orders  (pedidos - encabezado)
--    Origen móvil (cajero):   { id, type, table?, items, total, status, time, ... }
--    Origen móvil (repartidor):{ id, customerName, customerPhone, address,
--                                restaurantStatus, subtotal, deliveryFee, ... }
--    Origen web (ordenes):     { id, type, items, total, status, timeAgo }
--    Responsabilidad: el PEDIDO en sí (tipo, estado de ciclo de vida, referencias,
--    montos). El pago y la entrega viven en sus propias tablas.
--    type:   'mesa' | 'llevar' | 'Domicilio'
--    status: 'PENDIENTE' | 'PREPARANDO' | 'LISTO' | 'EN_RUTA' | 'ENTREGADO'
--      (los estados 'pendiente'/'pagado' del cajero y 'Pendiente'/'Aceptado' del
--       repartidor se mapean a este ciclo; los estados de pago/aceptación pasaron
--       a payments/deliveries)
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id            VARCHAR(30) PRIMARY KEY,          -- Identificador del pedido (ej. 'ORD-101', '#ORD-109'). Clave primaria.
    type          VARCHAR(20) NOT NULL,             -- Tipo de pedido: 'mesa' (en sitio), 'llevar' (para llevar) o 'Domicilio'.
    status        VARCHAR(25) NOT NULL DEFAULT 'PENDIENTE', -- Estado del ciclo de vida: recién creado, en cocina, listo, en ruta o entregado.
    table_id      INT,                              -- Mesa asociada (solo si type = 'mesa'). Relaciona con tables.
    waiter_id     INT,                              -- Mesero que tomó el pedido. Relaciona con employees.
    customer_id   INT,                              -- Cliente/destinatario (solo domicilio o invitado). Relaciona con customers.
    subtotal      DECIMAL(10,2) DEFAULT 0,          -- Suma de los productos sin domicilio. Base del total.
    total         DECIMAL(10,2) NOT NULL,           -- Monto total a cobrar (subtotal + domicilio). Valor final del pedido.
    time_label    VARCHAR(20),                      -- Texto de hora para mostrar (ej. '12:45 PM' o 'Hace 2 min').
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación del pedido.
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Fecha de última actualización del pedido.
    CONSTRAINT fk_order_table FOREIGN KEY (table_id) REFERENCES tables(id),
    CONSTRAINT fk_order_waiter FOREIGN KEY (waiter_id) REFERENCES employees(id),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT chk_order_type CHECK (type IN ('mesa','llevar','Domicilio')),
    CONSTRAINT chk_order_status CHECK (
        status IN ('PENDIENTE','PREPARANDO','LISTO','EN_RUTA','ENTREGADO')
    )
);


-- -----------------------------------------------------------------------------
-- 9. order_items  (detalle de pedido - líneas de producto)
--    Origen móvil (repartidor): OrderItem { name, quantity }
--    Origen móvil (mesero):     cart item { cartId, name, price, quantity,
--                                note, isToGo }
--    Origen móvil (cliente):    cart item { cartId, name, price, image, quantity }
--    Responsabilidad: una línea de producto por fila, ligada a su pedido.
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único de la línea. Clave primaria del detalle.
    order_id      VARCHAR(30) NOT NULL,             -- Pedido al que pertenece la línea. Relaciona con orders.
    product_id    INT,                              -- Referencia al producto del catálogo (opcional). Relaciona con products.
    name          VARCHAR(150) NOT NULL,            -- Nombre del producto en el momento de la venta (snapshot). Para histórico.
    quantity      INT NOT NULL DEFAULT 1,           -- Cantidad de unidades de este producto en el pedido.
    unit_price    DECIMAL(10,2) NOT NULL,           -- Precio unitario en el momento de la venta. Para cálculo y histórico.
    note          TEXT,                             -- Nota o instrucción del cliente (ej. "Sin cebolla"). Personaliza la preparación.
    takeaway      BOOLEAN DEFAULT FALSE,            -- Indica si el ítem se empaca para llevar (isToGo) en vez de consumo en mesa.
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación de la línea. Auditoría.
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id)
);


-- -----------------------------------------------------------------------------
-- 10. payments  (pago de un pedido)
--     Origen móvil (cajero):  paymentMethod?, status('pendiente'|'pagado'|
--                              'pagando_transferencia'), transferProofUrl?
--     Origen móvil (repartidor):paymentMethod('Efectivo'|'Datáfono'|
--                              'Transferencia'), paymentStatus('Pendiente'|'Pagado')
--     Origen móvil (cliente):  paymentMethod('wompi'|'efectivo')
--     Responsabilidad: la transacción de pago únicamente.
--     method: 'Efectivo' | 'Datáfono' | 'Transferencia' | 'wompi'
--     status: 'Pendiente' | 'Pagado'
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id            INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único del pago. Clave primaria.
    order_id      VARCHAR(30) NOT NULL UNIQUE,      -- Pedido que se paga (uno a uno). Relaciona con orders.
    method        VARCHAR(20),                      -- Método de pago: 'Efectivo', 'Datáfono', 'Transferencia' o 'wompi'.
    status        VARCHAR(15) DEFAULT 'Pendiente',  -- Estado del pago: 'Pendiente' o 'Pagado'. Refleja si ya se cobró.
    proof_url     VARCHAR(255),                     -- URL del comprobante de transferencia/Wompi. Valida pagos no presenciales.
    paid_at       TIMESTAMP NULL,                   -- Fecha y hora en que se realizó el pago. Para conciliación.
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de registro del pago. Auditoría.
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_method CHECK (
        method IS NULL OR method IN ('Efectivo','Datáfono','Transferencia','wompi')
    ),
    CONSTRAINT chk_payment_status CHECK (status IN ('Pendiente','Pagado'))
);


-- -----------------------------------------------------------------------------
-- 11. deliveries  (asignación y estado de domicilio)
--     Origen móvil (repartidor): assignedDriver, deliveryFee,
--                                 status('Pendiente'|'Aceptado')
--     Responsabilidad: quién entrega, la tarifa y el estado de aceptación.
--     driver_status: 'Pendiente' | 'Aceptado'
-- -----------------------------------------------------------------------------
CREATE TABLE deliveries (
    id            INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único de la entrega. Clave primaria.
    order_id      VARCHAR(30) NOT NULL UNIQUE,      -- Pedido a entregar (uno a uno). Relaciona con orders.
    driver_id     INT,                              -- Repartidor asignado. Relaciona con employees (rol REPARTIDOR).
    fee           DECIMAL(10,2) DEFAULT 0,          -- Tarifa o costo del domicilio (deliveryFee). Se suma al total.
    driver_status VARCHAR(15) DEFAULT 'Pendiente',  -- Estado de aceptación por el repartidor: 'Pendiente' o 'Aceptado'.
    assigned_at   TIMESTAMP NULL,                   -- Fecha y hora de asignación al repartidor.
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación del registro de entrega. Auditoría.
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_driver FOREIGN KEY (driver_id) REFERENCES employees(id),
    CONSTRAINT chk_delivery_driver_status CHECK (driver_status IN ('Pendiente','Aceptado'))
);


-- -----------------------------------------------------------------------------
-- 12. cash_closures  (cierre de caja / turno)
--     Origen web: audit-view.tsx -> Turno, Cajero, Efectivo Esperado,
--                 Efectivo Físico, Diferencia, Declarar Cierre
--     Responsabilidad: encabezado de conciliación de turno (totales, no líneas).
-- -----------------------------------------------------------------------------
CREATE TABLE cash_closures (
    id                INT AUTO_INCREMENT PRIMARY KEY, -- Identificador único del cierre. Clave primaria.
    cashier_id        INT NOT NULL,                  -- Cajero responsable del turno. Relaciona con employees.
    branch_id         INT,                           -- Sede donde se realizó el cierre. Relaciona con branches.
    shift             VARCHAR(50),                   -- Turno (ej. 'Tarde (14:00 - 22:00)'). Identifica la jornada.
    closure_date      DATE DEFAULT (CURRENT_DATE),   -- Fecha del cierre de caja.
    expected_cash     DECIMAL(12,2) DEFAULT 0,       -- Efectivo esperado según el sistema (base + cobros en efectivo).
    physical_cash     DECIMAL(12,2) DEFAULT 0,       -- Efectivo físico declarado por el cajero. Para cuadre real.
    difference        DECIMAL(12,2) DEFAULT 0,       -- Diferencia/descuadre: efectivo físico menos esperado.
    status            VARCHAR(20) DEFAULT 'ABIERTO', -- Estado del cierre: 'ABIERTO', 'CERRADO' o 'CUADRADO'.
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación del cierre. Auditoría.
    CONSTRAINT fk_closure_cashier FOREIGN KEY (cashier_id) REFERENCES employees(id),
    CONSTRAINT fk_closure_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT chk_closure_status CHECK (status IN ('ABIERTO','CERRADO','CUADRADO'))
);


-- -----------------------------------------------------------------------------
-- 13. cash_movements  (historial de movimientos / auditoría)
--     Origen web: audit-view.tsx -> Hora, Referencia, Concepto/Responsable,
--                 Método, Ingreso, Auditoría
--     Responsabilidad: una línea de transacción de caja por fila.
--     method:  'Efectivo' | 'Transferencia' | 'Físico'
--     audit:   'OK' | 'Bco.' | 'Pendiente' | 'Reclamado'
-- -----------------------------------------------------------------------------
CREATE TABLE cash_movements (
    id            INT AUTO_INCREMENT PRIMARY KEY,   -- Identificador único del movimiento. Clave primaria.
    closure_id    INT NOT NULL,                     -- Cierre de caja al que pertenece el movimiento. Relaciona con cash_closures.
    time_label    VARCHAR(10),                      -- Hora del movimiento (ej. '14:45'). Para el historial.
    reference     VARCHAR(30),                      -- Referencia del movimiento (ej. '#ORD-106', 'SYS-001').
    concept       VARCHAR(120),                     -- Concepto del movimiento (ej. 'Venta Mostrador', 'Apertura Base de Caja').
    responsible   VARCHAR(120),                     -- Persona responsable (ej. 'Cajero: Luis A.', 'Repartidor: Andrés').
    method        VARCHAR(20),                      -- Método del movimiento: 'Efectivo', 'Transferencia' o 'Físico'.
    amount        DECIMAL(12,2) DEFAULT 0,          -- Monto del ingreso (positivo). Valor del movimiento.
    audit_status  VARCHAR(20) DEFAULT 'OK',         -- Estado de auditoría: 'OK', 'Bco.' (validado banco), 'Pendiente' o 'Reclamado'.
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de registro del movimiento. Auditoría.
    CONSTRAINT fk_movement_closure FOREIGN KEY (closure_id) REFERENCES cash_closures(id) ON DELETE CASCADE,
    CONSTRAINT chk_movement_method CHECK (method IN ('Efectivo','Transferencia','Físico')),
    CONSTRAINT chk_movement_audit CHECK (audit_status IN ('OK','Bco.','Pendiente','Reclamado'))
);


-- =============================================================================
-- Índices sugeridos (mejoran el rendimiento de las consultas frecuentes)
-- =============================================================================
CREATE INDEX idx_orders_status      ON orders(status);          -- Buscar pedidos por estado (cocina, ruta, etc.).
CREATE INDEX idx_orders_type        ON orders(type);            -- Filtrar pedidos por tipo (mesa/llevar/domicilio).
CREATE INDEX idx_orders_waiter      ON orders(waiter_id);       -- Ver pedidos de un mesero.
CREATE INDEX idx_orders_table       ON orders(table_id);        -- Ver pedidos de una mesa.
CREATE INDEX idx_orders_customer    ON orders(customer_id);     -- Ver pedidos de un cliente.
CREATE INDEX idx_order_items_order  ON order_items(order_id);   -- Recuperar líneas de un pedido.
CREATE INDEX idx_payments_order     ON payments(order_id);      -- Buscar el pago de un pedido.
CREATE INDEX idx_deliveries_driver  ON deliveries(driver_id);   -- Ver domicilios de un repartidor.
CREATE INDEX idx_cash_movements_cls ON cash_movements(closure_id); -- Ver movimientos de un cierre.
CREATE INDEX idx_employees_branch   ON employees(branch_id);    -- Ver empleados por sede.
CREATE INDEX idx_products_category  ON products(category_id);   -- Ver productos por categoría.


-- =============================================================================
-- Datos semilla (coherentes con los ejemplos encontrados en el código)
-- =============================================================================

-- branches (sedes)
INSERT INTO branches (id, name, address) VALUES
(1, 'Sede Principal Centro', 'Calle Principal #1-01'),
(2, 'Sede Norte',            'Av. Norte #45-20'),
(3, 'Sede Sur',              'Cra. Sur #12-30');

-- categories (categorías del menú)
INSERT INTO categories (id, name, type) VALUES
(1, 'Hamburguesas', 'COCINA'),
(2, 'Pizzas',       'COCINA'),
(3, 'Bebidas',      'SOLO_PASAR'),
(4, 'Extras',       'SOLO_PASAR');

-- products (productos del menú, precios en COP)
INSERT INTO products (id, name, description, price, image, stock, category_id, branch_id, active) VALUES
(1, 'Hamburguesa Sabor', 'Doble carne, queso cheddar.',      15000, '🍔', 100, 1, 1, TRUE),
(2, 'Pizza Familiar',    '8 porciones con pepperoni.',       55000, '🍕', 50,  2, 1, TRUE),
(3, 'Pizza Express',     'Pepperoni y extra queso.',         18000, '🍕', 40,  2, 1, TRUE),
(4, 'Papas Francesas',   'Porción grande con salsas.',        5000, '🍟', 200, 4, 1, TRUE),
(5, 'Gaseosa 500ml',     'Coca-Cola o Sprite.',              4000, '🥤', 300, 3, 1, TRUE),
(6, 'Jugo Natural',      'Mango o Mora.',                    6000, '🧃', 150, 3, 1, TRUE),
(7, 'Empanada de Carne', 'Masa crocante de maíz, carne.',    4000, '🥟', 150, 4, 1, TRUE);

-- tables (mesas)
INSERT INTO tables (id, name, branch_id, status) VALUES
(1, 'Mesa 2', 1, 'OCUPADA'),
(2, 'Mesa 4', 1, 'OCUPADA'),
(3, 'Mesa 1', 1, 'LIBRE');

-- employees (personal, coincide con STAFF_TODAY y MOCK_EMPLOYEES)
INSERT INTO employees (id, full_name, document, email, phone, address, role, branch_id, status, base_pay, start_time, end_time) VALUES
(1, 'Luis Alberto',    '1098765432', 'luis.caja@saborexpress.com',   '3001234567', 'Calle 123 #45-67',   'CAJERO',     1, 'Activo',   45000, '08:00', '16:00'),
(2, 'María Rodríguez', '1023456789', 'maria.cocina@saborexpress.com','3159876543', 'Calle 200 #10-20',   'COCINERO',   1, 'Activo',   60000, '06:00', '16:00'),
(3, 'Carlos Gómez',    '1055666777', 'carlos.domi@saborexpress.com', '3205554433', 'Calle 50 #30-11',    'REPARTIDOR', 2, 'Inactivo', 35000, '12:00', '21:00');

-- customers (destinatarios de domicilio)
INSERT INTO customers (id, full_name, phone, address) VALUES
(1, 'Cliente 2', '+57 300 1234567', 'Calle Falsa 124, Barrio Centro'),
(2, 'Cliente 4', '+57 300 7654321', 'Calle Falsa 127, Barrio Centro');

-- orders (pedidos, coinciden con INITIAL_ORDERS, generateMockOrders, MOCK_ORDERS)
INSERT INTO orders (id, type, status, table_id, customer_id, subtotal, total, time_label) VALUES
('ORD-101', 'mesa',      'PENDIENTE', 2, NULL, 45000, 45000, '12:45 PM'),
('ORD-102', 'Domicilio', 'ENTREGADO', NULL, 1, 55000, 59500, '12:50 PM'),
('ORD-103', 'mesa',      'PENDIENTE', 1, NULL, 22000, 22000, '01:15 PM'),
('ORD-104', 'Domicilio', 'EN_RUTA',   NULL, 2, 42000, 46500, '01:25 PM');

-- order_items (líneas de producto de cada pedido)
INSERT INTO order_items (order_id, product_id, name, quantity, unit_price, takeaway) VALUES
('ORD-101', 1, 'Hamburguesa Sabor', 2, 15000, FALSE),
('ORD-101', 5, 'Gaseosa 500ml',    1,  4000, FALSE),
('ORD-102', 2, 'Pizza Familiar',   1, 55000, TRUE),
('ORD-103', 7, 'Empanada de Carne',3,  4000, FALSE),
('ORD-103', 6, 'Jugo Natural',     2,  6000, FALSE);

-- payments (método y estado de pago, según el código)
INSERT INTO payments (order_id, method, status, proof_url) VALUES
('ORD-101', NULL,           'Pendiente', NULL),
('ORD-102', 'Transferencia','Pagado',    NULL),
('ORD-103', NULL,           'Pendiente', NULL),
('ORD-104', 'Transferencia','Pagado',    'https://cdn-icons-png.flaticon.com/512/2942/2942269.png');

-- deliveries (asignación de repartidor, tarifa y aceptación)
INSERT INTO deliveries (order_id, driver_id, fee, driver_status) VALUES
('ORD-102', 3, 4500, 'Aceptado'),
('ORD-104', 3, 4500, 'Pendiente');

-- cash_closures (cierre de caja, audit-view: cajero Luis A., turno Tarde)
INSERT INTO cash_closures (id, cashier_id, branch_id, shift, expected_cash, physical_cash, difference, status) VALUES
(1, 1, 1, 'Tarde (14:00 - 22:00)', 450000, 426400, -23600, 'CERRADO');

-- cash_movements (movimientos de caja)
INSERT INTO cash_movements (closure_id, time_label, reference, concept, responsible, method, amount, audit_status) VALUES
(1, '14:45', 'ORD-106', 'Venta Mostrador',       'Cajero: Luis A.',       'Efectivo',      28000, 'OK'),
(1, '14:15', 'ORD-105', 'Domicilio',             'Repartidor: Andrés',   'Efectivo',      23600, 'Pendiente'),
(1, '13:30', 'ORD-104', 'Domicilio App',         'Repartidor: Carlos M.', 'Transferencia', 42000, 'Bco.'),
(1, '13:00', 'SYS-001', 'Apertura Base de Caja', 'Admin',                 'Físico',        100000, '-');
