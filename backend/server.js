const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI não definida no .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((error) => {
    console.error("❌ Erro ao conectar no MongoDB:", error);
    process.exit(1);
  });

/* =========================
   HELPERS
========================= */

function gerarSlug(nome) {
  return String(nome || "studio-barber")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function calcularValorPlano(plano) {
  if (plano === "Premium") return 99.9;
  if (plano === "Profissional") return 69.9;
  return 39.9;
}

/* =========================
   SCHEMAS
========================= */

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
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
    slug: { type: String, default: "" },
    abertura: { type: String, default: "09:00" },
    fechamento: { type: String, default: "19:00" },
    diasFuncionamento: {
      type: Object,
      default: {
        segunda: true,
        terca: true,
        quarta: true,
        quinta: true,
        sexta: true,
        sabado: true,
        domingo: false,
      },
    },
  },
  { timestamps: true }
);

const servicoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    nome: { type: String, required: true },
    preco: { type: Number, required: true, default: 0 },
    duracao: { type: String, default: "" },
  },
  { timestamps: true }
);

const agendamentoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    cliente: { type: String, required: true },
    telefone: { type: String, required: true },
    servico: { type: String, required: true },
    profissional: { type: String, default: "" },
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

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    senha: { type: String, required: true },
    nome: { type: String, default: "Administrador" },
  },
  { timestamps: true }
);

const assinaturaSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    plano: { type: String, default: "Básico" },
    status: { type: String, default: "ativo" }, // ativo | bloqueado
    vencimento: { type: String, default: "" },
    valor: { type: Number, default: 39.9 },
  },
  { timestamps: true }
);

/* =========================
   MODELS
========================= */

const User = mongoose.model("User", userSchema);
const Perfil = mongoose.model("Perfil", perfilSchema);
const Servico = mongoose.model("Servico", servicoSchema);
const Agendamento = mongoose.model("Agendamento", agendamentoSchema);
const Notificacao = mongoose.model("Notificacao", notificacaoSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Assinatura = mongoose.model("Assinatura", assinaturaSchema);

/* =========================
   FUNÇÕES INTERNAS
========================= */

async function criarPerfilPadraoSeNaoExistir(userId, email = "") {
  const perfilExistente = await Perfil.findOne({ userId: String(userId) });
  if (perfilExistente) return perfilExistente;

  const nomeBase = email ? email.split("@")[0] : "studio-barber";

  const perfil = await Perfil.create({
    userId: String(userId),
    nomeBarbearia: "Studio Barber",
    logoBarbearia: "",
    whatsapp: "",
    slug: gerarSlug(nomeBase),
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

  return perfil;
}

async function criarAssinaturaPadraoSeNaoExistir(userId) {
  const assinaturaExistente = await Assinatura.findOne({ userId: String(userId) });
  if (assinaturaExistente) return assinaturaExistente;

  const assinatura = await Assinatura.create({
    userId: String(userId),
    plano: "Básico",
    status: "ativo",
    vencimento: "",
    valor: calcularValorPlano("Básico"),
  });

  return assinatura;
}

/* =========================
   HEALTH
========================= */

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend online",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

/* =========================
   AUTH USUÁRIO
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
      return res.status(400).json({ message: "Esse email já está cadastrado." });
    }

    const user = await User.create({
      email: emailLimpo,
      senha: String(senha),
    });

    await criarPerfilPadraoSeNaoExistir(user._id, user.email);
    await criarAssinaturaPadraoSeNaoExistir(user._id);

    return res.status(201).json({
      message: "Conta criada com sucesso.",
      userId: String(user._id),
    });
  } catch (error) {
    console.error("Erro no register:", error);
    return res.status(500).json({ message: "Erro ao cadastrar usuário." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Preencha email e senha." });
    }

    const emailLimpo = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: emailLimpo });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (String(user.senha) !== String(senha)) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const assinatura = await criarAssinaturaPadraoSeNaoExistir(user._id);

    if (assinatura.status === "bloqueado") {
      return res.status(403).json({
        message: "Conta bloqueada. Entre em contato com o administrador.",
      });
    }

    await criarPerfilPadraoSeNaoExistir(user._id, user.email);

    return res.json({
      message: "Login realizado com sucesso.",
      userId: String(user._id),
    });
  } catch (error) {
    console.error("Erro no login:", error);
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
      const user = await User.findById(userId);
      perfil = await criarPerfilPadraoSeNaoExistir(userId, user?.email || "");
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
      slug,
      abertura,
      fechamento,
      diasFuncionamento,
    } = req.body;

    const perfil = await Perfil.findOneAndUpdate(
      { userId: String(userId) },
      {
        userId: String(userId),
        nomeBarbearia: nomeBarbearia || "Studio Barber",
        logoBarbearia: logoBarbearia || "",
        whatsapp: whatsapp || "",
        slug: gerarSlug(slug || nomeBarbearia || "studio-barber"),
        abertura: abertura || "09:00",
        fechamento: fechamento || "19:00",
        diasFuncionamento:
          diasFuncionamento || {
            segunda: true,
            terca: true,
            quarta: true,
            quinta: true,
            sexta: true,
            sabado: true,
            domingo: false,
          },
      },
      { new: true, upsert: true }
    );

    return res.json({
      message: "Perfil salvo com sucesso.",
      perfil,
    });
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
    const { userId } = req.params;
    const servicos = await Servico.find({ userId: String(userId) }).sort({ createdAt: -1 });
    return res.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return res.status(500).json({ message: "Erro ao buscar serviços." });
  }
});

app.post("/servicos", async (req, res) => {
  try {
    const { userId, nome, preco, duracao } = req.body;

    if (!userId || !nome || preco === undefined || preco === null || preco === "") {
      return res.status(400).json({ message: "Preencha userId, nome e preço." });
    }

    const servico = await Servico.create({
      userId: String(userId),
      nome: String(nome).trim(),
      preco: Number(preco),
      duracao: duracao || "",
    });

    return res.status(201).json(servico);
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return res.status(500).json({ message: "Erro ao criar serviço." });
  }
});

app.delete("/servicos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Servico.findByIdAndDelete(id);
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
    const { userId } = req.params;

    const agendamentos = await Agendamento.find({
      userId: String(userId),
    }).sort({ createdAt: -1 });

    return res.json(agendamentos);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return res.status(500).json({ message: "Erro ao buscar agendamentos." });
  }
});

/* =========================
   ROTAS PÚBLICAS
========================= */

app.get("/public/barbearias/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const perfil = await Perfil.findOne({
      slug: String(slug).trim().toLowerCase(),
    });

    if (!perfil) {
      return res.status(404).json({ message: "Barbearia não encontrada." });
    }

    const assinatura = await criarAssinaturaPadraoSeNaoExistir(perfil.userId);

    if (assinatura.status === "bloqueado") {
      return res.status(403).json({ message: "Barbearia temporariamente indisponível." });
    }

    const servicos = await Servico.find({
      userId: String(perfil.userId),
    }).sort({ createdAt: -1 });

    return res.json({
      userId: String(perfil.userId),
      nomeBarbearia: perfil.nomeBarbearia,
      logoBarbearia: perfil.logoBarbearia,
      whatsapp: perfil.whatsapp,
      slug: perfil.slug,
      abertura: perfil.abertura,
      fechamento: perfil.fechamento,
      diasFuncionamento: perfil.diasFuncionamento,
      servicos,
    });
  } catch (error) {
    console.error("Erro ao buscar barbearia pública:", error);
    return res.status(500).json({ message: "Erro ao carregar página pública." });
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
    return res.status(500).json({ message: "Erro ao buscar horários ocupados." });
  }
});

app.post("/public/agendar", async (req, res) => {
  try {
    const { userId, cliente, telefone, servico, data, horario, profissional } = req.body;

    if (!userId || !cliente || !telefone || !servico || !data || !horario) {
      return res.status(400).json({ message: "Preencha todos os campos do agendamento." });
    }

    const assinatura = await criarAssinaturaPadraoSeNaoExistir(userId);

    if (assinatura.status === "bloqueado") {
      return res.status(403).json({ message: "Essa barbearia está bloqueada no momento." });
    }

    const perfil = await Perfil.findOne({ userId: String(userId) });
    if (!perfil) {
      return res.status(404).json({ message: "Perfil da barbearia não encontrado." });
    }

    const jaExiste = await Agendamento.findOne({
      userId: String(userId),
      data: String(data),
      horario: String(horario),
    });

    if (jaExiste) {
      return res.status(400).json({ message: "Esse horário já foi ocupado." });
    }

    const agendamento = await Agendamento.create({
      userId: String(userId),
      cliente: String(cliente).trim(),
      telefone: String(telefone).trim(),
      servico: String(servico).trim(),
      profissional: profissional ? String(profissional).trim() : "",
      data: String(data),
      horario: String(horario),
    });

    await Notificacao.create({
      userId: String(userId),
      texto: `Novo agendamento de ${cliente} para ${servico} em ${data} às ${horario}.`,
      visto: false,
    });

    return res.status(201).json({
      message: "Agendamento realizado com sucesso.",
      agendamento,
      whatsapp: perfil.whatsapp || "",
    });
  } catch (error) {
    console.error("Erro ao realizar agendamento público:", error);
    return res.status(500).json({ message: "Erro ao realizar agendamento." });
  }
});

/* =========================
   NOTIFICAÇÕES
========================= */

app.get("/notificacoes/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const notificacoes = await Notificacao.find({
      userId: String(userId),
    }).sort({ createdAt: -1 });

    return res.json(notificacoes);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return res.status(500).json({ message: "Erro ao buscar notificações." });
  }
});

app.put("/notificacoes/marcar-vistas/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await Notificacao.updateMany(
      { userId: String(userId), visto: false },
      { $set: { visto: true } }
    );

    return res.json({ message: "Notificações marcadas como vistas." });
  } catch (error) {
    console.error("Erro ao marcar notificações:", error);
    return res.status(500).json({ message: "Erro ao marcar notificações." });
  }
});

/* =========================
   ADMIN MASTER
========================= */

app.post("/admin/setup", async (req, res) => {
  try {
    const { email, senha, nome } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    const emailLimpo = String(email).trim().toLowerCase();

    const existente = await Admin.findOne({ email: emailLimpo });
    if (existente) {
      return res.json({ message: "Admin já existe." });
    }

    const admin = await Admin.create({
      email: emailLimpo,
      senha: String(senha),
      nome: nome || "Administrador",
    });

    return res.status(201).json({
      message: "Admin criado com sucesso.",
      adminId: String(admin._id),
      email: admin.email,
      nome: admin.nome,
    });
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    return res.status(500).json({ message: "Erro ao criar admin." });
  }
});

app.post("/admin/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Preencha email e senha." });
    }

    const emailLimpo = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: emailLimpo });

    if (!admin) {
      return res.status(404).json({ message: "Admin não encontrado." });
    }

    if (String(admin.senha) !== String(senha)) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    return res.json({
      message: "Login admin realizado com sucesso.",
      adminId: String(admin._id),
      nome: admin.nome,
      email: admin.email,
    });
  } catch (error) {
    console.error("Erro no login admin:", error);
    return res.status(500).json({ message: "Erro no login admin." });
  }
});

app.get("/admin/barbearias", async (req, res) => {
  try {
    const usuarios = await User.find().sort({ createdAt: -1 });
    const perfis = await Perfil.find();
    const servicos = await Servico.find();
    const agendamentos = await Agendamento.find();
    const assinaturas = await Assinatura.find();

    const lista = usuarios.map((user) => {
      const perfil = perfis.find((p) => String(p.userId) === String(user._id));
      const assinatura = assinaturas.find((a) => String(a.userId) === String(user._id));
      const totalServicos = servicos.filter((s) => String(s.userId) === String(user._id)).length;
      const totalAgendamentos = agendamentos.filter((a) => String(a.userId) === String(user._id)).length;

      return {
        userId: String(user._id),
        email: user.email,
        nomeBarbearia: perfil?.nomeBarbearia || "Studio Barber",
        whatsapp: perfil?.whatsapp || "",
        slug: perfil?.slug || "",
        plano: assinatura?.plano || "Básico",
        status: assinatura?.status || "ativo",
        vencimento: assinatura?.vencimento || "",
        valor:
          assinatura?.valor ??
          calcularValorPlano(assinatura?.plano || "Básico"),
        totalServicos,
        totalAgendamentos,
        createdAt: user.createdAt,
      };
    });

    return res.json(lista);
  } catch (error) {
    console.error("Erro ao buscar barbearias admin:", error);
    return res.status(500).json({ message: "Erro ao buscar barbearias." });
  }
});

app.put("/admin/assinatura/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { plano, status, vencimento, valor } = req.body;

    const planoFinal = plano || "Básico";
    const valorFinal =
      valor !== undefined && valor !== null && valor !== ""
        ? Number(valor)
        : calcularValorPlano(planoFinal);

    const assinatura = await Assinatura.findOneAndUpdate(
      { userId: String(userId) },
      {
        userId: String(userId),
        plano: planoFinal,
        status: status || "ativo",
        vencimento: vencimento || "",
        valor: valorFinal,
      },
      { new: true, upsert: true }
    );

    return res.json({
      message: "Assinatura atualizada com sucesso.",
      assinatura,
    });
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return res.status(500).json({ message: "Erro ao atualizar assinatura." });
  }
});

app.delete("/admin/barbearias/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await Perfil.deleteOne({ userId: String(userId) });
    await Servico.deleteMany({ userId: String(userId) });
    await Agendamento.deleteMany({ userId: String(userId) });
    await Notificacao.deleteMany({ userId: String(userId) });
    await Assinatura.deleteOne({ userId: String(userId) });
    await User.findByIdAndDelete(userId);

    return res.json({ message: "Barbearia excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir barbearia:", error);
    return res.status(500).json({ message: "Erro ao excluir barbearia." });
  }
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});