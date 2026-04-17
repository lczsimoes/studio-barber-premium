import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const backend = "https://studio-barber.onrender.com";

const dark = {
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
  shadow: "0 8px 30px rgba(0,0,0,0.35)",
  soft: "#172033",
};

const light = {
  bg: "#f8fafc",
  sidebar: "#ffffff",
  content: "#f1f5f9",
  card: "#ffffff",
  input: "#ffffff",
  border: "#cbd5e1",
  text: "#0f172a",
  textSoft: "#64748b",
  primary: "#f59e0b",
  activeText: "#111827",
  shadow: "0 8px 30px rgba(0,0,0,0.08)",
  soft: "#f8fafc",
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
  const slug = paginaPublica ? partes[1] : "";

  if (paginaPublica && slug) {
    return <PaginaPublica slug={slug} />;
  }

  return <PainelBarbeiro />;
}

function PainelBarbeiro() {
  const [tela, setTela] = useState("home");
  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [temaEscuro, setTemaEscuro] = useState(true);
  const [menuHover, setMenuHover] = useState("");
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

  const [servicos, setServicos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);

  const [funcionarios, setFuncionarios] = useState([]);
  const [novoFuncionarioNome, setNovoFuncionarioNome] = useState("");
  const [novoFuncionarioCargo, setNovoFuncionarioCargo] = useState("");
  const [novoFuncionarioEspecialidade, setNovoFuncionarioEspecialidade] = useState("");
  const [novoFuncionarioWhatsapp, setNovoFuncionarioWhatsapp] = useState("");
  const [novoFuncionarioFoto, setNovoFuncionarioFoto] = useState("");

  const [nomeServico, setNomeServico] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario_barber");
    const temaSalvo = localStorage.getItem("tema_barber");

    if (temaSalvo !== null) {
      setTemaEscuro(JSON.parse(temaSalvo));
    }

    if (usuarioSalvo) {
      const user = JSON.parse(usuarioSalvo);
      setUsuario(user);
      setTela("dashboard");
    }
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;
    const funcionariosSalvos = localStorage.getItem(`funcionarios_barber_${usuario.id}`);
    if (funcionariosSalvos) {
      try {
        setFuncionarios(JSON.parse(funcionariosSalvos));
      } catch {
        setFuncionarios([]);
      }
    } else {
      setFuncionarios([]);
    }
  }, [usuario]);

  useEffect(() => {
    localStorage.setItem("tema_barber", JSON.stringify(temaEscuro));
  }, [temaEscuro]);

  useEffect(() => {
    if (!usuario?.id) return;
    localStorage.setItem(`funcionarios_barber_${usuario.id}`, JSON.stringify(funcionarios));
  }, [funcionarios, usuario]);

  useEffect(() => {
    if (!usuario?.id) return;
    carregarTudo(usuario.id);
  }, [usuario]);

  useEffect(() => {
    if (!usuario?.id) return;

    const intervalo = setInterval(() => {
      carregarNotificacoes(usuario.id);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [usuario]);

  const theme = temaEscuro ? dark : light;

  const linkPublico = perfil.slug
    ? `${window.location.origin}/agendar/${perfil.slug}`
    : "Salve os dados da barbearia para gerar o link";

  const logoPreview = perfil.logoBarbearia ? (
    <img src={perfil.logoBarbearia} alt="Logo" style={styles.logoImage} />
  ) : (
    <div style={{ ...styles.logoFallback, background: theme.primary }}>💈</div>
  );

  const faturamento = useMemo(() => {
    return agendamentos.reduce((total, item) => {
      const servico = servicos.find((s) => s.nome === item.servico);
      return total + (servico ? Number(servico.preco) : 0);
    }, 0);
  }, [agendamentos, servicos]);

  const ultimosAgendamentos = useMemo(() => {
    return [...agendamentos]
      .sort((a, b) => `${b.data} ${b.horario}`.localeCompare(`${a.data} ${a.horario}`))
      .slice(0, 5);
  }, [agendamentos]);

  async function carregarTudo(userId) {
    setCarregando(true);

    try {
      const [perfilRes, servicosRes, agendamentosRes, notificacoesRes] = await Promise.all([
        axios.get(`${backend}/perfil/${userId}`, { timeout: 10000 }),
        axios.get(`${backend}/servicos/${userId}`, { timeout: 10000 }),
        axios.get(`${backend}/agendamentos/${userId}`, { timeout: 10000 }),
        axios.get(`${backend}/notificacoes/${userId}`, { timeout: 10000 }),
      ]);

      setPerfil({
        nomeBarbearia: perfilRes.data.nomeBarbearia || "Studio Barber",
        logoBarbearia: perfilRes.data.logoBarbearia || "",
        whatsapp: perfilRes.data.whatsapp || "",
        slug: perfilRes.data.slug || "",
        abertura: perfilRes.data.abertura || "09:00",
        fechamento: perfilRes.data.fechamento || "19:00",
        diasFuncionamento: perfilRes.data.diasFuncionamento || diasPadrao,
      });

      setServicos(Array.isArray(servicosRes.data) ? servicosRes.data : []);
      setAgendamentos(Array.isArray(agendamentosRes.data) ? agendamentosRes.data : []);
      setNotificacoes(Array.isArray(notificacoesRes.data) ? notificacoesRes.data : []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados do sistema.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarNotificacoes(userId) {
    try {
      const res = await axios.get(`${backend}/notificacoes/${userId}`, { timeout: 10000 });
      setNotificacoes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  }

  async function registrar() {
    if (!email.trim() || !senha.trim()) {
      alert("Preencha email e senha.");
      return;
    }

    try {
      await axios.post(`${backend}/register`, { email, senha }, { timeout: 10000 });
      alert("Conta criada. Agora faça login.");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao cadastrar.");
    }
  }

  async function login() {
    if (!email.trim() || !senha.trim()) {
      alert("Preencha email e senha.");
      return;
    }

    try {
      const res = await axios.post(`${backend}/login`, { email, senha }, { timeout: 10000 });
      const user = {
        id: res.data.userId,
        email: res.data.email,
      };
      localStorage.setItem("usuario_barber", JSON.stringify(user));
      setUsuario(user);
      setTela("dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Erro no login.");
    }
  }

  function sair() {
    localStorage.removeItem("usuario_barber");
    setUsuario(null);
    setEmail("");
    setSenha("");
    setTela("home");
    setServicos([]);
    setAgendamentos([]);
    setNotificacoes([]);
    setFuncionarios([]);
  }

  function trocarConta() {
    localStorage.removeItem("usuario_barber");
    setUsuario(null);
    setEmail("");
    setSenha("");
    setTela("login");
    setServicos([]);
    setAgendamentos([]);
    setNotificacoes([]);
    setFuncionarios([]);
  }

  function aoTrocarLogo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onloadend = () => {
      setPerfil((prev) => ({ ...prev, logoBarbearia: leitor.result }));
    };
    leitor.readAsDataURL(arquivo);
  }

  function aoTrocarFotoFuncionario(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onloadend = () => {
      setNovoFuncionarioFoto(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  }

  function toggleDiaFuncionamento(dia) {
    setPerfil((prev) => ({
      ...prev,
      diasFuncionamento: {
        ...prev.diasFuncionamento,
        [dia]: !prev.diasFuncionamento[dia],
      },
    }));
  }

  async function salvarPerfil() {
    if (!usuario?.id) return;

    try {
      const res = await axios.put(
        `${backend}/perfil/${usuario.id}`,
        {
          nomeBarbearia: perfil.nomeBarbearia,
          logoBarbearia: perfil.logoBarbearia,
          whatsapp: perfil.whatsapp,
          abertura: perfil.abertura,
          fechamento: perfil.fechamento,
          diasFuncionamento: perfil.diasFuncionamento,
        },
        { timeout: 10000 }
      );

      setPerfil((prev) => ({ ...prev, ...res.data.perfil }));
      alert("Dados da barbearia salvos com sucesso.");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao salvar perfil.");
    }
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
          preco: Number(preco),
          duracao: duracao.trim(),
          userId: usuario.id,
        },
        { timeout: 10000 }
      );

      setServicos((prev) => [res.data, ...prev]);
      setNomeServico("");
      setPreco("");
      setDuracao("");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao adicionar serviço.");
    }
  }

  async function apagarServico(id) {
    const confirmar = window.confirm("Deseja apagar este serviço?");
    if (!confirmar) return;

    try {
      await axios.delete(`${backend}/servicos/${id}`, { timeout: 10000 });
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

    setFuncionarios((prev) => [novo, ...prev]);
    setNovoFuncionarioNome("");
    setNovoFuncionarioCargo("");
    setNovoFuncionarioEspecialidade("");
    setNovoFuncionarioWhatsapp("");
    setNovoFuncionarioFoto("");
  }

  function removerFuncionario(id) {
    const confirmar = window.confirm("Deseja remover este funcionário?");
    if (!confirmar) return;
    setFuncionarios((prev) => prev.filter((item) => item.id !== id));
  }

  function toggleFuncionario(id) {
    setFuncionarios((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ativo: !item.ativo } : item
      )
    );
  }

  async function marcarNotificacoesComoVistas() {
    if (!usuario?.id || notificacoes.length === 0) return;

    try {
      await axios.post(
        `${backend}/notificacoes/marcar-como-vistas/${usuario.id}`,
        {},
        { timeout: 10000 }
      );
      setNotificacoes([]);
      carregarTudo(usuario.id);
    } catch (error) {
      console.error(error);
    }
  }

  function copiarLinkPublico() {
    if (!perfil.slug) {
      alert("Salve os dados da barbearia primeiro.");
      return;
    }

    navigator.clipboard.writeText(linkPublico);
    alert("Link copiado com sucesso.");
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

  if (tela === "home") {
    return (
      <div style={{ ...styles.heroPage, background: theme.bg }}>
        <div style={styles.heroGlow(theme)} />
        <div style={styles.heroGlowSmall(theme)} />

        <div style={styles.heroTop}>
          <div style={styles.brandWrap}>
            {logoPreview}
            <h2 style={{ ...styles.heroBrand, color: theme.text }}>{perfil.nomeBarbearia}</h2>
          </div>

          <button style={{ ...styles.topLoginBtn, background: theme.primary }} onClick={() => setTela("login")}>
            Entrar
          </button>
        </div>

        <div style={styles.heroContent}>
          <div style={{ ...styles.badge, background: theme.card, color: theme.textSoft, borderColor: theme.border }}>
            Sistema premium para barbearias com link de agendamento
          </div>

          <h1 style={{ ...styles.heroTitle, color: theme.text }}>
            Venda sua agenda online com um <span style={{ color: theme.primary }}>link próprio</span>
          </h1>

          <p style={{ ...styles.heroDescription, color: theme.textSoft }}>
            O cliente agenda sozinho, o pedido cai automático no painel, o barbeiro recebe notificação e o WhatsApp vira seu canal de fechamento.
          </p>

          <div style={styles.heroActions}>
            <button style={{ ...styles.heroPrimaryBtn, background: theme.primary }} onClick={() => setTela("login")}>
              Acessar sistema
            </button>
            <button
              style={{ ...styles.heroSecondaryBtn, color: theme.text, borderColor: theme.border, background: theme.card }}
              onClick={() => setTela("login")}
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tela === "login") {
    return (
      <div style={{ ...styles.loginPageWrap, background: theme.bg }}>
        <div style={styles.heroGlow(theme)} />

        <div
          style={{
            ...styles.loginModernCard,
            background: theme.card,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={styles.loginHeader}>
            <div style={styles.loginLogoWrap}>{logoPreview}</div>
            <div style={{ ...styles.badge, background: theme.soft, color: theme.textSoft, borderColor: theme.border }}>
              Acesso seguro
            </div>
            <h1 style={{ ...styles.loginModernTitle, color: theme.text }}>Entrar no sistema</h1>
            <p style={{ ...styles.loginModernText, color: theme.textSoft }}>
              Faça login ou crie sua conta.
            </p>
          </div>

          <div style={styles.loginForm}>
            <input
              style={{ ...styles.loginInput, background: theme.input, color: theme.text, borderColor: theme.border }}
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div style={styles.senhaWrap}>
              <input
                style={{
                  ...styles.loginInput,
                  ...styles.senhaInput,
                  background: theme.input,
                  color: theme.text,
                  borderColor: theme.border,
                }}
                type={mostrarSenha ? "text" : "password"}
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                style={{ ...styles.olhoBtn, color: theme.textSoft }}
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
              >
                {mostrarSenha ? "🙈" : "👁️"}
              </button>
            </div>

            <button style={{ ...styles.heroPrimaryBtn, background: theme.primary }} onClick={login}>
              Entrar
            </button>
            <button
              style={{ ...styles.heroSecondaryBtn, color: theme.text, borderColor: theme.border, background: theme.card }}
              onClick={registrar}
            >
              Criar nova conta
            </button>
            <button style={{ ...styles.backBtn, color: theme.textSoft }} onClick={() => setTela("home")}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.app, background: theme.bg }}>
      <aside style={{ ...styles.sidebar, background: theme.sidebar, borderRight: `1px solid ${theme.border}` }}>
        <div style={styles.sidebarBrand}>
          {logoPreview}
          <div>
            <h2 style={{ color: theme.primary, margin: 0 }}>{perfil.nomeBarbearia}</h2>
            <p style={{ margin: "4px 0 0 0", color: theme.textSoft, fontSize: 12 }}>{usuario?.email}</p>
          </div>
        </div>

        <button
          style={getMenuStyle(theme, tela, menuHover, "dashboard")}
          onMouseEnter={() => setMenuHover("dashboard")}
          onMouseLeave={() => setMenuHover("")}
          onClick={() => setTela("dashboard")}
        >
          📊 Dashboard
        </button>

        <button
          style={getMenuStyle(theme, tela, menuHover, "servicos")}
          onMouseEnter={() => setMenuHover("servicos")}
          onMouseLeave={() => setMenuHover("")}
          onClick={() => setTela("servicos")}
        >
          ✂️ Serviços
        </button>

        <button
          style={getMenuStyle(theme, tela, menuHover, "funcionarios")}
          onMouseEnter={() => setMenuHover("funcionarios")}
          onMouseLeave={() => setMenuHover("")}
          onClick={() => setTela("funcionarios")}
        >
          👨‍💼 Funcionários
        </button>

        <button
          style={getMenuStyle(theme, tela, menuHover, "barbearia")}
          onMouseEnter={() => setMenuHover("barbearia")}
          onMouseLeave={() => setMenuHover("")}
          onClick={() => setTela("barbearia")}
        >
          🏪 Barbearia
        </button>

        <button
          style={getMenuStyle(theme, tela, menuHover, "link-publico")}
          onMouseEnter={() => setMenuHover("link-publico")}
          onMouseLeave={() => setMenuHover("")}
          onClick={() => setTela("link-publico")}
        >
          🔗 Link do cliente
        </button>

        <div style={styles.sidebarBottom}>
          <button
            style={{ ...styles.themeBtn, color: theme.text, borderColor: theme.border, background: theme.card }}
            onClick={() => setTemaEscuro(!temaEscuro)}
          >
            {temaEscuro ? "☀️ Modo claro" : "🌙 Modo escuro"}
          </button>

          <button
            style={{ ...styles.secondaryBtn, marginTop: 10, borderColor: theme.border, color: theme.text, background: theme.card }}
            onClick={trocarConta}
          >
            Trocar conta
          </button>

          <button style={{ ...styles.mainBtn, marginTop: 10 }} onClick={sair}>
            Sair
          </button>
        </div>
      </aside>

      <main style={{ ...styles.content, background: theme.content }}>
        {carregando && (
          <div style={{ ...styles.loadingBox, background: theme.card, color: theme.text }}>
            Carregando...
          </div>
        )}

        {notificacoes.length > 0 && (
          <div style={{ ...styles.notificationBanner, background: theme.primary, color: "#111827" }}>
            <div>
              <strong>🔔 Novos agendamentos</strong>
              {notificacoes.map((item) => (
                <div key={item._id} style={{ marginTop: 6 }}>
                  {item.texto}
                </div>
              ))}
            </div>
            <button style={styles.notificationButton} onClick={marcarNotificacoesComoVistas}>
              Marcar como visto
            </button>
          </div>
        )}

        {tela === "dashboard" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: 22 }}>Dashboard Premium 💈</h1>

            <div style={styles.dashboardGrid}>
              <CardInfo theme={theme} titulo="💰 Faturamento" valor={`R$ ${faturamento}`} />
              <CardInfo theme={theme} titulo="✂️ Serviços" valor={servicos.length} />
              <CardInfo theme={theme} titulo="👨‍💼 Funcionários" valor={funcionarios.length} />
              <CardInfo theme={theme} titulo="🔔 Novos avisos" valor={notificacoes.length} />
            </div>

            <div style={styles.dashboardColumns}>
              <div style={{ ...styles.premiumPanel, background: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
                <h2 style={{ color: theme.text, marginTop: 0 }}>Resumo da operação</h2>
                <p style={{ color: theme.textSoft, lineHeight: 1.7 }}>
                  Seu painel foi pensado para uma barbearia premium. O cliente agenda sozinho pelo link, você recebe a notificação, organiza serviços, funcionários e mantém sua marca forte.
                </p>

                <div style={{ marginTop: 18 }}>
                  {ultimosAgendamentos.length === 0 ? (
                    <p style={{ color: theme.textSoft }}>Nenhum agendamento recebido ainda.</p>
                  ) : (
                    ultimosAgendamentos.map((item) => (
                      <div key={item._id} style={{ ...styles.smallRow, borderBottom: `1px solid ${theme.border}` }}>
                        <div>
                          <strong style={{ color: theme.text }}>{item.cliente}</strong>
                          <div style={{ color: theme.textSoft, fontSize: 13 }}>
                            {item.servico} • {item.data} • {item.horario}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ ...styles.premiumPanel, background: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
                <h2 style={{ color: theme.text, marginTop: 0 }}>Link público</h2>
                <div style={{ ...styles.linkBox, background: theme.input, border: `1px solid ${theme.border}`, color: theme.text }}>
                  {linkPublico}
                </div>
                <button style={{ ...styles.mainBtn, marginTop: 14 }} onClick={copiarLinkPublico}>
                  Copiar link do cliente
                </button>
              </div>
            </div>
          </>
        )}

        {tela === "servicos" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: 22 }}>Serviços</h1>

            <div
              style={{
                ...styles.formCard,
                maxWidth: "100%",
                background: theme.card,
                boxShadow: theme.shadow,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={styles.gridTwo}>
                <input
                  style={inputStyle(theme)}
                  placeholder="Nome do serviço"
                  value={nomeServico}
                  onChange={(e) => setNomeServico(e.target.value)}
                />
                <input
                  style={inputStyle(theme)}
                  placeholder="Preço"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                />
              </div>

              <input
                style={inputStyle(theme)}
                placeholder="Duração ex: 45min"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
              />

              <button style={styles.mainBtn} onClick={adicionarServico}>
                Adicionar serviço
              </button>
            </div>

            <div style={styles.cardsGrid}>
              {servicos.map((item) => (
                <div
                  key={item._id}
                  style={{
                    ...styles.serviceCard,
                    background: theme.card,
                    boxShadow: theme.shadow,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <h3 style={{ color: theme.text, marginTop: 0 }}>{item.nome}</h3>
                  <p style={{ color: theme.textSoft }}>R$ {item.preco}</p>
                  <p style={{ color: theme.textSoft }}>{item.duracao || "Sem duração definida"}</p>
                  <button style={styles.deleteBtn} onClick={() => apagarServico(item._id)}>
                    Apagar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "funcionarios" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: 22 }}>Funcionários</h1>

            <div
              style={{
                ...styles.formCard,
                maxWidth: "100%",
                background: theme.card,
                boxShadow: theme.shadow,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={styles.gridTwo}>
                <input
                  style={inputStyle(theme)}
                  placeholder="Nome do funcionário"
                  value={novoFuncionarioNome}
                  onChange={(e) => setNovoFuncionarioNome(e.target.value)}
                />
                <input
                  style={inputStyle(theme)}
                  placeholder="Cargo ex: Barbeiro"
                  value={novoFuncionarioCargo}
                  onChange={(e) => setNovoFuncionarioCargo(e.target.value)}
                />
              </div>

              <div style={styles.gridTwo}>
                <input
                  style={inputStyle(theme)}
                  placeholder="Especialidade"
                  value={novoFuncionarioEspecialidade}
                  onChange={(e) => setNovoFuncionarioEspecialidade(e.target.value)}
                />
                <input
                  style={inputStyle(theme)}
                  placeholder="WhatsApp"
                  value={novoFuncionarioWhatsapp}
                  onChange={(e) => setNovoFuncionarioWhatsapp(formatarTelefone(e.target.value))}
                />
              </div>

              <div style={styles.funcionarioUploadArea}>
                <label style={styles.uploadLabel}>
                  Escolher foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={aoTrocarFotoFuncionario}
                    style={{ display: "none" }}
                  />
                </label>

                {novoFuncionarioFoto && (
                  <img src={novoFuncionarioFoto} alt="Preview" style={styles.funcionarioPreview} />
                )}
              </div>

              <button style={styles.mainBtn} onClick={adicionarFuncionario}>
                Adicionar funcionário
              </button>
            </div>

            <div style={styles.cardsGrid}>
              {funcionarios.map((item) => (
                <div
                  key={item.id}
                  style={{
                    ...styles.funcionarioCard,
                    background: theme.card,
                    boxShadow: theme.shadow,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div style={styles.funcionarioHeader}>
                    {item.foto ? (
                      <img src={item.foto} alt={item.nome} style={styles.funcionarioFoto} />
                    ) : (
                      <div style={{ ...styles.funcionarioFotoFallback, background: theme.primary }}>👨‍💼</div>
                    )}

                    <div>
                      <h3 style={{ color: theme.text, margin: 0 }}>{item.nome}</h3>
                      <p style={{ color: theme.textSoft, margin: "6px 0 0 0" }}>
                        {item.cargo || "Sem cargo"}
                      </p>
                    </div>
                  </div>

                  <div style={styles.funcionarioInfos}>
                    <p style={{ color: theme.textSoft }}>
                      <strong style={{ color: theme.text }}>Especialidade:</strong>{" "}
                      {item.especialidade || "Não definida"}
                    </p>
                    <p style={{ color: theme.textSoft }}>
                      <strong style={{ color: theme.text }}>WhatsApp:</strong>{" "}
                      {item.whatsapp || "Não informado"}
                    </p>
                    <p style={{ color: theme.textSoft }}>
                      <strong style={{ color: theme.text }}>Status:</strong>{" "}
                      {item.ativo ? "Ativo" : "Inativo"}
                    </p>
                  </div>

                  <div style={styles.funcionarioActions}>
                    <button style={styles.secondaryBtn} onClick={() => toggleFuncionario(item.id)}>
                      {item.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button style={styles.deleteBtn} onClick={() => removerFuncionario(item.id)}>
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "barbearia" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: 24 }}>Configurações Profissionais</h1>

            <div style={styles.configPremiumGrid}>
              <div
                style={{
                  ...styles.formCard,
                  maxWidth: "100%",
                  background: theme.card,
                  boxShadow: theme.shadow,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <label style={{ ...styles.label, color: theme.textSoft }}>Nome da barbearia</label>
                <input
                  style={inputStyle(theme)}
                  value={perfil.nomeBarbearia}
                  onChange={(e) =>
                    setPerfil((prev) => ({
                      ...prev,
                      nomeBarbearia: e.target.value,
                    }))
                  }
                />

                <label style={{ ...styles.label, color: theme.textSoft }}>WhatsApp da barbearia</label>
                <input
                  style={inputStyle(theme)}
                  value={perfil.whatsapp}
                  onChange={(e) =>
                    setPerfil((prev) => ({
                      ...prev,
                      whatsapp: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="47999998888"
                />

                <div style={styles.gridTwo}>
                  <div>
                    <label style={{ ...styles.label, color: theme.textSoft }}>Abertura</label>
                    <input
                      style={inputStyle(theme)}
                      type="time"
                      value={perfil.abertura}
                      onChange={(e) =>
                        setPerfil((prev) => ({
                          ...prev,
                          abertura: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label style={{ ...styles.label, color: theme.textSoft }}>Fechamento</label>
                    <input
                      style={inputStyle(theme)}
                      type="time"
                      value={perfil.fechamento}
                      onChange={(e) =>
                        setPerfil((prev) => ({
                          ...prev,
                          fechamento: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <label style={{ ...styles.label, color: theme.textSoft }}>Dias de funcionamento</label>
                <div style={styles.diasWrap}>
                  {[
                    ["segunda", "Segunda"],
                    ["terca", "Terça"],
                    ["quarta", "Quarta"],
                    ["quinta", "Quinta"],
                    ["sexta", "Sexta"],
                    ["sabado", "Sábado"],
                    ["domingo", "Domingo"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      style={{
                        ...styles.diaBtn,
                        background: perfil.diasFuncionamento[key] ? theme.primary : theme.input,
                        color: perfil.diasFuncionamento[key] ? "#111827" : theme.text,
                        borderColor: theme.border,
                      }}
                      onClick={() => toggleDiaFuncionamento(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <label style={{ ...styles.label, color: theme.textSoft }}>Logo da barbearia</label>

                <div style={styles.logoEditorWrap}>
                  <div style={styles.logoEditorPreview}>{logoPreview}</div>

                  <div style={styles.logoButtonsWrap}>
                    <label
                      style={{
                        ...styles.mainBtn,
                        display: "inline-block",
                        textAlign: "center",
                      }}
                    >
                      Escolher logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={aoTrocarLogo}
                        style={{ display: "none" }}
                      />
                    </label>

                    <button
                      style={styles.deleteBtn}
                      type="button"
                      onClick={() =>
                        setPerfil((prev) => ({
                          ...prev,
                          logoBarbearia: "",
                        }))
                      }
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <button style={styles.mainBtn} onClick={salvarPerfil}>
                  Salvar configurações
                </button>
              </div>

              <div
                style={{
                  ...styles.premiumPanel,
                  background: theme.card,
                  boxShadow: theme.shadow,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <h2 style={{ color: theme.text, marginTop: 0 }}>Resumo profissional</h2>

                <p style={{ color: theme.textSoft }}>
                  <strong style={{ color: theme.text }}>Barbearia:</strong> {perfil.nomeBarbearia}
                </p>

                <p style={{ color: theme.textSoft }}>
                  <strong style={{ color: theme.text }}>WhatsApp:</strong> {perfil.whatsapp || "Não configurado"}
                </p>

                <p style={{ color: theme.textSoft }}>
                  <strong style={{ color: theme.text }}>Horário:</strong> {perfil.abertura} às {perfil.fechamento}
                </p>

                <p style={{ color: theme.textSoft }}>
                  <strong style={{ color: theme.text }}>Funcionários:</strong> {funcionarios.length}
                </p>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: theme.input,
                    color: theme.text,
                    wordBreak: "break-word",
                    marginTop: 14,
                  }}
                >
                  {linkPublico}
                </div>
              </div>
            </div>
          </>
        )}

        {tela === "link-publico" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: 22 }}>Link do cliente</h1>

            <div
              style={{
                ...styles.formCard,
                maxWidth: 760,
                background: theme.card,
                boxShadow: theme.shadow,
                border: `1px solid ${theme.border}`,
              }}
            >
              <p style={{ color: theme.textSoft, lineHeight: 1.6 }}>
                Esse é o link que o cliente vai usar para ver os serviços e agendar sozinho. O painel do barbeiro agora foca em receber notificações e administrar a barbearia.
              </p>

              <div
                style={{
                  ...styles.linkBox,
                  background: theme.input,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                }}
              >
                {linkPublico}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <button style={styles.mainBtn} onClick={copiarLinkPublico}>
                  Copiar link
                </button>
                {perfil.slug && (
                  <button style={styles.secondaryBtn} onClick={() => window.open(linkPublico, "_blank")}>
                    Abrir link
                  </button>
                )}
              </div>

              <div style={{ marginTop: 18, color: theme.textSoft }}>
                <strong style={{ color: theme.text }}>Slug atual:</strong> {perfil.slug || "Ainda não gerado"}
              </div>
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
      const res = await axios.get(`${backend}/public/barbearias/${slug}`, { timeout: 10000 });
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
        timeout: 10000,
      });
      setHorariosOcupados(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
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

  function dataDisponivel(dataEscolhida) {
    if (!barbearia?.diasFuncionamento || !dataEscolhida) return true;

    const dia = new Date(`${dataEscolhida}T12:00:00`).getDay();
    const mapa = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    return Boolean(barbearia.diasFuncionamento[mapa[dia]]);
  }

  function gerarHorarios() {
    if (!barbearia?.abertura || !barbearia?.fechamento) return [];

    const [horaInicio, minutoInicio] = barbearia.abertura.split(":").map(Number);
    const [horaFim, minutoFim] = barbearia.fechamento.split(":").map(Number);

    let minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFim = horaFim * 60 + minutoFim;
    const lista = [];

    while (minutosInicio < minutosFim) {
      const h = String(Math.floor(minutosInicio / 60)).padStart(2, "0");
      const m = String(minutosInicio % 60).padStart(2, "0");
      lista.push(`${h}:${m}`);
      minutosInicio += 30;
    }

    return lista;
  }

  async function realizarAgendamento() {
    if (!cliente.trim() || !telefone.trim() || !servico || !data || !horario) {
      alert("Preencha todos os campos.");
      return;
    }

    if (!dataDisponivel(data)) {
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
        { timeout: 10000 }
      );

      alert("Agendamento realizado com sucesso.");

      if (res.data.whatsapp) {
        const mensagem = encodeURIComponent(
          `${cliente} agendou ${servico} às ${horario} do dia ${data}`
        );
        window.open(`https://wa.me/55${res.data.whatsapp}?text=${mensagem}`, "_blank");
      }

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
        <div style={styles.publicCard}>
          <h1 style={{ margin: 0 }}>Carregando agenda...</h1>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={styles.publicWrap}>
        <div style={styles.publicCard}>
          <h1 style={{ margin: 0 }}>{erro}</h1>
        </div>
      </div>
    );
  }

  const horarios = gerarHorarios();

  return (
    <div style={styles.publicWrap}>
      <div style={styles.publicCard}>
        <div style={styles.publicHeader}>
          {barbearia.logoBarbearia ? (
            <img src={barbearia.logoBarbearia} alt="Logo" style={styles.logoImage} />
          ) : (
            <div style={styles.logoFallback}>💈</div>
          )}
          <div>
            <h1 style={{ margin: 0 }}>{barbearia.nomeBarbearia}</h1>
            <p style={{ color: "#64748b", marginTop: 6 }}>
              Escolha seu serviço e agende seu horário
            </p>
          </div>
        </div>

        <select style={styles.publicInput} value={servico} onChange={(e) => setServico(e.target.value)}>
          <option value="">Selecione o serviço</option>
          {barbearia.servicos.map((s) => (
            <option key={s._id} value={s.nome}>
              {s.nome} - R$ {s.preco}
            </option>
          ))}
        </select>

        <input
          style={styles.publicInput}
          placeholder="Seu nome"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />

        <input
          style={styles.publicInput}
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
        />

        <input
          style={styles.publicInput}
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />

        <select style={styles.publicInput} value={horario} onChange={(e) => setHorario(e.target.value)}>
          <option value="">Selecione o horário</option>
          {horarios.map((h) => (
            <option key={h} value={h} disabled={horariosOcupados.includes(h)}>
              {h}
              {horariosOcupados.includes(h) ? " - ocupado" : ""}
            </option>
          ))}
        </select>

        <button style={styles.publicBtn} onClick={realizarAgendamento}>
          Agendar horário
        </button>

        {barbearia.whatsapp && (
          <button
            style={styles.whatsBtn}
            onClick={() => window.open(`https://wa.me/55${barbearia.whatsapp}`, "_blank")}
          >
            Falar no WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}

function CardInfo({ theme, titulo, valor }) {
  return (
    <div
      style={{
        ...styles.dashboardCard,
        background: theme.card,
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}
    >
      <p style={{ color: theme.textSoft, marginTop: 0 }}>{titulo}</p>
      <h2 style={{ color: theme.text, marginBottom: 0 }}>{valor}</h2>
    </div>
  );
}

function getMenuStyle(theme, tela, menuHover, alvo) {
  return {
    ...styles.menuBtn,
    color: tela === alvo || menuHover === alvo ? theme.activeText : theme.text,
    background: tela === alvo || menuHover === alvo ? theme.primary : "transparent",
  };
}

function inputStyle(theme) {
  return {
    ...styles.input,
    background: theme.input,
    color: theme.text,
    borderColor: theme.border,
  };
}

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },

  publicWrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    padding: "20px",
  },

  publicCard: {
    width: "100%",
    maxWidth: "520px",
    background: "#fff",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  },

  publicHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },

  publicInput: {
    width: "100%",
    padding: "14px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  publicBtn: {
    width: "100%",
    padding: "14px",
    background: "#f59e0b",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
    color: "#111827",
  },

  whatsBtn: {
    width: "100%",
    padding: "14px",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },

  loadingBox: {
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "14px",
  },

  notificationBanner: {
    padding: "16px",
    borderRadius: "14px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
  },

  notificationButton: {
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },

  linkBox: {
    padding: "14px",
    borderRadius: "12px",
    wordBreak: "break-all",
  },

  heroPage: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "28px 40px",
    position: "relative",
    zIndex: 1,
  },

  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  heroBrand: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
  },

  topLoginBtn: {
    border: "none",
    padding: "12px 18px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "700",
    color: "#111827",
  },

  heroContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "20px",
    position: "relative",
    zIndex: 1,
  },

  badge: {
    padding: "8px 14px",
    borderRadius: "999px",
    border: "1px solid",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "18px",
  },

  heroTitle: {
    fontSize: "56px",
    maxWidth: "900px",
    lineHeight: "1.05",
    fontWeight: "900",
    margin: 0,
  },

  heroDescription: {
    fontSize: "18px",
    maxWidth: "650px",
    marginTop: "18px",
    lineHeight: "1.6",
  },

  heroActions: {
    display: "flex",
    gap: "12px",
    marginTop: "28px",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  heroPrimaryBtn: {
    border: "none",
    padding: "14px 22px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800",
    color: "#111827",
    fontSize: "15px",
  },

  heroSecondaryBtn: {
    border: "1px solid",
    padding: "14px 22px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
  },

  loginPageWrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  loginModernCard: {
    width: "420px",
    borderRadius: "24px",
    padding: "28px",
    position: "relative",
    zIndex: 1,
  },

  loginHeader: {
    marginBottom: "18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  loginLogoWrap: {
    marginBottom: "8px",
  },

  loginModernTitle: {
    margin: "12px 0 0 0",
    fontSize: "30px",
    fontWeight: "800",
    textAlign: "center",
  },

  loginModernText: {
    marginTop: "10px",
    lineHeight: "1.5",
    textAlign: "center",
  },

  loginForm: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  loginInput: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  senhaWrap: {
    position: "relative",
    width: "100%",
  },

  senhaInput: {
    paddingRight: "52px",
  },

  olhoBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
  },

  backBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },

  sidebar: {
    width: "260px",
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    gap: "8px",
  },

  sidebarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  sidebarBottom: {
    marginTop: "auto",
    paddingTop: "18px",
  },

  content: {
    flex: 1,
    padding: "32px",
  },

  menuBtn: {
    border: "none",
    textAlign: "left",
    padding: "14px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "700",
    width: "100%",
    borderRadius: "14px",
  },

  themeBtn: {
    width: "100%",
    border: "1px solid",
    padding: "12px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "20px",
  },

  dashboardCard: {
    padding: "24px",
    borderRadius: "18px",
  },

  dashboardColumns: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "20px",
  },

  premiumPanel: {
    padding: "22px",
    borderRadius: "18px",
  },

  formCard: {
    width: "100%",
    maxWidth: "430px",
    padding: "20px",
    borderRadius: "18px",
    marginBottom: "14px",
  },

  cardRow: {
    padding: "18px",
    borderRadius: "18px",
    marginTop: "14px",
    width: "100%",
    maxWidth: "640px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
    marginTop: "20px",
  },

  serviceCard: {
    padding: "20px",
    borderRadius: "18px",
  },

  funcionarioCard: {
    padding: "18px",
    borderRadius: "18px",
  },

  funcionarioHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginBottom: "14px",
  },

  funcionarioFoto: {
    width: "62px",
    height: "62px",
    borderRadius: "16px",
    objectFit: "cover",
  },

  funcionarioFotoFallback: {
    width: "62px",
    height: "62px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#111827",
    fontWeight: "700",
    fontSize: "24px",
  },

  funcionarioInfos: {
    marginBottom: "14px",
  },

  funcionarioActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  funcionarioUploadArea: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  uploadLabel: {
    background: "#f59e0b",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#111827",
    display: "inline-block",
  },

  funcionarioPreview: {
    width: "70px",
    height: "70px",
    borderRadius: "16px",
    objectFit: "cover",
    border: "2px solid #e2e8f0",
  },

  configPremiumGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "20px",
    alignItems: "start",
  },

  gridTwo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "10px",
  },

  smallRow: {
    padding: "12px 0",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid",
    marginBottom: "10px",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  label: {
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "6px",
    display: "block",
  },

  diasWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "16px",
  },

  diaBtn: {
    border: "1px solid",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },

  mainBtn: {
    background: "#f59e0b",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#111827",
  },

  secondaryBtn: {
    background: "transparent",
    border: "1px solid",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
  },

  deleteBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    flexShrink: 0,
  },

  logoImage: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    objectFit: "cover",
    display: "block",
  },

  logoFallback: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "#111827",
    fontWeight: "700",
    flexShrink: 0,
  },

  logoEditorWrap: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  logoEditorPreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  logoButtonsWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  heroGlow: (theme) => ({
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    background: theme.primary,
    filter: "blur(140px)",
    opacity: 0.14,
    pointerEvents: "none",
  }),

  heroGlowSmall: (theme) => ({
    position: "absolute",
    right: "10%",
    bottom: "10%",
    width: "220px",
    height: "220px",
    borderRadius: "999px",
    background: theme.primary,
    filter: "blur(100px)",
    opacity: 0.08,
    pointerEvents: "none",
  }),
};