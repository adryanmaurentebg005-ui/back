const express = require('express')
const router = express.Router()
const { getUsers, getUserById, createUser, loginUser, deleteUser, userEdit } = require('../controllers/userController')   

router.get('/users', getUsers)
router.get('/users/:id', getUserById)
router.post('/users', createUser)
router.post('/login', loginUser)
router.put('/users/:id', userEdit)
router.delete('/users/:id', deleteUser)

router.post('/createUser', createUser)
router.delete('/deleteUser/:id', deleteUser)
router.put('/editUser/:id', userEdit)

module.exports = router