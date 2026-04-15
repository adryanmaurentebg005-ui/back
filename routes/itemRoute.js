const express = require('express')
const router = express.Router()
const { getItems, getItemById, createItem, deleteItem, itemEdit } = require('../controllers/itemController')

router.get('/', getItems)
router.get('/:id', getItemById)
router.post('/', createItem)
router.post('/create', createItem)
router.delete('/delete/:id', deleteItem)
router.put('/edit/:id', itemEdit)

module.exports = router