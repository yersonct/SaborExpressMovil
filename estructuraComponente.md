1. El Cajero: Calculadora Básica (Parte 4)
El contexto en saborExpress: El cajero recibe pagos en efectivo constantemente y necesita calcular cuánto cambio devolverle al cliente o dividir cuentas.

La implementación: Crearemos una vista de "Cobro" que incluya una pequeña calculadora funcional (suma, resta, multiplicación, división) para que el cajero haga las cuentas sin salir de la aplicación.

El requisito cumplido: Operaciones matemáticas, actualización dinámica de resultados y validación de datos.

2. El Repartidor: Scroll Loading (Parte 5)
El contexto en saborExpress: El repartidor necesita ver la lista de pedidos que están listos para ser entregados.

La implementación: Usaremos un componente FlatList para mostrar las tarjetas de los pedidos. Si hay muchos pedidos, al llegar al final de la pantalla, aparecerá un ActivityIndicator (la ruedita de carga) simulando que está buscando más envíos en el servidor.

El requisito cumplido: Uso de ScrollView/FlatList, desplazamiento vertical y mostrar indicador de carga.

3. El Mesero: Dropdown / Picker (Parte 3)
El contexto en saborExpress: Cuando el mesero está tomando una nueva orden, necesita seleccionar a qué mesa va dirigido el pedido.

La implementación: Integraremos un menú desplegable (Dropdown) donde el mesero pueda tocar y seleccionar "Mesa 1", "Mesa 2", etc. Aseguraremos que visualmente funcione perfecto tanto si el instructor lo prueba en un emulador Android como en un iPhone.

El requisito cumplido: Selección de opciones, validación multiplataforma y almacenamiento del valor seleccionado.

4. El Cocinero: Dialog o Modal (Parte 2)
El contexto en saborExpress: El chef ve los tickets de pedidos resumidos. Si necesita ver la receta exacta de un plato o las notas especiales del cliente ("sin cebolla"), tocará el pedido.

La implementación: Al tocar el pedido, la pantalla se oscurecerá y se abrirá un Modal flotante en el centro con la información detallada. Tendrá un botón para "Cerrar" y otro para "Marcar como Listo".

El requisito cumplido: Apertura y cierre de modal, mensajes informativos y diseño visual superpuesto.

5. Todos los Roles: Botones y Eventos (Parte 1)
El contexto en saborExpress: Cada pantalla tendrá acciones específicas.

La implementación: El repartidor tendrá un botón de "Aceptar Viaje", el cocinero uno de "Terminado" y el cajero uno de "Imprimir Ticket". Todos usarán el evento onPress para cambiar un texto en la pantalla confirmando la acción.

El requisito cumplido: Interacción, cambio de estado y estilos personalizados.

6. Estructura Base: Navegación (Parte 6)
El contexto en saborExpress: Dependiendo del inicio de sesión, el usuario entra a un entorno distinto.

La implementación: Usaremos un Stack Navigator para pasar del Login al interior de la app. Adentro, usaremos un Drawer Layout (menú lateral) para navegar entre opciones globales y Bottom Tabs (menú inferior) para que el Mesero, por ejemplo, cambie entre "Nueva Orden" y "Mesas Activas".