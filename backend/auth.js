const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  const { email } = req.body;

  const user = {
    id: 1,
    nome: "Barbearia do Lucas 💈",
    email: email
  };

  return res.send(user);
});

module.exports = router;