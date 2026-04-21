const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI não encontrada no .env");
  process.exit(1);
}

/* =========================
   CONEXÃO MONGODB
========================= */
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Mongo conectado (Atlas) ✅");
  })
  .catch((error) => {
    console.error("Erro ao conectar no Mongo:", error);
  });

/* =========================
   SCHEMAS
========================= */
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    senha: { type: String, required: true },
  },
  { timestamps: true }
);

const perfilSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    nomeBarbearia: { type: String, default: "Studio Barber" },
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

const servicoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    nome: { type: String, required: true, trim: true },
    preco: { type: Number, default: 0 },
    duracao: { type: String, default: "" },
  },
  { timestamps: true }
);

const agendamentoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    cliente: { type: String, required: true, trim: true },
    telefone: { type: String, default: "" },
    servico: { type: String, required: true, trim: true },
    data: { type: String, required: true },
    horario: { type: String, required: true },
  },
  { timestamps: true }
);

const notificacaoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    texto: { type: String, required: true },
    visto: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Perfil = mongoose.model("Perfil", perfilSchema);
const Servico = mongoose.model("Servico", servicoSchema);
const Agendamento = mongoose.model("Agendamento", agendamentoSchema);
const Notificacao = mongoose.model("Notificacao", notificacaoSchema);

/* =========================
   FUNÇÕES AUXILIARES
========================= */
function criarSlug(nome) {
  return String(nome || "studio-barber")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function gerarSlugUnico(nome, userId) {
  const base = criarSlug(nome) || `barbearia-${userId}`;
  let slugFinal = base;
  let contador = 1;

  while (true) {
    const existente = await Perfil.findOne({
      slug: slugFinal,
      userId: { $ne: String(userId) },
    });

    if (!existente) return slugFinal;

    contador += 1;
    slugFinal = `${base}-${contador}`;
  }
}

/* =========================
   HEALTH
========================= */
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Backend online" });
});

/* =========================
   AUTH
========================= */
app.post("/register", async (req, res) => {
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

    const novoUsuario = await User.create({
      email: emailLimpo,
      senha: String(senha),
    });

    await Perfil.create({
      userId: String(novoUsuario._id),
      nomeBarbearia: "Studio Barber",
      logoBarbearia: "",
      whatsapp: "",
      slug: await gerarSlugUnico("studio-barber", String(novoUsuario._id)),
      abertura: "09:00",
      fechamento: "19:00",
      diasFuncionamento: {
        segunda: true,
        terca: true,
        quarta: true,
        quinta: true,
        sexta: true,
        sabado: true,
        domingo: false,
      },
    });

    return res.status(201).json({
      message: "Conta criada com sucesso.",
      userId: novoUsuario._id,
      email: novoUsuario.email,
    });
  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    return res.status(500).json({ message: "Erro ao cadastrar." });
  }
});

app.post("/login", async (req, res) => {
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

    if (String(usuario.senha) !== String(senha)) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    return res.json({
      message: "Login realizado com sucesso.",
      userId: usuario._id,
      email: usuario.email,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ message: "Erro ao fazer login." });
  }
});

/* =========================
   PERFIL
========================= */
app.get("/perfil/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    let perfil = await Perfil.findOne({ userId: String(userId) });

    if (!perfil) {
      perfil = await Perfil.create({
        userId: String(userId),
        nomeBarbearia: "Studio Barber",
        logoBarbearia: "",
        whatsapp: "",
        slug: await gerarSlugUnico("studio-barber", String(userId)),
        abertura: "09:00",
        fechamento: "19:00",
        diasFuncionamento: {
          segunda: true,
          terca: true,
          quarta: true,
          quinta: true,
          sexta: true,
          sabado: true,
          domingo: false,
        },
      });
    }

    return res.json(perfil);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return res.status(500).json({ message: "Erro ao buscar perfil." });
  }
});

app.put("/perfil/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      nomeBarbearia,
      logoBarbearia,
      whatsapp,
      abertura,
      fechamento,
      diasFuncionamento,
    } = req.body;

    const slug = await gerarSlugUnico(nomeBarbearia || "studio-barber", userId);

    const perfil = await Perfil.findOneAndUpdate(
      { userId: String(userId) },
      {
        userId: String(userId),
        nomeBarbearia: nomeBarbearia || "Studio Barber",
        logoBarbearia: logoBarbearia || "",
        whatsapp: whatsapp || "",
        abertura: abertura || "09:00",
        fechamento: fechamento || "19:00",
        diasFuncionamento: diasFuncionamento || {
          segunda: true,
          terca: true,
          quarta: true,
          quinta: true,
          sexta: true,
          sabado: true,
          domingo: false,
        },
        slug,
      },
      { new: true, upsert: true }
    );

    return res.json({ message: "Perfil salvo com sucesso.", perfil });
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
    return res.status(500).json({ message: "Erro ao salvar perfil." });
  }
});

/* =========================
   SERVIÇOS
========================= */
app.get("/servicos/:userId", async (req, res) => {
  try {
    const servicos = await Servico.find({ userId: String(req.params.userId) }).sort({
      createdAt: -1,
    });
    return res.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return res.status(500).json({ message: "Erro ao buscar serviços." });
  }
});

app.post("/servicos", async (req, res) => {
  try {
    const { userId, nome, preco, duracao } = req.body;

    if (!userId || !nome) {
      return res.status(400).json({ message: "Preencha os dados do serviço." });
    }

    const novoServico = await Servico.create({
      userId: String(userId),
      nome: String(nome).trim(),
      preco: Number(preco || 0),
      duracao: duracao || "",
    });

    return res.status(201).json(novoServico);
  } catch (error) {
    console.error("Erro ao adicionar serviço:", error);
    return res.status(500).json({ message: "Erro ao adicionar serviço." });
  }
});

app.delete("/servicos/:id", async (req, res) => {
  try {
    await Servico.findByIdAndDelete(req.params.id);
    return res.json({ message: "Serviço apagado com sucesso." });
  } catch (error) {
    console.error("Erro ao apagar serviço:", error);
    return res.status(500).json({ message: "Erro ao apagar serviço." });
  }
});

/* =========================
   AGENDAMENTOS
========================= */
app.get("/agendamentos/:userId", async (req, res) => {
  try {
    const agendamentos = await Agendamento.find({
      userId: String(req.params.userId),
    }).sort({ createdAt: -1 });

    return res.json(agendamentos);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return res.status(500).json({ message: "Erro ao buscar agendamentos." });
  }
});

/* =========================
   NOTIFICAÇÕES
========================= */
app.get("/notificacoes/:userId", async (req, res) => {
  try {
    const notificacoes = await Notificacao.find({
      userId: String(req.params.userId),
      visto: false,
    }).sort({ createdAt: -1 });

    return res.json(notificacoes);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return res.status(500).json({ message: "Erro ao buscar notificações." });
  }
});

app.post("/notificacoes/marcar-como-vistas/:userId", async (req, res) => {
  try {
    await Notificacao.updateMany(
      { userId: String(req.params.userId), visto: false },
      { $set: { visto: true } }
    );

    return res.json({ message: "Notificações marcadas como vistas." });
  } catch (error) {
    console.error("Erro ao marcar notificações:", error);
    return res
      .status(500)
      .json({ message: "Erro ao marcar notificações." });
  }
});

/* =========================
   ROTAS PÚBLICAS
========================= */
app.get("/public/barbearias/:slug", async (req, res) => {
  try {
    const perfil = await Perfil.findOne({ slug: req.params.slug });

    if (!perfil) {
      return res.status(404).json({ message: "Barbearia não encontrada." });
    }

    const servicos = await Servico.find({ userId: String(perfil.userId) }).sort({
      createdAt: -1,
    });

    return res.json({
      userId: perfil.userId,
      nomeBarbearia: perfil.nomeBarbearia,
      logoBarbearia: perfil.logoBarbearia,
      whatsapp: perfil.whatsapp,
      abertura: perfil.abertura,
      fechamento: perfil.fechamento,
      diasFuncionamento: perfil.diasFuncionamento,
      servicos,
    });
  } catch (error) {
    console.error("Erro ao buscar barbearia pública:", error);
    return res
      .status(500)
      .json({ message: "Erro ao buscar barbearia pública." });
  }
});

app.get("/public/horarios-ocupados", async (req, res) => {
  try {
    const { userId, data } = req.query;

    if (!userId || !data) {
      return res.status(400).json({ message: "userId e data são obrigatórios." });
    }

    const agendamentos = await Agendamento.find({
      userId: String(userId),
      data: String(data),
    });

    const horarios = agendamentos.map((item) => item.horario);
    return res.json(horarios);
  } catch (error) {
    console.error("Erro ao buscar horários ocupados:", error);
    return res
      .status(500)
      .json({ message: "Erro ao buscar horários ocupados." });
  }
});

app.post("/public/agendar", async (req, res) => {
  try {
    const { userId, cliente, telefone, servico, data, horario } = req.body;

    if (!userId || !cliente || !servico || !data || !horario) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }

    const horarioExistente = await Agendamento.findOne({
      userId: String(userId),
      data: String(data),
      horario: String(horario),
    });

    if (horarioExistente) {
      return res.status(400).json({ message: "Esse horário já foi ocupado." });
    }

    const novoAgendamento = await Agendamento.create({
      userId: String(userId),
      cliente: String(cliente).trim(),
      telefone: telefone || "",
      servico: String(servico).trim(),
      data: String(data),
      horario: String(horario),
    });

    const perfil = await Perfil.findOne({ userId: String(userId) });

    await Notificacao.create({
      userId: String(userId),
      texto: `${cliente} agendou ${servico} para ${data} às ${horario}`,
      visto: false,
    });

    return res.status(201).json({
      message: "Agendamento realizado com sucesso.",
      agendamento: novoAgendamento,
      whatsapp: perfil?.whatsapp || "",
    });
  } catch (error) {
    console.error("Erro ao realizar agendamento:", error);
    return res.status(500).json({ message: "Erro ao realizar agendamento." });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`Servidor PRO rodando em http://localhost:${PORT} 🚀`);
});