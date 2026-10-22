# visual-design-system Specification

## Purpose

Lenguaje visual de la interfaz (pista clara de DESIGN.md): paleta, tipografia, formas, componentes base, responsive y garantias de accesibilidad visual.

## Requirements

### Requirement: Paleta y canvas claros
La interfaz SHALL usar unicamente la pista clara del diseno: fondo de pagina `#fbfbf5`, superficies de tarjeta, cabecera y pie `#ffffff`, texto principal `#000000`, bordes finos `#e4e4e7`, y aloe `#c1fbd4` y pistacho `#d4f9e0` solo como rellenos de superficie. No SHALL introducirse un tercer canvas ni aplicar aloe o pistacho como color de texto. La escala de grises solo SHALL usarse para texto secundario con contraste suficiente.

#### Scenario: Fondo y superficies
- **WHEN** se muestra cualquier pantalla
- **THEN** el fondo de pagina es `#fbfbf5` y las tarjetas, cabecera y pie son `#ffffff` con borde `#e4e4e7`

#### Scenario: Acentos como relleno
- **WHEN** se usa aloe o pistacho
- **THEN** es como fondo de una etiqueta, aviso o banda con texto negro encima, nunca como color de texto

### Requirement: Tipografia
El texto SHALL renderizarse con Inter Variable autoalojada, sin peticiones a servidores externos de fuentes, con la caracteristica OpenType `ss03` activa en toda la interfaz. Los titulares de pagina SHALL usar peso 330 y los encabezados de seccion y tarjeta los pesos 400 a 500 del diseno; el cuerpo SHALL usar 16 px con peso 420. Los tamanos SHALL expresarse en unidades relativas y los titulares SHALL reducirse en movil.

#### Scenario: Fuente propia
- **WHEN** la app carga en un navegador sin acceso a servidores de fuentes de terceros
- **THEN** el texto se muestra en Inter, servida desde el propio origen

#### Scenario: Titular ligero
- **WHEN** se muestra el titulo de una pantalla de catalogo o administracion
- **THEN** usa peso 330 y su tamano baja en anchos de movil

### Requirement: Botones pill
Todos los botones y enlaces con aspecto de boton SHALL tener forma pill (radio completo) y minimo 44 px de alto. La accion principal SHALL ser un pill negro con texto blanco, que en pulsado pasa a `#3f3f46`; la secundaria un pill blanco con borde negro de 1 px; el boton destacado, aloe con texto negro. Un boton deshabilitado SHALL ser visiblemente distinto y exponer su estado a las tecnologias de apoyo.

#### Scenario: Forma unica
- **WHEN** se muestra cualquier boton de la aplicacion
- **THEN** tiene esquinas totalmente redondeadas, sin variantes rectangulares

#### Scenario: Estado pulsado
- **WHEN** el usuario pulsa un boton primario
- **THEN** su fondo cambia a `#3f3f46`

#### Scenario: Boton deshabilitado
- **WHEN** un producto tiene stock 0
- **THEN** su boton de agregar esta deshabilitado, se distingue visualmente y no es activable

### Requirement: Campos de formulario
Los campos de texto SHALL tener fondo blanco, texto negro, borde de 1 px `#e4e4e7` reforzado hasta alcanzar 3:1 contra el fondo, radio de 8 px, relleno de 10 px 12 px y altura minima de 44 px. La etiqueta SHALL ser siempre visible. Un campo con error SHALL mostrar el mensaje en texto y un borde distinto del normal, sin depender solo del color.

#### Scenario: Altura y etiqueta
- **WHEN** se muestra un campo de formulario en cualquier ancho
- **THEN** mide al menos 44 px de alto y tiene su etiqueta visible

#### Scenario: Campo con error
- **WHEN** un campo tiene un error de validacion
- **THEN** muestra el mensaje en texto junto al campo y un borde de error visible

### Requirement: Tarjetas, etiquetas y bandas
Las tarjetas de producto SHALL ser blancas con borde fino, radio de 12 px y la sombra apilada suave del diseno, con imagen, nombre, precio y stock. El estado "Agotado" SHALL mostrarse como etiqueta pill neutra con texto, y los avisos de exito como banda aloe o pistacho con texto negro. Los estados activo e inactivo en administracion SHALL mostrarse como etiquetas pill con texto.

#### Scenario: Tarjeta de producto
- **WHEN** se muestra el catalogo
- **THEN** cada producto aparece en una tarjeta blanca con radio de 12 px, borde fino y sombra suave

#### Scenario: Producto agotado
- **WHEN** un producto tiene stock 0
- **THEN** su tarjeta muestra la etiqueta de texto "Agotado" en formato pill neutro

#### Scenario: Aviso de exito
- **WHEN** se confirma una accion (por ejemplo password actualizada)
- **THEN** el aviso aparece sobre un fondo aloe con texto negro

### Requirement: Cabecera y pie
La cabecera SHALL ser blanca con el logotipo a la izquierda, la navegacion en el centro y las acciones de sesion a la derecha (iniciar sesion como pill secundario, registrarse como pill primario sin sesion; nombre y "Salir" con sesion). En anchos menores de 768 px la navegacion SHALL colapsar en un menu. El pie SHALL ser blanco con texto de 14 px.

#### Scenario: Cabecera sin sesion
- **WHEN** un visitante abre la app en escritorio
- **THEN** ve el logotipo, la navegacion y los botones pill de iniciar sesion y registrarse

#### Scenario: Menu en movil
- **WHEN** el ancho es menor de 768 px
- **THEN** la navegacion se oculta tras un boton de menu que la despliega y la repliega con teclado

### Requirement: Diseno responsive
La interfaz SHALL adaptarse sin scroll horizontal desde 320 px: el catalogo en rejilla de 1, 2, 3 y 4 columnas segun el ancho, tablas con desplazamiento propio y titulares escalados. Los objetivos tactiles SHALL medir al menos 44 x 44 px en movil.

#### Scenario: Ancho minimo
- **WHEN** la pantalla mide 320 px de ancho
- **THEN** ninguna pantalla provoca scroll horizontal de la pagina

#### Scenario: Rejilla del catalogo
- **WHEN** el ancho de la ventana crece
- **THEN** el catalogo pasa de 1 a 2, 3 y 4 columnas

### Requirement: Accesibilidad visual del sistema
Toda pareja de colores texto/fondo usada SHALL tener contraste de al menos 4.5:1 (3:1 en texto grande y en bordes de componentes). El gris `#a1a1aa` y los mas claros MUST NOT usarse para texto sobre fondos claros. El foco de teclado SHALL ser visible en todos los controles con un contorno negro de 2 px y desplazamiento de 2 px, tambien sobre fondos aloe y pistacho. La informacion SHALL transmitirse tambien por texto, no solo por color. Las animaciones SHALL respetar `prefers-reduced-motion`.

#### Scenario: Contraste de las parejas
- **WHEN** se evaluan las parejas texto/fondo definidas en los tokens
- **THEN** todas alcanzan el contraste minimo exigido

#### Scenario: Foco visible
- **WHEN** el usuario navega con teclado por botones, enlaces y campos
- **THEN** cada control enfocado muestra un contorno de 2 px de alto contraste

#### Scenario: Movimiento reducido
- **WHEN** el sistema operativo pide reducir el movimiento
- **THEN** las transiciones se anulan o reducen

### Requirement: Sin cambios funcionales
La aplicacion del diseno MUST NOT cambiar rutas, contratos de API, textos funcionales ni el comportamiento de ninguna pantalla. Los roles y nombres accesibles de los controles existentes SHALL conservarse.

#### Scenario: Pruebas existentes
- **WHEN** se ejecutan las suites de Vitest y Playwright existentes tras el restyling
- **THEN** pasan sin modificar sus aserciones de comportamiento
