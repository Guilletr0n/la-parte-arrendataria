import fs from 'node:fs';
import path from 'node:path';
import type { Article, ArticleStatus, FanzineIssue, User, UserRole } from './types';
import admin from 'firebase-admin';

// Initialize Firebase Admin if credentials are provided or in GCP environment
let firestoreDb: admin.firestore.Firestore | null = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firestoreDb = admin.firestore();
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    // Standard GCP environment (Cloud Run uses Application Default Credentials)
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
      });
    }
    firestoreDb = admin.firestore();
  }
} catch (e) {
  console.warn('Firebase Admin init notice: Falling back to local data store.', e);
}

// Local persistent JSON storage fallback
const DATA_DIR = path.resolve(process.cwd(), '.data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const ISSUES_FILE = path.join(DATA_DIR, 'issues.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARTICLES_FILE)) {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(INITIAL_ARTICLES, null, 2), 'utf-8');
  }
  if (!fs.existsSync(ISSUES_FILE)) {
    fs.writeFileSync(ISSUES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Initial Seed Articles with Portada & Destacado configured
const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-8dxwewf',
    title: 'Trilerismo parlamentario y tortura institucional: el Sindicato de Inquilinas disecciona los nuevos decretos de vivienda',
    slug: 'trilerismo-parlamentario-y-tortura-institucional-el-sindicato-de-inquilinas-disecciona-los-nuevos-decretos-de-vivienda',
    author: 'Comité Editorial (Admin)',
    authorRole: 'admin',
    authorUid: 'user-admin-01',
    excerpt: 'Alejandra Jacinto disecciona la letra pequeña de los nuevos decretos gubernamentales y defiende el contrato indefinido como única vacuna frente al goteo diario de desahucios invisibles por burofax.',
    content: `# "Trilerismo parlamentario" y tortura institucional: el Sindicato de Inquilinas disecciona los nuevos decretos de vivienda

La publicación fragmentada de la nueva normativa de vivienda ha despertado el recelo entre los colectivos por el derecho a un techo. Alejandra Jacinto, abogada del Sindicato de Inquilinas y de CAES, advierte de la "letra pequeña" y la insuficiencia de unos decretos que, si bien recogen ciertas demandas sociales, omiten medidas estructurales de urgencia. En una reciente entrevista con Carolina Iglesias, la jurista ha denunciado la inacción de las administraciones ante una crisis que suma más de un millón de desahucios en la última década.

## El espejismo de los decretos y el "trilerismo" político

La decisión del Gobierno de dividir las medidas en dos textos legislativos —bautizados popularmente como decreto "Mari" y "Carmen"— ha generado desconfianza en el equipo jurídico del Sindicato. Jacinto califica esta maniobra de "trilerismo parlamentario", sospechando que el objetivo es dejar caer en el Congreso el texto más ambicioso. Este segundo decreto aborda el corazón del problema: la renovación automática de los contratos.

Para la abogada, el contrato indefinido es "la mejor vacuna contra la especulación", ya que impide la expulsión de inquilinos mediante burofax por el simple hecho de haber dejado de ser rentables para el casero. Además, los colectivos denuncian que las medidas actuales nacen cojas al no incluir mínimos históricos: la suspensión real de desahucios sin alternativa habitacional, la prohibición de compras especulativas y la reforma de la Ley de Arrendamientos Urbanos (LAU) para frenar el fraude masivo de los alquileres de temporada y por habitaciones.

## Quince años de crisis y "tortura institucional"

El mediático caso de Maricarmen ha funcionado como detonante social, pero los desahucios son el pan de cada día en España desde 2012. Según cifras de Amnistía Internacional y la Plataforma de Afectados por la Hipoteca (PAH), el país acumula más de un millón de lanzamientos en la última década. La dinámica ha mutado: de las ejecuciones hipotecarias masivas se ha pasado a los desahucios silenciosos por alquiler, impulsados por fondos buitre y rentistas de todo tamaño. Solo en su despacho, Jacinto atiende una media de entre 5 y 10 casos diarios.

La respuesta institucional a este goteo incesante se reduce a parches temporales —aplazamientos de un mes por "razones humanitarias"— que Jacinto define como una "violencia institucional supina" y una "tortura". La ineficacia del sistema es flagrante a nivel internacional; España acumula más de una decena de condenas por parte de Naciones Unidas por ejecutar desahucios sin garantizar un alojamiento alternativo.

## La barrera del lenguaje y la lotería judicial

A la vulnerabilidad económica se suma la barrera de un sistema judicial opaco. La jurista subraya la desconexión entre el lenguaje legal y la mayoría social. "A nosotros, incluso siendo juristas, muchas veces nos cuesta y se puede interpretar una cosa o la contraria", señala Jacinto, alertando de que el destino de una familia depende con frecuencia de la interpretación subjetiva del juez de turno. Democratizar el lenguaje jurídico se plantea como uno de los grandes retos para la defensa ciudadana.

## La calle como única garantía

Frente al fracaso coordinado de administraciones, jueces y fuerzas de seguridad, la abogada concluye que solo la movilización y la organización popular han demostrado ser eficaces. La recuperación del piso de Maricarmen no es un triunfo del sistema, sino de la presión vecinal. 

Aunque los decretos actuales se consideren insuficientes, desde el Sindicato de Inquilinas los reconocen como pequeñas victorias arrancadas gracias a la movilización ciudadana. El objetivo final, insisten, sigue intacto: forzar un cambio de paradigma hasta que la vivienda deje de ser un activo financiero y se consolide, en la práctica y no solo en el papel, como un derecho fundamental.`,
    photoUrl: '',
    photoCaption: '',
    speakPipeAudioUrl: '',
    sourceUrl: '',
    status: 'published',
    createdAt: '2026-10-02T10:05:05.396Z',
    updatedAt: '2026-10-02T10:05:05.396Z',
    selectedForPrint: true,
    printOrder: 2,
    fanzineCategory: 'portada',
    includeInInterior: true,
  },
  {
    id: 'art-i29u293',
    title: 'La vivienda no es un fenómeno meteorológico: Radiografía de una crisis política y de desigualdad',
    slug: 'la-vivienda-no-es-un-fenmeno-meteorolgico-radiografa-de-una-crisis-poltica-y-de-desigualdad',
    author: 'Comité Editorial (Admin)',
    authorRole: 'admin',
    authorUid: 'user-admin-01',
    excerpt: 'Javi Gil desmiente la narrativa de la escasez: la vivienda en España no es un problema meteorológico sino el resultado de décadas de ingeniería financiera y rentismo especulativo que devora los salarios.',
    content: `# La vivienda no es un fenómeno meteorológico: Radiografía de una crisis política y de desigualdad

El problema de la vivienda en España no es una catástrofe natural frente a la que solo quepa abrir el paraguas. Es el resultado de una ingeniería política y financiera perfectamente engrasada. Así lo expone Javi Gil, investigador del CSIC, doctor en Sociología y autor del libro *Generación inquilina*, quien desmiente la narrativa de la escasez para apuntar hacia una crisis de desigualdad y acumulación de la propiedad.

Con más de 40 desahucios diarios en el país y una rentabilidad especulativa disparada, el mercado inmobiliario se ha convertido en el principal refugio del capital internacional, enfrentando a una nueva generación de caseros con una generación de inquilinos.

## El origen del modelo: Del franquismo al neoliberalismo

La actual estructura de la vivienda en España hunde sus raíces en la dictadura franquista. En los años 50, el ministro de Vivienda José Luis de Arrese sentenció: "No queremos un país de proletarios, queremos un país de propietarios". El objetivo era desactivar la organización obrera que florecía en los nuevos barrios industriales formados por la migración rural. Convertir a la clase trabajadora en propietaria diluía su potencial revolucionario.

> [!DESTACADO]> Un fondo de bajo riesgo ofrece un 3% en bolsa; la vivienda en alquiler en España alcanza hasta el 16% de rentabilidad neta.

Décadas más tarde, figuras como Margaret Thatcher y Ronald Reagan globalizaron esta estrategia. El neoliberalismo impulsó un proceso de desposesión de la clase trabajadora, debilitando el Estado de bienestar y la capacidad de negociación sindical. A cambio, se ofreció crédito barato. La promesa de que el precio de la vivienda nunca caería generó un espejismo de clase media, anclado en la propiedad, que terminó saltando por los aires en 2008.

Hoy, ante la dificultad del capital para encontrar rentabilidad en otros sectores debido a los avances tecnológicos, el dinero especulativo ha recalado en el mercado del alquiler español. 

> "Un fondo normal con poco riesgo te da un 3% de rentabilidad; una vivienda te da un 16%", se señala en la entrevista. Gil confirma que, entre 2013 y 2019, la entrada de dinero especulativo extranjero fue masiva. "Ni la bolsa, ni la deuda, ni las criptomonedas: invertir en vivienda en alquiler en España".

## La inacción del Gobierno y el poder de las plazas

Frente a un panorama donde el esfuerzo para pagar un techo devora entre el 50% y el 60% del salario —lo que deja obsoletos los índices actuales de vulnerabilidad legal—, las soluciones políticas son esquivas. Gil señala directamente la responsabilidad del PSOE en el Gobierno, acusándolo de presentar normativas fragmentadas para que socios conservadores como Junts las tumben en el Congreso. Contrasta esta tibieza con la contundencia de Mariano Rajoy en 2012, quien modificó múltiples leyes para allanar la entrada de los fondos de inversión.

> [!DESTACADO]> Más de 40 desahucios diarios se ejecutan en España mientras el pago del alquiler devora entre el 50% y el 60% de los salarios medios de la clase trabajadora.

Ante la parálisis parlamentaria, la legitimidad se traslada a la calle. Desahucios dramáticos como el de Maricarmen se han convertido en símbolos del hartazgo social. Las acampadas en la Puerta del Sol y las movilizaciones impulsadas por el Sindicato de Inquilinas y las Plataformas de Afectados por la Hipoteca (PAH) constatan una fractura profunda entre las instituciones y la sociedad. Lo que hasta hace poco parecía intocable, hoy cristaliza en exigencias de huelgas de alquileres y huelgas generales por la vivienda, alterando el sentido común de lo que es políticamente aceptable.

## El peligro de la fractura civil y el auge de la extrema derecha

La crisis habitacional plantea una encrucijada que trasciende los contratos de arrendamiento. Gil advierte sobre la estrategia de transformar un conflicto de clases —que exigiría redistribuir la riqueza y la propiedad— en un enfrentamiento civil. Narrativas cotidianas que culpan de la crisis a la población migrante o a los jubilados buscan fragmentar a la clase trabajadora y proteger el rentismo. 

La historia reciente demuestra que las políticas tibias en materia de vivienda actúan como fertilizante para la extrema derecha, canalizando el malestar de la población precarizada. La alternativa real, argumenta Gil, requiere una intervención profunda. Ejemplos como las propuestas de la izquierda en Berlín (*Die Linke*) para expropiar a los grandes fondos, o las medidas en Estados Unidos para congelar precios y aumentar impuestos a los grandes patrimonios inmobiliarios, marcan la línea de flotación de este conflicto. La manera en que España resuelva esta crisis no solo definirá el acceso a un techo, sino el modelo de sociedad, democracia e igualdad de las próximas décadas.`,
    photoUrl: '',
    photoCaption: '',
    speakPipeAudioUrl: '',
    sourceUrl: '',
    status: 'published',
    createdAt: '2026-10-02T09:51:41.873Z',
    updatedAt: '2026-10-02T11:13:08.031Z',
    selectedForPrint: true,
    printOrder: 1,
    fanzineCategory: 'destacado',
    includeInInterior: true,
  },
  {
    id: 'art-001',
    title: 'El corazón del decreto y la urgencia del contrato indefinido',
    slug: 'corazon-decreto-contrato-indefinido',
    author: 'Alejandra Jacinto',
    authorRole: 'admin',
    excerpt: 'Análisis de urgencia del decreto de vivienda: por qué el contrato indefinido y la renovación automática son la única vacuna real contra la especulación inmobiliaria y los desahucios invisibles por burofax.',
    content: `Estamos analizando la letra pequeña porque hay que recordar que el corazón del decreto que reclamábamos los sindicatos de inquilinas es el que establece la **renovación automática de los contratos**.

Esto es el contrato indefinido, que es la mejor vacuna contra la especulación porque es lo que impide que te llegue un burofax en el que tu casero te diga que ya no eres rentable y que te va a sustituir por otro que pague más.

Llevamos más de 15 años en nuestro país viendo ejecuciones y desahucios. No han cesado: se han transformado en desahucios por alquiler. Bloques enteros de vecinos vienen a las asambleas —como Tribulete 7 o General Lacy— con cartas de rentistas que los expulsan de sus barrios. 

Mientras no exista una normativa protectora estructural que impida que esto suceda, sólo tenemos parches. El derecho a techo no puede seguir subordinado al rendimiento de los grandes tenedores.`,
    photoUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1000&q=80',
    photoCaption: 'Asamblea de inquilinas en lucha contra desahucios por alquiler en Madrid.',
    speakPipeAudioUrl: 'https://www.speakpipe.com/voice-recorder/embed/demo1',
    sourceUrl: 'https://www.elsaltodiario.com/vivienda',
    status: 'published',
    createdAt: '2026-09-30T09:32:56.542Z',
    updatedAt: '2026-10-02T09:52:48.775Z',
    selectedForPrint: true,
    printOrder: 3,
    fanzineCategory: 'portada',
    includeInInterior: true,
  },
  {
    id: 'art-002',
    title: 'La huelga de alquileres y la organización colectiva',
    slug: 'huelga-alquileres-organizacion-colectiva',
    author: 'Javi Gil',
    authorRole: 'editor',
    excerpt: 'La huelga de alquileres no es una consigna abstracta sino una herramienta de contrapoder frente a rentistas y fondos buitre cuando el coste de la vida devora los salarios.',
    content: `El conflicto de la vivienda en el estado español ha alcanzado un punto de no retorno. Los precios del alquiler han subido más de un 60% en la última década, mientras los salarios se han mantenido estancados.

La huelga de alquileres no es una utopía teórica: es una herramienta de lucha histórica de la clase trabajadora cuando el coste de la vida se vuelve insostenible. Cuando un inquilino no paga solo, se le llama moroso y se le desahucia; cuando 10.000 inquilinos deciden colectivamente dejar de transferir su salario a los rentistas, se abre una crisis de estado que obliga a intervenir el mercado.

Necesitamos desmercantilizar la vivienda, suspender los fondos buitre y garantizar que ningún hogar destine más del 20% de sus ingresos a un techo digno.`,
    photoUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1000&q=80',
    photoCaption: 'Manifestación histórica por la bajada de alquileres y huelga inquilina.',
    speakPipeAudioUrl: 'https://www.speakpipe.com/voice-recorder/embed/demo2',
    sourceUrl: 'https://sindicatodeinquilinas.org',
    status: 'published',
    createdAt: '2026-10-01T09:32:56.542Z',
    updatedAt: '2026-10-02T10:24:27.562Z',
    selectedForPrint: true,
    printOrder: 4,
    fanzineCategory: 'portada',
    includeInInterior: true,
  },
  {
    id: 'art-003',
    title: 'Guía rápida de autodefensa frente al burofax de no renovación',
    slug: 'guia-autodefensa-burofax-no-renovacion',
    author: 'Colectivo Jurídico LPA',
    authorRole: 'editor',
    excerpt: 'Pasos inmediatos, plazos legales de preaviso de la LAU y claves de organización colectiva ante la notificación de expulsión de tu vivienda habitual.',
    content: `Si has recibido un burofax comunicando que finaliza tu contrato de arrendamiento y debes abandonar la vivienda, **no te vayas y acude de inmediato a tu asamblea sindical**.

> [!DESTACADO]
> Si el arrendador o intermediarios ejercen coacciones o amenazas de corte de suministros, no firmes ningún documento sin asesoría jurídica colectiva y graba cualquier interacción.

1. **Revisa la fecha y forma**: El preaviso del arrendador debe cumplir los plazos estrictos de la LAU (4 meses de antelación si es persona jurídica, 2 meses si es persona física). Si no cumple el plazo exacto, la notificación es nula.
2. **Identifica a tu casero**: ¿Es un gran tenedor (más de 5 o 10 inmuebles)? Tienen obligaciones legales adicionales y están sujetos a normativas de vulnerabilidad.
3. **Organización en bloque**: Si vives en un edificio donde el fondo o rentista está vaciando pisos, convocad reunión con las vecinas. La resistencia colectiva multiplica la capacidad de negociación.`,
    photoUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
    photoCaption: 'Documentación legal y avisos de no renovación inmobiliaria.',
    speakPipeAudioUrl: '',
    sourceUrl: 'https://caes.coop',
    status: 'published',
    createdAt: '2026-10-02T09:32:56.542Z',
    updatedAt: '2026-10-02T10:25:17.748Z',
    selectedForPrint: true,
    printOrder: 5,
    fanzineCategory: 'interior',
    includeInInterior: true,
  },
];

// Helper for Local Storage
function readLocalArticles(): Article[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(ARTICLES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return INITIAL_ARTICLES;
  }
}

function writeLocalArticles(articles: Article[]) {
  ensureDataDir();
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf-8');
}

// Public Data Methods
export async function getArticles(filter?: { status?: ArticleStatus; selectedForPrint?: boolean }): Promise<Article[]> {
  if (firestoreDb) {
    try {
      let query: admin.firestore.Query = firestoreDb.collection('articles');
      if (filter?.status) {
        query = query.where('status', '==', filter.status);
      }
      if (filter?.selectedForPrint !== undefined) {
        query = query.where('selectedForPrint', '==', filter.selectedForPrint);
      }
      const snapshot = await query.get();
      const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      return articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.warn('Firestore query error, falling back to local file store', e);
    }
  }

  let list = readLocalArticles();
  if (filter?.status) {
    list = list.filter(a => a.status === filter.status);
  }
  if (filter?.selectedForPrint !== undefined) {
    list = list.filter(a => !!a.selectedForPrint === filter.selectedForPrint);
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getArticleById(id: string): Promise<Article | null> {
  if (firestoreDb) {
    try {
      const doc = await firestoreDb.collection('articles').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Article;
      }
    } catch (e) {
      console.warn('Firestore getById error, using local fallback', e);
    }
  }

  const list = readLocalArticles();
  return list.find(a => a.id === id) || null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getArticles();
  return articles.find(a => a.slug === slug) || null;
}

export async function createArticle(data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article> {
  const now = new Date().toISOString();
  const id = 'art-' + Math.random().toString(36).substring(2, 9);
  const newArticle: Article = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  if (firestoreDb) {
    try {
      await firestoreDb.collection('articles').doc(id).set(newArticle);
    } catch (e) {
      console.warn('Firestore createArticle error, saving locally', e);
    }
  }

  const list = readLocalArticles();
  list.unshift(newArticle);
  writeLocalArticles(list);

  return newArticle;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  const now = new Date().toISOString();

  if (firestoreDb) {
    try {
      await firestoreDb.collection('articles').doc(id).set({
        ...updates,
        updatedAt: now,
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore update error', e);
    }
  }

  const list = readLocalArticles();
  const index = list.findIndex(a => a.id === id);
  if (index === -1) return null;

  const updated: Article = {
    ...list[index],
    ...updates,
    updatedAt: now,
  };
  list[index] = updated;
  writeLocalArticles(list);

  return updated;
}

export async function deleteArticle(id: string): Promise<boolean> {
  if (firestoreDb) {
    try {
      await firestoreDb.collection('articles').doc(id).delete();
    } catch (e) {
      console.warn('Firestore delete error', e);
    }
  }

  const list = readLocalArticles();
  const filtered = list.filter(a => a.id !== id);
  if (filtered.length === list.length) return false;

  writeLocalArticles(filtered);
  return true;
}

export interface PrintSelectionItem {
  id: string;
  category?: FanzineCategory;
  order?: number;
  includeInInterior?: boolean;
}

export async function updatePrintSelection(
  selection: (string | PrintSelectionItem)[]
): Promise<Article[]> {
  const list = readLocalArticles();

  const itemMap = new Map<string, { category: FanzineCategory; order: number; includeInInterior: boolean }>();

  selection.forEach((item, index) => {
    if (typeof item === 'string') {
      itemMap.set(item, {
        category: 'interior',
        order: index + 1,
        includeInInterior: true,
      });
    } else if (item && item.id) {
      itemMap.set(item.id, {
        category: item.category || 'interior',
        order: item.order ?? (index + 1),
        includeInInterior: item.includeInInterior ?? (item.category === 'interior'),
      });
    }
  });

  const updated = list.map(art => {
    const sel = itemMap.get(art.id);
    const isSelected = !!sel && sel.category !== 'none';
    return {
      ...art,
      selectedForPrint: isSelected,
      printOrder: isSelected ? sel.order : undefined,
      fanzineCategory: isSelected ? sel.category : 'none',
      includeInInterior: isSelected ? (sel.includeInInterior ?? (sel.category === 'interior')) : false,
    };
  });

  writeLocalArticles(updated);

  if (firestoreDb) {
    try {
      const batch = firestoreDb.batch();
      for (const item of updated) {
        batch.update(firestoreDb.collection('articles').doc(item.id), {
          selectedForPrint: item.selectedForPrint,
          printOrder: item.printOrder || null,
          fanzineCategory: item.fanzineCategory || 'none',
          includeInInterior: !!item.includeInInterior,
        });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore batch update error', e);
    }
  }

  return updated.filter(a => a.selectedForPrint).sort((a, b) => (a.printOrder || 0) - (b.printOrder || 0));
}
