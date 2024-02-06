import express from 'express';
import serverRoutes from './modules/routes.js';

const app = express();
app.use(express.static('webflow'));
app.use(express.json());

serverRoutes(app);

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});