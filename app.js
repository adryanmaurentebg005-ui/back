const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoute");
const itemRoutes = require("./routes/itemRoute");
const orderRoutes = require("./routes/orderRoute");
const {
    getItems,
    getItemById,
    createItem,
    deleteItem,
    itemEdit,
} = require("./controllers/itemController");
const swaggerUI = require("swagger-ui-express");
const swaggerDocument = require("./swagger/swagger.json");
require('dotenv').config();

connectDB();
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.get('/health', (req, res) => {
    res.status(200).json({ ok: true });
});
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});
app.get('/items', getItems);
app.get('/items/:id', getItemById);
app.post('/items', createItem);
app.put('/items/:id', itemEdit);
app.delete('/items/:id', deleteItem);
app.use("/items", itemRoutes);
app.use("/orders", orderRoutes);
app.use("/", userRoutes);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando: http://localhost:${PORT}/api-docs`)
    })
}

module.exports = app;