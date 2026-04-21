// SCRIPT PARA CARGAR PRODUCTOS EN FIREBASE (Node.js)
// 
// INSTRUCCIONES:
// 1. Instala dependencias: npm install firebase-admin
// 2. Descarga JSON de credenciales desde Firebase Console
// 3. Actualiza la ruta del archivo credentials
// 4. Ejecuta: node import-products.js

const admin = require('firebase-admin');

// Descargar desde Firebase Console > Configuración > Clave privada
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// PRODUCTOS DE EJEMPLO
const products = [
  {
    name: "2 Premium Fenders with cover white",
    sku: "f7-301-F",
    price: 53.95,
    cost: 20.95,
    stock: 5,
    category: "ANCHOR AND DECKING",
    description: "Premium white fenders with protective cover for boat protection",
    image: "https://example.com/image1.jpg",
    active: true,
    barcode: "7f61137f3017",
    unitType: "unit",
    lowStockThreshold: 0,
  },
  {
    name: "Yamaha Outboard Oil 10W-40 Mineral 1L",
    sku: "YAM-OIL-1L",
    price: 45.00,
    cost: 15.00,
    stock: 12,
    category: "LUBRICANTS",
    description: "Premium mineral oil for Yamaha outboard motors",
    image: "https://example.com/yamaha-oil.jpg",
    active: true,
    barcode: "4897456123894",
    unitType: "unit",
    lowStockThreshold: 3,
  },
  {
    name: "Stainless Steel Clevis Pin",
    sku: "PIN-SS-5MM",
    price: 8.99,
    cost: 2.50,
    stock: 25,
    category: "HARDWARE",
    description: "5mm stainless steel clevis pin for marine applications",
    active: true,
    barcode: "1234567890123",
    unitType: "unit",
    lowStockThreshold: 5,
  },
  {
    name: "Solas Propeller 14.5x17",
    sku: "SOL-1417",
    price: 285.00,
    cost: 120.00,
    stock: 2,
    category: "PROPELLERS",
    description: "Solas high-performance stainless steel propeller",
    image: "https://example.com/solas-prop.jpg",
    active: true,
    barcode: "9876543210987",
    unitType: "unit",
    lowStockThreshold: 3,
  },
  {
    name: "Mercury 25HP Impeller Kit",
    sku: "MER-IMP-25",
    price: 89.50,
    cost: 40.00,
    stock: 0,
    category: "ENGINE PARTS",
    description: "OEM Mercury impeller replacement kit for 25HP outboard",
    image: "https://example.com/mercury-imp.jpg",
    active: true,
    barcode: "5555555555555",
    unitType: "unit",
    lowStockThreshold: 2,
  },
  {
    name: "Lumitec LED Navigation Light",
    sku: "LUM-NAV-LED",
    price: 125.00,
    cost: 55.00,
    stock: 8,
    category: "ELECTRICAL",
    description: "Energy-efficient LED navigation light for boats",
    image: null,
    active: true,
    barcode: "7777777777777",
    unitType: "unit",
    lowStockThreshold: 2,
  }
];

async function importProducts() {
  try {
    console.log('🚀 Iniciando importación de productos...\n');
    
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Agregar timestamp
        product.createdAt = new Date().toISOString();
        product.updatedAt = new Date().toISOString();
        
        // Agregar a Firestore
        const docRef = await db.collection('products').add(product);
        
        console.log(`✅ ${product.name}`);
        console.log(`   ID: ${docRef.id}`);
        console.log(`   Precio: $${product.price}\n`);
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error con ${product.name}: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ IMPORTACIÓN COMPLETADA`);
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// OPCIONES ADICIONALES:

// Opción 1: Importar desde CSV
async function importFromCSV(csvPath) {
  const fs = require('fs');
  const csv = require('csv-parse/sync');
  
  const content = fs.readFileSync(csvPath);
  const records = csv.parse(content, {
    columns: true,
    skip_empty_lines: true
  });

  for (const record of records) {
    await db.collection('products').add(record);
  }
}

// Opción 2: Actualizar stock existente
async function updateStock(productId, newStock) {
  await db.collection('products').doc(productId).update({
    stock: newStock,
    updatedAt: new Date().toISOString()
  });
}

// Opción 3: Eliminar todos los productos
async function deleteAllProducts() {
  const snapshot = await db.collection('products').get();
  const batch = db.batch();

  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  return batch.commit();
}

// Opción 4: Leer todos los productos
async function getAllProducts() {
  const snapshot = await db.collection('products').get();
  const products = [];

  snapshot.forEach(doc => {
    products.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return products;
}

// Opción 5: Búsqueda por categoría
async function getProductsByCategory(category) {
  const snapshot = await db
    .collection('products')
    .where('category', '==', category)
    .get();

  const products = [];
  snapshot.forEach(doc => {
    products.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return products;
}

// Ejecutar importación
importProducts();

/*
EJEMPLOS DE USO ADICIONAL:
==========================

// Actualizar stock de un producto
updateStock('documento-id', 10);

// Leer todos los productos
getAllProducts().then(products => {
  console.log(products);
});

// Obtener solo productos de una categoría
getProductsByCategory('PROPELLERS').then(products => {
  console.log(products);
});

// Eliminar todos (CUIDADO!)
deleteAllProducts();
*/

// ALTERNATIVA: Usar Firebase CLI para importar
/*
OPCIÓN CON FIREBASE CLI:
=======================

1. Instala: npm install -g firebase-tools
2. Login: firebase login
3. Selecciona proyecto: firebase use tu-proyecto
4. Exporta datos: firebase firestore:export ./backup
5. Importa datos: firebase firestore:import ./backup

O usa el script de Google Sheets:
https://firebase.google.com/docs/firestore/solutions/export-import
*/
