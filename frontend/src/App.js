import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const backend = "https://studio-barber-backend.onrender.com";

const temaDark = {
  bg: "#020617",
  sidebar: "#020617",
  content: "#08111f",
  card: "#111827",
  input: "#0f172a",
  border: "#334155",
  text: "#ffffff",
  textSoft: "#94a3b8",
  primary: "#f59e0b",
  activeText: "#111827",
  shadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const diasPadrao = {
  segunda: true,
  terca: true,
  quarta: true,
  quinta: true,
  sexta: true,
  sabado: true,
  domingo: false,
};

export default function App() {
  const path = window.location.pathname;
  const partes = path.split("/").filter(Boolean);
  const paginaPublica = partes[0] === "agendar";
  const slugPublico = paginaPublica ? partes[1] : "";

  const [tela, setTela] = useState("home");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [perfil, setPerfil] = useState({
    nomeBarbearia: "Studio Barber",
    logoBarbearia: "",
    whatsapp: "",
    slug: "",
    abertura: "09:00",
    fechamento: "19:00",
    diasFuncionamento: diasPadrao,
  });

  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);

  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");

  const [nomeServico, setNomeServico] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");

  const [novoFuncionarioNome, setNovoFuncionarioNome] = useState("");
  const [novoFuncionarioCargo, setNovoFuncionarioCargo] = useState("");
  const [novoFuncionarioEspecialidade, setNovoFuncionarioEspecialidade] = useState("");
  const [novoFuncionarioWhatsapp, setNovoFuncionarioWhatsapp] = useState("");
  const [novoFuncionarioFoto, setNovoFuncionarioFoto] = useState("");

  const [agendamentoCliente, setAgendamentoCliente] = useState("");
  const [agendamentoServico, setAgendamentoServico] = useState("");
  const [agendamentoProfissional, setAgendamentoProfissional] = useState("");
  const [agendamentoData, setAgendamentoData] = useState("");
  const [agendamentoHorario, setAgendamentoHorario] = useState("");

  const theme = temaDark;

  useEffect(() => {
    const salvo = localStorage.getItem("usuario_studio_barber");
    if (!salvo) return;

    try {
      const user = JSON.parse(salvo);
      setUsuario(user);
      setTela("dashboard");
      carregarTudo(user.id);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const faturamento = useMemo(() => {
    return agendamentos.reduce((total, item) => {
      const servicoEncontrado = servicos.find((s) => s.nome === item.servico);
      return total + Number(servicoEncontrado?.preco || 0);
    }, 0);
  }, [agendamentos, servicos]);

  const totalClientes = clientes.length;
  const totalServicos = servicos.length;
  const totalFuncionarios = funcionarios.length;
  const totalAgendamentos = agendamentos.length;

  const linkPublico = perfil.slug
    ? `${window.location.origin}/agendar/${perfil.slug}`
    : "Salve a barbearia para gerar o link";

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

  function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function salvarLocal(chave, valor, userId = usuario?.id) {
    if (!userId) return;
    localStorage.setItem(`${chave}_${userId}`, JSON.stringify(valor));
  }

  function carregarLocais(userId) {
    try {
      const clientesSalvos = localStorage.getItem(`clientes_studio_barber_${userId}`);
      const funcionariosSalvos = localStorage.getItem(`funcionarios_studio_barber_${userId}`);

      if (clientesSalvos) setClientes(JSON.parse(clientesSalvos));
      if (funcionariosSalvos) setFuncionarios(JSON.parse(funcionariosSalvos));
    } catch (error) {
      console.error("Erro ao carregar dados locais:", error);
    }
  }

  async function carregarTudo(userId) {
    carregarLocais(userId);
    await Promise.all([
      carregarPerfil(userId),
      carregarServicosBackend(userId),
      carregarAgendamentosBackend(userId),
    ]);
  }

  async function carregarPerfil(userId) {
    try {
      const res = await axios.get(`${backend}/perfil/${userId}`, { timeout: 60000 });
      if (res.data) {
        setPerfil({
          nomeBarbearia: res.data.nomeBarbearia || "Studio Barber",
          logoBarbearia: res.data.logoBarbearia || "",
          whatsapp: res.data.whatsapp || "",
          slug: res.data.slug || "",
          abertura: res.data.abertura || "09:00",
          fechamento: res.data.fechamento || "19:00",
          diasFuncionamento: res.data.diasFuncionamento || diasPadrao,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  }

  async function carregarServicosBackend(userId) {
    try {
      const res = await axios.get(`${backend}/servicos/${userId}`, { timeout: 60000 });
      setServicos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      setServicos([]);
    }
  }

  async function carregarAgendamentosBackend(userId) {
    try {
      const res = await axios.get(`${backend}/agendamentos/${userId}`, { timeout: 60000 });
      setAgendamentos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      setAgendamentos([]);
    }
  }

  async function login() {
    if (!email.trim() || !senha.trim()) {
      alert("Preencha e-mail e senha.");
      return;
    }

    setCarregando(true);

    try {
      const res = await axios.post(
        `${backend}/login`,
        { email, senha },
        { timeout: 60000 }
      );

      const user = {
        id: res.data.userId,
        email,
      };

      localStorage.setItem("usuario_studio_barber", JSON.stringify(user));
      setUsuario(user);
      setTela("dashboard");
      await carregarTudo(user.id);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao entrar.");
    } finally {
      setCarregando(false);
    }
  }

  async function registrar() {
    if (!email.includes("@")) {
      alert("Digite um e-mail válido.");
      return;
    }

    if (senha.length < 4) {
      alert("Senha mínima de 4 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      await axios.post(
        `${backend}/register`,
        { email, senha },
        { timeout: 60000 }
      );

      alert("Conta criada com sucesso.");
      setTela("login");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao cadastrar conta.");
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    localStorage.removeItem("usuario_studio_barber");
    setUsuario(null);
    setTela("home");
    setEmail("");
    setSenha("");
  }

  function trocarConta() {
    localStorage.removeItem("usuario_studio_barber");
    setUsuario(null);
    setTela("login");
    setEmail("");
    setSenha("");
  }

  function aoTrocarLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPerfil((prev) => ({
        ...prev,
        logoBarbearia: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  }

  function aoTrocarFotoFuncionario(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNovoFuncionarioFoto(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function salvarPerfil() {
    if (!usuario?.id) return;

    try {
      const payload = {
        ...perfil,
        slug: gerarSlug(perfil.slug || perfil.nomeBarbearia),
      };

      const res = await axios.put(
        `${backend}/perfil/${usuario.id}`,
        payload,
        { timeout: 60000 }
      );

      const perfilSalvo = res.data?.perfil || payload;

      const novoPerfil = {
        nomeBarbearia: perfilSalvo.nomeBarbearia || "Studio Barber",
        logoBarbearia: perfilSalvo.logoBarbearia || "",
        whatsapp: perfilSalvo.whatsapp || "",
        slug: perfilSalvo.slug || "",
        abertura: perfilSalvo.abertura || "09:00",
        fechamento: perfilSalvo.fechamento || "19:00",
        diasFuncionamento: perfilSalvo.diasFuncionamento || diasPadrao,
      };

      setPerfil(novoPerfil);
      alert("Perfil salvo com sucesso.");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao salvar perfil.");
    }
  }

  function adicionarCliente() {
    if (!nomeCliente.trim() || !telefoneCliente.trim()) {
      alert("Preencha nome e telefone do cliente.");
      return;
    }

    const novo = {
      id: Date.now(),
      nome: nomeCliente.trim(),
      telefone: telefoneCliente.trim(),
    };

    const atualizados = [...clientes, novo];
    setClientes(atualizados);
    salvarLocal("clientes_studio_barber", atualizados);

    setNomeCliente("");
    setTelefoneCliente("");
  }

  function removerCliente(id) {
    const atualizados = clientes.filter((item) => item.id !== id);
    setClientes(atualizados);
    salvarLocal("clientes_studio_barber", atualizados);
  }

  async function adicionarServico() {
    if (!nomeServico.trim() || !preco.trim()) {
      alert("Preencha nome e preço do serviço.");
      return;
    }

    try {
      const res = await axios.post(
        `${backend}/servicos`,
        {
          nome: nomeServico.trim(),
          preco,
          duracao,
          userId: usuario.id,
        },
        { timeout: 60000 }
      );

      const atualizados = [...servicos, res.data];
      setServicos(atualizados);

      setNomeServico("");
      setPreco("");
      setDuracao("");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao adicionar serviço.");
    }
  }

  async function apagarServico(id) {
    try {
      await axios.delete(`${backend}/servicos/${id}`, { timeout: 60000 });
      setServicos((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao apagar serviço.");
    }
  }

  function adicionarFuncionario() {
    if (!novoFuncionarioNome.trim()) {
      alert("Digite o nome do funcionário.");
      return;
    }

    const novo = {
      id: Date.now(),
      nome: novoFuncionarioNome.trim(),
      cargo: novoFuncionarioCargo.trim(),
      especialidade: novoFuncionarioEspecialidade.trim(),
      whatsapp: novoFuncionarioWhatsapp.trim(),
      foto: novoFuncionarioFoto,
      ativo: true,
    };

    const atualizados = [...funcionarios, novo];
    setFuncionarios(atualizados);
    salvarLocal("funcionarios_studio_barber", atualizados);

    setNovoFuncionarioNome("");
    setNovoFuncionarioCargo("");
    setNovoFuncionarioEspecialidade("");
    setNovoFuncionarioWhatsapp("");
    setNovoFuncionarioFoto("");
  }

  function removerFuncionario(id) {
    const atualizados = funcionarios.filter((item) => item.id !== id);
    setFuncionarios(atualizados);
    salvarLocal("funcionarios_studio_barber", atualizados);
  }

  function toggleFuncionario(id) {
    const atualizados = funcionarios.map((item) =>
      item.id === id ? { ...item, ativo: !item.ativo } : item
    );

    setFuncionarios(atualizados);
    salvarLocal("funcionarios_studio_barber", atualizados);
  }

  async function adicionarAgendamentoInterno() {
    if (
      !agendamentoCliente ||
      !agendamentoServico ||
      !agendamentoData ||
      !agendamentoHorario
    ) {
      alert("Preencha todos os campos do agendamento.");
      return;
    }

    try {
      const res = await axios.post(
        `${backend}/public/agendar`,
        {
          userId: usuario.id,
          cliente: agendamentoCliente,
          telefone:
            clientes.find((c) => c.nome === agendamentoCliente)?.telefone || "",
          servico: agendamentoServico,
          data: agendamentoData,
          horario: agendamentoHorario,
        },
        { timeout: 60000 }
      );

      setAgendamentos((prev) => [res.data.agendamento, ...prev]);

      setAgendamentoCliente("");
      setAgendamentoServico("");
      setAgendamentoProfissional("");
      setAgendamentoData("");
      setAgendamentoHorario("");
      alert("Agendamento criado com sucesso.");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao criar agendamento.");
    }
  }

  function removerAgendamento(id) {
    const atualizados = agendamentos.filter((item) => item._id !== id && item.id !== id);
    setAgendamentos(atualizados);
  }

  if (paginaPublica && slugPublico) {
    return <PaginaPublica slug={slugPublico} />;
  }

  if (tela === "home") {
    return (
      <div style={styles.homeWrap}>
        <div style={styles.container}>
          <div style={styles.topoHome}>
            <h1 style={styles.logoTitulo}>Studio Barber</h1>

            <button onClick={() => setTela("login")} style={styles.botaoGoldInline}>
              Entrar no sistema
            </button>
          </div>

          <div style={styles.hero}>
            <h2 style={styles.heroTitulo}>
              O sistema premium para{" "}
              <span style={{ color: "#f59e0b" }}>barbearias modernas</span>
            </h2>

            <p style={styles.heroTexto}>
              Organize clientes, receba agendamentos, controle serviços e equipe,
              e use um link público profissional para seus clientes.
            </p>

            <div style={styles.heroBotoes}>
              <button onClick={() => setTela("login")} style={styles.botaoGoldInline}>
                Acessar sistema
              </button>

              <button onClick={() => setTela("login")} style={styles.botaoSecundarioInline}>
                Criar conta
              </button>
            </div>
          </div>

          <div style={styles.gridCards}>
            <div style={styles.cardHome}>
              <h3 style={styles.cardTitulo}>📅 Agenda inteligente</h3>
              <p style={styles.cardTexto}>Receba pedidos de agendamento pelo seu link público real.</p>
            </div>

            <div style={styles.cardHome}>
              <h3 style={styles.cardTitulo}>👥 Clientes</h3>
              <p style={styles.cardTexto}>Cadastre e organize seus clientes com facilidade.</p>
            </div>

            <div style={styles.cardHome}>
              <h3 style={styles.cardTitulo}>✂️ Serviços</h3>
              <p style={styles.cardTexto}>Defina preços e duração dos seus serviços.</p>
            </div>

            <div style={styles.cardHome}>
              <h3 style={styles.cardTitulo}>👨‍💼 Funcionários</h3>
              <p style={styles.cardTexto}>Gerencie equipe com foto, cargo e especialidade.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tela === "login") {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginCard}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            {perfil.logoBarbearia ? (
              <img
                src={perfil.logoBarbearia}
                alt="Logo"
                style={styles.loginLogo}
              />
            ) : (
              <div style={styles.loginLogoFake}>💈</div>
            )}

            <h1 style={styles.loginTitulo}>Entrar no sistema</h1>
            <p style={styles.loginTexto}>Faça login ou crie sua conta agora.</p>
          </div>

          <input
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle(theme)}
          />

          <div style={{ position: "relative" }}>
            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{ ...inputStyle(theme), paddingRight: "50px" }}
            />

            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={styles.botaoOlho}
            >
              {mostrarSenha ? "🙈" : "👁️"}
            </button>
          </div>

          <button onClick={login} style={styles.botaoGold}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <button
            onClick={registrar}
            style={{ ...styles.botaoSecundario, marginTop: "12px" }}
          >
            Criar conta
          </button>

          <button onClick={() => setTela("home")} style={styles.botaoVoltar}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.painelWrap}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTopo}>
          {perfil.logoBarbearia ? (
            <img src={perfil.logoBarbearia} alt="Logo" style={styles.logoImg} />
          ) : (
            <div style={styles.logoFake}>💈</div>
          )}

          <h2 style={styles.sidebarTitulo}>{perfil.nomeBarbearia}</h2>
          <p style={styles.sidebarEmail}>{usuario?.email}</p>
        </div>

        <button onClick={() => setTela("dashboard")} style={menuStyle(tela === "dashboard", theme)}>
          📊 Dashboard
        </button>
        <button onClick={() => setTela("clientes")} style={menuStyle(tela === "clientes", theme)}>
          👥 Clientes
        </button>
        <button onClick={() => setTela("servicos")} style={menuStyle(tela === "servicos", theme)}>
          ✂️ Serviços
        </button>
        <button onClick={() => setTela("funcionarios")} style={menuStyle(tela === "funcionarios", theme)}>
          👨‍💼 Funcionários
        </button>
        <button onClick={() => setTela("agendamentos")} style={menuStyle(tela === "agendamentos", theme)}>
          📅 Agendamentos
        </button>
        <button onClick={() => setTela("barbearia")} style={menuStyle(tela === "barbearia", theme)}>
          🏪 Barbearia
        </button>
        <button onClick={() => setTela("link")} style={menuStyle(tela === "link", theme)}>
          🔗 Link Cliente
        </button>

        <button onClick={trocarConta} style={styles.botaoTrocar}>
          Trocar conta
        </button>

        <button onClick={sair} style={styles.botaoDangerFull}>
          Sair
        </button>
      </aside>

      <main style={styles.main}>
        {tela === "dashboard" && (
          <>
            <h1 style={styles.mainTitulo}>Dashboard Premium 💈</h1>

            <div style={styles.gridResumo}>
              <div style={styles.cardResumo}>
                <p style={styles.cardResumoLabel}>💰 Faturamento</p>
                <h2 style={styles.cardResumoValor}>R$ {faturamento.toFixed(2)}</h2>
              </div>

              <div style={styles.cardResumo}>
                <p style={styles.cardResumoLabel}>👥 Clientes</p>
                <h2 style={styles.cardResumoValor}>{totalClientes}</h2>
              </div>

              <div style={styles.cardResumo}>
                <p style={styles.cardResumoLabel}>✂️ Serviços</p>
                <h2 style={styles.cardResumoValor}>{totalServicos}</h2>
              </div>

              <div style={styles.cardResumo}>
                <p style={styles.cardResumoLabel}>👨‍💼 Funcionários</p>
                <h2 style={styles.cardResumoValor}>{totalFuncionarios}</h2>
              </div>

              <div style={styles.cardResumo}>
                <p style={styles.cardResumoLabel}>📅 Agendamentos</p>
                <h2 style={styles.cardResumoValor}>{totalAgendamentos}</h2>
              </div>
            </div>

            <div style={styles.cardBloco}>
              <h2 style={styles.subtitulo}>Seu link público</h2>
              <div style={styles.linkBox}>{linkPublico}</div>
              <button onClick={() => navigator.clipboard.writeText(linkPublico)} style={styles.botaoGoldInline}>
                Copiar link do cliente
              </button>
            </div>
          </>
        )}

        {tela === "clientes" && (
          <>
            <h1 style={styles.mainTitulo}>Clientes</h1>

            <div style={styles.cardBloco}>
              <input
                placeholder="Nome do cliente"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                style={styles.input}
              />

              <input
                placeholder="Telefone do cliente"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(formatarTelefone(e.target.value))}
                style={styles.input}
              />

              <button onClick={adicionarCliente} style={styles.botaoGoldInline}>
                Adicionar cliente
              </button>
            </div>

            <div style={styles.gridLista}>
              {clientes.map((item) => (
                <div key={item.id} style={styles.cardItem}>
                  <h3 style={styles.itemTitulo}>{item.nome}</h3>
                  <p style={styles.itemTexto}>{item.telefone}</p>
                  <button onClick={() => removerCliente(item.id)} style={styles.botaoDangerInline}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "servicos" && (
          <>
            <h1 style={styles.mainTitulo}>Serviços</h1>

            <div style={styles.cardBloco}>
              <input
                placeholder="Nome do serviço"
                value={nomeServico}
                onChange={(e) => setNomeServico(e.target.value)}
                style={styles.input}
              />

              <input
                placeholder="Preço"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                style={styles.input}
              />

              <input
                placeholder="Duração ex: 45min"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                style={styles.input}
              />

              <button onClick={adicionarServico} style={styles.botaoGoldInline}>
                Adicionar serviço
              </button>
            </div>

            <div style={styles.gridLista}>
              {servicos.map((item) => (
                <div key={item._id} style={styles.cardItem}>
                  <h3 style={styles.itemTitulo}>{item.nome}</h3>
                  <p style={styles.itemTexto}>💰 R$ {item.preco}</p>
                  <p style={styles.itemTexto}>⏱️ {item.duracao || "Sem duração"}</p>
                  <button onClick={() => apagarServico(item._id)} style={styles.botaoDangerInline}>
                    Apagar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "funcionarios" && (
          <>
            <h1 style={styles.mainTitulo}>Funcionários</h1>

            <div style={styles.cardBloco}>
              <input
                placeholder="Nome"
                value={novoFuncionarioNome}
                onChange={(e) => setNovoFuncionarioNome(e.target.value)}
                style={styles.input}
              />

              <input
                placeholder="Cargo"
                value={novoFuncionarioCargo}
                onChange={(e) => setNovoFuncionarioCargo(e.target.value)}
                style={styles.input}
              />

              <input
                placeholder="Especialidade"
                value={novoFuncionarioEspecialidade}
                onChange={(e) => setNovoFuncionarioEspecialidade(e.target.value)}
                style={styles.input}
              />

              <input
                placeholder="WhatsApp"
                value={novoFuncionarioWhatsapp}
                onChange={(e) => setNovoFuncionarioWhatsapp(formatarTelefone(e.target.value))}
                style={styles.input}
              />

              <div style={{ marginBottom: "12px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={aoTrocarFotoFuncionario}
                  style={{ color: "#fff" }}
                />
              </div>

              <button onClick={adicionarFuncionario} style={styles.botaoGoldInline}>
                Adicionar funcionário
              </button>
            </div>

            <div style={styles.gridLista}>
              {funcionarios.map((item) => (
                <div key={item.id} style={styles.cardItem}>
                  {item.foto && <img src={item.foto} alt={item.nome} style={styles.funcionarioFoto} />}
                  <h3 style={styles.itemTitulo}>{item.nome}</h3>
                  <p style={styles.itemTexto}>{item.cargo}</p>
                  <p style={styles.itemTexto}>{item.especialidade}</p>
                  <p style={styles.itemTexto}>{item.whatsapp}</p>
                  <p style={{ ...styles.itemTexto, color: item.ativo ? "#22c55e" : "#ef4444" }}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </p>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={() => toggleFuncionario(item.id)} style={styles.botaoGoldInline}>
                      {item.ativo ? "Desativar" : "Ativar"}
                    </button>

                    <button onClick={() => removerFuncionario(item.id)} style={styles.botaoDangerInline}>
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "agendamentos" && (
          <>
            <h1 style={styles.mainTitulo}>Agendamentos</h1>

            <div style={styles.cardBloco}>
              <select
                value={agendamentoCliente}
                onChange={(e) => setAgendamentoCliente(e.target.value)}
                style={styles.input}
              >
                <option value="">Selecione o cliente</option>
                {clientes.map((item) => (
                  <option key={item.id} value={item.nome}>
                    {item.nome}
                  </option>
                ))}
              </select>

              <select
                value={agendamentoServico}
                onChange={(e) => setAgendamentoServico(e.target.value)}
                style={styles.input}
              >
                <option value="">Selecione o serviço</option>
                {servicos.map((item) => (
                  <option key={item._id} value={item.nome}>
                    {item.nome}
                  </option>
                ))}
              </select>

              <select
                value={agendamentoProfissional}
                onChange={(e) => setAgendamentoProfissional(e.target.value)}
                style={styles.input}
              >
                <option value="">Selecione o profissional</option>
                {funcionarios
                  .filter((item) => item.ativo)
                  .map((item) => (
                    <option key={item.id} value={item.nome}>
                      {item.nome}
                    </option>
                  ))}
              </select>

              <input
                type="date"
                value={agendamentoData}
                onChange={(e) => setAgendamentoData(e.target.value)}
                style={styles.input}
              />

              <input
                type="time"
                value={agendamentoHorario}
                onChange={(e) => setAgendamentoHorario(e.target.value)}
                style={styles.input}
              />

              <button onClick={adicionarAgendamentoInterno} style={styles.botaoGoldInline}>
                Adicionar agendamento
              </button>
            </div>

            <div style={styles.gridLista}>
              {agendamentos.map((item) => (
                <div key={item._id || item.id} style={styles.cardItem}>
                  <h3 style={styles.itemTitulo}>{item.cliente}</h3>
                  <p style={styles.itemTexto}>✂️ {item.servico}</p>
                  {item.profissional && <p style={styles.itemTexto}>👨‍💼 {item.profissional}</p>}
                  <p style={styles.itemTexto}>📅 {item.data}</p>
                  <p style={styles.itemTexto}>🕒 {item.horario}</p>

                  <button onClick={() => removerAgendamento(item._id || item.id)} style={styles.botaoDangerInline}>
                    Remover da tela
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "barbearia" && (
          <>
            <h1 style={styles.mainTitulo}>Configurações da Barbearia</h1>

            <div style={styles.cardBloco}>
              <input
                placeholder="Nome da barbearia"
                value={perfil.nomeBarbearia}
                onChange={(e) => setPerfil({ ...perfil, nomeBarbearia: e.target.value })}
                style={styles.input}
              />

              <input
                placeholder="WhatsApp"
                value={perfil.whatsapp}
                onChange={(e) => setPerfil({ ...perfil, whatsapp: e.target.value })}
                style={styles.input}
              />

              <input
                placeholder="Slug do link ex: studio-barber"
                value={perfil.slug}
                onChange={(e) => setPerfil({ ...perfil, slug: gerarSlug(e.target.value) })}
                style={styles.input}
              />

              <div style={styles.grid2}>
                <div>
                  <label style={styles.labelMini}>Abertura</label>
                  <input
                    type="time"
                    value={perfil.abertura}
                    onChange={(e) => setPerfil({ ...perfil, abertura: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.labelMini}>Fechamento</label>
                  <input
                    type="time"
                    value={perfil.fechamento}
                    onChange={(e) => setPerfil({ ...perfil, fechamento: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.cardDias}>
                {Object.keys(perfil.diasFuncionamento).map((dia) => (
                  <label key={dia} style={styles.diaItem}>
                    <input
                      type="checkbox"
                      checked={perfil.diasFuncionamento[dia]}
                      onChange={(e) =>
                        setPerfil({
                          ...perfil,
                          diasFuncionamento: {
                            ...perfil.diasFuncionamento,
                            [dia]: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>{capitalizar(dia)}</span>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: "12px" }}>
                <input type="file" accept="image/*" onChange={aoTrocarLogo} style={{ color: "#fff" }} />
              </div>

              <button onClick={salvarPerfil} style={styles.botaoGoldInline}>
                Salvar configurações
              </button>
            </div>
          </>
        )}

        {tela === "link" && (
          <>
            <h1 style={styles.mainTitulo}>Link do Cliente</h1>

            <div style={styles.cardBloco}>
              <p style={styles.itemTexto}>
                Esse é o link que você envia para o cliente agendar atendimento.
              </p>

              <div style={styles.linkBox}>{linkPublico}</div>

              <button onClick={() => navigator.clipboard.writeText(linkPublico)} style={styles.botaoGoldInline}>
                Copiar link
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PaginaPublica({ slug }) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [barbearia, setBarbearia] = useState(null);
  const [horariosOcupados, setHorariosOcupados] = useState([]);

  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  useEffect(() => {
    carregarBarbearia();
  }, [slug]);

  useEffect(() => {
    if (!barbearia?.userId || !data) return;
    carregarHorariosOcupados();
  }, [barbearia, data]);

  async function carregarBarbearia() {
    setCarregando(true);
    setErro("");

    try {
      const res = await axios.get(`${backend}/public/barbearias/${slug}`, {
        timeout: 60000,
      });

      setBarbearia(res.data);
    } catch (error) {
      setErro(error.response?.data?.message || "Erro ao carregar página da barbearia.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarHorariosOcupados() {
    try {
      const res = await axios.get(`${backend}/public/horarios-ocupados`, {
        params: {
          userId: barbearia.userId,
          data,
        },
        timeout: 60000,
      });

      setHorariosOcupados(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
  }

  function formatarTelefonePublico(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function diaDisponivel(dataEscolhida) {
    if (!barbearia?.diasFuncionamento || !dataEscolhida) return true;

    const dia = new Date(`${dataEscolhida}T12:00:00`).getDay();
    const mapa = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

    return Boolean(barbearia.diasFuncionamento[mapa[dia]]);
  }

  function gerarHorarios() {
    if (!barbearia?.abertura || !barbearia?.fechamento) return [];

    const [horaInicio, minutoInicio] = barbearia.abertura.split(":").map(Number);
    const [horaFim, minutoFim] = barbearia.fechamento.split(":").map(Number);

    let atual = horaInicio * 60 + minutoInicio;
    const fim = horaFim * 60 + minutoFim;
    const lista = [];

    while (atual < fim) {
      const h = String(Math.floor(atual / 60)).padStart(2, "0");
      const m = String(atual % 60).padStart(2, "0");
      lista.push(`${h}:${m}`);
      atual += 30;
    }

    return lista;
  }

  async function realizarAgendamento() {
    if (!cliente.trim() || !telefone.trim() || !servico || !data || !horario) {
      alert("Preencha todos os campos.");
      return;
    }

    if (!diaDisponivel(data)) {
      alert("A barbearia não atende nesse dia.");
      return;
    }

    if (horariosOcupados.includes(horario)) {
      alert("Esse horário já foi ocupado.");
      return;
    }

    try {
      const res = await axios.post(
        `${backend}/public/agendar`,
        {
          userId: barbearia.userId,
          cliente: cliente.trim(),
          telefone: telefone.trim(),
          servico,
          data,
          horario,
        },
        { timeout: 60000 }
      );

      const whatsapp = String(res.data?.whatsapp || "").replace(/\D/g, "");
      if (whatsapp) {
        const texto = encodeURIComponent(
          `Olá! Sou ${cliente.trim()} e acabei de agendar ${servico} para ${data} às ${horario}.`
        );
        window.open(`https://wa.me/${whatsapp}?text=${texto}`, "_blank");
      }

      alert("Agendamento realizado com sucesso.");

      setCliente("");
      setTelefone("");
      setServico("");
      setData("");
      setHorario("");
      setHorariosOcupados((prev) => [...prev, horario]);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao realizar agendamento.");
    }
  }

  if (carregando) {
    return (
      <div style={styles.publicWrap}>
        <div style={styles.publicContainer}>
          <div style={styles.publicCard}>
            <h1 style={styles.publicTitulo}>Carregando agenda...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (erro || !barbearia) {
    return (
      <div style={styles.publicWrap}>
        <div style={styles.publicContainer}>
          <div style={styles.publicCard}>
            <h1 style={styles.publicTitulo}>Studio Barber</h1>
            <p style={styles.publicSubtitulo}>{erro || "Barbearia não encontrada."}</p>
          </div>
        </div>
      </div>
    );
  }

  const horarios = gerarHorarios();

  return (
    <div style={styles.publicWrap}>
      <div style={styles.publicContainer}>
        <div style={styles.publicCard}>
          {barbearia.logoBarbearia ? (
            <img src={barbearia.logoBarbearia} alt="Logo" style={styles.publicLogoImg} />
          ) : (
            <div style={styles.publicLogo}>💈</div>
          )}

          <h1 style={styles.publicTitulo}>{barbearia.nomeBarbearia}</h1>
          <p style={styles.publicSubtitulo}>Agende seu horário com facilidade</p>

          <div style={styles.publicInfo}>
            <strong>Link:</strong> {slug}
          </div>

          <input
            placeholder="Seu nome"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Seu telefone"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefonePublico(e.target.value))}
            style={styles.input}
          />

          <select
            value={servico}
            onChange={(e) => setServico(e.target.value)}
            style={styles.input}
          >
            <option value="">Selecione o serviço</option>
            {(barbearia.servicos || []).map((item) => (
              <option key={item._id} value={item.nome}>
                {item.nome} - R$ {Number(item.preco || 0).toFixed(2)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={styles.input}
          />

          <select
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            style={styles.input}
          >
            <option value="">Selecione o horário</option>
            {horarios.map((h) => (
              <option key={h} value={h} disabled={horariosOcupados.includes(h)}>
                {h}{horariosOcupados.includes(h) ? " - ocupado" : ""}
              </option>
            ))}
          </select>

          <button onClick={realizarAgendamento} style={styles.publicBtn}>
            Confirmar agendamento
          </button>
        </div>
      </div>
    </div>
  );
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function menuStyle(ativo, theme) {
  return {
    width: "100%",
    textAlign: "left",
    background: ativo ? theme.primary : "transparent",
    color: ativo ? theme.activeText : theme.text,
    border: "none",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
    marginBottom: "10px",
  };
}

function inputStyle(theme) {
  return {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: `1px solid ${theme.border}`,
    marginBottom: "12px",
    background: theme.input,
    color: theme.text,
    boxSizing: "border-box",
    outline: "none",
  };
}

const styles = {
  homeWrap: {
    minHeight: "100vh",
    background: "#020617",
    color: "#fff",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  topoHome: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "60px",
    flexWrap: "wrap",
    gap: "16px",
  },
  logoTitulo: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "900",
    color: "#f59e0b",
  },
  hero: {
    textAlign: "center",
    marginBottom: "80px",
  },
  heroTitulo: {
    fontSize: "58px",
    lineHeight: "1.1",
    margin: 0,
    fontWeight: "900",
  },
  heroTexto: {
    maxWidth: "760px",
    margin: "24px auto",
    color: "#94a3b8",
    fontSize: "20px",
    lineHeight: "1.6",
  },
  heroBotoes: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  gridCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: "18px",
  },
  cardHome: {
    background: "#111827",
    padding: "24px",
    borderRadius: "18px",
    border: "1px solid #1f2937",
  },
  cardTitulo: {
    marginTop: 0,
    color: "#f59e0b",
    fontSize: "22px",
  },
  cardTexto: {
    color: "#94a3b8",
    marginBottom: 0,
    lineHeight: "1.6",
  },
  botaoGoldInline: {
    background: "#f59e0b",
    color: "#111827",
    border: "none",
    padding: "14px 24px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },
  botaoSecundarioInline: {
    background: "transparent",
    color: "#fff",
    border: "1px solid #334155",
    padding: "14px 24px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },
  loginWrap: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  loginCard: {
    width: "100%",
    maxWidth: "460px",
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "24px",
    padding: "34px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  loginLogo: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    objectFit: "cover",
  },
  loginLogoFake: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    background: "#f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    margin: "0 auto",
  },
  loginTitulo: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: "34px",
    marginTop: "18px",
    marginBottom: "10px",
  },
  loginTexto: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: "24px",
  },
  botaoOlho: {
    position: "absolute",
    right: "14px",
    top: "13px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
  },
  botaoGold: {
    width: "100%",
    background: "#f59e0b",
    color: "#111827",
    border: "none",
    padding: "16px",
    borderRadius: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  botaoSecundario: {
    width: "100%",
    background: "transparent",
    color: "#fff",
    border: "1px solid #334155",
    padding: "16px",
    borderRadius: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  botaoVoltar: {
    width: "100%",
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    padding: "12px",
    cursor: "pointer",
    marginTop: "10px",
  },
  painelWrap: {
    display: "flex",
    minHeight: "100vh",
    background: "#020617",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "270px",
    background: "#020617",
    borderRight: "1px solid #334155",
    padding: "24px",
  },
  sidebarTopo: {
    textAlign: "center",
    marginBottom: "26px",
  },
  logoImg: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    objectFit: "cover",
  },
  logoFake: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    background: "#f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    margin: "0 auto",
  },
  sidebarTitulo: {
    color: "#f59e0b",
    marginTop: "14px",
    marginBottom: "6px",
  },
  sidebarEmail: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  botaoTrocar: {
    width: "100%",
    marginTop: "24px",
    background: "#111827",
    color: "#fff",
    border: "1px solid #334155",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },
  botaoDangerFull: {
    width: "100%",
    marginTop: "10px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "30px",
    background: "#08111f",
  },
  mainTitulo: {
    color: "#ffffff",
    marginBottom: "24px",
  },
  gridResumo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  cardResumo: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "22px",
  },
  cardResumoLabel: {
    color: "#94a3b8",
    marginTop: 0,
  },
  cardResumoValor: {
    color: "#ffffff",
    marginBottom: 0,
  },
  cardBloco: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "22px",
    marginTop: "18px",
  },
  subtitulo: {
    color: "#ffffff",
    marginTop: 0,
  },
  linkBox: {
    padding: "14px",
    borderRadius: "12px",
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#fff",
    wordBreak: "break-all",
    margin: "14px 0",
  },
  gridLista: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: "18px",
    marginTop: "20px",
  },
  cardItem: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "22px",
  },
  itemTitulo: {
    color: "#ffffff",
    marginTop: 0,
  },
  itemTexto: {
    color: "#94a3b8",
  },
  botaoDangerInline: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "10px",
  },
  funcionarioFoto: {
    width: "70px",
    height: "70px",
    borderRadius: "16px",
    objectFit: "cover",
    marginBottom: "10px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  labelMini: {
    display: "block",
    color: "#94a3b8",
    marginBottom: "6px",
    fontSize: "14px",
  },
  cardDias: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
    gap: "10px",
    marginBottom: "14px",
    marginTop: "6px",
  },
  diaItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#fff",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "10px 12px",
  },
  publicWrap: {
    minHeight: "100vh",
    background: "#020617",
    color: "#fff",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  publicContainer: {
    maxWidth: "700px",
    margin: "0 auto",
    textAlign: "center",
  },
  publicCard: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "24px",
    padding: "32px",
  },
  publicLogo: {
    width: "80px",
    height: "80px",
    borderRadius: "20px",
    background: "#f59e0b",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    margin: "0 auto 18px",
  },
  publicLogoImg: {
    width: "86px",
    height: "86px",
    borderRadius: "20px",
    objectFit: "cover",
    margin: "0 auto 18px",
    display: "block",
  },
  publicTitulo: {
    color: "#f59e0b",
    fontSize: "42px",
    marginTop: 0,
    marginBottom: "8px",
  },
  publicSubtitulo: {
    color: "#94a3b8",
    marginBottom: "24px",
  },
  publicInfo: {
    color: "#cbd5e1",
    marginBottom: "24px",
  },
  publicBtn: {
    width: "100%",
    background: "#f59e0b",
    color: "#111827",
    border: "none",
    padding: "16px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "16px",
  },
};