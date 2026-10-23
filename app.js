// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCIda03hCXKULZxiNTnvL4MI8u4ldWXzMA",
  authDomain: "gym-finity.firebaseapp.com",
  databaseURL: "https://gym-finity-default-rtdb.firebaseio.com",
  projectId: "gym-finity",
  storageBucket: "gym-finity.firebasestorage.app",
  messagingSenderId: "231620381377",
  appId: "1:231620381377:web:01f8d727423b131993e240"
};

// Inicializamos la conexión a la Nube
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// ESTADO GLOBAL
// ==========================================
const state = {
  currentUser: JSON.parse(localStorage.getItem('gym_session')) || null, 
  adminTab: 'profile', clientTab: 'routine', viewingClientAsAdmin: false,
  calendarDate: new Date(),
  events: [],
  historyDB: {},
  inventory: [
    'Extensiones de cuadriceps', 'Curl femoral de pie', 'Curl femoral acostado', 'Smith',
    'Press militar hombro en máquina', 'Trapecio en máquina', 'Peck deck hombro', 'Peck deck pecho', 
    'Jalón vertical', 'Aperturas', 'Fondos', 'Crunch abdominal', 'Mancuernas', 'Polea'
  ],
  clients: [],
  currentProductIndex: 0
};

// ==========================================
// FUNCIONES DE SINCRONIZACIÓN CON LA NUBE
// ==========================================
async function loadDataFromFirebase() {
    try {
        const settingsDoc = await db.collection('gymData').doc('settings').get();
        if(settingsDoc.exists) {
            const d = settingsDoc.data();
            if(d.inventory) state.inventory = d.inventory;
        }

        const eventsDoc = await db.collection('gymData').doc('events').get();
        if(eventsDoc.exists) state.events = eventsDoc.data().events || [];

        const historyDoc = await db.collection('gymData').doc('history').get();
        if(historyDoc.exists) state.historyDB = historyDoc.data() || {};

        const clientsSnapshot = await db.collection('clients').get();
        state.clients = clientsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error conectando a Firebase:", error);
    }
}

function syncClientToDB(clientRecord) { db.collection('clients').doc(clientRecord.cc).set(clientRecord).catch(e => console.log(e)); }
function deleteClientFromDB(cc) { db.collection('clients').doc(cc).delete().catch(e => console.log(e)); }
function syncSettingsToDB() { db.collection('gymData').doc('settings').set({ inventory: state.inventory }).catch(e => console.log(e)); }
function syncEventsToDB() { db.collection('gymData').doc('events').set({ events: state.events }).catch(e => console.log(e)); }
function syncHistoryToDB() { db.collection('gymData').doc('history').set(state.historyDB).catch(e => console.log(e)); }

// ==========================================
// ENTRENADORES Y PLANES
// ==========================================
const authorizedAdmins = [
    { name: "Daniel Muñoz", cc: "1022991699" },
    { name: "José Muñoz", cc: "79818717" }
];

const gymPlans = [
    { id: "1. SILVER", price: "$70.000", subtitle: "Plan básico", target: "Para quien quiere entrenar por su cuenta y busca una opción económica.", schedule: "6:00am - 3:00pm", classes: false, inbody: false, routine: false, companion: false, discount: false, color: "#E5E7EB", shadow: "rgba(229,231,235,0.5)", durationDays: 30 },
    { id: "2. PREMIUM", price: "$75.000", subtitle: "Plan recomendado", target: "Para quien quiere entrenar con mayor orientación y una rutina adaptada a sus objetivos.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Valoración inicial InBody", routine: "Adaptación personalizada", companion: false, discount: "5% Dcto. suplementos", color: "#3B82F6", shadow: "rgba(59,130,246,0.5)", durationDays: 30 },
    { id: "3. GOLD", price: "$85.000", subtitle: "Plan más completo", target: "Para quien desea un seguimiento más frecuente y beneficios adicionales.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Seguimiento mensual InBody", routine: "Revisión y ajuste mensual", companion: "Acompañante 4 veces/mes", discount: "10% Dcto. suplementos", color: "#FFD700", shadow: "rgba(255,215,0,0.5)", durationDays: 30 },
    { id: "4. FLEX", price: "$49.000", subtitle: "Modalidad flexible", target: "Para quien no quiere comprometerse con un plan mensual tradicional.", schedule: "10 entradas vigencia 1 mes", classes: true, inbody: false, routine: false, companion: false, discount: false, color: "#EC4899", shadow: "rgba(236,72,153,0.5)", durationDays: 30 },
    { id: "1. SILVER BIMESTRE", price: "$130.000", subtitle: "Plan básico", target: "Para quien quiere entrenar por su cuenta y busca una opción económica.", schedule: "6:00am - 3:00pm", classes: false, inbody: false, routine: false, companion: false, discount: false, color: "#A855F7", shadow: "rgba(168,85,247,0.5)", durationDays: 60 },
    { id: "2. PREMIUM BIMESTRE", price: "$140.000", subtitle: "Plan recomendado", target: "Para quien quiere entrenar con mayor orientación y una rutina adaptada a sus objetivos.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Valoración inicial InBody", routine: "Adaptación personalizada", companion: false, discount: "5% Dcto. suplementos", color: "#F97316", shadow: "rgba(249,115,22,0.5)", durationDays: 60 },
    { id: "3. GOLD BIMESTRE", price: "$155.000", subtitle: "Plan más completo", target: "Para quien desea un seguimiento más frecuente y beneficios adicionales.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Seguimiento mensual InBody", routine: "Revisión y ajuste mensual", companion: "Acompañante 4 veces/mes", discount: "10% Dcto. suplementos", color: "#14B8A6", shadow: "rgba(20,184,166,0.5)", durationDays: 60 },
    { id: "5. RUTINA", price: "$10.000", subtitle: "Puede ir guiada", target: "Para quien quiere orientación básica para entrenar sin plan mensual.", schedule: "6:00am - 10:00pm", classes: true, inbody: false, routine: false, companion: false, discount: false, color: "#18181B", shadow: "rgba(255,255,255,0.4)", durationDays: 30 },
    { id: "2. PLAN JUVENIL", price: "$70.000", subtitle: "De 14 a 17 años", target: "Para quien quiere entrenar con mayor orientación y una rutina adaptada a sus objetivos.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Valoración inicial InBody", routine: "Adaptación personalizada", companion: false, discount: false, color: "#06B6D4", shadow: "rgba(6,182,212,0.5)", durationDays: 30 },
    { id: "3. GOLD F. ARMADAS", price: "$70.000", subtitle: "Fuerzas Armadas", target: "Para quien desea un seguimiento más frecuente y beneficios adicionales.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Seguimiento mensual InBody", routine: "Revisión y ajuste mensual", companion: "Acompañante 4 veces/mes", discount: "10% Dcto. suplementos", color: "#10B981", shadow: "rgba(16,185,129,0.5)", durationDays: 30 }
];

const storeProducts = [
    { name: "Proteína Whey Elite", img: "PRODUCTOS/PROTEINA_1.png", desc: "Fórmula avanzada para acelerar la recuperación post-entrenamiento.", price: "$165.000", tag: "SABOR VAINILLA • 2 LIBRAS", info: ["Rápida absorción", "Baja en carbohidratos", "Ideal post-entreno"] },
    { name: "Proteína Isolate Pro", img: "PRODUCTOS/PROTEINA_2.png", desc: "Proteína aislada de máxima pureza, diseñada para atletas exigentes.", price: "$190.000", tag: "SABOR CHOCOLATE • 2 LIBRAS", info: ["Cero Azúcar", "Libre de Lactosa", "Alta en BCAAs"] },
    { name: "Creatina Monohidratada", img: "PRODUCTOS/CREATINA_1.png", desc: "Suplemento esencial para aumentar la fuerza explosiva y el volumen celular.", price: "$90.000", tag: "SIN SABOR • 300G", info: ["Aumenta la fuerza", "Mejora resistencia", "100% Pura"] }
];

const gymCoaches = [
    { name: "RZR Training", coach: "Alta Intensidad", img: "CLASES/RZR.png", desc: "Entrenamiento de alta intensidad (HIIT). Supera tus límites, mejora tu resistencia cardiovascular y desarrolla fuerza explosiva." },
    { name: "Rumba Aeróbica", coach: "Cardio Dance", img: "CLASES/RUMBA.png", desc: "Quema calorías y libera el estrés al ritmo de los mejores géneros musicales. Una sesión llena de energía, sudor y pura actitud." },
    { name: "Colombia Rumbera", coach: "Sabor Local", img: "CLASES/COLOMBIA_RUMBERA.png", desc: "Fusión explosiva de ritmos folclóricos y urbanos. Un cardio intenso, diferente y muy divertido con auténtico sabor colombiano." },
    { name: "Step Fit", coach: "Resistencia", img: "CLASES/STEP.png", desc: "Coreografía y resistencia sobre plataforma. Ideal para tonificar piernas y glúteos mientras potencias tu capacidad aeróbica." },
    { name: "Combat & Yoga", coach: "Fuerza y Flexibilidad", img: "CLASES/COMBATYOGA.png", desc: "Fusión perfecta entre la adrenalina y energía de los movimientos de combate con la respiración, flexibilidad y control del yoga. Fortalece cuerpo y mente en una sola sesión." }
];

// ==========================================
// DICCIONARIO DE EJERCICIOS (CON TODAS TUS IMÁGENES EXACTAS)
// ==========================================
const exerciseDetails = {
    // ABDOMEN
    "Abdomen Polea Oblicuos": { img: "ejercicios/ABDOMEN/abdomen_polea_oblicuos_arriba.png", desc: "Contrae el abdomen girando desde el torso y mantén tensión en el oblicuo." },
    "Crunch Balón Medicinal": { img: "ejercicios/ABDOMEN/crunch_balon_medicinal.png", desc: "Eleva el torso abrazando o sosteniendo el balón medicinal." },
    "Crunch con Balón Medicinal": { img: "ejercicios/ABDOMEN/crunch_con_balon_medicinal.png", desc: "Eleva el torso abrazando o sosteniendo el balón medicinal." },
    "Crunch con Disco": { img: "ejercicios/ABDOMEN/crunch_con_disco.png", desc: "Sostén el disco sobre el pecho o extendido y eleva el torso." },
    "Crunch Cruzado Libre": { img: "ejercicios/ABDOMEN/crunch_cruzado_libre.png", desc: "Lleva el codo hacia la rodilla contraria alternando lados." },
    "Crunch Elevando Pelvis": { img: "ejercicios/ABDOMEN/crunch_elevando_pelvis.png", desc: "Eleva la cadera ligeramente al mismo tiempo que contraes el abdomen alto." },
    "Crunch en Banco": { img: "ejercicios/ABDOMEN/crunch_en_banco.png", desc: "Recostado en el banco, contrae el abdomen sin tirar del cuello." },
    "Crunch en Máquina": { img: "ejercicios/ABDOMEN/crunch_en_maquina.png", desc: "Ajusta la máquina y flexiona el torso con la resistencia elegida." },
    "Crunch Frog": { img: "ejercicios/ABDOMEN/crunch_frog.png", desc: "Abre las rodillas como rana y haz el crunch para trabajar todo el bloque abdominal." },
    "Crunch Levantamiento Pelvis": { img: "ejercicios/ABDOMEN/crunch_levantamiento_de_pelvis.png", desc: "Levanta la cadera controlando la bajada." },
    "Elevación de Pelvis": { img: "ejercicios/ABDOMEN/elevacion_de_pelvis.png", desc: "Acuéstate boca arriba y eleva la pelvis despegando los glúteos del piso." },
    "Elevación de Piernas": { img: "ejercicios/ABDOMEN/elevacion_de_piernas.png", desc: "Mantén las piernas rectas y súbelas controlando la tensión abdominal." },
    "Elevación Piernas Flexionadas": { img: "ejercicios/ABDOMEN/elevacion_piernas_flexionadas.png", desc: "Lleva las rodillas flexionadas hacia el pecho." },
    "Escaladas": { img: "ejercicios/ABDOMEN/escaladas.png", desc: "En posición de plancha, lleva las rodillas hacia el pecho de forma rápida y controlada." },
    "Giros con Polea": { img: "ejercicios/ABDOMEN/giros_con_polea.png", desc: "Tira de la polea girando el torso, manteniendo los brazos fijos y apretando el abdomen." },
    "Half Wipers Estiradas": { img: "ejercicios/ABDOMEN/Half_Wipers_con_piernas_estiradas.png", desc: "Piernas estiradas apuntando al techo, baja hacia un lado y luego al otro sin tocar el suelo." },
    "Half Wipers Flexionadas": { img: "ejercicios/ABDOMEN/Half_Wipers_con_piernas_flexionadas.png", desc: "Con rodillas dobladas, gira de un lado a otro controlando desde el abdomen." },
    "Laterales Oblicuos": { img: "ejercicios/ABDOMEN/laterales_oblicuos.png", desc: "Desliza la mano hacia el talón del mismo lado contrayendo los oblicuos." },
    "Marcha Horizontal Acostado": { img: "ejercicios/ABDOMEN/marcha_horizontal_acostado.png", desc: "Acuéstate y alterna el movimiento de las piernas como si caminaras." },
    "Marcha Piernas Alternadas": { img: "ejercicios/ABDOMEN/marcha_horizontal_piernas_alternadas.png", desc: "Movimiento de tijera horizontal con las piernas." },
    "Oblicuos Cruzados": { img: "ejercicios/ABDOMEN/oblicuos_cruzados.png", desc: "Elevación cruzando para enfocar el esfuerzo en la pared lateral abdominal." },
    "Oblicuos en Hiperextensión": { img: "ejercicios/ABDOMEN/oblicuos_en_hiperextension.png", desc: "En la silla romana, ponte de lado y eleva el torso contrayendo el oblicuo." },
    "Oblicuos Libre": { img: "ejercicios/ABDOMEN/oblicuos_libre.png", desc: "Trabajo libre enfocado a los laterales del abdomen." },
    "Plancha Lateral": { img: "ejercicios/ABDOMEN/plancha_lateral.png", desc: "Mantén el cuerpo recto y apoyado sobre un antebrazo." },
    "Puente Lateral con Peso": { img: "ejercicios/ABDOMEN/puente_lateral_con_peso.png", desc: "Plancha lateral con elevación o soporte de un peso extra en la mano libre." },
    "Puente Lateral": { img: "ejercicios/ABDOMEN/puente_lateral_sin_peso.png", desc: "Eleva la cadera lateralmente y mantén la posición." },
    "Rueda Abdominal": { img: "ejercicios/ABDOMEN/rueda_abdominal1.png", desc: "Desliza la rueda hacia adelante hasta estirarte por completo y regresa contrayendo fuerte." },
    "Rueda Abdominal Sencilla": { img: "ejercicios/ABDOMEN/rueda_abdominal2.png", desc: "Apoya las rodillas en el suelo y desliza la rueda hacia adelante hasta estirarte por completo y regresa contrayendo fuerte." },

    // ANTEBRAZO
    "Curl Antebrazo Barra": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_BARRA.png", desc: "Con palmas arriba, flexiona las muñecas para subir la barra." },
    "Curl Antebrazo Atrás": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_BARRA_ATRAS.png", desc: "Barra por detrás del cuerpo, flexiona las muñecas hacia arriba." },
    "Curl Antebrazo Mancuerna Prono": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_MANCUERNA_PRONACION.png", desc: "Palmas abajo, levanta la mancuerna solo doblando la muñeca." },
    "Curl Antebrazo Prono Polea": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_PRONO_POLEA.png", desc: "Polea desde abajo. Palmas hacia abajo, tira hacia arriba con la muñeca." },
    "Curl Antebrazo Supinación": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_SUPINACION.png", desc: "Aislado para la flexión de muñeca con la palma hacia arriba." },
    "Curl Concentrado Antebrazo Barra": { img: "ejercicios/ANTEBRAZO/CURL_CONCENTRADO_ANTEBRAZO_BARRA.png", desc: "Brazo apoyado, movimiento aislado usando barra." },
    "Curl Concentrado Pronación Barra": { img: "ejercicios/ANTEBRAZO/CURL_CONCENTRADO_PRONACION_CON_BARRA.png", desc: "Palmas abajo apoyado sobre rodilla o banco, elevando solo la muñeca." },

    // BICEPS
    "Curl Bíceps Barra Abierto": { img: "ejercicios/BICEPS/CURL_BICEPS_BARRA_AGARRE_ABIERTO.png", desc: "Sostén la barra con un agarre más ancho que los hombros y flexiona los brazos, enfocando la cabeza corta." },
    "Curl Bíceps Barra Cerrado": { img: "ejercicios/BICEPS/CURL_BICEPS_BARRA_AGARRE_CERRADO.png", desc: "Agarre cerrado en la barra. Flexiona para enfocar el trabajo en la cabeza externa (larga) del bíceps." },
    "Curl Bíceps Barra Romana": { img: "ejercicios/BICEPS/CURL_BICEPS_BARRA_ROMANA.png", desc: "Utiliza el agarre neutro de la barra romana para trabajar el bíceps y el braquial anterior." },
    "Curl Bíceps Bayesian": { img: "ejercicios/BICEPS/CURL_BICEPS_BAYESIAN.png", desc: "De espaldas a la polea baja, realiza el curl permitiendo que el brazo quede por detrás del torso para máximo estiramiento." },
    "Curl Bíceps Unilateral": { img: "ejercicios/BICEPS/CURL_BICEPS_CON_MANCUERNA_UNILATERAL.png", desc: "Trabaja un brazo a la vez manteniendo el codo fijo pegado al cuerpo y flexionando hacia arriba." },
    "Curl Concentrado Supino": { img: "ejercicios/BICEPS/CURL_BICEPS_CONCENTRADO_SUPINO.png", desc: "Sentado, apoya el codo en la cara interna del muslo y flexiona aislando por completo el movimiento." },
    "Curl Mancuernas Alternado": { img: "ejercicios/BICEPS/CURL_BICEPS_MANCUERNAS_ALTERNADO.png", desc: "Alterna la flexión de cada brazo subiendo una mancuerna mientras la otra baja controladamente." },
    "Curl Mancuernas Inclinado": { img: "ejercicios/BICEPS/CURL_BICEPS_MANCUERNAS_INCLINADO.png", desc: "Recostado en un banco inclinado, deja colgar los brazos hacia atrás y flexiona aislando las cabezas del bíceps." },
    "Curl Martillo Alternado": { img: "ejercicios/BICEPS/CURL_BICEPS_MARTILLOS_ALTERNADO.png", desc: "Sube las mancuernas alternadamente con agarre neutro para trabajar el braquiorradial y braquial." },
    "Curl Martillo Simultáneo": { img: "ejercicios/BICEPS/CURL_BICEPS_MARTILLOS_MANCUERNA.png", desc: "Flexiona ambos brazos al mismo tiempo manteniendo el agarre neutro a lo largo de todo el movimiento." },
    "Curl Martillo Predicador": { img: "ejercicios/BICEPS/CURL_BICEPS_MARTILLOS_PREDICADOR.png", desc: "Apoyado en el banco Scott, realiza la flexión usando agarre neutro o mancuerna vertical." },
    "Curl Polea Supino": { img: "ejercicios/BICEPS/CURL_BICEPS_POLEA_SUPINO.png", desc: "En polea baja, sujeta la barra recta o en V con las palmas hacia arriba y flexiona contrayendo fuerte." },
    "Curl Bíceps Polea": { img: "ejercicios/BICEPS/CURL_BICEPS_POLEA.png", desc: "Flexiona los brazos tirando del peso desde la polea baja, manteniendo una tensión muscular continua." },
    "Curl Bíceps Soga Polea": { img: "ejercicios/BICEPS/CURL_BICEPS_SOGA_POLEA.png", desc: "Usa la soga en polea baja con agarre neutro, separando ligeramente las manos al llegar arriba." },
    "Curl Spider Inclinado": { img: "ejercicios/BICEPS/CURL_BICEPS_SPIDER.png", desc: "Pecho apoyado boca abajo en banco inclinado. Flexiona los brazos colgantes estrujando el bíceps." },
    "Curl Predicador Unilateral": { img: "ejercicios/BICEPS/CURL_BICEPS_UNILATERAL_PREDICADOR.png", desc: "Aísla el trabajo de un solo bíceps apoyando firmemente la axila y el tríceps en el banco Scott." },
    "Curl Spider Sentado Suelo": { img: "ejercicios/BICEPS/CURL_SPIDER_SENTADO_SUELO.png", desc: "Variante estricta desde el suelo apoyando brazos, estabiliza el torso y realiza la flexión concentrada." }, 
    
    // CUADRICEPS
    "Sentadilla Profunda con Barra": { img: "ejercicios/CUADRICEPS/SENTADILLA_PROFUNDA_CON_BARRA.PNG", desc: "Con la barra en la espalda alta, baja flexionando rodillas y cadera hasta romper el paralelo, manteniendo el torso firme, y empuja para subir." },
    "Sentadilla Hacka": { img: "ejercicios/CUADRICEPS/SENTANDILLA_HACKA.PNG", desc: "Apoya completamente la espalda en el respaldo de la máquina, baja de forma controlada y empuja desde los talones para extender las piernas." },
    "Extensión de Cuádriceps": { img: "ejercicios/CUADRICEPS/EXTENSION_DE_CUADRICEPS.PNG", desc: "Sentado en la máquina, extiende las rodillas para elevar el peso contrayendo fuertemente los cuádriceps en la parte más alta del movimiento." },
    
    // ESPALDA
    "Dominadas": { img: "ejercicios/ESPALDA/DOMINADAS.png", desc: "Levanta tu peso libremente pasando la barbilla sobre la barra." },
    "Dominadas Agarre Neutro": { img: "ejercicios/ESPALDA/DOMINADAS_AGARRE_NEUTRO.png", desc: "Las palmas de las manos se miran entre sí. Sube enfocando el trabajo en la espalda." },
    "Dominadas Supino": { img: "ejercicios/ESPALDA/DOMINADAS_SUPINO.png", desc: "Palmas hacia ti. Involucra fuertemente también a los bíceps." },
    "Hiperextensión Lumbar": { img: "ejercicios/ESPALDA/HIPEREXTENSION_LUMBAR.png", desc: "En banco romano, flexiona y extiende el tronco para fortalecer la espalda baja." },
    "Jalón Vertical Unilateral": { img: "ejercicios/ESPALDA/JALON_VERTICAL_UNILATERAL.png", desc: "Jalón en polea a una sola mano, estirando completamente el dorsal." },
    "Jalón Libre Polea": { img: "ejercicios/ESPALDA/JALON_LIBRE_POLEA.png", desc: "Lleva el agarre hacia ti sintiendo la contracción escapular." },
    "Jalón Vertical Abierto": { img: "ejercicios/ESPALDA/JALON_VERTICAL_ABIERTO.png", desc: "Agarre amplio. Jala la barra hacia la clavícula juntando las escápulas atrás." },
    "Jalón Vertical Neutro": { img: "ejercicios/ESPALDA/JALON_VERTICAL_NEUTRO.png", desc: "Jalón con agarre cerrado o V. Énfasis en el grosor de la espalda." },
    "Jalón Vertical Supino": { img: "ejercicios/ESPALDA/JALON_VERTICAL_SUPINO.png", desc: "Agarre inverso (palmas hacia ti). Jala al pecho." },
    "Pull Over": { img: "ejercicios/ESPALDA/PULL_OVER.png", desc: "Acostado con mancuerna, baja los brazos estirados hacia atrás y vuelve al centro." },
    "Pull Over Sentado": { img: "ejercicios/ESPALDA/PULL_OVER_SENTADO.png", desc: "En máquina o polea, baja la barra con brazos rígidos hasta los muslos." },
    "Remo Barra Libre Supino": { img: "ejercicios/ESPALDA/REMO_BARRA_LIBRE_SUPINACION.png", desc: "Torso inclinado, agarre invertido. Jala la barra hacia el ombligo." },
    "Remo Colgado": { img: "ejercicios/ESPALDA/REMO_COLGADO.png", desc: "Cuelga del TRX o barra baja y tracciona tu propio peso." },
    "Remo de Pie Polea": { img: "ejercicios/ESPALDA/REMO_DEPIE_POLEA.png", desc: "De pie, jala hacia el abdomen manteniendo la espalda estable." },
    "Remo Horizontal Abierto": { img: "ejercicios/ESPALDA/REMO_HORIZONTAL_ABIERTO.png", desc: "Agarre ancho en máquina o polea. Tracciona llevando codos hacia atrás." },
    "Remo Horizontal Cerrado": { img: "ejercicios/ESPALDA/REMO_HORIZONTAL_CERRADO.png", desc: "Agarre cerrado en polea baja. Lleva el triángulo hacia el estómago." },
    "Remo Horizontal Hammer": { img: "ejercicios/ESPALDA/REMO_HORIZONTAL_HAMMER.png", desc: "En máquina articulada de discos, jala apretando la espalda." },
    "Remo Inferior Polea": { img: "ejercicios/ESPALDA/REMO_INFERIOR_POLEA.png", desc: "Desde polea muy baja tracciona hacia la cadera." },
    "Remo Mancuernas": { img: "ejercicios/ESPALDA/REMO_MANCUERNAS.png", desc: "Jala ambas mancuernas al mismo tiempo llevando los codos arriba." },
    "Remo Mancuernas Inclinado": { img: "ejercicios/ESPALDA/REMO_MANCUERNAS_INCLINADO.png", desc: "Pecho apoyado en banco inclinado. Remo estricto con mancuernas." },
    "Remo Mancuernas Libre": { img: "ejercicios/ESPALDA/REMO_MANCUERNAS_LIBRE.png", desc: "Posición inclinada de pie, rema sin apoyo de pecho." },
    "Remo Smith": { img: "ejercicios/ESPALDA/REMO_SMITH.png", desc: "Remo con barra apoyado en la guía de la máquina Smith." },
    "Remo Supinación": { img: "ejercicios/ESPALDA/REMO_SUPINACION.png", desc: "Agarre palmas hacia arriba. Fuerte trabajo para la parte baja del dorsal." },
    "Remo en T Supinación": { img: "ejercicios/ESPALDA/REMO_T_SUPINACION.png", desc: "Máquina o barra en T con agarre invertido." },
    "Remo Unilateral Mancuerna": { img: "ejercicios/ESPALDA/REMO_UNILATERAL_MANCUERNA.png", desc: "Rodilla y mano apoyada en banco. El otro brazo jala hacia la cadera." },
    "Remo T Pronación": { img: "ejercicios/ESPALDA/REMOT_PRONACION.png", desc: "Barra en T con agarre tradicional palmas hacia abajo." },

    // HOMBRO
    "Face Pull": { img: "ejercicios/HOMBRO/FACE_PULL.PNG", desc: "Tira de la polea hacia tu rostro separando las manos y llevando los codos hacia atrás y arriba, enfocando el trabajo en el deltoides posterior y trapecio." },
    "PeckDeck Hombro": { img: "ejercicios/HOMBRO/PECKDECK_APERTURAS_HOMBRO_POSTERIOR.PNG", desc: "Siéntate mirando hacia la máquina (con el pecho apoyado en el respaldo). Empuja los agarres hacia atrás con los brazos casi rectos para trabajar la parte trasera del hombro." },
    "Trapecio": { img: "ejercicios/HOMBRO/trapecio.png", desc: "Encoge los hombros hacia arriba como si quisieras tocar tus orejas." },

    // ISQUIOS
    "Curl Femoral": { img: "ejercicios/ISQUIOS/curl_femoral.png", desc: "Flexiona las rodillas llevando el peso hacia tus glúteos." },
    "Peso Muerto": { img: "ejercicios/ISQUIOS/PESO_MUERTO.PNG", desc: "Con la espalda recta y el core apretado, baja el torso empujando la cadera hacia atrás y sube contrayendo los isquiosurales y glúteos." },

    // PECHO
    "Press Plano con Mancuernas": { img: "ejercicios/PECHO/PRESS_BANCO_PLANO_CON_MANCUERNA.PNG", desc: "Acostado en banco plano, empuja las mancuernas hacia arriba juntándolas ligeramente en el centro para una contracción profunda del pectoral." },
    "Press Inclinado con Barra": { img: "ejercicios/PECHO/PRESS_INCLINADO_CON_BARRA.PNG", desc: "En banco inclinado, baja la barra hasta la parte alta del pecho y empuja para enfocar el trabajo en la porción clavicular (pecho superior)." },
    "Press Banco Plano": { img: "ejercicios/PECHO/PRESS_BANCO_PLANO.PNG", desc: "Acostado en banco plano, baja la barra de forma controlada hasta rozar el pecho y empuja con fuerza hacia arriba." },
    "Press Plano Hammer": { img: "ejercicios/PECHO/PRESS_BANCO_PLANO_HAMMER.PNG", desc: "Sentado en la máquina articulada (Hammer), empuja el peso hacia el frente manteniendo los codos ligeramente por debajo de los hombros." },
    "Press Inclinado Hammer": { img: "ejercicios/PECHO/PRESS_INCLINADO_HAMMER.PNG", desc: "Utiliza la máquina articulada con inclinación para aislar y trabajar de manera estable la parte superior del pectoral." },
    "Press Plano Abierto": { img: "ejercicios/PECHO/PRESS_BANCO_PLANO_ABIERTO.PNG", desc: "Realiza el press con un agarre más ancho que la línea de los hombros, estirando al máximo las fibras externas del pecho al bajar." },
    "Fondos en Paralelas": { img: "ejercicios/PECHO/FONDOS_EN_PARALELAS.PNG", desc: "Inclina el torso ligeramente hacia adelante y baja flexionando los codos. Empuja para subir enfocando el esfuerzo en la zona baja del pecho." },
    "Flexiones Básicas": { img: "ejercicios/PECHO/FLEXIONES_DE_PECHO_BASICAS.PNG", desc: "Con las manos a la anchura de los hombros y el cuerpo recto, baja el pecho hasta casi tocar el piso y empuja para subir." },
    "Flexiones de Pecho": { img: "ejercicios/PECHO/FLEXIONES_DE_PECHO.PNG", desc: "Flexiones (push-ups) tradicionales manteniendo el core apretado para empujar tu propio peso corporal." },
    "Aperturas Polea Inferior": { img: "ejercicios/PECHO/APERTURAS_EN_POLEA_INFERIOR.PNG", desc: "De pie, tira de los agarres desde las poleas bajas llevándolos hacia arriba y al centro del pecho." },
    "Peck Deck": { img: "ejercicios/PECHO/PECKDECK_APERTURAS_HOMBRO_POSTERIOR.PNG", desc: "En la máquina Peck Deck, junta los brazos frente a ti apretando los pectorales en la contracción máxima." },

    // OTROS (Músculos adicionales de tu base original)
    "Abducción en maquina": { img: "ejercicios/GLUTEO/ABDUCCION_EN_MAQUINA_SENTADO.PNG", desc: "Sentado en la máquina, junta las piernas empujando los cojines hacia el centro. Sirve para trabajar la cara interna del muslo (entrepierna)." },
    "Aductores en maquina": { img: "ejercicios/ADUCTORES/ADUCTOR_SENTADO_MAQUINA.PNG", desc: "Sentado en la máquina, empuja los cojines hacia afuera abriendo las piernas. Sirve para trabajar la parte lateral de la pierna y el glúteo." },
    "Gemelos": { img: "ejercicios/GEMELOS/gemelos.png", desc: "Eleva los talones apoyándote en la punta de los pies." }
};

let progressChartInstance = null;
let exerciseChartInstance = null;

// ==========================================
// INICIALIZACIÓN Y CARGA DESDE LA NUBE
// ==========================================
window.onload = async () => {
  const loader = document.getElementById('loading-screen');
  if(loader) {
      loader.classList.remove('hide-loader');
      const title = loader.querySelector('h1');
      if(title) title.innerHTML = '<span class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">GYM</span> <span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">FINITY</span>';
  }
  
  await loadDataFromFirebase();
  performSystemMaintenance(); 
  migrateOldRoutines(); 
  
  if(loader) {
      setTimeout(() => {
         loader.classList.add('hide-loader');
      }, 500);
  }
  
  if (state.currentUser && state.currentUser.role === 'client') {
      const dbClient = state.clients.find(c => c.cc === state.currentUser.cc);
      if(dbClient) {
          state.currentUser.record = dbClient;
          localStorage.setItem('gym_session', JSON.stringify(state.currentUser));
      }
  }

  renderNavbar();
  renderMainContent();
};

function migrateOldRoutines() {
    let updated = false;
    state.clients.forEach(client => {
        if(!client.plan) { client.plan = gymPlans[0]; updated = true; } 
        if(!client.plan.durationDays) { client.plan.durationDays = 30; updated = true; }
        if(!client.exerciseHistory) { client.exerciseHistory = {}; updated = true; }
        if(client.workout) {
            client.workout.forEach(day => {
                day.exercises.forEach(ex => {
                    const dict = exerciseDetails[ex.name];
                    if(dict) {
                        if(ex.img && (!ex.img.includes('ejercicios/') || ex.img.includes('http') || ex.img.includes('.gif'))) { ex.img = dict.img; updated = true; }
                        if(!ex.desc) { ex.desc = dict.desc; updated = true; }
                    }
                    if(!ex.rest) { ex.rest = "4-5 Minutos"; updated = true; }
                    if(!ex.desc && !dict) { ex.desc = "Sigue las indicaciones de tu entrenador para una correcta ejecución biomecánica."; updated = true; }
                });
            });
        }
        if(updated) syncClientToDB(client);
    });
}

function performSystemMaintenance() {
  let updated = false, historyUpdated = false;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  state.clients = state.clients.filter(client => {
    const dueDate = new Date(client.dueDate); dueDate.setHours(0, 0, 0, 0);
    const diffTime = today - dueDate; const daysExpired = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysExpired > 61) { 
        state.historyDB[client.cc] = client.evaluations; historyUpdated = true; updated = true; 
        deleteClientFromDB(client.cc);
        return false; 
    }
    if (daysExpired > 8 && client.status !== 'inactive') { 
        client.status = 'inactive'; updated = true; 
        syncClientToDB(client);
    }
    return true; 
  });

  if (historyUpdated) syncHistoryToDB();
  if (updated && state.currentUser && state.currentUser.role === 'client') {
      const stillActive = state.clients.find(c => c.cc === state.currentUser.cc && c.status !== 'inactive');
      if (!stillActive) { state.currentUser = null; localStorage.removeItem('gym_session'); }
  }
}

// ==========================================
// NAVEGACIÓN Y RENDERIZADO PRINCIPAL
// ==========================================
function renderNavbar() {
  const container = document.getElementById('nav-actions');
  if (!state.currentUser) {
    container.innerHTML = `<button onclick="showMainLoginFlow()" class="btn-depth bg-transparent border border-cyan-500/80 text-cyan-400 hover:bg-cyan-500 hover:text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)]"><i class="fa-solid fa-user-astronaut"></i> Entrar</button>`;
  } else {
    container.innerHTML = `
      <span class="text-xs md:text-sm text-zinc-300 flex items-center gap-2 inner-depth px-4 py-2 rounded-xl border border-cyan-500/20"><i class="fa-solid ${state.currentUser.role === 'admin' ? 'fa-user-shield text-yellow-400' : 'fa-user text-cyan-400'}"></i><strong class="text-white">${state.currentUser.name}</strong></span>
      <button onclick="logout()" class="btn-depth bg-red-900/60 border border-red-500/50 text-red-100 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-red-600 transition shadow-[0_0_10px_rgba(239,68,68,0.3)]"><i class="fa-solid fa-right-from-bracket"></i></button>
    `;
  }
}

function renderMainContent() {
  const main = document.getElementById('app-content');
  let content = '';
  if (!state.currentUser) { content = renderLandingPage(); } 
  else if (state.currentUser.role === 'admin') {
    if (state.viewingClientAsAdmin) { content = renderClientPortal(); setTimeout(initProgressChart, 100); } 
    else { content = renderAdminDashboard(); }
  } else { content = renderClientPortal(); setTimeout(initProgressChart, 100); }
  
  let footer = '';
  if(!state.currentUser) {
      footer = `
        <footer class="mt-16 py-8 border-t border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-400 text-sm bg-[#030303] px-8 rounded-[2rem] shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-zinc-800">
            <div class="flex items-center gap-4 hover:scale-105 transition-transform">
                <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white text-2xl shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                    <i class="fa-brands fa-instagram"></i>
                </div>
                <a href="https://www.instagram.com/gym____finity?srtk=Z3E0Yndqc2NmdHhj" target="_blank" class="font-black text-white hover:text-pink-400 transition tracking-widest uppercase text-base drop-shadow-md">@gym__finity</a>
            </div>
            <div class="text-center md:text-right flex flex-col gap-1">
                <p class="font-bold text-white drop-shadow-md text-base"><i class="fa-solid fa-location-dot text-red-500 mr-1 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"></i> Cra 14#104-05 sur Usminia</p>
                <a href="https://maps.app.goo.gl/uxurEsSw4Vm6HCAj7?g_st=ac" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 underline font-black inline-block mt-1 transition drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]">
                    Mostrar en Google Maps <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]"></i>
                </a>
            </div>
        </footer>
      `;
  }
  
  main.innerHTML = content + footer;
}

// ==========================================
// CONTROLADOR DEL SLIDER DE PRODUCTOS
// ==========================================
window.changeProduct = function(offset) {
    state.currentProductIndex += offset;
    if (state.currentProductIndex < 0) state.currentProductIndex = storeProducts.length - 1;
    if (state.currentProductIndex >= storeProducts.length) state.currentProductIndex = 0;
    renderMainContent();
};

// ==========================================
// GENERADOR IA DE RUTINAS
// ==========================================
function generateAiWorkout(objective, days, level, machines) {
  const getEx = (name) => {
      const e = exerciseDetails[name] || { img: "ejercicios/default.png", desc: "Sigue las indicaciones de tu entrenador." };
      return { name, img: e.img, desc: e.desc };
  };
  const baseSchedule = [
    { day: "Día 1: Empuje", exercises: [
        { ...getEx("Press Banco Plano"), sets: "4 Series", reps: "8-10 Reps", rest: "4-5 Minutos" },
        { ...getEx("Aperturas Polea Inferior"), sets: "3 Series", reps: "12-15 Reps", rest: "4-5 Minutos" },
        { ...getEx("Press Hombro"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" },
        { ...getEx("Fondos en Paralelas"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" }
    ]},
    { day: "Día 2: Tracción", exercises: [
        { ...getEx("Jalón Vertical Abierto"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" },
        { ...getEx("Remo Mancuernas"), sets: "3 Series", reps: "10-12 Reps", rest: "4-5 Minutos" },
        { ...getEx("Trapecio"), sets: "4 Series", reps: "15 Reps", rest: "4-5 Minutos" },
        { ...getEx("Curl Bíceps Barra Abierto"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" }
    ]},
    { day: "Día 3: Pierna", exercises: [
        { ...getEx("Sentadilla Profunda con Barra"), sets: "4 Series", reps: "8-10 Reps", rest: "4-5 Minutos" },
        { ...getEx("Extensión de Cuádriceps"), sets: "4 Series", reps: "12-15 Reps", rest: "4-5 Minutos" },
        { ...getEx("Abductores"), sets: "4 Series", reps: "15 Reps", rest: "4-5 Minutos" },
        { ...getEx("Glúteos"), sets: "4 Series", reps: "12-15 Reps", rest: "4-5 Minutos" }
    ]},
    { day: "Día 4: Isquios & Core", exercises: [
        { ...getEx("Curl Femoral"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" },
        { ...getEx("Peso Muerto"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" },
        { ...getEx("Gemelos"), sets: "4 Series", reps: "15-20 Reps", rest: "4-5 Minutos" },
        { ...getEx("Crunch en Banco"), sets: "4 Series", reps: "20 Reps", rest: "4-5 Minutos" }
    ]},
    { day: "Día 5: Brazo y Hombro", exercises: [
        { ...getEx("Press Hombro"), sets: "4 Series", reps: "10-12 Reps", rest: "3-4 Minutos" },
        { ...getEx("Face Pull"), sets: "4 Series", reps: "15 Reps", rest: "3-4 Minutos" },
        { ...getEx("Curl Martillo Alternado"), sets: "4 Series", reps: "12-15 Reps", rest: "3-4 Minutos" },
        { ...getEx("Fondos en Paralelas"), sets: "4 Series", reps: "10-12 Reps", rest: "3-4 Minutos" }
    ]},
    { day: "Día 6: Full Body", exercises: [
        { ...getEx("Sentadilla Libre"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" },
        { ...getEx("Press Banco Plano"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" },
        { ...getEx("Jalón Vertical Abierto"), sets: "4 Series", reps: "10-12 Reps", rest: "4-5 Minutos" },
        { ...getEx("Rueda Abdominal"), sets: "4 Series", reps: "20 Reps", rest: "3-4 Minutos" }
    ]}
  ];
  return baseSchedule.slice(0, days);
}

// ==========================================
// EXPORTACIÓN A PDF
// ==========================================
window.downloadPDF = function() {
    const originalElement = document.getElementById('pdf-container');
    const clone = originalElement.cloneNode(true);
    
    clone.style.backgroundColor = '#ffffff'; clone.style.color = '#000000';
    clone.style.padding = '40px'; clone.style.width = '1000px'; clone.style.fontFamily = 'Arial, sans-serif';
    
    clone.querySelectorAll('.inner-depth').forEach(el => {
        el.className = ''; el.style.border = '2px solid #ccc'; el.style.backgroundColor = '#f8fafc';
        el.style.borderRadius = '16px'; el.style.padding = '24px'; el.style.marginBottom = '24px'; el.style.pageBreakInside = 'avoid';
    });

    clone.querySelectorAll('.bg-\\[\\#050505\\]').forEach(el => {
        el.className = ''; el.style.backgroundColor = '#ffffff'; el.style.border = '1px solid #e2e8f0';
        el.style.borderRadius = '12px'; el.style.padding = '16px'; el.style.marginBottom = '12px'; el.style.display = 'flex';
        el.style.alignItems = 'center'; el.style.gap = '16px'; el.style.pageBreakInside = 'avoid';
    });

    clone.querySelectorAll('.text-white, .text-zinc-400, .u-theme-text').forEach(el => {
        el.style.color = '#0f172a'; el.style.textShadow = 'none'; el.style.filter = 'none';
    });

    clone.querySelectorAll('.bg-\\[\\#0a0a0a\\]').forEach(el => {
        el.style.backgroundColor = '#f1f5f9'; el.style.color = '#334155'; el.style.border = '1px solid #cbd5e1'; el.style.boxShadow = 'none';
    });

    const editBtns = clone.querySelectorAll('.edit-btn-pdf-hide');
    editBtns.forEach(btn => btn.remove());
    const addBtns = clone.querySelectorAll('.add-btn-pdf-hide');
    addBtns.forEach(btn => btn.remove());

    const header = document.createElement('div');
    const targetName = state.viewingClientAsAdmin && state.selectedClientRecord ? state.selectedClientRecord.name : (state.currentUser ? state.currentUser.name : 'Cliente');
    header.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #ccc; padding-bottom: 20px;">
            <h1 style="font-size: 42px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: 2px;">GYMFINITY</h1>
            <p style="font-size: 18px; color: #475569; margin-top: 8px; font-weight: bold; text-transform: uppercase;">Plan de Entrenamiento Oficial</p>
            <p style="font-size: 16px; color: #64748b; margin-top: 5px;">Atleta: <strong style="color: #0f172a;">${targetName.toUpperCase()}</strong></p>
        </div>
    `;
    clone.prepend(header);
    clone.style.position = 'absolute'; clone.style.left = '-9999px';
    document.body.appendChild(clone);

    const targetCC = state.viewingClientAsAdmin && state.selectedClientRecord ? state.selectedClientRecord.cc : (state.currentUser ? state.currentUser.cc : 'cliente');
    
    html2pdf().set({ 
        margin: 0.4, filename: `Rutina_${targetCC}.pdf`, image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all', before: '.page-break' }
    }).from(clone).save().then(() => { document.body.removeChild(clone); });
};

// ==========================================
// MODAL DETALLADO DE EJERCICIO (CONTROL DE PESO)
// ==========================================
window.openExerciseModal = function(dayIndex, exerciseIndex) {
    const isAdminViewing = state.viewingClientAsAdmin; 
    const clientData = isAdminViewing ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    const ex = clientData.workout[dayIndex].exercises[exerciseIndex];
    const restTime = ex.rest || '4-5 Minutos';
    const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    const defaultPlan = gymPlans[0];
    const userPlan = clientData.plan || defaultPlan;
    const effColor = userPlan.color === '#18181B' ? '#D4D4D8' : userPlan.color;
    
    const history = (clientData.exerciseHistory || {})[ex.name] || [];
    const lastWeight = history.length > 0 ? history[history.length - 1].weight + ' kg' : '---';

    openModal(`
        <div class="relative bg-[#050505] border shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-[2rem] p-6 md:p-10 max-w-lg mx-auto w-full animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar" style="border-color: ${effColor};">
            <button onclick="closeModal()" class="absolute top-4 right-4 md:-top-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition border-2 z-20 shadow-lg" style="border-color: ${effColor};">
                <i class="fa-solid fa-xmark text-lg md:text-xl"></i>
            </button>
            <div class="flex flex-col items-center gap-5">
                <div class="w-full bg-white rounded-2xl p-4 flex justify-center items-center border-2 shadow-[0_0_20px_rgba(255,255,255,0.05)] mt-4 md:mt-0" style="border-color: ${effColor};">
                    <img src="${ex.img}" class="w-full max-h-56 object-contain mix-blend-multiply" onerror="this.onerror=null; this.src='${fallbackBase64}';" />
                </div>
                <div class="text-center w-full">
                    <h3 class="text-2xl md:text-3xl font-black text-white uppercase tracking-wider drop-shadow-md mb-2" style="color: ${effColor};">${ex.name}</h3>
                    
                    <div class="grid grid-cols-2 gap-3 w-full mb-2">
                        <div class="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-md">
                            <i class="fa-solid fa-layer-group text-xl mb-1" style="color: ${effColor}; filter: drop-shadow(0 0 5px ${effColor}80);"></i>
                            <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Series</span>
                            <span class="text-lg font-black text-white">${ex.sets}</span>
                        </div>
                        <div class="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-md">
                            <i class="fa-solid fa-repeat text-xl mb-1" style="color: ${effColor}; filter: drop-shadow(0 0 5px ${effColor}80);"></i>
                            <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reps</span>
                            <span class="text-lg font-black text-white">${ex.reps}</span>
                        </div>
                        <div class="col-span-2 bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-md">
                            <i class="fa-solid fa-stopwatch text-xl mb-1" style="color: ${effColor}; filter: drop-shadow(0 0 5px ${effColor}80);"></i>
                            <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Descanso</span>
                            <span class="text-lg font-black text-white">${restTime}</span>
                        </div>
                    </div>
                    
                    <div class="mt-3 text-left bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                        <h4 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2"><i class="fa-solid fa-circle-info" style="color: ${effColor};"></i> Técnica</h4>
                        <p class="text-xs text-zinc-300 leading-relaxed font-medium">${ex.desc || 'Sigue las indicaciones de tu entrenador.'}</p>
                    </div>

                    <div class="mt-4 border-t border-zinc-800/80 pt-5 w-full text-left">
                        <h4 class="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-dumbbell" style="color: ${effColor};"></i> Control de Carga (Progresión)
                        </h4>
                        <div class="flex gap-3 mb-4 h-14">
                            <div class="flex-1 bg-[#0a0a0a] border border-zinc-800 rounded-xl p-2 text-center shadow-inner flex flex-col justify-center">
                                <span class="block text-[8px] md:text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">Peso Anterior</span>
                                <span id="prev_ex_weight" class="text-sm md:text-base font-black text-white">${lastWeight}</span>
                            </div>
                            
                            <!-- Restricción: Si es el entrenador, no mostramos el input de guardar -->
                            ${!isAdminViewing ? `
                            <div class="flex-1 flex flex-col">
                                <input type="number" step="0.5" id="new_ex_weight" placeholder="Nuevo (kg)" class="w-full h-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-2 py-1 text-sm text-white font-bold text-center focus:outline-none transition-colors" style="border-bottom: 2px solid ${effColor};" />
                            </div>
                            <button id="save_weight_btn" onclick="saveExerciseWeight('${ex.name}')" class="bg-[#050505] border border-zinc-700 text-zinc-400 px-4 rounded-xl text-lg transition-all hover:scale-105 shadow-md flex items-center justify-center" onmouseover="this.style.color='${effColor}'; this.style.borderColor='${effColor}'" onmouseout="this.style.color=''; this.style.borderColor=''">
                                <i class="fa-solid fa-save"></i>
                            </button>
                            ` : `
                            <div class="flex-1 flex flex-col justify-center items-center bg-[#0a0a0a] border border-red-900/50 rounded-xl px-2 text-center shadow-inner">
                                <span class="text-[9px] font-bold text-red-400 uppercase tracking-widest leading-tight">Solo el usuario puede registrar peso.</span>
                            </div>
                            `}

                        </div>
                        
                        <button onclick="toggleExerciseChart('${ex.name}')" class="w-full bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 hover:bg-zinc-900">
                            <i class="fa-solid fa-chart-line" style="color: ${effColor};"></i> Ver Gráfica de Progreso <i id="ex-chart-toggle-icon" class="fa-solid fa-chevron-down ml-1"></i>
                        </button>
                        <div id="ex-chart-wrapper" class="hidden mt-4 bg-[#030303] rounded-xl p-4 h-48 border border-zinc-800 shadow-inner" data-color="${effColor}">
                            <canvas id="exerciseChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
};

window.saveExerciseWeight = function(exName) {
    const weightInput = document.getElementById('new_ex_weight').value;
    if(!weightInput || isNaN(weightInput)) return;
    
    const clientData = state.viewingClientAsAdmin ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    clientData.exerciseHistory = clientData.exerciseHistory || {};
    if(!clientData.exerciseHistory[exName]) clientData.exerciseHistory[exName] = [];
    
    const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    clientData.exerciseHistory[exName].push({ date: today, weight: Number(weightInput) });
    
    syncClientToDB(clientData);
    
    document.getElementById('prev_ex_weight').innerText = weightInput + ' kg';
    document.getElementById('new_ex_weight').value = '';
    
    const btn = document.getElementById('save_weight_btn');
    const origColor = btn.style.color;
    btn.style.color = '#10b981';
    setTimeout(() => btn.style.color = origColor, 1000);

    if(!document.getElementById('ex-chart-wrapper').classList.contains('hidden')) {
        updateExerciseChart(exName, clientData.exerciseHistory[exName]);
    }
};

window.toggleExerciseChart = function(exName) {
    const w = document.getElementById('ex-chart-wrapper');
    const i = document.getElementById('ex-chart-toggle-icon');
    if (w.classList.contains('hidden')) {
        w.classList.remove('hidden');
        i.classList.replace('fa-chevron-down', 'fa-chevron-up');
        const clientData = state.viewingClientAsAdmin ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
        const history = (clientData.exerciseHistory || {})[exName] || [];
        updateExerciseChart(exName, history);
    } else {
        w.classList.add('hidden');
        i.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
};

window.updateExerciseChart = function(exName, history) {
    const ctx = document.getElementById('exerciseChart');
    if (!ctx) return;
    if (window.exerciseChartInstance) window.exerciseChartInstance.destroy();
    
    const effColor = document.getElementById('ex-chart-wrapper').getAttribute('data-color') || '#00e5ff';
    const labels = history.map(e => e.date.substring(0, 5)); 
    const data = history.map(e => e.weight);
    
    window.exerciseChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Carga (kg)', data: data, borderColor: effColor,
                backgroundColor: effColor + '33', fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: effColor
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#6b7280', font: {size: 10} }, grid: { color: '#1a1a1a' } },
                y: { ticks: { color: '#6b7280', font: {size: 10} }, grid: { color: '#1a1a1a' } }
            }
        }
    });
};

// ==========================================
// EDITOR DE RUTINAS Y BUSCADOR VISUAL DE EJERCICIOS (CON FILTRO MUSCULAR)
// ==========================================
const musculos = ["ABDOMEN", "ADUCTORES", "ANTEBRAZO", "BICEPS", "CUADRICEPS", "ESPALDA", "GEMELOS", "GLUTEO", "HOMBRO", "ISQUIOS", "PECHO", "TIBIA", "TRICEPS"];

window.addExerciseModal = function(dIdx) {
    const musculoOptions = musculos.map(m => `<option value="${m}">${m}</option>`).join('');

    openModal(`
        <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
            <h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"><i class="fa-solid fa-plus"></i> Añadir Ejercicio</h3>
            <button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form onsubmit="saveNewExercise(event, ${dIdx})" class="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            
            <div class="relative bg-[#050505] p-5 rounded-2xl border border-zinc-800 mb-6 shadow-inner">
                <div class="mb-4">
                    <label class="block text-sm font-black text-zinc-400 mb-2 tracking-widest uppercase"><i class="fa-solid fa-layer-group text-cyan-400 mr-1"></i> Grupo Muscular</label>
                    <select id="ex_muscle_filter" onchange="filterExerciseOptions(document.getElementById('ex_search_input').value)" class="w-full bg-[#0a0a0a] border border-cyan-500/50 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-bold transition-all outline-none shadow-md appearance-none cursor-pointer">
                        <option value="TODOS">Ver Todos los Músculos</option>
                        ${musculoOptions}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-black text-zinc-400 mb-2 tracking-widest uppercase"><i class="fa-solid fa-magnifying-glass text-yellow-400 mr-1"></i> Buscar Ejercicio</label>
                    <input type="text" id="ex_search_input" onkeyup="filterExerciseOptions(this.value)" placeholder="Ej: sentadilla, press..." class="w-full bg-[#0a0a0a] border border-zinc-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-base text-white font-bold transition-all outline-none shadow-md" autocomplete="off" />
                </div>
                
                <div id="ex_search_results" class="w-full max-h-60 overflow-y-auto bg-[#0a0a0a] border border-yellow-500/50 shadow-[0_0_20px_rgba(255,215,0,0.15)] rounded-xl mt-3 hidden custom-scrollbar"></div>
            </div>
            
            <input type="hidden" id="n_e_nm" />
            <input type="hidden" id="n_e_im" />
            <input type="hidden" id="n_e_ds" />

            <div id="selected_ex_preview" class="hidden items-center gap-5 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30 mb-4 animate-fade-in shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                <div class="w-20 h-20 bg-white rounded-xl flex items-center justify-center p-2 shadow-inner shrink-0">
                    <img id="prev_ex_img" src="" class="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div class="flex-1">
                    <p class="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mb-1">Selección:</p>
                    <p id="prev_ex_name" class="text-white font-black text-lg drop-shadow-md leading-tight"></p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Series</label><input type="text" id="n_e_st" value="4 Series" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
                <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Repeticiones</label><input type="text" id="n_e_rp" value="10-12 Reps" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            </div>
            <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Tiempo de Descanso</label><input type="text" id="n_e_rt" value="4-5 Minutos" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            
            <button type="submit" class="w-full btn-depth bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-sm mt-4 shadow-[0_0_15px_rgba(255,215,0,0.4)]"><i class="fa-solid fa-plus"></i> Añadir a la Rutina</button>
        </form>
    `);
    
    filterExerciseOptions(""); // Inicia mostrando u ocultando según el select
};

window.filterExerciseOptions = function(query) {
    const resultsDiv = document.getElementById('ex_search_results');
    const selectedMuscle = document.getElementById('ex_muscle_filter').value;
    
    if(!query && selectedMuscle === "TODOS") { 
        resultsDiv.classList.add('hidden'); 
        return; 
    }
    
    let matches = Object.keys(exerciseDetails);

    if (selectedMuscle !== "TODOS") {
        matches = matches.filter(name => {
            const exImg = exerciseDetails[name].img.toUpperCase();
            return exImg.includes(`/${selectedMuscle}/`);
        });
    }

    if (query) {
        matches = matches.filter(name => name.toLowerCase().includes(query.toLowerCase()));
    }
    
    if(matches.length > 0) {
        resultsDiv.innerHTML = matches.map(name => {
            const ex = exerciseDetails[name];
            return `
            <div onclick="selectExerciseOption('${name}', '${ex.img}', '${ex.desc.replace(/'/g, "\\'")}')" class="p-3 hover:bg-zinc-800 cursor-pointer flex items-center gap-4 border-b border-zinc-800 last:border-0 transition-colors group">
                <div class="w-14 h-14 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <img src="${ex.img}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.src='ejercicios/default.png'" />
                </div>
                <span class="text-sm font-bold text-white drop-shadow-md">${name}</span>
            </div>`;
        }).join('');
        resultsDiv.classList.remove('hidden');
    } else {
        resultsDiv.innerHTML = `<div class="p-4 text-sm text-zinc-500 font-medium text-center">No se encontraron ejercicios en este grupo.</div>`;
        resultsDiv.classList.remove('hidden');
    }
};

window.selectExerciseOption = function(name, img, desc) {
    document.getElementById('n_e_nm').value = name;
    document.getElementById('n_e_im').value = img;
    document.getElementById('n_e_ds').value = desc;
    
    document.getElementById('ex_search_input').value = name;
    document.getElementById('ex_search_results').classList.add('hidden');
    
    document.getElementById('prev_ex_img').src = img;
    document.getElementById('prev_ex_name').innerText = name;
    document.getElementById('selected_ex_preview').classList.remove('hidden');
    document.getElementById('selected_ex_preview').classList.add('flex');
};

window.saveNewExercise = function(e, dIdx) {
    e.preventDefault();
    let nm = document.getElementById('n_e_nm').value;
    let img = document.getElementById('n_e_im').value;
    let desc = document.getElementById('n_e_ds').value;

    if(!nm) {
        nm = document.getElementById('ex_search_input').value;
        img = "ejercicios/default.png";
        desc = "Sigue las indicaciones de tu entrenador.";
    }

    state.selectedClientRecord.workout[dIdx].exercises.push({ 
        name: nm, 
        img: img, 
        sets: document.getElementById('n_e_st').value, 
        reps: document.getElementById('n_e_rp').value, 
        rest: document.getElementById('n_e_rt').value, 
        desc: desc 
    });
    syncClientToDB(state.selectedClientRecord); closeModal(); renderMainContent();
};

window.editExerciseModal = function(dIdx, exIdx) {
    const clientData = state.selectedClientRecord;
    const ex = clientData.workout[dIdx].exercises[exIdx];
    const musculoOptions = musculos.map(m => `<option value="${m}">${m}</option>`).join('');

    openModal(`
        <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
            <h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"><i class="fa-solid fa-pen"></i> Editar Ejercicio</h3>
            <button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        
        <div class="relative bg-[#050505] p-5 rounded-2xl border border-zinc-800 mb-6 shadow-inner">
            <div class="mb-4">
                <label class="block text-sm font-black text-zinc-400 mb-2 tracking-widest uppercase"><i class="fa-solid fa-layer-group text-cyan-400 mr-1"></i> Grupo Muscular</label>
                <select id="edit_ex_muscle_filter" onchange="filterEditExerciseOptions(document.getElementById('edit_ex_search_input').value)" class="w-full bg-[#0a0a0a] border border-cyan-500/50 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-bold transition-all outline-none shadow-md appearance-none cursor-pointer">
                    <option value="TODOS">Ver Todos los Músculos</option>
                    ${musculoOptions}
                </select>
            </div>

            <div>
                <label class="block text-sm font-black text-zinc-400 mb-2 tracking-widest uppercase"><i class="fa-solid fa-magnifying-glass text-yellow-400 mr-1"></i> Buscar Ejercicio (Reemplazar)</label>
                <input type="text" id="edit_ex_search_input" onkeyup="filterEditExerciseOptions(this.value)" placeholder="Ej: sentadilla, press..." class="w-full bg-[#0a0a0a] border border-zinc-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-sm text-white font-bold transition-all outline-none shadow-md" autocomplete="off" />
            </div>
            <div id="edit_ex_search_results" class="w-full max-h-60 overflow-y-auto bg-[#0a0a0a] border border-yellow-500/50 shadow-[0_0_20px_rgba(255,215,0,0.15)] rounded-xl mt-3 hidden custom-scrollbar"></div>
        </div>

        <form onsubmit="saveExerciseEdit(event, ${dIdx}, ${exIdx})" class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nombre Ejercicio</label><input type="text" id="e_nm" value="${ex.name}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            <input type="hidden" id="e_im" value="${ex.img}" />
            <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Series</label><input type="text" id="e_st" value="${ex.sets}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
                <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Repeticiones</label><input type="text" id="e_rp" value="${ex.reps}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            </div>
            <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Tiempo de Descanso</label><input type="text" id="e_rt" value="${ex.rest || '4-5 Minutos'}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Explicación</label><textarea id="e_ds" required rows="3" class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium">${ex.desc || ''}</textarea></div>
            <div class="flex gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onclick="deleteExercise(${dIdx}, ${exIdx})" class="flex-1 bg-red-900/40 text-red-400 border border-red-500/50 py-3.5 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-trash"></i> Eliminar</button>
                <button type="submit" class="flex-1 btn-depth bg-yellow-400 text-black font-extrabold py-3.5 rounded-xl text-sm shadow-[0_0_15px_rgba(255,215,0,0.4)]"><i class="fa-solid fa-save"></i> Guardar</button>
            </div>
        </form>
    `);
};

window.filterEditExerciseOptions = function(query) {
    const resultsDiv = document.getElementById('edit_ex_search_results');
    const selectedMuscle = document.getElementById('edit_ex_muscle_filter').value;
    
    if(!query && selectedMuscle === "TODOS") { 
        resultsDiv.classList.add('hidden'); 
        return; 
    }
    
    let matches = Object.keys(exerciseDetails);

    if (selectedMuscle !== "TODOS") {
        matches = matches.filter(name => {
            const exImg = exerciseDetails[name].img.toUpperCase();
            return exImg.includes(`/${selectedMuscle}/`);
        });
    }

    if (query) {
        matches = matches.filter(name => name.toLowerCase().includes(query.toLowerCase()));
    }
    
    if(matches.length > 0) {
        resultsDiv.innerHTML = matches.map(name => {
            const ex = exerciseDetails[name];
            return `
            <div onclick="selectEditExerciseOption('${name}', '${ex.img}', '${ex.desc.replace(/'/g, "\\'")}')" class="p-3 hover:bg-zinc-800 cursor-pointer flex items-center gap-4 border-b border-zinc-800 last:border-0 transition-colors group">
                <div class="w-14 h-14 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <img src="${ex.img}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.src='ejercicios/default.png'" />
                </div>
                <span class="text-sm font-bold text-white drop-shadow-md">${name}</span>
            </div>`;
        }).join('');
        resultsDiv.classList.remove('hidden');
    } else {
        resultsDiv.innerHTML = `<div class="p-4 text-sm text-zinc-500 font-medium text-center">No se encontraron ejercicios en este grupo.</div>`;
        resultsDiv.classList.remove('hidden');
    }
};

window.selectEditExerciseOption = function(name, img, desc) {
    document.getElementById('e_nm').value = name;
    document.getElementById('e_im').value = img;
    document.getElementById('e_ds').value = desc;
    
    document.getElementById('edit_ex_search_input').value = name;
    document.getElementById('edit_ex_search_results').classList.add('hidden');
};

window.saveExerciseEdit = function(e, dIdx, exIdx) {
    e.preventDefault(); const clientData = state.selectedClientRecord;
    clientData.workout[dIdx].exercises[exIdx] = { name: document.getElementById('e_nm').value, img: document.getElementById('e_im').value, sets: document.getElementById('e_st').value, reps: document.getElementById('e_rp').value, rest: document.getElementById('e_rt').value, desc: document.getElementById('e_ds').value };
    syncClientToDB(clientData); closeModal(); renderMainContent();
};

window.deleteExercise = function(dIdx, exIdx) {
    if(confirm("¿Seguro que deseas eliminar este ejercicio?")) {
        state.selectedClientRecord.workout[dIdx].exercises.splice(exIdx, 1);
        syncClientToDB(state.selectedClientRecord); closeModal(); renderMainContent();
    }
};

// ==========================================
// PORTAL DE USUARIO Y RUTINA
// ==========================================
window.switchClientTab = function(tab) { state.clientTab = tab; renderMainContent(); };

window.uploadProfilePic = function(event, cc) { 
    const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = function(e) { const client = state.clients.find(c => c.cc === cc); if(client) { client.profilePic = e.target.result; syncClientToDB(client); if(state.currentUser && state.currentUser.cc === cc) { state.currentUser.record.profilePic = e.target.result; localStorage.setItem('gym_session', JSON.stringify(state.currentUser)); } renderMainContent(); } }; reader.readAsDataURL(file); }
}

function renderClientPortal() {
  const clientData = state.viewingClientAsAdmin ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
  if (!clientData) return `<p class="p-8 text-zinc-400 text-center font-bold">Sin registros.</p>`;

  const { bia, workout, name, date, days, dueDate, profilePic, plan } = clientData;
  const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;
  
  const defaultPlan = gymPlans[0];
  const userPlan = plan || defaultPlan;
  const effColor = userPlan.color === '#18181B' ? '#D4D4D8' : userPlan.color; 
  
  const planIndex = gymPlans.findIndex(p => p.id === userPlan.id);
  const planIdxParam = planIndex !== -1 ? planIndex : 0;

  const themeStyles = `
    <style>
      .u-theme-text { color: ${effColor} !important; }
      .u-theme-bg { background-color: ${effColor} !important; color: ${effColor === '#E5E7EB' || effColor === '#FFD700' || effColor === '#D4D4D8' ? '#000000' : '#ffffff'} !important; }
      .u-theme-border { border-color: ${effColor} !important; }
      .u-theme-border-soft { border-color: ${effColor}50 !important; }
      .u-theme-shadow { box-shadow: 0 0 15px ${effColor}66 !important; }
      .u-theme-drop { filter: drop-shadow(0 0 5px ${effColor}80) !important; }
      .u-theme-btn { background-color: ${effColor}; color: ${effColor === '#E5E7EB' || effColor === '#FFD700' || effColor === '#D4D4D8' ? '#000000' : '#ffffff'}; font-weight: 900; box-shadow: 0 0 15px ${effColor}66; }
      .u-theme-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
    </style>
  `;

  const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const profileImageHTML = profilePic ? `<img src="${profilePic}" class="w-full h-full object-cover rounded-full" />` : `<i class="fa-solid fa-camera text-2xl text-zinc-500/50 u-theme-text"></i>`;

  let contentHTML = state.clientTab === 'calendar' ? renderCalendarHTML('client') : `
      <div class="card-depth p-6 md:p-10 rounded-[2rem] flex flex-col gap-6 mb-8 border u-theme-border-soft shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div class="flex items-center gap-6">
              <div class="relative w-24 h-24 rounded-full border-2 border-dashed u-theme-border inner-depth flex items-center justify-center overflow-hidden cursor-pointer transition u-theme-shadow group" onclick="document.getElementById('pic-upload').click()">
                  ${profileImageHTML}
                  <div class="absolute inset-0 bg-black/60 hidden group-hover:flex flex-col items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-sm"><i class="fa-solid fa-pen mb-1"></i> Editar</div><input type="file" id="pic-upload" class="hidden" accept="image/*" onchange="uploadProfilePic(event, '${clientData.cc}')" />
              </div>
              <div><h2 class="text-2xl md:text-3xl font-black text-white drop-shadow-md">${name}</h2><p class="text-xs mt-2 font-mono uppercase u-theme-drop u-theme-text">CC: ${clientData.cc} | Alta: ${date}</p></div>
          </div>
          <button onclick="downloadPDF()" class="btn-depth px-6 py-4 rounded-2xl text-sm w-full md:w-auto flex justify-center items-center gap-2 u-theme-btn transition"><i class="fa-solid fa-file-pdf"></i> Guardar PDF</button>
        </div>
        <div class="flex flex-wrap gap-4 pt-6 border-t border-zinc-800/80"><span class="inner-depth px-5 py-2.5 rounded-xl text-xs text-zinc-400 font-bold">Estatura: <strong class="text-white text-sm ml-1 drop-shadow-md">${bia.height} cm</strong></span><span class="inner-depth px-5 py-2.5 rounded-xl text-xs text-zinc-400 font-bold">Peso: <strong class="text-white text-sm ml-1 drop-shadow-md">${bia.weight} kg</strong></span></div>
      </div>

      <div onclick="showDynamicPlanModal(${planIdxParam})" class="card-depth p-6 rounded-[2rem] border u-theme-border-soft mb-8 bg-[#0a0a0a] cursor-pointer hover:scale-[1.01] transition-transform relative group overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <div class="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-100 transition-opacity">
              <i class="fa-solid fa-chevron-right text-3xl u-theme-text"></i>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <i class="fa-solid fa-id-badge text-2xl u-theme-text u-theme-drop"></i>
            <h3 class="text-lg md:text-xl font-black text-white uppercase tracking-widest">${userPlan.id}</h3>
          </div>
          <p class="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-2">${userPlan.subtitle}</p>
          <p class="text-sm text-zinc-300 font-medium leading-relaxed pr-12">${userPlan.target}</p>
      </div>

      <div class="p-6 md:p-8 mb-8 rounded-[2rem] border ${isExpired ? 'bg-red-900/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'card-depth border-yellow-500/40 shadow-[0_0_20px_rgba(255,215,0,0.1)]'} flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl inner-depth flex items-center justify-center ${isExpired ? 'text-red-500 border border-red-500/50 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-yellow-400 border border-yellow-500/50 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]'}"><i class="fa-solid fa-calendar-check text-2xl"></i></div>
              <div><p class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Estado Mensualidad</p><p class="text-xl font-bold text-white drop-shadow-md">Vence: <span class="${isExpired ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]'}">${dueDate}</span></p></div>
          </div>
          <span class="px-6 py-3 rounded-xl text-xs font-black uppercase w-full md:w-auto text-center tracking-widest shadow-md ${isExpired ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'btn-depth bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]'}">${isExpired ? 'VENCIDA' : daysLeft + ' Días Restantes'}</span>
      </div>
      
      <div class="card-depth rounded-[2rem] overflow-hidden mb-8 border border-zinc-800/80 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div class="bg-[#050505] p-6 flex justify-between items-center cursor-pointer border-b border-black hover:bg-[#080808] transition" onclick="toggleProgressChart()">
              <h3 class="text-sm font-bold flex items-center gap-3 u-theme-text u-theme-drop"><i class="fa-solid fa-chart-line text-lg"></i> Evolución Física</h3>
              <button class="inner-depth text-zinc-400 px-4 py-2 rounded-lg text-xs font-bold border border-zinc-800"><span id="chart-toggle-text">Ocultar</span> <i id="chart-toggle-icon" class="fa-solid fa-chevron-up ml-1"></i></button>
          </div>
          <div id="chart-wrapper" class="p-6 md:p-8 bg-[#030303]"><div class="relative h-64 w-full"><canvas id="progressChart"></canvas></div></div>
      </div>

      <div id="pdf-container" class="space-y-6">
          <div class="card-depth p-6 md:p-10 rounded-[2rem] border u-theme-border-soft shadow-[0_0_20px_rgba(0,0,0,0.05)]">
              <div class="flex items-center gap-4 mb-8 border-b border-zinc-800/80 pb-6"><div class="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border u-theme-border u-theme-text u-theme-shadow"><i class="fa-solid fa-dumbbell text-xl"></i></div><h3 class="text-xl md:text-2xl font-black text-white drop-shadow-md">Plan de Entrenamiento <span class="text-zinc-500 text-lg font-medium">(${days} Días)</span></h3></div>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  ${workout.map((d, dIdx) => `
                  <div class="inner-depth p-6 rounded-2xl space-y-5 border border-zinc-800/50 relative">
                      <h4 class="font-bold text-sm border-b border-zinc-800/80 pb-3 u-theme-text u-theme-drop">${d.day}</h4>
                      <div class="space-y-4">
                          ${d.exercises.map((ex, exIdx) => `
                          <div onclick="openExerciseModal(${dIdx}, ${exIdx})" class="cursor-pointer bg-[#050505] p-4 rounded-xl flex gap-4 border border-zinc-800/80 hover:border-zinc-500 transition group items-center relative overflow-hidden">
                              <div class="w-28 h-20 rounded-lg bg-white flex items-center justify-center border u-theme-border-soft shrink-0 overflow-hidden shadow-inner p-1">
                                  <img src="${ex.img}" alt="${ex.name}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.onerror=null; this.src='${fallbackBase64}';"/>
                              </div>
                              <div class="flex-1 flex flex-col justify-center gap-2">
                                  <div class="text-xs font-bold text-white uppercase drop-shadow-md transition">${exIdx + 1}. ${ex.name}</div>
                                  <div class="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                                      <span class="bg-[#0a0a0a] px-3 py-1.5 rounded border u-theme-border-soft u-theme-text">${ex.sets}</span>
                                      <span class="bg-[#0a0a0a] px-3 py-1.5 rounded border border-zinc-700 text-zinc-300">${ex.reps}</span>
                                  </div>
                              </div>
                              ${state.viewingClientAsAdmin ? `
                                  <button onclick="event.stopPropagation(); editExerciseModal(${dIdx}, ${exIdx})" class="absolute top-2 right-2 w-8 h-8 rounded bg-[#0a0a0a] border border-zinc-700 text-zinc-500 hover:text-yellow-400 hover:border-yellow-400 transition flex items-center justify-center shadow-md edit-btn-pdf-hide">
                                      <i class="fa-solid fa-pen"></i>
                                  </button>
                              ` : ''}
                          </div>
                          `).join('')}
                      </div>
                      ${state.viewingClientAsAdmin ? `
                          <button onclick="addExerciseModal(${dIdx})" class="w-full mt-4 border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 add-btn-pdf-hide">
                              <i class="fa-solid fa-plus"></i> Añadir Ejercicio
                          </button>
                      ` : ''}
                  </div>`).join('')}
              </div>
          </div>
      </div>
  `;

  return `
    ${themeStyles}
    <div class="space-y-6 animate-fade-in pb-12">
      ${state.currentUser && state.currentUser.role === 'admin' ? `<div class="flex justify-between items-center bg-yellow-500/10 border border-yellow-500/40 p-4 rounded-2xl mb-6 shadow-[0_0_15px_rgba(255,215,0,0.1)]"><button onclick="backToAdminPanel()" class="bg-[#050505] text-yellow-400 border border-yellow-500/50 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_15px_rgba(255,215,0,0.4)] px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2"><i class="fa-solid fa-arrow-left"></i> Volver al Panel Admin</button></div>` : ''}
      <div class="flex flex-wrap gap-3 border-b border-zinc-900 pb-6 mb-6">
          <button onclick="switchClientTab('routine')" class="px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.clientTab === 'routine' ? 'u-theme-btn' : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'}"><i class="fa-solid fa-dumbbell"></i> Mi Plan</button>
          <button onclick="switchClientTab('calendar')" class="px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.clientTab === 'calendar' ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'}"><i class="fa-solid fa-calendar-day"></i> Citas / Asistencia</button>
      </div>
      ${contentHTML}
    </div>
  `;
}

// ==========================================
// LANDING PAGE Y PLANES 
// ==========================================
function renderLandingPage() {
  const currentProduct = storeProducts[state.currentProductIndex];
  
  const mainPlans = gymPlans.slice(0, 3);
  const extraPlans = gymPlans.slice(3);

  return `
    <div class="flex flex-col gap-24 animate-fade-in pb-20">
      <div class="text-center mt-12 md:mt-16 space-y-6">
          <h2 class="text-5xl md:text-7xl font-black tracking-tight leading-tight flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5">
              <div class="flex"><span class="letter-anim delay-1">G</span><span class="letter-anim delay-2">Y</span><span class="letter-anim delay-3">M</span><span class="letter-anim delay-4 ml-2">F</span><span class="letter-anim delay-5">I</span><span class="letter-anim delay-6">N</span><span class="letter-anim delay-7">I</span><span class="letter-anim delay-8">T</span><span class="letter-anim delay-9">Y</span><span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">,</span></div>
              <span class="glow-text-anim text-white">entrena sin limites.</span>
          </h2>
          <p class="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base mt-2 drop-shadow-md">Inteligencia artificial aplicada al rendimiento biomecánico. Evaluaciones InBody y rutinas adaptativas.</p>
      </div>
      
      <div class="space-y-12">
          <h3 class="text-center text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Estructura de Planes</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
              ${mainPlans.map((plan, index) => {
                  const isBlack = plan.id.includes('RUTINA');
                  const planColor = isBlack ? '#3F3F46' : plan.color; 
                  const planShadow = isBlack ? 'rgba(255,255,255,0.2)' : plan.shadow;
                  const bgColorAlpha = isBlack ? 'rgba(63, 63, 70, 0.4)' : `${plan.color}1A`;
                  const textColor = isBlack ? '#FFFFFF' : plan.color;

                  return `
                  <div onclick="showDynamicPlanModal(${index})" class="rounded-3xl p-8 cursor-pointer flex flex-col items-center relative transparent-plan-card group" style="--plan-color: ${planColor}; --plan-shadow: ${planShadow}; --plan-shadow-inset: ${planColor}33; --plan-color-alpha: ${bgColorAlpha};">
                      <h4 class="text-xl font-black uppercase text-center group-hover:scale-110 transition-transform duration-300 drop-shadow-md" style="color: ${textColor};">${plan.id}</h4>
                      <p class="text-xs text-zinc-400 uppercase tracking-widest mb-4 text-center font-bold group-hover:text-zinc-300 transition-colors">${plan.subtitle}</p>
                      <p class="text-3xl font-black text-white mb-8 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">${plan.price}</p>
                      <ul class="w-full space-y-4 text-sm text-zinc-400 mb-8 flex-1 group-hover:text-zinc-200 transition-colors font-medium">
                          <li class="flex items-center gap-3"><i class="fa-regular fa-clock text-zinc-500 group-hover:text-zinc-300"></i> ${plan.schedule}</li>
                          ${plan.classes ? `<li class="flex items-center gap-3"><i class="fa-solid fa-check text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]"></i> Clases grupales</li>` : `<li class="flex items-center gap-3"><i class="fa-solid fa-xmark text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"></i> Sin Clases grupales</li>`}
                          ${plan.inbody ? `<li class="flex items-center gap-3"><i class="fa-solid fa-check text-cyan-500 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"></i> ${plan.inbody}</li>` : `<li class="flex items-center gap-3"><i class="fa-solid fa-xmark text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"></i> Sin InBody</li>`}
                      </ul>
                      <div class="mt-auto w-full text-center border-t border-zinc-800/50 pt-5 transition-colors group-hover:border-zinc-500"><p class="text-xs font-black transition-all group-hover:translate-x-2 inline-block drop-shadow-md" style="color: ${textColor};">Ver detalles <i class="fa-solid fa-arrow-right ml-1"></i></p></div>
                  </div>
              `}).join('')}
          </div>

          <div class="text-center mt-8">
              <button onclick="document.getElementById('extra-plans-container').classList.toggle('hidden')" class="bg-[#0a0a0a] border border-zinc-800 text-zinc-300 px-6 py-3 rounded-xl font-bold hover:text-white transition shadow-md">
                  <i class="fa-solid fa-layer-group text-yellow-400"></i> VER PLANES EXTRA <i class="fa-solid fa-chevron-down ml-2"></i>
              </button>
          </div>

          <div id="extra-plans-container" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch mt-8 transition-all">
              ${extraPlans.map((plan, index) => {
                  const actualIndex = index + 3; 
                  const isBlack = plan.id.includes('RUTINA');
                  const planColor = isBlack ? '#3F3F46' : plan.color; 
                  const planShadow = isBlack ? 'rgba(255,255,255,0.2)' : plan.shadow;
                  const bgColorAlpha = isBlack ? 'rgba(63, 63, 70, 0.4)' : `${plan.color}1A`;
                  const textColor = isBlack ? '#FFFFFF' : plan.color;

                  return `
                  <div onclick="showDynamicPlanModal(${actualIndex})" class="rounded-3xl p-8 cursor-pointer flex flex-col items-center relative transparent-plan-card group" style="--plan-color: ${planColor}; --plan-shadow: ${planShadow}; --plan-shadow-inset: ${planColor}33; --plan-color-alpha: ${bgColorAlpha};">
                      <h4 class="text-xl font-black uppercase text-center group-hover:scale-110 transition-transform duration-300 drop-shadow-md" style="color: ${textColor};">${plan.id}</h4>
                      <p class="text-xs text-zinc-400 uppercase tracking-widest mb-4 text-center font-bold group-hover:text-zinc-300 transition-colors">${plan.subtitle}</p>
                      <p class="text-3xl font-black text-white mb-8 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">${plan.price}</p>
                      <ul class="w-full space-y-4 text-sm text-zinc-400 mb-8 flex-1 group-hover:text-zinc-200 transition-colors font-medium">
                          <li class="flex items-center gap-3"><i class="fa-regular fa-clock text-zinc-500 group-hover:text-zinc-300"></i> ${plan.schedule}</li>
                          ${plan.classes ? `<li class="flex items-center gap-3"><i class="fa-solid fa-check text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]"></i> Clases grupales</li>` : `<li class="flex items-center gap-3"><i class="fa-solid fa-xmark text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"></i> Sin Clases grupales</li>`}
                      </ul>
                      <div class="mt-auto w-full text-center border-t border-zinc-800/50 pt-5 transition-colors group-hover:border-zinc-500"><p class="text-xs font-black transition-all group-hover:translate-x-2 inline-block drop-shadow-md" style="color: ${textColor};">Ver detalles <i class="fa-solid fa-arrow-right ml-1"></i></p></div>
                  </div>
              `}).join('')}
          </div>
      </div>
      
      <div class="space-y-12">
          <h3 class="text-center text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Clases Grupales</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              ${gymCoaches.map(c => `
                  <div class="card-depth border border-zinc-800/80 rounded-[2rem] overflow-hidden flex flex-col md:flex-row group hover:border-cyan-500/50 transition duration-500">
                      <div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center space-y-4 order-2 md:order-1 relative z-10 bg-[#050505]/80 backdrop-blur-sm">
                          <div><p class="text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">${c.coach}</p><h4 class="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors drop-shadow-md">${c.name}</h4></div>
                          <p class="text-sm text-zinc-400 leading-relaxed font-medium">${c.desc}</p>
                      </div>
                      <div class="w-full md:w-1/2 relative min-h-[200px] md:min-h-full order-1 md:order-2 overflow-hidden bg-black flex items-center justify-center"><div class="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#050505] to-transparent z-10 hidden md:block"></div><img src="${c.img}" alt="${c.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-70 group-hover:opacity-100" onerror="this.src='https://via.placeholder.com/400x400/15130b/fff.png&text=${encodeURIComponent(c.name)}'"/></div>
                  </div>
              `).join('')}
          </div>
      </div>

      <div class="space-y-12">
          <h3 class="text-center text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Suplementación</h3>
          <div class="max-w-5xl mx-auto flex items-center gap-6">
              <button onclick="changeProduct(-1)" class="w-14 h-14 rounded-full border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-chevron-left"></i></button>
              <div class="flex-1 rounded-[2rem] overflow-hidden card-depth flex flex-col md:flex-row items-center p-8 md:p-14 relative animate-fade-in" id="product-display">
                  <div class="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative"><div class="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full mix-blend-screen"></div><img src="${currentProduct.img}" alt="${currentProduct.name}" class="w-56 md:w-80 object-contain relative z-10 hover:scale-105 transition duration-500 drop-shadow-2xl" onerror="this.src='https://via.placeholder.com/400x400/15130b/fff.png&text=${encodeURIComponent(currentProduct.name)}'" /></div>
                  <div class="w-full md:w-1/2 text-left space-y-5">
                      <h4 class="text-3xl md:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">${currentProduct.name}</h4><p class="text-xs text-yellow-500 uppercase tracking-[0.2em] font-bold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">${currentProduct.tag}</p><p class="text-sm md:text-base text-zinc-300 leading-relaxed font-medium">${currentProduct.desc}</p>
                      <ul class="text-sm text-zinc-300 space-y-3 mt-4 border-l-2 border-cyan-500/50 pl-4 font-medium">${currentProduct.info.map(i => `<li><i class="fa-solid fa-check mr-2 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"></i> ${i}</li>`).join('')}</ul>
                      <div class="mt-8 inline-block btn-depth bg-yellow-500 text-black px-8 py-4 rounded-2xl text-xl font-black shadow-[0_0_20px_rgba(255,215,0,0.4)]">${currentProduct.price}</div>
                  </div>
              </div>
              <button onclick="changeProduct(1)" class="w-14 h-14 rounded-full border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
      </div>
      
    </div>
  `;
}

// ==========================================
// MODALES GLOBALES Y LOGIN
// ==========================================
function openModal(html) { const m = document.getElementById('app-modal'), c = document.getElementById('modal-content'); c.innerHTML = html; m.classList.remove('hidden'); c.classList.add('animate-scale-up'); }
function closeModal() { document.getElementById('app-modal').classList.add('hidden'); }

window.showDynamicPlanModal = function(index) {
    const plan = gymPlans[index];
    const isBlack = plan.id.includes('RUTINA');
    const planColor = isBlack ? '#3F3F46' : plan.color;

    openModal(`
        <div class="absolute inset-0 metallic-bg rounded-[2rem] overflow-hidden" style="--plan-color: ${planColor};"><div class="metallic-shine"></div><div class="metallic-texture"></div></div>
        <div class="relative z-10 text-left space-y-6">
            <div class="flex justify-between items-start">
                <div class="w-12 h-8 rounded bg-zinc-300 flex flex-col justify-center gap-1 shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-white/50 relative overflow-hidden" style="background: linear-gradient(135deg, #eee, #aaa);"><div class="w-full h-[1px] bg-black/20"></div><div class="w-full h-[1px] bg-black/20"></div><div class="w-full h-[1px] bg-black/20"></div></div>
                <button onclick="closeModal()" class="w-10 h-10 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-black transition border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div>
                <h3 class="text-4xl font-black text-white tracking-widest uppercase metal-text-shadow drop-shadow-md">${plan.id}</h3>
                <p class="text-xs font-black uppercase tracking-widest mt-1 metal-text-shadow text-white drop-shadow-md bg-black/40 inline-block px-3 py-1 rounded-full border border-white/10">${plan.subtitle}</p>
                <p class="text-6xl font-black text-white mt-4 metal-text-shadow drop-shadow-md">${plan.price}</p>
            </div>
            <div class="bg-black/70 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-2xl p-6 space-y-5">
                <div class="text-sm text-zinc-200 italic border-b border-zinc-700/50 pb-4 font-medium"><strong class="text-white not-italic block mb-1">¿Para quién es?</strong> ${plan.target}</div>
                <div class="pt-2"><p class="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-3">Características del Plan</p><ul class="space-y-4 text-sm font-bold text-white drop-shadow-md">
                        <li class="flex items-center gap-4"><i class="fa-regular fa-clock text-zinc-300 text-lg w-5 text-center drop-shadow-md"></i> ${plan.schedule}</li>
                        <li class="flex items-center gap-4"><i class="fa-solid ${plan.classes ? 'fa-check text-green-400' : 'fa-xmark text-red-400'} text-lg w-5 text-center drop-shadow-md"></i> ${plan.classes ? 'Acceso a clases grupales' : 'No incluye clases grupales'}</li>
                        <li class="flex items-center gap-4"><i class="fa-solid ${plan.inbody ? 'fa-check text-cyan-400' : 'fa-xmark text-red-400'} text-lg w-5 text-center drop-shadow-md"></i> ${plan.inbody || 'No incluye InBody'}</li>
                        <li class="flex items-center gap-4"><i class="fa-solid ${plan.routine ? 'fa-check text-cyan-400' : 'fa-xmark text-red-400'} text-lg w-5 text-center drop-shadow-md"></i> ${plan.routine || 'No incluye adaptación de rutina'}</li>
                        ${plan.companion ? `<li class="flex items-center gap-4"><i class="fa-solid fa-user-group text-yellow-400 text-lg w-5 text-center drop-shadow-md"></i> ${plan.companion}</li>` : ''}
                        ${plan.discount ? `<li class="flex items-center gap-4"><i class="fa-solid fa-sparkles text-lg w-5 text-center drop-shadow-md" style="color: ${isBlack ? '#FFFFFF' : plan.color};"></i> ${plan.discount}</li>` : ''}
                </ul></div>
            </div>
        </div>
    `);
};

window.showMainLoginFlow = function() {
  openModal(`
    <div class="flex justify-between items-center mb-8 border-b border-zinc-800/50 pb-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            <i class="fa-solid fa-door-open text-cyan-400"></i> Acceso al Sistema
        </h3>
        <button onclick="closeModal()" class="text-zinc-500 hover:text-white">
            <i class="fa-solid fa-xmark text-lg"></i>
        </button>
    </div>
    <div class="space-y-4">
      <button onclick="showClientLoginModal()" class="w-full card-depth border border-cyan-500/30 text-white hover:border-cyan-400 font-bold py-6 rounded-2xl text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_10px_rgba(0,229,255,0.1)]">
          <i class="fa-solid fa-user text-cyan-400 text-xl"></i> INGRESO DE USUARIO
      </button>
      <button onclick="showAdminLoginModal()" class="w-full card-depth border border-yellow-500/30 text-white hover:border-yellow-400 font-bold py-6 rounded-2xl text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_10px_rgba(255,215,0,0.1)]">
          <i class="fa-solid fa-user-shield text-yellow-400 text-xl"></i> ACCESO ENTRENADOR
      </button>
    </div>
  `);
};

window.showClientLoginModal = function() {
  openModal(`
    <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
        <h3 class="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Ingreso de Usuario</h3>
        <button onclick="showMainLoginFlow()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>
    </div>
    <form onsubmit="handleClientLoginSubmit(event)" class="space-y-5">
      <div>
          <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Cédula</label>
          <input type="text" id="l_c_cc" required class="w-full input-gym rounded-xl p-4 text-sm text-white font-medium" />
      </div>
      <button type="submit" class="w-full btn-depth bg-cyan-500 text-black font-extrabold py-4 rounded-xl text-sm shadow-[0_0_15px_rgba(0,229,255,0.4)]">Entrar a mi Rutina</button>
    </form>
  `);
};

window.showAdminLoginModal = function() {
  openModal(`
    <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
        <h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">Acceso Entrenador</h3>
        <button onclick="showMainLoginFlow()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>
    </div>
    <form onsubmit="handleAdminLoginSubmit(event)" class="space-y-4">
      <div>
          <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Cédula Autorizada</label>
          <input type="text" id="l_cc" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" />
      </div>
      <button type="submit" class="w-full btn-depth bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-sm mt-4 shadow-[0_0_15px_rgba(255,215,0,0.4)]">Entrar al Panel Admin</button>
    </form>
  `);
};

function showModalError(message, backFunction) {
  openModal(`
    <div class="text-center space-y-6 py-6">
        <div class="w-20 h-20 inner-depth text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-red-500/50 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div><h3 class="text-lg font-bold text-white mb-2">Aviso del Sistema</h3><p class="text-sm text-zinc-400 leading-relaxed max-w-[80%] mx-auto font-medium">${message}</p></div>
        <div class="flex gap-3 pt-4"><button onclick="closeModal()" class="flex-1 card-depth border border-zinc-800 text-white py-3.5 rounded-xl text-sm font-bold">Cerrar</button>
        ${backFunction ? `<button onclick="(${backFunction.name})()" class="flex-1 btn-depth bg-cyan-500 text-black py-3.5 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(0,229,255,0.3)]">Reintentar</button>` : ''}</div>
    </div>
  `);
}

window.handleAdminLoginSubmit = function(e) {
    e.preventDefault();
    const cc = document.getElementById('l_cc').value.trim();
    const trainer = authorizedAdmins.find(x => x.cc === cc);
    
    if(trainer) {
        state.currentUser = {role: 'admin', name: trainer.name, cc: trainer.cc};
        localStorage.setItem('gym_session', JSON.stringify(state.currentUser));
        closeModal(); renderNavbar(); renderMainContent();
    } else {
        showModalError('Cédula no autorizada o acceso denegado.', showAdminLoginModal);
    }
};

window.showClientRegisterModal = function() {
  const dToday = new Date().toISOString().split('T')[0];
  const planOptions = gymPlans.filter(p => !p.id.includes('RUTINA')).map(p => `<option value="${p.id}">${p.id} - ${p.price}</option>`).join('');
  
  openModal(`
    <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4"><h3 class="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Nuevo Usuario</h3><button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button></div>
    <form onsubmit="handleClientRegisterSubmit(event)" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div><label class="block text-xs font-bold text-cyan-400 mb-1.5 ml-1">Seleccionar Plan</label><select id="r_c_pl" class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-black border-cyan-500/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]">${planOptions}</select></div>
      <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Fecha de Ingreso</label><input type="date" id="r_c_ing" value="${dToday}" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div>
      <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Cédula</label><input type="text" id="r_c_cc" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div>
      <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nombre Completo</label><input type="text" id="r_c_nm" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div>
      <div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Edad</label><input type="number" id="r_c_ag" value="25" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Género</label><select id="r_c_gn" class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium"><option value="M">Masc.</option><option value="F">Fem.</option></select></div></div>
      <div class="border-t border-zinc-800/50 pt-5 mt-2">
          <p class="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"><i class="fa-solid fa-weight-scale"></i> Análisis BIA</p>
          <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Peso (kg)</label><input type="number" step="0.1" id="b_wt" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
              <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Altura (cm)</label><input type="number" id="b_ht" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
              <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">% Grasa</label><input type="number" step="0.1" id="b_ft" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
              <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Músculo (kg)</label><input type="number" step="0.1" id="b_ms" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
          </div>
      </div>
      <div class="grid grid-cols-2 gap-3 pt-3">
          <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Días Entreno</label>
              <select id="w_dy" class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium">
                  <option value="3">3 Días</option>
                  <option value="4" selected>4 Días</option>
                  <option value="5">5 Días</option>
                  <option value="6">6 Días</option>
              </select>
          </div>
          <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nivel</label>
              <select id="w_lv" class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium">
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio" selected>Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
              </select>
          </div>
      </div>
      <button type="submit" class="w-full btn-depth bg-cyan-500 text-black font-extrabold py-4 rounded-xl text-sm mt-6 shadow-[0_0_15px_rgba(0,229,255,0.4)]">Guardar y Generar Rutina</button>
    </form>
  `);
};

window.handleClientRegisterSubmit = async function(e) {
  e.preventDefault();
  const loader = document.getElementById('loading-screen');
  if(loader) {
      loader.classList.remove('hide-loader'); loader.style.opacity = '1'; loader.style.visibility = 'visible'; loader.style.zIndex = '100000';
      loader.querySelector('h1').innerHTML = '<span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)] animate-pulse">GENERANDO RUTINA IA...</span>';
  }
  
  const selectedPlanId = document.getElementById('r_c_pl').value;
  const userPlan = gymPlans.find(p => p.id === selectedPlanId) || gymPlans[0];

  const inputDateStr = document.getElementById('r_c_ing').value;
  const inputDate = new Date(inputDateStr);
  const expirationDate = new Date(inputDate.getTime() + (userPlan.durationDays * 24 * 60 * 60 * 1000));
  const dueDate = expirationDate.toISOString().split('T')[0];

  const cc = document.getElementById('r_c_cc').value.trim(); const name = document.getElementById('r_c_nm').value.trim();
  const gender = document.getElementById('r_c_gn').value; 
  const weight = Number(document.getElementById('b_wt').value); const height = Number(document.getElementById('b_ht').value);
  const fat = Number(document.getElementById('b_ft').value);
  const bmi = (weight / ((height/100) ** 2)).toFixed(1);
  let objective = "Recomposición Corporal"; if (fat > 22 && gender === 'M') objective = "Déficit Calórico"; else if (fat > 28 && gender === 'F') objective = "Déficit Calórico"; else if (fat < 15) objective = "Hipertrofia Muscular";
  
  const aiRoutine = generateAiWorkout(objective, document.getElementById('w_dy').value, document.getElementById('w_lv').value, state.inventory);
  const evalDate = new Date(inputDateStr).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const currentEval = { date: evalDate, weight, fat, muscle: Number(document.getElementById('b_ms').value), bmi };
  
  let evaluations = []; const existingIdx = state.clients.findIndex(c => c.cc === cc);
  if (existingIdx >= 0) { evaluations = state.clients[existingIdx].evaluations || []; } else if (state.historyDB[cc]) { evaluations = [...state.historyDB[cc]]; evaluations.push({ date: 'INACTIVO', weight: null, fat: null, muscle: null, bmi: null }); } evaluations.push(currentEval);

  const newRecord = { cc, name, age: Number(document.getElementById('r_c_ag').value), gender, dueDate, status: 'active', date: evalDate, profilePic: null, plan: userPlan, exerciseHistory: {}, bia: { weight, height, fat, muscle: currentEval.muscle, bmi, objective }, workout: aiRoutine, days: document.getElementById('w_dy').value, level: document.getElementById('w_lv').value, evaluations: evaluations };
  if (existingIdx >= 0) state.clients[existingIdx] = newRecord; else state.clients.push(newRecord);
  
  syncClientToDB(newRecord);
  
  if(loader) { loader.classList.add('hide-loader'); setTimeout(() => { loader.querySelector('h1').innerHTML = '<span class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">GYM</span> <span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">FINITY</span>'; loader.style = ''; }, 600); }
  closeModal(); renderMainContent();
};

window.handleClientLoginSubmit = function(e) {
  e.preventDefault(); const cc = document.getElementById('l_c_cc').value.trim(); const client = state.clients.find(c => c.cc === cc);
  if (!client) return showModalError("Cédula no encontrada. Por favor comunícate con el entrenador.", showClientLoginModal);
  if (client.status === 'inactive') return showModalError("Su cuenta está inactiva.", showClientLoginModal);
  if (Math.ceil((new Date(client.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) < 0) return showModalError("Su mensualidad ha vencido.", showClientLoginModal);

  state.currentUser = { role: 'client', name: client.name, cc: client.cc, record: client }; localStorage.setItem('gym_session', JSON.stringify(state.currentUser));
  closeModal(); state.clientTab = 'routine'; 

  const today = new Date(); const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const futureEvents = state.events.filter(ev => ev.assignedCC === client.cc && ev.date >= todayStr && ev.attendance !== 'missed');
  futureEvents.sort((a,b) => new Date(a.date) - new Date(b.date));

  if(futureEvents.length > 0) {
      const nextEvent = futureEvents[0]; const toast = document.createElement('div'); toast.className = "bg-black/90 border border-cyan-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center gap-4 animate-popup card-depth";
      toast.innerHTML = `<div class="text-cyan-400 text-3xl drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]"><i class="fa-solid fa-bell animate-bounce"></i></div><div><p class="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Tu próxima cita</p><p class="text-white font-bold text-sm drop-shadow-md">${nextEvent.name}</p><p class="text-cyan-400 text-xs font-mono drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"><i class="fa-regular fa-calendar"></i> ${nextEvent.date} a las ${nextEvent.startTime}</p></div>`;
      document.getElementById('toast-container').appendChild(toast); setTimeout(() => { toast.style.animation = "fadeOutLoader 0.5s ease-out forwards"; setTimeout(() => toast.remove(), 500); }, 4000);
  }
  renderNavbar(); renderMainContent();
};

// ==========================================
// CALENDARIO CON RESTRICCIÓN DE CRUCE
// ==========================================
window.changeMonth = function(offset) { state.calendarDate.setMonth(state.calendarDate.getMonth() + offset); renderMainContent(); };
function renderCalendarHTML(context) { 
  const year = state.calendarDate.getFullYear(); const month = state.calendarDate.getMonth(); const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const monthName = state.calendarDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase(); 
  let grid = `<div class="grid grid-cols-7 gap-2 text-center mb-3">${['D','L','M','M','J','V','S'].map(d => `<div class="font-black text-zinc-500 text-sm">${d}</div>`).join('')}`;
  for (let i = 0; i < firstDay; i++) { grid += `<div></div>`; }
  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    let dayEvents = state.events.filter(e => e.date === currentDateStr); if (context === 'client' && state.currentUser) { dayEvents = dayEvents.filter(e => e.assignedCC === state.currentUser.cc); }
    let baseClass = "w-10 h-10 md:w-12 md:h-12 mx-auto flex items-center justify-center rounded-full text-sm md:text-base font-black cursor-pointer transition-all duration-300 ";
    if (dayEvents.length > 0) { const allAttended = dayEvents.every(e => e.attendance === 'attended'); const anyMissed = dayEvents.some(e => e.attendance === 'missed');
        if (allAttended) { baseClass += "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"; } else if (anyMissed) { baseClass += "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]"; } else { baseClass += "bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.6)]"; }
    } else if (currentDateStr === todayStr) { baseClass += "border-2 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.4)]"; } else { baseClass += "text-zinc-400 hover:bg-zinc-800 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]"; }
    grid += `<div onclick="showEventModal('${currentDateStr}', '${context}')" class="${baseClass}">${i}</div>`;
  }
  grid += `</div>`; return `<div class="card-depth p-6 md:p-8 rounded-[2rem] border border-cyan-500/20 max-w-lg mx-auto shadow-[0_0_25px_rgba(0,229,255,0.05)] mb-8"><div class="flex justify-between items-center mb-6"><button onclick="changeMonth(-1)" class="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition shadow-[0_0_10px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-chevron-left"></i></button><h3 class="text-base md:text-lg font-black text-white tracking-widest drop-shadow-md">${monthName} <span class="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">${year}</span></h3><button onclick="changeMonth(1)" class="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition shadow-[0_0_10px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-chevron-right"></i></button></div>${grid}</div>`;
}

window.filterUserSearch = function(query) { 
  const resultsDiv = document.getElementById('ev_cc_results'); const hiddenInput = document.getElementById('ev_assigned_cc');
  if(!query) { resultsDiv.classList.add('hidden'); hiddenInput.value=''; return; } const matches = state.clients.filter(c => c.cc.includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase()));
  if(matches.length > 0) { resultsDiv.innerHTML = matches.map(m => `<div onclick="selectEventUser('${m.cc}', '${m.name.replace(/'/g,"\\'")}')" class="p-3 hover:bg-zinc-800 cursor-pointer text-sm text-white font-medium border-b border-zinc-800 last:border-0">${m.name} <br><span class="text-cyan-400 font-mono text-xs drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">(CC: ${m.cc})</span></div>`).join(''); resultsDiv.classList.remove('hidden'); } else { resultsDiv.innerHTML = `<div class="p-4 text-sm text-zinc-500 font-medium">Sin resultados</div>`; resultsDiv.classList.remove('hidden'); }
};
window.selectEventUser = function(cc, name) { document.getElementById('ev_cc_search').value = `${name}`; document.getElementById('ev_assigned_cc').value = cc; document.getElementById('ev_cc_results').classList.add('hidden'); };

window.saveActivity = function(e, date) { 
    e.preventDefault(); 
    const name = document.getElementById('ev_name').value;
    const start = document.getElementById('ev_start').value;
    const end = document.getElementById('ev_end').value;
    const cc = document.getElementById('ev_assigned_cc').value || null; 
    
    if(!name || !start || !end) return; 

    const toMins = (t) => { const [h,m] = t.split(':'); return parseInt(h)*60 + parseInt(m); };
    const nStart = toMins(start);
    const nEnd = toMins(end);

    const dayEvents = state.events.filter(ev => ev.date === date);
    const hasOverlap = dayEvents.some(ev => {
        const eStart = toMins(ev.startTime);
        const eEnd = toMins(ev.endTime);
        return (nStart < eEnd && nEnd > eStart);
    });

    if (hasOverlap) {
        showModalError("Ya existe una cita agendada que se cruza con este horario. Por favor, selecciona otra hora.", null);
        return;
    }

    state.events.push({ id: Date.now(), date, name, startTime: start, endTime: end, assignedCC: cc, attendance: 'pending' }); 
    syncEventsToDB(); 
    closeModal(); 
    renderMainContent(); 
};

window.deleteEvent = function(id) { state.events = state.events.filter(e => e.id !== id); syncEventsToDB(); closeModal(); renderMainContent(); };
window.markAttendance = function(id, status) { const event = state.events.find(e => e.id === id); if(event) { event.attendance = status; syncEventsToDB(); closeModal(); renderMainContent(); } };

window.showEventModal = function(dateStr, context) { 
  let dayEvents = state.events.filter(e => e.date === dateStr); if (context === 'client' && state.currentUser) { dayEvents = dayEvents.filter(e => e.assignedCC === state.currentUser.cc); }
  let existingHTML = ''; 
  if(dayEvents.length > 0) { 
      existingHTML = `<div class="mb-6 space-y-4"><h4 class="text-xs text-zinc-400 font-bold uppercase tracking-widest border-b border-zinc-800/50 pb-2">Actividades Programadas:</h4>${dayEvents.map(e => { let bgColor = "bg-zinc-900/50", borderColor = "border-zinc-800", shadowColor = ""; if(e.attendance === 'attended') { bgColor = "bg-emerald-900/10"; borderColor = "border-emerald-500/50"; shadowColor="shadow-[0_0_10px_rgba(16,185,129,0.1)]"; } if(e.attendance === 'missed') { bgColor = "bg-red-900/10"; borderColor = "border-red-500/50"; shadowColor="shadow-[0_0_10px_rgba(239,68,68,0.1)]"; } return `<div class="inner-depth p-5 rounded-2xl flex flex-col gap-3 border ${borderColor} ${bgColor} ${shadowColor}"><div class="flex justify-between items-start"><div><strong class="text-white text-base drop-shadow-md">${e.name}</strong><br><span class="text-sm text-zinc-400 mt-1 block font-medium"><i class="fa-regular fa-clock text-zinc-500"></i> ${e.startTime} - ${e.endTime}</span>${e.assignedCC ? `<span class="text-cyan-400 font-bold text-xs mt-2 block drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Cédula asignada: ${e.assignedCC}</span>` : ''}</div>${context === 'admin' ? `<button onclick="deleteEvent(${e.id})" class="text-zinc-500 hover:text-red-500 bg-black p-2 rounded-lg border border-red-500/20 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)] transition"><i class="fa-solid fa-trash"></i></button>` : ''}</div><div class="flex gap-3 mt-3 pt-3 border-t border-zinc-800/50"><button onclick="markAttendance(${e.id}, 'attended')" class="flex-1 py-2 rounded-xl text-xs font-black transition ${e.attendance === 'attended' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[#050505] text-zinc-400 border border-zinc-700 hover:text-emerald-400 hover:border-emerald-500/50'}"><i class="fa-solid fa-check"></i> Asistió</button><button onclick="markAttendance(${e.id}, 'missed')" class="flex-1 py-2 rounded-xl text-xs font-black transition ${e.attendance === 'missed' ? 'bg-red-500/20 text-red-400 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-[#050505] text-zinc-400 border border-zinc-700 hover:text-red-400 hover:border-red-500/50'}"><i class="fa-solid fa-xmark"></i> Faltó</button></div></div>`}).join('')}</div>`; 
  } else { existingHTML = `<div class="flex flex-col items-center justify-center p-8 text-center opacity-80 animate-fade-in"><i class="fa-regular fa-calendar-xmark text-5xl text-cyan-500/30 mb-4 animate-float drop-shadow-[0_0_10px_rgba(0,229,255,0.2)]"></i><p class="text-sm text-zinc-400 font-medium">Sin actividades para esta fecha.</p></div>`; }
  
  if (context === 'client') { openModal(`<div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4"><h3 class="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"><i class="fa-solid fa-calendar-day"></i> Actividades</h3><button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button></div><p class="text-sm text-zinc-400 mb-4 font-bold">Fecha: <span class="text-white">${dateStr}</span></p>${existingHTML}`); return; }
  openModal(`<div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4"><h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"><i class="fa-solid fa-calendar-plus"></i> Gestión de Fecha</h3><button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button></div><p class="text-sm text-zinc-400 mb-4 font-bold">Fecha: <span class="text-white">${dateStr}</span></p>${existingHTML}<form onsubmit="saveActivity(event, '${dateStr}')" class="space-y-4 pt-6 border-t border-zinc-800/80"><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nombre Actividad</label><input type="text" id="ev_name" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Hora Inicio</label><input type="time" id="ev_start" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Hora Fin</label><input type="time" id="ev_end" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div></div><div class="relative"><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Asignar a Cliente (Opcional)</label><input type="text" id="ev_cc_search" onkeyup="filterUserSearch(this.value)" placeholder="Buscar por nombre o CC..." class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" autocomplete="off" /><div id="ev_cc_results" class="absolute w-full z-10 max-h-40 overflow-y-auto bg-[#0a0a0a] border border-cyan-500/50 shadow-[0_0_15px_rgba(0,229,255,0.2)] rounded-xl mt-1 hidden custom-scrollbar"></div><input type="hidden" id="ev_assigned_cc"></div><button type="submit" class="w-full btn-depth bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-sm mt-4 shadow-[0_0_15px_rgba(255,215,0,0.4)]">Guardar Actividad</button></form>`);
};

// ==========================================
// PANEL DE ADMINISTRADOR COMPLETO
// ==========================================
window.switchAdminTab = function(tab) { state.adminTab = tab; state.viewingClientAsAdmin = false; renderMainContent(); };
function renderAdminDashboard() { 
  const activeClients = state.clients.filter(c => c.status !== 'inactive'); const inactiveClients = state.clients.filter(c => c.status === 'inactive');
  return `<div class="space-y-8 animate-fade-in pb-10"><div class="flex flex-wrap gap-3 border-b border-zinc-900 pb-6 mb-4"><button onclick="switchAdminTab('profile')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'profile' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-cyan-500/50'}"><i class="fa-solid fa-id-card"></i> Perfil</button><button onclick="switchAdminTab('calendar')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'calendar' ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-yellow-400/50'}"><i class="fa-solid fa-calendar-days"></i> Calendario</button><button onclick="switchAdminTab('active_clients')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'active_clients' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-emerald-500/50'}"><i class="fa-solid fa-users"></i> Activos (${activeClients.length})</button><button onclick="switchAdminTab('inactive_clients')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'inactive_clients' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-500/50'}"><i class="fa-solid fa-user-slash"></i> Inactivos (${inactiveClients.length})</button><button onclick="switchAdminTab('inventory')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'inventory' ? 'bg-zinc-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-white/50'}"><i class="fa-solid fa-dumbbell"></i> Máquinas</button></div>
      ${state.adminTab === 'profile' ? `<div class="card-depth border border-cyan-500/20 rounded-[2rem] p-10 max-w-2xl mx-auto space-y-8 shadow-[0_0_20px_rgba(0,229,255,0.05)]"><div class="flex items-center gap-5 border-b border-zinc-800/50 pb-6"><div class="w-16 h-16 inner-depth text-cyan-400 rounded-full flex items-center justify-center text-2xl drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]"><i class="fa-solid fa-user-shield"></i></div><div><h3 class="text-2xl font-black text-white drop-shadow-md">Perfil Entrenador</h3><p class="text-sm text-zinc-400 mt-1 font-medium">Administración del sistema</p></div></div><div class="space-y-4 text-sm"><div class="inner-depth p-5 rounded-2xl flex justify-between items-center"><span class="text-zinc-500 font-bold uppercase tracking-widest text-xs">Nombre Completo:</span><span class="font-bold text-white text-base drop-shadow-md">${state.currentUser.name}</span></div><div class="inner-depth p-5 rounded-2xl flex justify-between items-center"><span class="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cédula Asignada:</span><span class="font-bold text-cyan-400 font-mono text-base drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">${state.currentUser.cc}</span></div></div></div>` : ''}
      ${state.adminTab === 'calendar' ? renderCalendarHTML('admin') : ''}
      ${state.adminTab === 'active_clients' ? renderActiveClientsTab(activeClients) : ''}
      ${state.adminTab === 'inactive_clients' ? renderInactiveClientsTab(inactiveClients) : ''}
      ${state.adminTab === 'inventory' ? `<div class="card-depth border border-zinc-500/20 rounded-[2rem] p-8 max-w-3xl mx-auto space-y-6"><h3 class="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md"><span class="p-2.5 bg-zinc-800 rounded-xl shadow-[0_0_10px_rgba(255,255,255,0.1)]"><i class="fa-solid fa-dumbbell text-zinc-300"></i></span> Inventario de Máquinas</h3><div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">${state.inventory.map((item, idx) => `<div class="flex justify-between items-center inner-depth p-4 rounded-xl text-sm"><span class="text-zinc-200 font-medium">${item}</span><button onclick="state.inventory.splice(${idx},1); syncSettingsToDB(); renderMainContent();" class="text-zinc-500 hover:text-red-500 bg-[#050505] p-3 rounded-lg border border-zinc-800 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] transition"><i class="fa-solid fa-trash-can"></i></button></div>`).join('')}</div><div class="flex flex-col md:flex-row gap-3 pt-6 border-t border-zinc-800/80"><input type="text" id="new-machine" placeholder="Nombre de nueva máquina..." class="flex-1 input-gym rounded-xl px-4 py-3 text-sm text-white font-medium" /><button onclick="const v=document.getElementById('new-machine').value; if(v){state.inventory.push(v); syncSettingsToDB(); renderMainContent();}" class="btn-depth bg-zinc-200 text-black px-8 py-3.5 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(255,255,255,0.3)]">+ Añadir Equipo</button></div></div>` : ''}
    </div>`;
}

function renderActiveClientsTab(clients) { 
  const btnAdd = `<button onclick="showClientRegisterModal()" class="bg-cyan-500 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-[0_0_10px_rgba(0,229,255,0.3)] hover:scale-105 transition flex items-center gap-2"><i class="fa-solid fa-user-plus"></i> Nuevo Usuario</button>`;
  if (clients.length === 0) return `<div class="flex flex-col items-center justify-center p-16 opacity-80 animate-fade-in"><i class="fa-solid fa-user-astronaut text-6xl text-cyan-500/30 mb-6 animate-float drop-shadow-[0_0_15px_rgba(0,229,255,0.2)]"></i><p class="text-base text-zinc-400 font-medium mb-6">Aún no tienes usuarios activos registrados.</p>${btnAdd}</div>`;
  return `<div class="space-y-4"><div class="flex justify-between items-center px-2"><h3 class="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md"><span class="p-2.5 bg-cyan-500/10 rounded-xl shadow-[0_0_10px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-users text-cyan-400"></i></span> Usuarios Activos</h3>${btnAdd}</div><div class="block md:hidden space-y-4">${clients.map(c => { const daysLeft = Math.ceil((new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24)); return `<div class="card-depth p-5 rounded-[2rem] flex flex-col gap-4 border border-cyan-500/20"><div class="flex justify-between items-start"><div><strong class="text-white text-base drop-shadow-md">${c.name}</strong><br><span class="text-xs text-cyan-400 font-mono mt-1 block drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">CC: ${c.cc}</span></div><span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-md ${daysLeft < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}">${daysLeft < 0 ? 'VENCIDO' : daysLeft + ' días'}</span></div><div class="bg-[#050505] p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex justify-around font-medium"><span>Peso: <strong class="text-white">${c.bia.weight}kg</strong></span><span>Grasa: <strong class="text-white">${c.bia.fat}%</strong></span></div><div class="flex gap-2"><button onclick="viewClientRoutine('${c.cc}')" class="flex-1 bg-cyan-500 text-black py-2.5 rounded-xl text-xs font-black shadow-[0_0_10px_rgba(0,229,255,0.3)]"><i class="fa-solid fa-eye"></i> Ver / Editar Rutina</button><button onclick="toggleClientStatus('${c.cc}', 'inactive')" class="flex-1 bg-[#050505] text-zinc-400 border border-zinc-700 py-2.5 rounded-xl text-xs font-bold hover:text-red-400 hover:border-red-500/50 transition"><i class="fa-solid fa-user-slash"></i> Inactivar</button></div></div>` }).join('')}</div><div class="hidden md:block card-depth rounded-[2rem] p-8 overflow-x-auto border border-cyan-500/20"><table class="w-full text-left text-sm text-zinc-300"><thead class="text-zinc-500 uppercase text-xs tracking-wider border-b border-zinc-800"><tr><th class="p-4 font-bold">Cliente</th><th class="p-4 font-bold">Vencimiento</th><th class="p-4 font-bold">Datos BIA</th><th class="p-4 font-bold text-center">Acciones</th></tr></thead><tbody class="divide-y divide-zinc-800/50">${clients.map(c => { const daysLeft = Math.ceil((new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24)); return `<tr class="hover:bg-[#0a0a0a] transition-all"><td class="p-4"><strong class="text-white drop-shadow-md">${c.name}</strong><br><span class="text-xs text-cyan-400 font-mono drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">CC: ${c.cc}</span></td><td class="p-4"><span class="px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ${daysLeft < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}">${c.dueDate} (${daysLeft < 0 ? 'VENCIDO' : daysLeft + ' días'})</span></td><td class="p-4 text-xs text-zinc-400 font-medium">Peso: <strong class="text-white">${c.bia.weight}kg</strong> | Grasa: <strong class="text-white">${c.bia.fat}%</strong></td><td class="p-4 text-center space-x-2 whitespace-nowrap"><button onclick="viewClientRoutine('${c.cc}')" class="bg-cyan-500 text-black px-6 py-2.5 rounded-full text-xs font-extrabold hover:scale-105 transition shadow-[0_0_10px_rgba(0,229,255,0.4)]"><i class="fa-solid fa-eye"></i> Ver / Editar</button><button onclick="toggleClientStatus('${c.cc}', 'inactive')" class="bg-[#050505] text-zinc-300 border border-zinc-700 px-6 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-800 hover:text-red-400 hover:border-red-500/50 transition"><i class="fa-solid fa-user-slash"></i> Inactivar</button></td></tr>`; }).join('')}</tbody></table></div></div>`;
}

function renderInactiveClientsTab(clients) { 
  if (clients.length === 0) return `<div class="flex flex-col items-center justify-center p-16 opacity-80 animate-fade-in"><i class="fa-solid fa-user-shield text-6xl text-red-500/30 mb-6 animate-float drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]"></i><p class="text-base text-zinc-400 font-medium">No hay usuarios inactivos o retirados.</p></div>`;
  return `<div class="space-y-4"><h3 class="text-xl font-bold text-white flex items-center gap-3 px-2 drop-shadow-md"><span class="p-2.5 bg-red-500/10 rounded-xl shadow-[0_0_10px_rgba(239,68,68,0.2)]"><i class="fa-solid fa-user-slash text-red-400"></i></span> Inactivos</h3><div class="block md:hidden space-y-4">${clients.map(c => `<div class="card-depth p-5 rounded-[2rem] flex flex-col gap-4 border border-red-500/30"><div class="flex justify-between items-start"><div><strong class="text-white text-base drop-shadow-md">${c.name}</strong><br><span class="text-xs text-red-400 font-mono mt-1 block drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">CC: ${c.cc}</span></div><span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-[#050505] border border-zinc-800 text-zinc-500 shadow-md">Inactivo</span></div><div class="text-xs text-zinc-500 font-medium"><i class="fa-regular fa-calendar"></i> Última Eval: ${c.date}</div><div class="flex gap-2"><button onclick="toggleClientStatus('${c.cc}', 'active')" class="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 py-2.5 rounded-xl text-xs font-bold transition hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_10px_rgba(16,185,129,0.4)]"><i class="fa-solid fa-user-check"></i> Reactivar</button><button onclick="confirmDeleteUser('${c.cc}')" class="flex-1 bg-red-900/40 text-red-400 border border-red-500/50 py-2.5 rounded-xl text-xs font-bold transition hover:bg-red-600 hover:text-white hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]"><i class="fa-solid fa-trash-can"></i> Borrar</button></div></div>`).join('')}</div><div class="hidden md:block card-depth rounded-[2rem] p-8 overflow-x-auto border border-red-500/30"><table class="w-full text-left text-sm text-zinc-300"><thead class="text-zinc-500 uppercase text-xs tracking-wider border-b border-zinc-800"><tr><th class="p-4 font-bold">Cliente</th><th class="p-4 font-bold">Última Eval</th><th class="p-4 font-bold">Estado</th><th class="p-4 font-bold text-center">Acciones</th></tr></thead><tbody class="divide-y divide-zinc-800/50">${clients.map(c => `<tr class="hover:bg-[#0a0a0a] transition-all"><td class="p-4"><strong class="text-white drop-shadow-md">${c.name}</strong><br><span class="text-xs text-red-400 font-mono drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">CC: ${c.cc}</span></td><td class="p-4 text-zinc-400 font-medium">${c.date}</td><td class="p-4"><span class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#050505] border border-zinc-800 text-zinc-500 shadow-md">Inactivo</span></td><td class="p-4 text-center space-x-2 whitespace-nowrap"><button onclick="toggleClientStatus('${c.cc}', 'active')" class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-emerald-500 hover:text-black transition shadow-[0_0_10px_rgba(16,185,129,0.2)]"><i class="fa-solid fa-user-check"></i> Reactivar</button><button onclick="confirmDeleteUser('${c.cc}')" class="bg-red-900/40 text-red-400 border border-red-500/50 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-red-600 hover:text-white transition shadow-[0_0_10px_rgba(239,68,68,0.2)]"><i class="fa-solid fa-trash-can"></i> Borrar</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

window.toggleClientStatus = function(cc, status) { const c = state.clients.find(x => x.cc === cc); if (c) { c.status = status; syncClientToDB(c); renderMainContent(); } };
window.viewClientRoutine = function(cc) { const c = state.clients.find(x => x.cc === cc); if (c) { state.viewingClientAsAdmin = true; state.selectedClientRecord = c; renderMainContent(); } };
window.backToAdminPanel = function() { state.viewingClientAsAdmin = false; state.selectedClientRecord = null; renderMainContent(); };
window.confirmDeleteUser = function(cc) {
  const client = state.clients.find(c => c.cc === cc); if (!client) return;
  openModal(`<div class="text-center space-y-6 py-4"><div class="w-20 h-20 inner-depth text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-red-500/50 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"><i class="fa-solid fa-trash-can"></i></div><div><h3 class="text-lg font-bold text-white mb-2">¿Borrar Definitivamente?</h3><p class="text-sm text-zinc-400 leading-relaxed max-w-[90%] mx-auto font-medium">Se eliminarán los datos de <strong class="text-white">${client.name}</strong>, pero su progreso se guardará en el historial del sistema.</p></div><div class="flex gap-3 pt-4"><button onclick="closeModal()" class="flex-1 card-depth border border-zinc-800 text-zinc-300 py-3.5 rounded-xl text-sm font-bold">Cancelar</button><button onclick="deleteUserPermanently('${cc}')" class="flex-1 btn-depth bg-red-600 text-white py-3.5 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(239,68,68,0.4)]">Sí, Borrar</button></div></div>`);
};
window.deleteUserPermanently = function(cc) { 
  const client = state.clients.find(c => c.cc === cc);
  if(client && client.evaluations) { state.historyDB[cc] = client.evaluations; syncHistoryToDB(); }
  state.clients = state.clients.filter(c => c.cc !== cc); deleteClientFromDB(cc); closeModal(); renderMainContent(); 
};

window.toggleProgressChart = function() { const w = document.getElementById('chart-wrapper'), i = document.getElementById('chart-toggle-icon'), t = document.getElementById('chart-toggle-text'); if (w.classList.contains('hidden')) { w.classList.remove('hidden'); i.classList.replace('fa-chevron-down', 'fa-chevron-up'); t.innerText = 'Ocultar'; } else { w.classList.add('hidden'); i.classList.replace('fa-chevron-up', 'fa-chevron-down'); t.innerText = 'Mostrar'; } };
window.initProgressChart = function() { const c = state.viewingClientAsAdmin ? state.selectedClientRecord : (state.clients.find(x => x.cc === state.currentUser.cc) || state.currentUser.record); if (!c || !c.evaluations || c.evaluations.length === 0) return; const ctx = document.getElementById('progressChart'); if (!ctx) return; if (progressChartInstance) progressChartInstance.destroy(); const labels = c.evaluations.map(e => e.date); const fatData = c.evaluations.map(e => e.fat); const muscleData = c.evaluations.map(e => e.muscle); const bmiData = c.evaluations.map(e => e.bmi); progressChartInstance = new Chart(ctx, { type: 'line', data: { labels, datasets: [ { label: '% Grasa', data: fatData, borderColor: '#ef4444', backgroundColor: '#ef4444', tension: 0.3, borderWidth: 3, spanGaps: false }, { label: 'Músculo', data: muscleData, borderColor: '#10b981', backgroundColor: '#10b981', tension: 0.3, borderWidth: 3, spanGaps: false }, { label: 'IMC', data: bmiData, borderColor: '#3b82f6', backgroundColor: '#3b82f6', tension: 0.3, borderWidth: 3, spanGaps: false } ] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff', font: { family: 'Outfit', weight: 'bold' } } } }, scales: { x: { ticks: { color: '#6b7280' }, grid: { color: '#111' } }, y: { ticks: { color: '#6b7280' }, grid: { color: '#111' } } } } }); };
window.logout = function() { state.currentUser = null; state.viewingClientAsAdmin = false; localStorage.removeItem('gym_session'); renderNavbar(); renderMainContent(); };