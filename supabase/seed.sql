-- Datos iniciales para RuedaLibre en Supabase
-- Ejecutar después de supabase/schema.sql

insert into public.locations (id, name, category, address, phone, email, hours, latitude, longitude, description, available, bike_types_supported, services_summary)
values
  (
    '11111111-1111-4111-8111-111111111101',
    'Taller Palermo Bike Lab',
    'taller',
    'Av. Honduras 4820, Palermo, Buenos Aires',
    '+54 11 4831-2290',
    'taller@palermobikelab.com',
    'Lun a Sáb 09:00 - 19:30',
    -34.5875,
    -58.4274,
    'Taller especializado en mecánica de precisión, tubeless, parchado de neumáticos y calibración hidráulica.',
    true,
    array['Urbana', 'Ruta', 'Gravel', 'Montaña'],
    array['Reparación de neumáticos', 'Centrado de ruedas', 'Frenos hidráulicos', 'Service completo']
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Bicicletería Nordelta & Belgrano',
    'tienda',
    'Av. Cabildo 2145, Belgrano, Buenos Aires',
    '+54 11 4784-9012',
    'ventas@bicisbelgrano.com',
    'Lun a Sáb 10:00 - 20:00',
    -34.5612,
    -58.4564,
    'Tienda multimarca con bicicletas urbanas, eléctricas y gravel, además de equipamiento de seguridad certificado.',
    true,
    array['Urbana', 'Eléctrica', 'Gravel', 'Plegable'],
    array['Venta de bicicletas', 'Accesorios de seguridad', 'Armado a medida']
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Estación Ciclista Puerto Madero',
    'estacion',
    'Av. Alicia Moreau de Justo 1150, Puerto Madero, Buenos Aires',
    '+54 11 4334-7780',
    'estacion@maderoecobici.com',
    'Todos los días 07:00 - 22:00',
    -34.6118,
    -58.3649,
    'Estación de servicio rápido al paso junto a la ciclovía: inflado de alta presión, cambio de cámara y carga eléctrica.',
    true,
    array['Urbana', 'Eléctrica', 'Plegable', 'Ruta'],
    array['Reparación de neumáticos', 'Inflado con manómetro', 'Carga e-bike', 'Ajuste rápido de frenos']
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'CicloMecánica Caballito',
    'taller',
    'Av. Rivadavia 5120, Caballito, Buenos Aires',
    '+54 11 4902-5518',
    'contacto@ciclomecanicacaballito.com',
    'Lun a Vie 09:00 - 19:00 · Sáb 09:30 - 14:00',
    -34.6186,
    -58.4368,
    'Taller integral para bicicletas de montaña, gravel y uso diario con diagnóstico de transmisión y suspensiones.',
    true,
    array['Montaña', 'Gravel', 'Urbana'],
    array['Reparación de neumáticos', 'Mantenimiento de horquilla', 'Cambio de transmisión', 'Limpieza ultrasónica']
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    'VeloStudio Recoleta',
    'tienda',
    'Av. Las Heras 2410, Recoleta, Buenos Aires',
    '+54 11 4805-3341',
    'hola@velostudiorecoleta.com',
    'Lun a Sáb 10:00 - 19:30',
    -34.5882,
    -58.3976,
    'Showroom boutique de movilidad urbana, bicicletas eléctricas y accesorios reflectivos para circulación segura.',
    true,
    array['Urbana', 'Eléctrica', 'Plegable'],
    array['Venta de bicicletas', 'Accesorios de seguridad', 'Taller express']
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    'Punto Bici San Telmo',
    'estacion',
    'Av. Paseo Colón 890, San Telmo, Buenos Aires',
    '+54 11 4361-8842',
    'soporte@puntobicisantelmo.com',
    'Lun a Dom 08:00 - 20:30',
    -34.6177,
    -58.3688,
    'Estación ciclista urbana con autoatención asistida, reparación de pinchaduras y venta de repuestos esenciales.',
    true,
    array['Urbana', 'Montaña', 'Eléctrica'],
    array['Reparación de neumáticos', 'Lubricación de cadena', 'Venta de cámaras y parches']
  )
on conflict (id) do nothing;

insert into public.products (id, location_id, item_type, name, brand, bike_type, price, stock, available, specs, image_url)
values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102', 'bicicleta', 'CityCommuter Alfine 8', 'VeloNord', 'Urbana', 540.00, 6, true, 'Cuadro aluminio 6061, frenos a disco mecánicos, rodado 28, portaequipaje delantero integrado.', '/src/assets/images/bike_urban_commuter_1795624885348.jpg'),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111105', 'bicicleta', 'MetroFold Compact 20', 'BiciUrban', 'Plegable', 390.00, 4, true, 'Plegado en 12 segundos, 7 velocidades Shimano Tourney, rodado 20, peso 12.2 kg.', '/src/assets/images/bike_urban_commuter_1795624885348.jpg'),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111102', 'bicicleta', 'TerraX Gravel Pro', 'AndesCycle', 'Gravel', 890.00, 3, true, 'Transmisión 1x11, frenos hidráulicos Shimano GRX, cubiertas tubeless 700x40c.', '/src/assets/images/bike_mtb_gravel_1795624886633.jpg'),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111104', 'bicicleta', 'TrailMaster 29 Deore', 'AndesCycle', 'Montaña', 720.00, 5, true, 'Horquilla con bloqueo hidráulico 120 mm, cuadro aluminio hidroformado, rodado 29.', '/src/assets/images/bike_mtb_gravel_1795624886633.jpg'),
  ('22222222-2222-4222-8222-222222222205', '11111111-1111-4111-8111-111111111105', 'bicicleta', 'VoltGlide E-City 350W', 'E-Move', 'Eléctrica', 1350.00, 2, true, 'Motor trasero 350W, batería extraíble 504Wh (autonomía 75 km), luces LED integradas.', '/src/assets/images/bike_urban_commuter_1795624885348.jpg'),
  ('22222222-2222-4222-8222-222222222206', '11111111-1111-4111-8111-111111111102', 'accesorio', 'Casco Urbano Aero MIPS', 'SafeRide', 'Seguridad', 68.00, 14, true, 'Sistema de protección rotacional MIPS, ventilación canalizada y luz trasera integrada.', '/src/assets/images/cycling_gear_safety_1795624886403.jpg'),
  ('22222222-2222-4222-8222-222222222207', '11111111-1111-4111-8111-111111111105', 'accesorio', 'Kit Luces LED USB-C 600 Lm', 'LumenBike', 'Iluminación', 36.00, 22, true, 'Faro delantero 600 lúmenes + baliza trasera roja resistente al agua IPX6.', '/src/assets/images/cycling_gear_safety_1795624886403.jpg'),
  ('22222222-2222-4222-8222-222222222208', '11111111-1111-4111-8111-111111111102', 'accesorio', 'Traba U-Lock Acero Templado', 'KryptonSafe', 'Seguridad', 54.00, 9, true, 'Grillete de acero endurecido de 14 mm con soporte para cuadro y 3 llaves codificadas.', '/src/assets/images/cycling_gear_safety_1795624886403.jpg'),
  ('22222222-2222-4222-8222-222222222209', '11111111-1111-4111-8111-111111111103', 'accesorio', 'Inflador Portátil + Kit Parches', 'TopeakPro', 'Herramientas', 29.00, 18, true, 'Válvula dual Presta/Schrader hasta 120 PSI con palancas desmontables y parches autoadhesivos.', '/src/assets/images/cycling_gear_safety_1795624886403.jpg'),
  ('22222222-2222-4222-8222-222222222210', '11111111-1111-4111-8111-111111111106', 'accesorio', 'Chaleco Reflectivo Alta Visibilidad', 'SafeRide', 'Seguridad', 24.00, 16, true, 'Bandolera reflectiva 360 grados con tejido respirable y bolsillo posterior con cierre.', '/src/assets/images/cycling_gear_safety_1795624886403.jpg')
on conflict (id) do nothing;

insert into public.repairs (id, location_id, service_name, service_category, bike_type, price, estimated_minutes, available, description)
values
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111101', 'Reparación de pinchadura y sellado de neumático', 'Neumáticos', 'Todas', 14.00, 20, true, 'Desmontaje de rueda, revisión interna de cubierta, parche vulcanizado o reemplazo de cámara y calibración de presión.'),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111103', 'Cambio express de cámara y neumático', 'Neumáticos', 'Urbana', 16.00, 15, true, 'Atención sin turno previo junto a la ciclovía para reparar neumáticos pinchados o cambiar cubiertas desgastadas.'),
  ('33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111104', 'Conversión y mantenimiento Tubeless de neumáticos', 'Neumáticos', 'Montaña', 28.00, 40, true, 'Instalación de cinta tubeless, válvulas, líquido sellador y talonado de neumáticos MTB o Gravel.'),
  ('33333333-3333-4333-8333-333333333304', '11111111-1111-4111-8111-111111111106', 'Reparación de neumáticos al paso', 'Neumáticos', 'Todas', 12.00, 15, true, 'Parchado rápido o cambio de cámara con verificación de talón y válvula.'),
  ('33333333-3333-4333-8333-333333333305', '11111111-1111-4111-8111-111111111101', 'Purgado y calibración de frenos hidráulicos', 'Frenos', 'Gravel', 32.00, 45, true, 'Renovación de líquido mineral o DOT, centrado de caliper y limpieza de discos.'),
  ('33333333-3333-4333-8333-333333333306', '11111111-1111-4111-8111-111111111104', 'Regulación de cambios y transmisión', 'Transmisión', 'Montaña', 24.00, 35, true, 'Alineación de fusible, ajuste de descarriladores, lubricación con cera y medición de desgaste de cadena.'),
  ('33333333-3333-4333-8333-333333333307', '11111111-1111-4111-8111-111111111101', 'Service completo de seguridad y puesta a punto', 'Mantenimiento General', 'Todas', 55.00, 90, true, 'Limpieza integral, ajuste de frenos y cambios, centrado de ruedas, torque de tornillería y revisión de neumáticos.'),
  ('33333333-3333-4333-8333-333333333308', '11111111-1111-4111-8111-111111111103', 'Diagnóstico y carga rápida de bicicleta eléctrica', 'Eléctrica', 'Eléctrica', 18.00, 30, true, 'Control de voltaje de batería, ajuste de sensores de pedaleo y carga rápida en estación.'),
  ('33333333-3333-4333-8333-333333333309', '11111111-1111-4111-8111-111111111104', 'Mantenimiento básico de horquilla con suspensión', 'Suspensión', 'Montaña', 45.00, 60, true, 'Limpieza de retenes, cambio de aceite de botellas y regulación de presión según peso del ciclista.'),
  ('33333333-3333-4333-8333-333333333310', '11111111-1111-4111-8111-111111111106', 'Ajuste general urbano express', 'Mantenimiento General', 'Urbana', 22.00, 30, true, 'Control de frenos, tensión de cadena, inflado de neumáticos y lubricación completa.')
on conflict (id) do nothing;
