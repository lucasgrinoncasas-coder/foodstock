// recipeCatalog.js — Catálogo ampliado de recetas populares/tradicionales.
// Contenido redactado íntegramente para FoodStock (no copiado de ninguna
// fuente concreta): listas de ingredientes y pasos funcionales de platos
// de conocimiento común, con cantidades orientativas para 4 personas.

export const RECIPE_CATALOG = [
  // --- Rápidas ---
  {
    name: 'Tortilla francesa',
    ingredients: [
      { name: 'Huevos', quantity: 4, unit: 'unidades' },
      { name: 'Sal', quantity: 1, unit: 'g' },
      { name: 'Aceite', quantity: 15, unit: 'ml' },
    ],
    steps: ['Bate los huevos con una pizca de sal', 'Calienta el aceite en una sartén', 'Vierte el huevo y cuaja a fuego medio', 'Dobla por la mitad y sirve'],
    time: 10, difficulty: 'Fácil', category: 'Rápida',
    nutrition: { calories: 180, protein: 13, carbs: 1, fat: 14 },
  },
  {
    name: 'Sándwich club',
    ingredients: [
      { name: 'Pan', quantity: 8, unit: 'unidades' },
      { name: 'Pollo', quantity: 200, unit: 'g' },
      { name: 'Queso', quantity: 4, unit: 'unidades' },
      { name: 'Tomate', quantity: 1, unit: 'unidades' },
      { name: 'Lechuga', quantity: 4, unit: 'unidades' },
    ],
    steps: ['Tuesta el pan', 'Cocina el pollo a la plancha y córtalo en tiras', 'Monta capas de pan, pollo, queso, tomate y lechuga', 'Corta en triángulos y sirve'],
    time: 20, difficulty: 'Fácil', category: 'Rápida',
    nutrition: { calories: 420, protein: 28, carbs: 38, fat: 16 },
  },
  {
    name: 'Ensalada César',
    ingredients: [
      { name: 'Lechuga', quantity: 1, unit: 'unidades' },
      { name: 'Pollo', quantity: 200, unit: 'g' },
      { name: 'Queso', quantity: 40, unit: 'g' },
      { name: 'Pan', quantity: 2, unit: 'unidades' },
      { name: 'Aceite', quantity: 30, unit: 'ml' },
    ],
    steps: ['Corta el pan en dados y tuéstalo para los picatostes', 'Cocina el pollo a la plancha y trocéalo', 'Trocea la lechuga y mezcla con el aceite', 'Añade el pollo, el queso rallado y los picatostes'],
    time: 20, difficulty: 'Fácil', category: 'Rápida',
    nutrition: { calories: 360, protein: 30, carbs: 18, fat: 19 },
  },
  {
    name: 'Pasta al ajillo',
    ingredients: [
      { name: 'Pasta', quantity: 350, unit: 'g' },
      { name: 'Aceite', quantity: 40, unit: 'ml' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
    ],
    steps: ['Cuece la pasta en agua con sal', 'Lamina el ajo (si tienes) y dóralo en aceite', 'Escurre la pasta y saltéala con el aceite aromatizado', 'Añade un toque de guindilla si te gusta picante'],
    time: 15, difficulty: 'Fácil', category: 'Rápida',
    nutrition: { calories: 480, protein: 12, carbs: 78, fat: 14 },
  },
  {
    name: 'Huevos revueltos con jamón',
    ingredients: [
      { name: 'Huevos', quantity: 6, unit: 'unidades' },
      { name: 'Aceite', quantity: 15, unit: 'ml' },
    ],
    steps: ['Bate los huevos', 'Calienta el aceite y añade el jamón troceado', 'Vierte el huevo y remueve a fuego suave sin dejar de mover', 'Retira cuando esté cremoso, antes de que cuaje del todo'],
    time: 10, difficulty: 'Fácil', category: 'Rápida',
    nutrition: { calories: 260, protein: 19, carbs: 1, fat: 20 },
  },
  {
    name: 'Wrap de pollo',
    ingredients: [
      { name: 'Pollo', quantity: 250, unit: 'g' },
      { name: 'Lechuga', quantity: 4, unit: 'unidades' },
      { name: 'Tomate', quantity: 1, unit: 'unidades' },
      { name: 'Queso', quantity: 40, unit: 'g' },
    ],
    steps: ['Cocina el pollo a la plancha en tiras', 'Calienta ligeramente la tortilla de trigo', 'Rellena con pollo, lechuga, tomate y queso', 'Enrolla apretando bien y corta por la mitad'],
    time: 15, difficulty: 'Fácil', category: 'Rápida',
    nutrition: { calories: 390, protein: 32, carbs: 30, fat: 15 },
  },
  {
    name: 'Gazpacho exprés',
    ingredients: [
      { name: 'Tomate', quantity: 6, unit: 'unidades' },
      { name: 'Cebolla', quantity: 0.5, unit: 'unidades' },
      { name: 'Aceite', quantity: 40, unit: 'ml' },
    ],
    steps: ['Trocea el tomate, el pepino, el pimiento y la cebolla', 'Tritura todo junto con el aceite y un chorro de vinagre', 'Ajusta la sal y añade agua fría hasta la textura deseada', 'Enfría en la nevera antes de servir'],
    time: 15, difficulty: 'Fácil', category: 'Rápida',
    nutrition: { calories: 120, protein: 2, carbs: 10, fat: 8 },
  },
  {
    name: 'Tostada con aguacate y huevo',
    ingredients: [
      { name: 'Pan', quantity: 4, unit: 'unidades' },
      { name: 'Huevos', quantity: 2, unit: 'unidades' },
    ],
    steps: ['Tuesta el pan', 'Aplasta el aguacate con un poco de sal y limón', 'Cuece o escalfa los huevos a tu gusto', 'Unta el pan con aguacate y corona con el huevo'],
    time: 15, difficulty: 'Fácil', category: 'Rápida',
    nutrition: { calories: 320, protein: 14, carbs: 28, fat: 18 },
  },

  // --- Saludables ---
  {
    name: 'Pollo a la plancha con verduras',
    ingredients: [
      { name: 'Pollo', quantity: 500, unit: 'g' },
      { name: 'Verduras congeladas', quantity: 1, unit: 'paquetes' },
      { name: 'Aceite', quantity: 20, unit: 'ml' },
    ],
    steps: ['Salpimienta el pollo y cocínalo a la plancha', 'Saltea las verduras en una sartén con un poco de aceite', 'Sirve el pollo junto a las verduras', 'Añade un chorrito de limón al emplatar'],
    time: 25, difficulty: 'Fácil', category: 'Saludable',
    nutrition: { calories: 340, protein: 42, carbs: 10, fat: 12 },
  },
  {
    name: 'Salmón al horno con espárragos',
    ingredients: [
      { name: 'Salmón', quantity: 500, unit: 'g' },
      { name: 'Aceite', quantity: 20, unit: 'ml' },
    ],
    steps: ['Precalienta el horno a 200°C', 'Coloca el salmón y los espárragos en una bandeja con aceite', 'Hornea 15-18 minutos', 'Sirve con un toque de limón'],
    time: 25, difficulty: 'Fácil', category: 'Saludable',
    nutrition: { calories: 380, protein: 38, carbs: 6, fat: 22 },
  },
  {
    name: 'Ensalada de quinoa',
    ingredients: [
      { name: 'Quinoa', quantity: 200, unit: 'g' },
      { name: 'Tomate', quantity: 2, unit: 'unidades' },
      { name: 'Aceite', quantity: 30, unit: 'ml' },
    ],
    steps: ['Cuece la quinoa según el envase y deja enfriar', 'Trocea el tomate, el pepino y la cebolla', 'Mezcla la quinoa con las verduras y el aceite', 'Ajusta de sal y limón al gusto'],
    time: 25, difficulty: 'Fácil', category: 'Saludable',
    nutrition: { calories: 310, protein: 9, carbs: 42, fat: 12 },
  },
  {
    name: 'Bowl de arroz integral y verduras',
    ingredients: [
      { name: 'Arroz', quantity: 250, unit: 'g' },
      { name: 'Verduras congeladas', quantity: 1, unit: 'paquetes' },
      { name: 'Aceite', quantity: 20, unit: 'ml' },
    ],
    steps: ['Cuece el arroz integral', 'Saltea las verduras con un poco de aceite y salsa de soja', 'Sirve el arroz con las verduras encima', 'Añade sésamo o huevo frito si quieres'],
    time: 30, difficulty: 'Fácil', category: 'Saludable',
    nutrition: { calories: 380, protein: 10, carbs: 68, fat: 9 },
  },
  {
    name: 'Salteado de tofu y brócoli',
    ingredients: [
      { name: 'Tofu', quantity: 300, unit: 'g' },
      { name: 'Aceite', quantity: 20, unit: 'ml' },
    ],
    steps: ['Corta el tofu en dados y dóralo en una sartén', 'Añade el brócoli troceado y saltea unos minutos', 'Incorpora salsa de soja y un poco de ajo', 'Cocina hasta que el brócoli esté al dente'],
    time: 20, difficulty: 'Fácil', category: 'Saludable',
    nutrition: { calories: 260, protein: 20, carbs: 12, fat: 15 },
  },
  {
    name: 'Sopa de verduras',
    ingredients: [
      { name: 'Verduras congeladas', quantity: 1, unit: 'paquetes' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
    ],
    steps: ['Sofríe la cebolla en una olla', 'Añade las verduras y cubre con agua o caldo', 'Cuece 20 minutos a fuego medio', 'Tritura si prefieres una crema, o sirve tal cual'],
    time: 30, difficulty: 'Fácil', category: 'Saludable',
    nutrition: { calories: 110, protein: 4, carbs: 16, fat: 3 },
  },
  {
    name: 'Poke bowl de atún',
    ingredients: [
      { name: 'Arroz', quantity: 200, unit: 'g' },
      { name: 'Atún', quantity: 200, unit: 'g' },
      { name: 'Aceite', quantity: 15, unit: 'ml' },
    ],
    steps: ['Cuece el arroz y deja enfriar', 'Corta el atún fresco en dados (o usa atún en conserva)', 'Reparte en un bowl arroz, atún, aguacate y edamame', 'Aliña con salsa de soja y sésamo'],
    time: 25, difficulty: 'Media', category: 'Saludable',
    nutrition: { calories: 420, protein: 30, carbs: 48, fat: 12 },
  },
  {
    name: 'Avena con frutas',
    ingredients: [
      { name: 'Avena', quantity: 80, unit: 'g' },
      { name: 'Leche', quantity: 250, unit: 'ml' },
      { name: 'Fruta', quantity: 1, unit: 'unidades' },
    ],
    steps: ['Calienta la leche sin que llegue a hervir', 'Añade la avena y cuece 5 minutos removiendo', 'Sirve en un bowl y añade la fruta troceada', 'Endulza con miel si lo prefieres'],
    time: 10, difficulty: 'Fácil', category: 'Saludable',
    nutrition: { calories: 290, protein: 11, carbs: 48, fat: 6 },
  },

  // --- Económicas ---
  {
    name: 'Lentejas con verduras',
    ingredients: [
      { name: 'Lentejas', quantity: 300, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
      { name: 'Tomate', quantity: 1, unit: 'unidades' },
      { name: 'Aceite', quantity: 20, unit: 'ml' },
    ],
    steps: ['Sofríe la cebolla, el pimiento y el tomate en aceite', 'Añade las lentejas y cubre con agua', 'Cuece 30-40 minutos hasta que estén tiernas', 'Ajusta de sal y sirve caliente'],
    time: 45, difficulty: 'Fácil', category: 'Económica',
    nutrition: { calories: 340, protein: 20, carbs: 52, fat: 6 },
  },
  {
    name: 'Arroz con huevo frito',
    ingredients: [
      { name: 'Arroz', quantity: 300, unit: 'g' },
      { name: 'Huevos', quantity: 4, unit: 'unidades' },
      { name: 'Aceite', quantity: 30, unit: 'ml' },
    ],
    steps: ['Cuece el arroz en agua con sal', 'Fríe los huevos hasta que la yema quede jugosa', 'Sirve el arroz con el huevo encima', 'Añade un chorrito de tomate frito si tienes'],
    time: 20, difficulty: 'Fácil', category: 'Económica',
    nutrition: { calories: 420, protein: 14, carbs: 68, fat: 11 },
  },
  {
    name: 'Patatas con chorizo',
    ingredients: [
      { name: 'Patatas', quantity: 600, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
      { name: 'Aceite', quantity: 20, unit: 'ml' },
    ],
    steps: ['Pela y trocea las patatas', 'Sofríe la cebolla y el chorizo troceado', 'Añade las patatas y cubre con agua', 'Cuece hasta que las patatas estén tiernas'],
    time: 35, difficulty: 'Fácil', category: 'Económica',
    nutrition: { calories: 380, protein: 12, carbs: 44, fat: 17 },
  },
  {
    name: 'Sopa de fideos',
    ingredients: [
      { name: 'Pasta', quantity: 150, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
    ],
    steps: ['Prepara un caldo con cebolla, zanahoria y agua', 'Cuece 15 minutos a fuego medio', 'Añade los fideos y cuece 8-10 minutos más', 'Sirve caliente'],
    time: 25, difficulty: 'Fácil', category: 'Económica',
    nutrition: { calories: 180, protein: 6, carbs: 34, fat: 2 },
  },
  {
    name: 'Garbanzos con espinacas',
    ingredients: [
      { name: 'Garbanzos', quantity: 400, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
      { name: 'Aceite', quantity: 20, unit: 'ml' },
    ],
    steps: ['Sofríe la cebolla y el ajo en aceite', 'Añade las espinacas y deja que reduzcan', 'Incorpora los garbanzos cocidos y un poco de caldo', 'Cuece 10 minutos y ajusta de sal y comino'],
    time: 25, difficulty: 'Fácil', category: 'Económica',
    nutrition: { calories: 300, protein: 14, carbs: 38, fat: 10 },
  },
  {
    name: 'Macarrones con tomate',
    ingredients: [
      { name: 'Pasta', quantity: 350, unit: 'g' },
      { name: 'Tomate', quantity: 400, unit: 'g' },
      { name: 'Queso', quantity: 60, unit: 'g' },
    ],
    steps: ['Cuece la pasta en agua con sal', 'Calienta el tomate frito con un poco de albahaca', 'Mezcla la pasta escurrida con el tomate', 'Espolvorea queso rallado por encima'],
    time: 20, difficulty: 'Fácil', category: 'Económica',
    nutrition: { calories: 460, protein: 16, carbs: 78, fat: 10 },
  },
  {
    name: 'Tortilla de patatas sencilla',
    ingredients: [
      { name: 'Patatas', quantity: 500, unit: 'g' },
      { name: 'Huevos', quantity: 5, unit: 'unidades' },
      { name: 'Aceite', quantity: 150, unit: 'ml' },
    ],
    steps: ['Pela y corta las patatas en láminas finas', 'Fríelas a fuego suave hasta que estén tiernas', 'Bate los huevos y mezcla con las patatas escurridas', 'Cuaja la tortilla por ambos lados en la sartén'],
    time: 35, difficulty: 'Media', category: 'Económica',
    nutrition: { calories: 420, protein: 14, carbs: 34, fat: 26 },
  },
  {
    name: 'Arroz a la cubana',
    ingredients: [
      { name: 'Arroz', quantity: 300, unit: 'g' },
      { name: 'Huevos', quantity: 4, unit: 'unidades' },
      { name: 'Tomate', quantity: 400, unit: 'g' },
      { name: 'Plátano', quantity: 2, unit: 'unidades' },
    ],
    steps: ['Cuece el arroz en agua con sal', 'Calienta el tomate frito', 'Fríe los huevos y el plátano en rodajas', 'Sirve el arroz con el huevo, el plátano y el tomate'],
    time: 25, difficulty: 'Fácil', category: 'Económica',
    nutrition: { calories: 450, protein: 13, carbs: 78, fat: 11 },
  },

  // --- Vegetarianas ---
  {
    name: 'Hummus con crudités',
    ingredients: [
      { name: 'Garbanzos', quantity: 400, unit: 'g' },
      { name: 'Aceite', quantity: 40, unit: 'ml' },
    ],
    steps: ['Tritura los garbanzos cocidos con tahini, limón y ajo', 'Añade aceite poco a poco hasta lograr una crema fina', 'Ajusta de sal y comino', 'Sirve con palitos de verdura cruda'],
    time: 10, difficulty: 'Fácil', category: 'Vegetariana',
    nutrition: { calories: 260, protein: 10, carbs: 26, fat: 14 },
  },
  {
    name: 'Curry de garbanzos',
    ingredients: [
      { name: 'Garbanzos', quantity: 400, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
      { name: 'Tomate', quantity: 400, unit: 'g' },
    ],
    steps: ['Sofríe la cebolla con curry en polvo', 'Añade el tomate triturado y cuece 10 minutos', 'Incorpora los garbanzos y un poco de leche de coco', 'Cuece 10 minutos más y sirve con arroz'],
    time: 30, difficulty: 'Fácil', category: 'Vegetariana',
    nutrition: { calories: 340, protein: 13, carbs: 40, fat: 14 },
  },
  {
    name: 'Berenjenas rellenas de verduras',
    ingredients: [
      { name: 'Berenjena', quantity: 2, unit: 'unidades' },
      { name: 'Tomate', quantity: 2, unit: 'unidades' },
      { name: 'Queso', quantity: 80, unit: 'g' },
    ],
    steps: ['Corta las berenjenas por la mitad y vacía la pulpa', 'Sofríe la pulpa con tomate y cebolla picados', 'Rellena las berenjenas con el sofrito', 'Gratina con queso en el horno 15 minutos'],
    time: 40, difficulty: 'Media', category: 'Vegetariana',
    nutrition: { calories: 220, protein: 9, carbs: 18, fat: 12 },
  },
  {
    name: 'Falafel con pan de pita',
    ingredients: [
      { name: 'Garbanzos', quantity: 400, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
      { name: 'Pan', quantity: 4, unit: 'unidades' },
    ],
    steps: ['Tritura los garbanzos crudos remojados con cebolla, ajo y especias', 'Forma bolitas con la masa', 'Fríelas hasta que estén doradas', 'Sirve dentro del pan de pita con verduras'],
    time: 30, difficulty: 'Media', category: 'Vegetariana',
    nutrition: { calories: 380, protein: 14, carbs: 46, fat: 16 },
  },
  {
    name: 'Risotto de champiñones',
    ingredients: [
      { name: 'Arroz', quantity: 300, unit: 'g' },
      { name: 'Champiñones', quantity: 300, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
      { name: 'Queso', quantity: 60, unit: 'g' },
    ],
    steps: ['Sofríe la cebolla y los champiñones laminados', 'Añade el arroz y nácara un par de minutos', 'Incorpora caldo caliente poco a poco sin dejar de remover', 'Cuando esté cremoso, añade el queso y retira del fuego'],
    time: 35, difficulty: 'Media', category: 'Vegetariana',
    nutrition: { calories: 420, protein: 12, carbs: 68, fat: 11 },
  },
  {
    name: 'Pisto manchego',
    ingredients: [
      { name: 'Calabacín', quantity: 2, unit: 'unidades' },
      { name: 'Tomate', quantity: 3, unit: 'unidades' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
      { name: 'Aceite', quantity: 40, unit: 'ml' },
    ],
    steps: ['Sofríe la cebolla y el pimiento en aceite', 'Añade el calabacín y la berenjena troceados', 'Incorpora el tomate y cuece a fuego lento 25 minutos', 'Ajusta de sal y sirve con un huevo frito si quieres'],
    time: 40, difficulty: 'Fácil', category: 'Vegetariana',
    nutrition: { calories: 180, protein: 4, carbs: 18, fat: 10 },
  },
  {
    name: 'Ensalada de lentejas',
    ingredients: [
      { name: 'Lentejas', quantity: 300, unit: 'g' },
      { name: 'Tomate', quantity: 2, unit: 'unidades' },
      { name: 'Cebolla', quantity: 0.5, unit: 'unidades' },
    ],
    steps: ['Cuece las lentejas y deja enfriar (o usa cocidas)', 'Trocea el tomate, la cebolla y el pimiento', 'Mezcla todo con aceite y vinagre', 'Ajusta de sal y deja reposar 10 minutos'],
    time: 20, difficulty: 'Fácil', category: 'Vegetariana',
    nutrition: { calories: 290, protein: 16, carbs: 40, fat: 8 },
  },
  {
    name: 'Quiche de verduras',
    ingredients: [
      { name: 'Huevos', quantity: 4, unit: 'unidades' },
      { name: 'Leche', quantity: 150, unit: 'ml' },
      { name: 'Verduras congeladas', quantity: 1, unit: 'paquetes' },
      { name: 'Queso', quantity: 80, unit: 'g' },
    ],
    steps: ['Forra un molde con masa quebrada', 'Bate los huevos con la leche y el queso', 'Reparte las verduras salteadas sobre la masa y cubre con la mezcla', 'Hornea a 180°C durante 30-35 minutos'],
    time: 50, difficulty: 'Media', category: 'Vegetariana',
    nutrition: { calories: 320, protein: 14, carbs: 22, fat: 20 },
  },

  // --- Postres ---
  {
    name: 'Tarta de queso',
    ingredients: [
      { name: 'Queso', quantity: 500, unit: 'g' },
      { name: 'Huevos', quantity: 4, unit: 'unidades' },
      { name: 'Leche', quantity: 200, unit: 'ml' },
    ],
    steps: ['Bate el queso crema con los huevos y el azúcar', 'Añade la leche y la harina y mezcla bien', 'Vierte en un molde forrado con papel de horno', 'Hornea a 200°C unos 35-40 minutos'],
    time: 55, difficulty: 'Media', category: 'Postre',
    nutrition: { calories: 340, protein: 9, carbs: 24, fat: 23 },
  },
  {
    name: 'Bizcocho de yogur',
    ingredients: [
      { name: 'Yogures', quantity: 1, unit: 'unidades' },
      { name: 'Huevos', quantity: 3, unit: 'unidades' },
      { name: 'Aceite', quantity: 100, unit: 'ml' },
    ],
    steps: ['Mezcla el yogur, los huevos, el aceite y el azúcar', 'Añade la harina tamizada con la levadura', 'Vierte en un molde engrasado', 'Hornea a 180°C durante 35-40 minutos'],
    time: 50, difficulty: 'Fácil', category: 'Postre',
    nutrition: { calories: 280, protein: 5, carbs: 34, fat: 14 },
  },
  {
    name: 'Arroz con leche',
    ingredients: [
      { name: 'Arroz', quantity: 150, unit: 'g' },
      { name: 'Leche', quantity: 1, unit: 'litros' },
    ],
    steps: ['Cuece el arroz en agua unos minutos y escurre', 'Añade la leche, azúcar y una rama de canela', 'Cuece a fuego lento removiendo hasta que espese', 'Deja enfriar y espolvorea canela'],
    time: 45, difficulty: 'Fácil', category: 'Postre',
    nutrition: { calories: 260, protein: 6, carbs: 48, fat: 5 },
  },
  {
    name: 'Macedonia de frutas',
    ingredients: [
      { name: 'Fruta', quantity: 4, unit: 'unidades' },
    ],
    steps: ['Pela y trocea las frutas que tengas a mano', 'Mézclalas en un bol grande', 'Añade un chorrito de zumo de naranja', 'Enfría en la nevera antes de servir'],
    time: 10, difficulty: 'Fácil', category: 'Postre',
    nutrition: { calories: 110, protein: 1, carbs: 26, fat: 0 },
  },
  {
    name: 'Natillas caseras',
    ingredients: [
      { name: 'Leche', quantity: 500, unit: 'ml' },
      { name: 'Huevos', quantity: 3, unit: 'unidades' },
    ],
    steps: ['Calienta la leche con un poco de piel de limón', 'Bate las yemas con azúcar y maicena', 'Añade la leche caliente poco a poco sin dejar de remover', 'Cuece a fuego suave hasta que espese, sin hervir'],
    time: 25, difficulty: 'Media', category: 'Postre',
    nutrition: { calories: 190, protein: 7, carbs: 22, fat: 8 },
  },
  {
    name: 'Brownie de chocolate',
    ingredients: [
      { name: 'Huevos', quantity: 3, unit: 'unidades' },
      { name: 'Aceite', quantity: 120, unit: 'ml' },
    ],
    steps: ['Funde el chocolate con la mantequilla', 'Bate los huevos con el azúcar e incorpora el chocolate', 'Añade la harina tamizada con cuidado', 'Hornea a 180°C 20-25 minutos'],
    time: 40, difficulty: 'Fácil', category: 'Postre',
    nutrition: { calories: 380, protein: 6, carbs: 38, fat: 24 },
  },
  {
    name: 'Flan casero',
    ingredients: [
      { name: 'Huevos', quantity: 4, unit: 'unidades' },
      { name: 'Leche', quantity: 500, unit: 'ml' },
    ],
    steps: ['Prepara un caramelo con azúcar y fórralo en el molde', 'Bate los huevos con la leche y el azúcar', 'Vierte sobre el caramelo y cuece al baño maría 40 minutos', 'Deja enfriar en la nevera antes de desmoldar'],
    time: 60, difficulty: 'Media', category: 'Postre',
    nutrition: { calories: 210, protein: 8, carbs: 28, fat: 7 },
  },
  {
    name: 'Mousse de chocolate',
    ingredients: [
      { name: 'Huevos', quantity: 4, unit: 'unidades' },
    ],
    steps: ['Funde el chocolate al baño maría', 'Separa las claras de las yemas y monta las claras a punto de nieve', 'Mezcla el chocolate con las yemas y añade las claras con cuidado', 'Reparte en vasitos y enfría al menos 2 horas'],
    time: 20, difficulty: 'Media', category: 'Postre',
    nutrition: { calories: 250, protein: 7, carbs: 20, fat: 17 },
  },

  // --- Tradicionales ---
  {
    name: 'Paella de pollo y verduras',
    ingredients: [
      { name: 'Arroz', quantity: 400, unit: 'g' },
      { name: 'Pollo', quantity: 500, unit: 'g' },
      { name: 'Verduras congeladas', quantity: 1, unit: 'paquetes' },
      { name: 'Aceite', quantity: 40, unit: 'ml' },
    ],
    steps: ['Dora el pollo troceado en la paellera', 'Añade las verduras y sofríe unos minutos', 'Incorpora el arroz y el caldo caliente con azafrán', 'Cuece 18-20 minutos sin remover y deja reposar'],
    time: 45, difficulty: 'Media', category: 'Tradicional',
    nutrition: { calories: 480, protein: 30, carbs: 62, fat: 12 },
  },
  {
    name: 'Fabada asturiana',
    ingredients: [
      { name: 'Alubias', quantity: 500, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
    ],
    steps: ['Pon las alubias en remojo la noche anterior', 'Cuece las alubias con cebolla y laurel a fuego lento', 'Añade chorizo, morcilla y panceta', 'Cuece 1.5-2 horas hasta que estén tiernas'],
    time: 120, difficulty: 'Media', category: 'Tradicional',
    nutrition: { calories: 520, protein: 28, carbs: 48, fat: 24 },
  },
  {
    name: 'Cocido madrileño',
    ingredients: [
      { name: 'Garbanzos', quantity: 400, unit: 'g' },
      { name: 'Pollo', quantity: 400, unit: 'g' },
      { name: 'Patatas', quantity: 3, unit: 'unidades' },
    ],
    steps: ['Pon los garbanzos en remojo la noche anterior', 'Cuece las carnes y los garbanzos en una olla grande', 'Añade la verdura y las patatas y sigue cociendo', 'Sirve el caldo primero y luego los garbanzos con la carne'],
    time: 150, difficulty: 'Media', category: 'Tradicional',
    nutrition: { calories: 540, protein: 35, carbs: 42, fat: 22 },
  },
  {
    name: 'Croquetas de jamón',
    ingredients: [
      { name: 'Leche', quantity: 500, unit: 'ml' },
      { name: 'Huevos', quantity: 2, unit: 'unidades' },
    ],
    steps: ['Haz una bechamel espesa con mantequilla, harina y leche', 'Añade el jamón picado y deja enfriar la masa', 'Forma las croquetas y pásalas por huevo y pan rallado', 'Fríe en aceite bien caliente hasta dorar'],
    time: 60, difficulty: 'Media', category: 'Tradicional',
    nutrition: { calories: 320, protein: 11, carbs: 26, fat: 19 },
  },
  {
    name: 'Pulpo a la gallega',
    ingredients: [
      { name: 'Pulpo', quantity: 1, unit: 'kg' },
      { name: 'Patatas', quantity: 3, unit: 'unidades' },
      { name: 'Aceite', quantity: 40, unit: 'ml' },
    ],
    steps: ['Cuece el pulpo en agua hirviendo unos 40 minutos', 'Cuece las patatas y córtalas en rodajas', 'Corta el pulpo en trozos con tijeras', 'Emplata sobre las patatas con aceite, sal gorda y pimentón'],
    time: 60, difficulty: 'Media', category: 'Tradicional',
    nutrition: { calories: 260, protein: 28, carbs: 18, fat: 9 },
  },
  {
    name: 'Bacalao al pil pil',
    ingredients: [
      { name: 'Bacalao', quantity: 600, unit: 'g' },
      { name: 'Aceite', quantity: 200, unit: 'ml' },
    ],
    steps: ['Confita el bacalao en aceite suave a fuego bajo', 'Retira el bacalao y reserva el aceite', 'Liga el aceite con el jugo del bacalao moviendo la sartén en círculos', 'Vierte la salsa emulsionada sobre el bacalao'],
    time: 40, difficulty: 'Difícil', category: 'Tradicional',
    nutrition: { calories: 380, protein: 32, carbs: 1, fat: 27 },
  },
  {
    name: 'Migas',
    ingredients: [
      { name: 'Pan', quantity: 400, unit: 'g' },
      { name: 'Aceite', quantity: 60, unit: 'ml' },
    ],
    steps: ['Humedece el pan troceado la noche anterior', 'Fríe panceta y chorizo en una sartén grande', 'Añade el pan y remueve sin parar hasta que suelte', 'Sirve caliente, tradicionalmente con uvas'],
    time: 45, difficulty: 'Media', category: 'Tradicional',
    nutrition: { calories: 420, protein: 12, carbs: 44, fat: 22 },
  },
  {
    name: 'Empanada gallega',
    ingredients: [
      { name: 'Atún', quantity: 300, unit: 'g' },
      { name: 'Tomate', quantity: 400, unit: 'g' },
      { name: 'Cebolla', quantity: 2, unit: 'unidades' },
    ],
    steps: ['Sofríe la cebolla y el pimiento a fuego lento', 'Añade el tomate y el atún y cuece 10 minutos', 'Forra un molde con masa, rellena y cubre con otra capa', 'Hornea a 200°C 30-35 minutos hasta dorar'],
    time: 60, difficulty: 'Media', category: 'Tradicional',
    nutrition: { calories: 360, protein: 18, carbs: 38, fat: 15 },
  },
];
