require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PRIVATE_APP_ACCESS = process.env.HUBSPOT_PRIVATE_APP_ACCESS;  // Cargar el token desde las variables de entorno

// Ruta GET para la página de inicio ("/")
app.get('/', async (req, res) => {
    const customObjectsUrl = 'https://api.hubapi.com/crm/v3/objects/2-32339523?properties=nombre,marca,modelo';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };
    try {
        const response = await axios.get(customObjectsUrl, { headers });
        const data = response.data.results;
        res.render('home', { title: 'Home | HubSpot APIs', data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving custom object data');
    }
});

// Ruta GET para el formulario HTML ("/update-cobj")
app.get('/update-cobj', (req, res) => {
    res.render('updates', { title: 'Formulario de actualización de objeto personalizado | Integración con HubSpot I Práctica' });
});

// Ruta POST para enviar los datos capturados por el formulario HTML ("/update-cobj")
app.post('/update-cobj', async (req, res) => {
    const nombre = req.body.nombre;
    const customObjectData = {
        properties: {
            nombre: req.body.nombre,
            marca: req.body.marca,
            modelo: req.body.modelo
        }
    };

    const findObjectUrl = `https://api.hubapi.com/crm/v3/objects/2-32339523?properties=nombre,marca,modelo&query=${nombre}`;
    const createOrUpdateObjectUrl = `https://api.hubapi.com/crm/v3/objects/2-32339523`;

    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try {
        // Buscar el objeto basado en el nombre
        const response = await axios.get(findObjectUrl, { headers });
        const existingObject = response.data.results.find(item => item.properties.nombre === nombre);

        if (existingObject) {
            // Si el objeto existe, actualizarlo
            const updateObjectUrl = `${createOrUpdateObjectUrl}/${existingObject.id}`;
            await axios.patch(updateObjectUrl, customObjectData, { headers });
        } else {
            // Si el objeto no existe, crearlo
            await axios.post(createOrUpdateObjectUrl, customObjectData, { headers });
        }
        res.redirect('/');
    } catch (error) {
        console.error("Error details:", error.response ? error.response.data : error.message);
        res.status(500).send('Error creating or updating custom object data');
    }
});

// Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));
