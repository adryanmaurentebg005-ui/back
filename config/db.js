const mongoose  = require ('mongoose')
require ('dotenv').config()

const connectDB = async () => {
try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB foi conectado com sucesso, show de bola")

} catch (error) {
    console.log("Erro ao conectar no MongoDB, paia dmais", error)
}

}

module.exports = connectDB