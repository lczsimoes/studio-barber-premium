const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

mongoose
  .connect("mongodb://127.0.0.1:27017/barber")
  .then(() => console.log("Mongo conectado ✅"))
  .catch((err) => console.error("Erro ao conectar no Mongo:", err));

const criarSlug = (texto = "") => {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
};

const UsuarioSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    senha: { type: String, required: true },
    nomeBarbearia: { type: String, default: "Studio Barber", trim: true },
    logoBarbearia: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    slug: { type: String, unique: true, sparse: true },
    abertura: { type: String, default: "09:00" },
    fechamento: { type: String, default: "19:00" },
    diasFuncionamento: {
      segunda: { type: Boolean, default: true },
      terca: { type: Boolean, default: true },
      quarta: { type: Boolean, default: true },
      quinta: { type: Boolean, default: true },
      sexta: { type: Boolean, default: true },
      sabado: { type: Boolean, default: true },
      domingo: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const ServicoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    preco: { type: Number, required: true },
    duracao: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

const AgendamentoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    cliente: { type: String, required: true, trim: true },
    telefone: { type: String, required: true, trim: true },
    servico: { type: String, required: true, trim: true },
    data: { type: String, required: true, trim: true },
    horario: { type: String, required: true, trim: true },
    origem: { type: String, default: "painel" },
    vistoPeloBarbeiro: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Usuario = mongoose.model("Usuario", UsuarioSchema);
const Servico = mongoose.model("Servico", ServicoSchema);
const Agendamento = mongoose.model("Agendamento", AgendamentoSchema);

app.get("/health", (_, res) => {
  res.json({ ok: true, message: "Backend online" });
});

app.post("/register", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const senha = String(req.body.senha || "").trim();

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Digite um email válido." });
    }

    if (senha.length < 4) {
      return res.status(400).json({ message: "A senha precisa ter pelo menos 4 caracteres." });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: "Esse email já está cadastrado." });
    }

    const novoUsuario = await Usuario.create({
      email,
      senha,
      slug: `barbearia-${Date.now()}`,
    });

    return res.status(201).json({
      message: "Conta criada com sucesso.",
      userId: novoUsuario._id,
    });
  } catch (error) {
    console.error("Erro no register:", error);
    return res.status(500).json({ message: "Erro ao cadastrar conta." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const senha = String(req.body.senha || "").trim();

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ message: "Usuário não encontrado." });
    }

    if (usuario.senha !== senha) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    return res.json({
      userId: usuario._id,
      email: usuario.email,
      nomeBarbearia: usuario.nomeBarbearia,
      logoBarbearia: usuario.logoBarbearia,
      whatsapp: usuario.whatsapp,
      slug: usuario.slug,
      abertura: usuario.abertura,
      fechamento: usuario.fechamento,
      diasFuncionamento: usuario.diasFuncionamento,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro ao fazer login." });
  }
});

app.get("/perfil/:userId", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.userId).lean();
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.json({
      _id: usuario._id,
      email: usuario.email,
      nomeBarbearia: usuario.nomeBarbearia,
      logoBarbearia: usuario.logoBarbearia,
      whatsapp: usuario.whatsapp,
      slug: usuario.slug,
      abertura: usuario.abertura,
      fechamento: usuario.fechamento,
      diasFuncionamento: usuario.diasFuncionamento,
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return res.status(500).json({ message: "Erro ao buscar perfil." });
  }
});

app.put("/perfil/:userId", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.userId);
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const nomeBarbearia = String(req.body.nomeBarbearia || usuario.nomeBarbearia).trim();
    const logoBarbearia = String(req.body.logoBarbearia || "");
    const whatsapp = String(req.body.whatsapp || "").replace(/\D/g, "");
    const abertura = String(req.body.abertura || usuario.abertura);
    const fechamento = String(req.body.fechamento || usuario.fechamento);
    const diasFuncionamento = req.body.diasFuncionamento || usuario.diasFuncionamento;

    const slugBase = criarSlug(nomeBarbearia) || `barbearia-${Date.now()}`;
    let slugFinal = slugBase;

    const slugEmUso = await Usuario.findOne({
      slug: slugBase,
      _id: { $ne: usuario._id },
    });

    if (slugEmUso) {
      slugFinal = `${slugBase}-${String(usuario._id).slice(-5)}`;
    }

    usuario.nomeBarbearia = nomeBarbearia;
    usuario.logoBarbearia = logoBarbearia;
    usuario.whatsapp = whatsapp;
    usuario.abertura = abertura;
    usuario.fechamento = fechamento;
    usuario.diasFuncionamento = diasFuncionamento;
    usuario.slug = slugFinal;

    await usuario.save();

    return res.json({
      message: "Perfil atualizado com sucesso.",
      perfil: {
        _id: usuario._id,
        email: usuario.email,
        nomeBarbearia: usuario.nomeBarbearia,
        logoBarbearia: usuario.logoBarbearia,
        whatsapp: usuario.whatsapp,
        slug: usuario.slug,
        abertura: usuario.abertura,
        fechamento: usuario.fechamento,
        diasFuncionamento: usuario.diasFuncionamento,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ message: "Erro ao atualizar perfil." });
  }
});

app.get("/servicos/:userId", async (req, res) => {
  try {
    const servicos = await Servico.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    return res.json(servicos);
  } catch (error) {
    console.error("Erro ao listar serviços:", error);
    return res.status(500).json({ message: "Erro ao listar serviços." });
  }
});

app.post("/servicos", async (req, res) => {
  try {
    const nome = String(req.body.nome || "").trim();
    const preco = Number(req.body.preco);
    const duracao = String(req.body.duracao || "").trim();
    const userId = req.body.userId;

    if (!nome || !userId || Number.isNaN(preco) || preco <= 0) {
      return res.status(400).json({ message: "Preencha nome, preço e usuário corretamente." });
    }

    const novoServico = await Servico.create({ nome, preco, duracao, userId });
    return res.status(201).json(novoServico);
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return res.status(500).json({ message: "Erro ao criar serviço." });
  }
});

app.delete("/servicos/:id", async (req, res) => {
  try {
    await Servico.findByIdAndDelete(req.params.id);
    return res.json({ message: "Serviço apagado." });
  } catch (error) {
    console.error("Erro ao apagar serviço:", error);
    return res.status(500).json({ message: "Erro ao apagar serviço." });
  }
});

app.get("/agendamentos/:userId", async (req, res) => {
  try {
    const agendamentos = await Agendamento.find({ userId: req.params.userId }).sort({
      data: 1,
      horario: 1,
      createdAt: -1,
    });
    return res.json(agendamentos);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return res.status(500).json({ message: "Erro ao listar agendamentos." });
  }
});

app.post("/agendamentos/painel", async (req, res) => {
  try {
    const { userId, cliente, telefone, servico, data, horario } = req.body;

    if (!userId || !cliente || !telefone || !servico || !data || !horario) {
      return res.status(400).json({ message: "Preencha todos os campos do agendamento." });
    }

    const conflito = await Agendamento.findOne({ userId, data, horario });
    if (conflito) {
      return res.status(400).json({ message: "Já existe agendamento nessa data e horário." });
    }

    const novoAgendamento = await Agendamento.create({
      userId,
      cliente,
      telefone,
      servico,
      data,
      horario,
      origem: "painel",
      vistoPeloBarbeiro: true,
    });

    return res.status(201).json(novoAgendamento);
  } catch (error) {
    console.error("Erro ao criar agendamento pelo painel:", error);
    return res.status(500).json({ message: "Erro ao criar agendamento." });
  }
});

app.delete("/agendamentos/:id", async (req, res) => {
  try {
    await Agendamento.findByIdAndDelete(req.params.id);
    return res.json({ message: "Agendamento apagado." });
  } catch (error) {
    console.error("Erro ao apagar agendamento:", error);
    return res.status(500).json({ message: "Erro ao apagar agendamento." });
  }
});

app.get("/notificacoes/:userId", async (req, res) => {
  try {
    const novos = await Agendamento.find({
      userId: req.params.userId,
      origem: "cliente",
      vistoPeloBarbeiro: false,
    }).sort({ createdAt: -1 });

    const notificacoes = novos.map((item) => ({
      _id: item._id,
      texto: `${item.cliente} agendou ${item.servico} às ${item.horario} do dia ${item.data}`,
    }));

    return res.json(notificacoes);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return res.status(500).json({ message: "Erro ao buscar notificações." });
  }
});

app.post("/notificacoes/marcar-como-vistas/:userId", async (req, res) => {
  try {
    await Agendamento.updateMany(
      {
        userId: req.params.userId,
        origem: "cliente",
        vistoPeloBarbeiro: false,
      },
      {
        $set: { vistoPeloBarbeiro: true },
      }
    );

    return res.json({ message: "Notificações marcadas como vistas." });
  } catch (error) {
    console.error("Erro ao marcar notificações:", error);
    return res.status(500).json({ message: "Erro ao atualizar notificações." });
  }
});

app.get("/public/barbearias/:slug", async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ slug: req.params.slug }).lean();
    if (!usuario) {
      return res.status(404).json({ message: "Barbearia não encontrada." });
    }

    const servicos = await Servico.find({ userId: usuario._id }).sort({ createdAt: -1 }).lean();

    return res.json({
      userId: usuario._id,
      nomeBarbearia: usuario.nomeBarbearia,
      logoBarbearia: usuario.logoBarbearia,
      whatsapp: usuario.whatsapp,
      slug: usuario.slug,
      abertura: usuario.abertura,
      fechamento: usuario.fechamento,
      diasFuncionamento: usuario.diasFuncionamento,
      servicos,
    });
  } catch (error) {
    console.error("Erro ao buscar página pública:", error);
    return res.status(500).json({ message: "Erro ao buscar página pública." });
  }
});

app.get("/public/horarios-ocupados", async (req, res) => {
  try {
    const { userId, data } = req.query;

    if (!userId || !data) {
      return res.status(400).json({ message: "userId e data são obrigatórios." });
    }

    const agendamentos = await Agendamento.find({ userId, data }).lean();
    return res.json(agendamentos.map((item) => item.horario));
  } catch (error) {
    console.error("Erro ao buscar horários ocupados:", error);
    return res.status(500).json({ message: "Erro ao buscar horários ocupados." });
  }
});

app.post("/public/agendar", async (req, res) => {
  try {
    const { userId, cliente, telefone, servico, data, horario } = req.body;

    if (!userId || !cliente || !telefone || !servico || !data || !horario) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }

    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      return res.status(404).json({ message: "Barbeiro não encontrado." });
    }

    const conflito = await Agendamento.findOne({ userId, data, horario });
    if (conflito) {
      return res.status(400).json({ message: "Esse horário já foi ocupado." });
    }

    const novoAgendamento = await Agendamento.create({
      userId,
      cliente: String(cliente).trim(),
      telefone: String(telefone).trim(),
      servico: String(servico).trim(),
      data: String(data).trim(),
      horario: String(horario).trim(),
      origem: "cliente",
      vistoPeloBarbeiro: false,
    });

    return res.status(201).json({
      message: "Agendamento realizado com sucesso.",
      agendamento: novoAgendamento,
      whatsapp: usuario.whatsapp,
      nomeBarbearia: usuario.nomeBarbearia,
    });
  } catch (error) {
    console.error("Erro no agendamento público:", error);
    return res.status(500).json({ message: "Erro ao realizar agendamento." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor PRO rodando em http://localhost:${PORT} 🚀`);
});