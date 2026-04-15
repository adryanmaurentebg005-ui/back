const Item = require('../models/itemModel');

const getItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar items', error: error.message });
    }
};

const getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('user', 'name email');
        if (!item) {
            return res.status(404).json({ message: 'Item não encontrado' });
        }

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar item', error: error.message });
    }
};

const createItem = async (req, res) => {
    const { user, name, price, stock, description, image } = req.body;

    if (!user || !name || price === undefined || stock === undefined || !image) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
    }

    try {
        const newItem = new Item({
            user,
            name,
            price,
            stock,
            description: description || '',
            image,
        });

        await newItem.save();

        const populatedItem = await Item.findById(newItem._id).populate('user', 'name email');
        res.status(201).json({ message: 'Item criado com sucesso', item: populatedItem });
    } catch (error) {
        console.log('Erro ao criar item, paia dmais :(', error);
        res.status(500).json({ message: 'Erro ao criar item, paia dmais :(' });
    }
};

const deleteItem = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório para deletar item' });
    }

    try {
        const item = await Item.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Item não encontrado :(' });
        }

        if (item.user.toString() !== userId) {
            return res.status(403).json({ message: 'Você só pode apagar seus próprios itens' });
        }

        await Item.findByIdAndDelete(id);

        res.status(200).json({ message: 'Item deletado com sucesso ;)'});
    } catch (error) {
        console.log('Erro ao deletar item, paia dmais :(', error);
        res.status(500).json({ message: 'Erro ao deletar item, paia dmais :(' });
    }
};

const itemEdit = async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, description, image } = req.body;

    try {
        const item = await Item.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Item não encontrado :(' });
        }

        if (name) item.name = name;
        if (price !== undefined) item.price = price;
        if (stock !== undefined) item.stock = stock;
        if (description !== undefined) item.description = description;
        if (image) item.image = image;

        await item.save();
        const populatedItem = await Item.findById(item._id).populate('user', 'name email');
        res.status(200).json({ message: 'Item editado com sucesso ;)', item: populatedItem });
    } catch (error) {
        console.log('Erro ao editar item, paia dmais :(', error);
        res.status(500).json({ message: 'Erro ao editar item, paia dmais :(' });
    }
};

module.exports = { getItems, getItemById, createItem, deleteItem, itemEdit };