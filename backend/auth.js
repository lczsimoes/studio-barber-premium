const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

module.exports = (User) => {
  router.post("/register", async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ message: "Preencha email e senha." });
      }

      const emailLimpo = String(email).trim().toLowerCase();

      const existente = await User.findOne({ email: emailLimpo });
      if (existente) {
        return res.status(400).json({ message: "Email já cadastrado." });
      }

      const senhaHash = await bcrypt.hash(String(senha), 10);

      const novoUsuario = await User.create({
        email: emailLimpo,
        senha: senhaHash,
      });

      return res.status(201).json({
        message: "Conta criada com sucesso.",
        userId: novoUsuario._id,
        email: novoUsuario.email,
      });
    } catch (error) {
      console.error("Erro no register:", error);
      return res.status(500).json({ message: "Erro ao cadastrar." });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ message: "Preencha email e senha." });
      }

      const emailLimpo = String(email).trim().toLowerCase();

      const usuario = await User.findOne({ email: emailLimpo });
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      const senhaCorreta = await bcrypt.compare(String(senha), usuario.senha);
      if (!senhaCorreta) {
        return res.status(401).json({ message: "Senha incorreta." });
      }

      return res.json({
        message: "Login realizado com sucesso.",
        userId: usuario._id,
        email: usuario.email,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      return res.status(500).json({ message: "Erro ao fazer login." });
    }
  });

  return router;
};