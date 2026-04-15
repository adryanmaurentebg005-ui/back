const User = require('../models/userModel')
const bcrypt = require('bcrypt');

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 })
        res.status(200).json(users)
    } catch (error) {
        console.log("Erro ao buscar usuários, paia dmais :(", error)
        res.status(500).json({message: "Erro ao buscar usuários, paia dmais :(", error: error.message})
    }
}

const getUserById = async (req, res) => {
    const { id } = req.params

    try {
        const user = await User.findById(id, { password: 0 })
        if (!user) {
            return res.status(404).json({message: "Usuário não encontrado :("})
        }
        res.status(200).json(user)
    } catch (error) {
        console.log("Erro ao buscar usuário, paia dmais :(", error)
        res.status(500).json({message: "Erro ao buscar usuário, paia dmais :(", error: error.message})
    }
}

const createUser = async (req, res) => {

    const { name, email, password} = req.body

    if (!name || !email || !password) {
        const error = new Error("Preencha todos os campos ;)")
        return res.status(400).json({message: "Preencha todos os campos ;)", error: error.message})
    }

    try {
        const userExist = await User.findOne({email})
        if (userExist) {
            const error = new Error("Usuário já existe :(")
            return res.status(400).json({message: "Usuário já existe :(", error: error.message})
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = new User({name, email, password: hashPassword})
        
        await newUser.save()

        res.status(201).json({message: "Usuário criado com sucesso"})

    } catch (error) {
        console.log("Erro ao criar usuário, paia dmais :(", error)
        res.status(500).json({message: "Erro ao criar usuário, paia dmais :(", error: error.message})
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        const error = new Error("Preencha email e senha ;)")
        return res.status(400).json({ message: "Preencha email e senha ;)", error: error.message })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) {
            const error = new Error("Usuário não encontrado :(")
            return res.status(404).json({ message: "Usuário não encontrado :(", error: error.message })
        }

        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) {
            const error = new Error("Senha inválida :(")
            return res.status(401).json({ message: "Senha inválida :(", error: error.message })
        }

        res.status(200).json({
            message: "Login realizado com sucesso",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        })
    } catch (error) {
        console.log("Erro ao fazer login, paia dmais :(", error)
        res.status(500).json({ message: "Erro ao fazer login, paia dmais :(", error: error.message })
    }
}

    const deleteUser = async (req, res) => {
        const { id } = req.params

        try {
            const user = await User.findByIdAndDelete(id)
            if (!user) {
                const error = new Error("Usuário não encontrado :(")
                return res.status(404).json({message: "Usuário não encontrado :(", error: error.message} )
            }
            res.status(200).json({message: "Usuário deletado com sucesso ;)"})
        } catch (error) {
            console.log("Erro ao deletar usuário, paia dmais :(", error)
            res.status(500).json({message: "Erro ao deletar usuário, paia dmais :(", error: error.message})

        }

}
    const userEdit = async (req, res) => {
        const { id } = req.params
        const { name, email, password } = req.body 

        try {
        const user = await User.findById(id)
        if (!user) {
            const error = new Error("Usuário não encontrado :(")
            return res.status(404).json({message: "Usuário não encontrado :(", error: error.message})
        }
        if (email && email !== user.email) {
            const emailExist = await User.findOne({ email, _id: { $ne: id } })
            if(emailExist){
                const error = new Error("Email já cadastrado")
                return res.status(400).json({ message:"Email já cadastrado", error: error.message });
            }
        }

        if (name) user.name = name
        if (email) user.email = email
        if (password) {
            const hashPassword = await bcrypt.hash(password, 10)
            user.password = hashPassword
        }

        await user.save()
        res.status(200).json({message: "Usuário editado com sucesso ;)"})

        } catch (error) {
        console.log("Erro ao editar usuário, paia dmais :(", error)
        res.status(500).json({message: "Erro ao editar usuário, paia dmais :(", error: error.message})

    }
}

module.exports = { getUsers, getUserById, createUser, loginUser, deleteUser, userEdit }