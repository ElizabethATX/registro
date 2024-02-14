const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

// Configurar middleware para analizar solicitudes JSON
app.use(express.json());

// Configurar middleware para analizar datos de formularios codificados
app.use(express.urlencoded({ extended: true }));

// Configurar conexión a la base de datos
const db = new sqlite3.Database('mydb.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos SQLite.');
    }
});

// Configurar multer para cargar archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Directorio donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        // Generar un nombre de archivo único
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Configurar multer para guardar archivos en el directorio 'uploads'
const upload = multer({ storage: storage });

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static('public'));

// Ruta para servir el formulario HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para guardar datos en la base de datos
app.post('/guardar_datos', upload.single('imagen'), (req, res) => {
    console.log('Entrando en la ruta /guardar_datos');

    // Verificar si se subió una imagen
    if (!req.file) {
        console.log('No se subió ninguna imagen');
        return res.status(400).send('No se ha seleccionado ninguna imagen');
    }

    // Obtener los datos del formulario
    console.log('Datos del formulario:', req.body);
    const { nombre, edad, fecha, especialidad, contra } = req.body;

    // Verificar si todos los campos requeridos están presentes
    if (!nombre || !edad || !fecha || !especialidad || !contra) {
        console.log('Faltan campos requeridos');
        return res.status(400).send('Todos los campos son requeridos');
    }

    // Obtener el nombre del archivo de imagen subido
    const imagen = req.file.filename;
    console.log('Nombre del archivo de imagen:', imagen);

    // Insertar los datos en la base de datos
    const sql = 'INSERT INTO registros (nombre, edad, fecha, especialidad, contra, imagen) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(sql, [nombre, edad, fecha, especialidad, contra, imagen], (err) => {
        if (err) {
            console.error('Error al insertar datos:', err);
            return res.status(500).send('Error interno del servidor');
        }
        console.log('Datos guardados correctamente');
        res.send('<div class="alert alert-success" role="alert">Datos guardados correctamente</div>');
    });
});


// Ruta para buscar datos por ID
app.get('/buscar_por_id/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM registros WHERE id = ?';
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error interno del servidor');
    } else if (row) {
      // Construir la URL de la imagen estática
      const imagenURL = `/uploads/${row.imagen}`;
      // Enviar los datos del registro al cliente dentro de una caja con estilo Bootstrap
      res.send(`
        <div class="container mx-auto mt-4">
          <div class="row justify-content-center">
            <div class="col-md-14">
              <div class="card">
                <div class="card-body">
                  <h2 class="card-title">Registro encontrado</h2>
                  <p class="card-text"><b>ID:</b> ${row.id}</p>
                  <p class="card-text"><b>Nombre:</b> ${row.nombre}</p>
                  <p class="card-text"><b>Edad:</b> ${row.edad}</p>
                  <p class="card-text"><b>Fecha:</b> ${row.fecha}</p>
                  <p class="card-text"><b>Especialidad:</b> ${row.especialidad}</p>
                  <img src="${imagenURL}" alt="Imagen de perfil" class="img-fluid" style="max-height: 200px;">
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    } else {
      res.status(404).send('Registro no encontrado');
    }
  });
});

// Ruta para el formulario de inicio de sesión
app.get('/', (req, res) => {
  res.send(`
    <form action="/login" method="post">
      <input type="text" name="nombre" placeholder="Nombre">
      <input type="password" name="contra" placeholder="Contraseña">
      <button type="submit">Iniciar sesión</button>
    </form>
  `);
});

// Ruta para procesar el inicio de sesión
app.post('/login', (req, res) => {
  const { nombre, contra } = req.body;
  db.get('SELECT * FROM registros WHERE nombre = ? AND contra = ?', [nombre, contra], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error interno del servidor');
    } else if (row) {
      // Establecer una cookie de sesión
      const imagenURL = `/uploads/${row.imagen}`;    
      res.cookie('usuario', nombre);
      res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      background-color: #f0f0f0; /* Cambia el color de fondo aquí */
    }
    .container-fluid {
      display: flex;
      justify-content: center;
    }
    .card {
      width: 80%;
    }
    .card-body {
      display: flex;
      align-items: center;
    }
    .profile-image {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      object-fit: cover;
      margin-right: 20px;
    }
  </style>
</head>
<body>
  <div class="container mt-5">
    <div class="card">
      <div class="card-body">
        <img src="${imagenURL}" alt="Imagen de perfil" class="profile-image">
        <div>
          <h2 class="card-title alert alert-primary" role="alert" style="text-align: center;">¡Bienvenido, ${nombre}!</h2>
          <h2>Perfil:</h2>
          <p><b>ID:</b> ${row.id}</p>
          <p><b>Nombre:</b> ${row.nombre}</p>
          <p><b>Edad:</b> ${row.edad}</p>
          <p><b>Fecha:</b> ${row.fecha}</p>
          <p><b>Especialidad:</b> ${row.especialidad}</p>
          <p><b>Contraseña:</b> ${row.contra}</p>
        </div>
        <div style="flex-grow: 1;"></div> <!-- Espacio en blanco para dejar el lado derecho vacío -->
        <a href="/logout" class="btn btn-danger">Cerrar Sesión</a>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
      `);
    } else {
      res.status(401).send('Nombre de usuario o contraseña incorrectos');
    }
  });
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
  // Eliminar la cookie de sesión
  res.clearCookie('usuario');
  res.redirect('/'); // Redirige al usuario a la página de inicio de sesión
});



// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
