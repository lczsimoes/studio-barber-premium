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
    if (salvo) {
      const user = JSON.parse(salvo);
      setUsuario(user);
      setTela("dashboard");
      carregarDadosLocais(user.id);
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
    : "Defina o nome da barbearia para gerar o link";

  function gerarSlug(nome) {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
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

  function salvarLocal(chave, valor) {
    if (!usuario?.id) return;
    localStorage.setItem(`${chave}_${usuario.id}`, JSON.stringify(valor));
  }

  function carregarDadosLocais(userId) {
    try {
      const perfilSalvo = localStorage.getItem(`perfil_studio_barber_${userId}`);
      const clientesSalvos = localStorage.getItem(`clientes_studio_barber_${userId}`);
      const funcionariosSalvos = localStorage.getItem(`funcionarios_studio_barber_${userId}`);
      const agendamentosSalvos = localStorage.getItem(`agendamentos_studio_barber_${userId}`);

      if (perfilSalvo) setPerfil(JSON.parse(perfilSalvo));
      if (clientesSalvos) setClientes(JSON.parse(clientesSalvos));
      if (funcionariosSalvos) setFuncionarios(JSON.parse(funcionariosSalvos));
      if (agendamentosSalvos) setAgendamentos(JSON.parse(agendamentosSalvos));
    } catch (error) {
      console.error("Erro ao carregar dados locais:", error);
    }

    carregarServicosBackend(userId);
  }

  async function carregarServicosBackend(userId) {
    try {
      const res = await axios.get(`${backend}/servicos/${userId}`);
      setServicos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      setServicos([]);
    }
  }

  async function login() {
    if (!email.trim() || !senha.trim()) {
      alert("Preencha e-mail e senha.");
      return;
    }

    setCarregando(true);

    try {
      const res = await axios.post(`${backend}/login`, {
        email,
        senha,
      });

      const user = {
        id: res.data.userId,
        email,
      };

      localStorage.setItem("usuario_studio_barber", JSON.stringify(user));
      setUsuario(user);
      setTela("dashboard");
      carregarDadosLocais(user.id);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao entrar.");
    }

    setCarregando(false);
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
      await axios.post(`${backend}/register`, {
        email,
        senha,
      });

      alert("Conta criada com sucesso.");
      setTela("login");
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao cadastrar conta.");
    }

    setCarregando(false);
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
      const novoPerfil = {
        ...perfil,
        logoBarbearia: reader.result,
      };
      setPerfil(novoPerfil);
      salvarLocal("perfil_studio_barber", novoPerfil);
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

  function salvarPerfil() {
    if (!usuario) return;

    const novoPerfil = {
      ...perfil,
      slug: gerarSlug(perfil.nomeBarbearia),
    };

    setPerfil(novoPerfil);
    salvarLocal("perfil_studio_barber", novoPerfil);
    alert("Perfil salvo com sucesso.");
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
      const res = await axios.post(`${backend}/servicos`, {
        nome: nomeServico.trim(),
        preco,
        duracao,
        userId: usuario.id,
      });

      const atualizados = [...servicos, res.data];
      setServicos(atualizados);

      setNomeServico("");
      setPreco("");
      setDuracao("");
    } catch (error) {
      alert("Erro ao adicionar serviço.");
    }
  }

  async function apagarServico(id) {
    try {
      await axios.delete(`${backend}/servicos/${id}`);
      setServicos((prev) => prev.filter((item) => item._id !== id));
    } catch {
      alert("Erro ao apagar serviço.");
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

  function adicionarAgendamentoInterno() {
    if (
      !agendamentoCliente ||
      !agendamentoServico ||
      !agendamentoProfissional ||
      !agendamentoData ||
      !agendamentoHorario
    ) {
      alert("Preencha todos os campos do agendamento.");
      return;
    }

    const novo = {
      id: Date.now(),
      cliente: agendamentoCliente,
      servico: agendamentoServico,
      profissional: agendamentoProfissional,
      data: agendamentoData,
      horario: agendamentoHorario,
    };

    const atualizados = [...agendamentos, novo];
    setAgendamentos(atualizados);
    salvarLocal("agendamentos_studio_barber", atualizados);

    setAgendamentoCliente("");
    setAgendamentoServico("");
    setAgendamentoProfissional("");
    setAgendamentoData("");
    setAgendamentoHorario("");
  }

  function removerAgendamento(id) {
    const atualizados = agendamentos.filter((item) => item.id !== id);
    setAgendamentos(atualizados);
    salvarLocal("agendamentos_studio_barber", atualizados);
  }

  if (paginaPublica && slugPublico) {
    return <PaginaPublica slug={slugPublico} />;
  }

  if (tela === "home") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#fff",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "60px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "34px",
                fontWeight: "900",
                color: "#f59e0b",
              }}
            >
              Studio Barber
            </h1>

            <button
              onClick={() => setTela("login")}
              style={{
                background: "#f59e0b",
                color: "#111827",
                border: "none",
                padding: "14px 24px",
                borderRadius: "12px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Entrar no sistema
            </button>
          </div>

          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2
              style={{
                fontSize: "58px",
                lineHeight: "1.1",
                margin: 0,
                fontWeight: "900",
              }}
            >
              O sistema premium para{" "}
              <span style={{ color: "#f59e0b" }}>barbearias modernas</span>
            </h2>

            <p
              style={{
                maxWidth: "760px",
                margin: "24px auto",
                color: "#94a3b8",
                fontSize: "20px",
                lineHeight: "1.6",
              }}
            >
              Organize clientes, receba agendamentos, controle sua equipe e
              profissionalize sua barbearia com um sistema premium de verdade.
            </p>

            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setTela("login")}
                style={{
                  background: "#f59e0b",
                  color: "#111827",
                  border: "none",
                  padding: "18px 28px",
                  borderRadius: "14px",
                  fontWeight: "900",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Acessar sistema
              </button>

              <button
                onClick={() => setTela("login")}
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "1px solid #334155",
                  padding: "18px 28px",
                  borderRadius: "14px",
                  fontWeight: "800",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Ver demonstração
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: "18px",
              marginBottom: "70px",
            }}
          >
            {[
              ["+300", "Barbearias prontas para crescer"],
              ["24h", "Agendamento online automático"],
              ["Premium", "Visual moderno e elegante"],
              ["Rápido", "Fácil de configurar e usar"],
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#111827",
                  padding: "24px",
                  borderRadius: "18px",
                  border: "1px solid #1f2937",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "#f59e0b",
                    fontSize: "34px",
                  }}
                >
                  {item[0]}
                </h3>

                <p style={{ color: "#94a3b8", marginBottom: 0 }}>{item[1]}</p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "70px" }}>
            <h2
              style={{
                textAlign: "center",
                fontSize: "44px",
                marginBottom: "40px",
              }}
            >
              Tudo que sua barbearia precisa
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: "18px",
              }}
            >
              {[
                "Cadastro completo de clientes",
                "Serviços com preço e duração",
                "Funcionários organizados",
                "Agendamentos rápidos",
                "Link online para cliente",
                "Visual premium preto e dourado",
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "#111827",
                    padding: "24px",
                    borderRadius: "18px",
                    border: "1px solid #1f2937",
                    fontWeight: "700",
                  }}
                >
                  ✂️ {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "70px" }}>
            <h2
              style={{
                textAlign: "center",
                fontSize: "44px",
                marginBottom: "40px",
              }}
            >
              Como funciona
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: "18px",
              }}
            >
              {[
                ["1", "Crie sua conta"],
                ["2", "Configure sua barbearia"],
                ["3", "Receba clientes e agendamentos"],
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "#111827",
                    padding: "28px",
                    borderRadius: "18px",
                    border: "1px solid #1f2937",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "#f59e0b",
                      color: "#111827",
                      margin: "0 auto 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "900",
                      fontSize: "22px",
                    }}
                  >
                    {item[0]}
                  </div>

                  <h3 style={{ margin: 0 }}>{item[1]}</h3>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginBottom: "70px",
              background: "#111827",
              padding: "50px 20px",
              borderRadius: "24px",
              textAlign: "center",
              border: "1px solid #1f2937",
            }}
          >
            <h2 style={{ fontSize: "44px", marginTop: 0, marginBottom: "16px" }}>
              Pronto para profissionalizar sua barbearia?
            </h2>

            <p
              style={{
                color: "#94a3b8",
                maxWidth: "700px",
                margin: "0 auto 24px",
                lineHeight: "1.7",
              }}
            >
              Organize seu negócio, tenha uma presença premium e entregue uma
              experiência melhor para cada cliente.
            </p>

            <button
              onClick={() => setTela("login")}
              style={{
                background: "#f59e0b",
                color: "#111827",
                border: "none",
                padding: "18px 28px",
                borderRadius: "14px",
                fontWeight: "900",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Começar agora
            </button>
          </div>

          <p style={{ textAlign: "center", color: "#64748b", marginBottom: 0 }}>
            © Studio Barber - Sistema Premium para Barbearias
          </p>
        </div>
      </div>
    );
  }

  if (tela === "login") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: "24px",
            padding: "34px",
            boxShadow: theme.shadow,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            {perfil.logoBarbearia ? (
              <img
                src={perfil.logoBarbearia}
                alt="Logo"
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "18px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "18px",
                  background: theme.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "34px",
                  margin: "0 auto",
                }}
              >
                💈
              </div>
            )}

            <h1
              style={{
                marginTop: "18px",
                marginBottom: "10px",
                color: theme.text,
                fontSize: "34px",
              }}
            >
              Entrar no sistema
            </h1>

            <p style={{ color: theme.textSoft }}>
              Faça login ou crie sua conta agora.
            </p>
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
              style={{
                ...inputStyle(theme),
                paddingRight: "50px",
              }}
            />

            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{
                position: "absolute",
                right: "14px",
                top: "13px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              {mostrarSenha ? "🙈" : "👁️"}
            </button>
          </div>

          <button onClick={login} style={primaryButton(theme)}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <button
            onClick={registrar}
            style={{
              width: "100%",
              background: "transparent",
              color: theme.text,
              border: `1px solid ${theme.border}`,
              padding: "16px",
              borderRadius: "14px",
              fontWeight: "800",
              cursor: "pointer",
              marginTop: "12px",
            }}
          >
            Criar conta
          </button>

          <button
            onClick={() => setTela("home")}
            style={{
              width: "100%",
              background: "transparent",
              color: theme.textSoft,
              border: "none",
              padding: "12px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: theme.bg,
      }}
    >
      <aside
        style={{
          width: "270px",
          background: theme.sidebar,
          borderRight: `1px solid ${theme.border}`,
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          {perfil.logoBarbearia ? (
            <img
              src={perfil.logoBarbearia}
              alt="Logo"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "18px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "18px",
                background: theme.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "34px",
                margin: "0 auto",
              }}
            >
              💈
            </div>
          )}

          <h2
            style={{
              color: theme.primary,
              marginTop: "14px",
              marginBottom: "6px",
            }}
          >
            {perfil.nomeBarbearia}
          </h2>

          <p style={{ color: theme.textSoft, fontSize: "14px" }}>
            {usuario?.email}
          </p>
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

        <button
          onClick={trocarConta}
          style={{
            width: "100%",
            marginTop: "24px",
            background: theme.card,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            padding: "14px",
            borderRadius: "12px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Trocar conta
        </button>

        <button
          onClick={sair}
          style={{
            width: "100%",
            marginTop: "10px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            padding: "14px",
            borderRadius: "12px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </aside>

      <main
        style={{
          flex: 1,
          padding: "30px",
          background: theme.content,
        }}
      >
        {tela === "dashboard" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: "24px" }}>
              Dashboard Premium 💈
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: "18px",
                marginBottom: "24px",
              }}
            >
              <div style={cardInfoStyle(theme)}>
                <p style={{ color: theme.textSoft }}>💰 Faturamento</p>
                <h2 style={{ color: theme.text }}>R$ {faturamento}</h2>
              </div>

              <div style={cardInfoStyle(theme)}>
                <p style={{ color: theme.textSoft }}>👥 Clientes</p>
                <h2 style={{ color: theme.text }}>{totalClientes}</h2>
              </div>

              <div style={cardInfoStyle(theme)}>
                <p style={{ color: theme.textSoft }}>✂️ Serviços</p>
                <h2 style={{ color: theme.text }}>{totalServicos}</h2>
              </div>

              <div style={cardInfoStyle(theme)}>
                <p style={{ color: theme.textSoft }}>👨‍💼 Funcionários</p>
                <h2 style={{ color: theme.text }}>{totalFuncionarios}</h2>
              </div>

              <div style={cardInfoStyle(theme)}>
                <p style={{ color: theme.textSoft }}>📅 Agendamentos</p>
                <h2 style={{ color: theme.text }}>{totalAgendamentos}</h2>
              </div>
            </div>

            <div style={panelStyle(theme)}>
              <h2 style={{ color: theme.text, marginTop: 0 }}>
                Resumo da operação
              </h2>

              <p style={{ color: theme.textSoft, lineHeight: "1.7" }}>
                Seu sistema premium está pronto para cadastrar clientes,
                organizar serviços, funcionários e receber agendamentos com
                visual profissional.
              </p>

              <div style={linkBoxStyle(theme)}>{linkPublico}</div>

              <button
                onClick={() => navigator.clipboard.writeText(linkPublico)}
                style={primaryButton(theme)}
              >
                Copiar link do cliente
              </button>
            </div>
          </>
        )}

        {tela === "clientes" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: "24px" }}>
              Clientes
            </h1>

            <div style={panelStyle(theme)}>
              <input
                placeholder="Nome do cliente"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                style={inputStyle(theme)}
              />

              <input
                placeholder="Telefone do cliente"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(formatarTelefone(e.target.value))}
                style={inputStyle(theme)}
              />

              <button onClick={adicionarCliente} style={primaryButton(theme)}>
                Adicionar cliente
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: "18px",
                marginTop: "20px",
              }}
            >
              {clientes.map((item) => (
                <div key={item.id} style={panelStyle(theme)}>
                  <h3 style={{ color: theme.text, marginTop: 0 }}>{item.nome}</h3>
                  <p style={{ color: theme.textSoft }}>{item.telefone}</p>

                  <button onClick={() => removerCliente(item.id)} style={dangerButton()}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "servicos" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: "24px" }}>
              Serviços
            </h1>

            <div style={panelStyle(theme)}>
              <input
                placeholder="Nome do serviço"
                value={nomeServico}
                onChange={(e) => setNomeServico(e.target.value)}
                style={inputStyle(theme)}
              />

              <input
                placeholder="Preço"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                style={inputStyle(theme)}
              />

              <input
                placeholder="Duração ex: 45min"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                style={inputStyle(theme)}
              />

              <button onClick={adicionarServico} style={primaryButton(theme)}>
                Adicionar serviço
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: "18px",
                marginTop: "20px",
              }}
            >
              {servicos.map((item) => (
                <div key={item._id} style={panelStyle(theme)}>
                  <h3 style={{ color: theme.text, marginTop: 0 }}>{item.nome}</h3>
                  <p style={{ color: theme.textSoft }}>💰 R$ {item.preco}</p>
                  <p style={{ color: theme.textSoft }}>⏱️ {item.duracao}</p>

                  <button onClick={() => apagarServico(item._id)} style={dangerButton()}>
                    Apagar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "funcionarios" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: "24px" }}>
              Funcionários
            </h1>

            <div style={panelStyle(theme)}>
              <input
                placeholder="Nome"
                value={novoFuncionarioNome}
                onChange={(e) => setNovoFuncionarioNome(e.target.value)}
                style={inputStyle(theme)}
              />

              <input
                placeholder="Cargo"
                value={novoFuncionarioCargo}
                onChange={(e) => setNovoFuncionarioCargo(e.target.value)}
                style={inputStyle(theme)}
              />

              <input
                placeholder="Especialidade"
                value={novoFuncionarioEspecialidade}
                onChange={(e) => setNovoFuncionarioEspecialidade(e.target.value)}
                style={inputStyle(theme)}
              />

              <input
                placeholder="WhatsApp"
                value={novoFuncionarioWhatsapp}
                onChange={(e) => setNovoFuncionarioWhatsapp(formatarTelefone(e.target.value))}
                style={inputStyle(theme)}
              />

              <div style={{ marginBottom: "12px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={aoTrocarFotoFuncionario}
                  style={{ color: theme.text }}
                />
              </div>

              <button onClick={adicionarFuncionario} style={primaryButton(theme)}>
                Adicionar funcionário
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: "18px",
                marginTop: "20px",
              }}
            >
              {funcionarios.map((item) => (
                <div key={item.id} style={panelStyle(theme)}>
                  {item.foto && (
                    <img
                      src={item.foto}
                      alt={item.nome}
                      style={{
                        width: "70px",
                        height: "70px",
                        borderRadius: "16px",
                        objectFit: "cover",
                        marginBottom: "10px",
                      }}
                    />
                  )}

                  <h3 style={{ color: theme.text, marginTop: 0 }}>{item.nome}</h3>
                  <p style={{ color: theme.textSoft }}>{item.cargo}</p>
                  <p style={{ color: theme.textSoft }}>{item.especialidade}</p>
                  <p style={{ color: theme.textSoft }}>{item.whatsapp}</p>

                  <button onClick={() => toggleFuncionario(item.id)} style={primaryButton(theme)}>
                    {item.ativo ? "Desativar" : "Ativar"}
                  </button>

                  <button onClick={() => removerFuncionario(item.id)} style={dangerButton()}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "agendamentos" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: "24px" }}>
              Agendamentos
            </h1>

            <div style={panelStyle(theme)}>
              <select
                value={agendamentoCliente}
                onChange={(e) => setAgendamentoCliente(e.target.value)}
                style={inputStyle(theme)}
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
                style={inputStyle(theme)}
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
                style={inputStyle(theme)}
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
                style={inputStyle(theme)}
              />

              <input
                type="time"
                value={agendamentoHorario}
                onChange={(e) => setAgendamentoHorario(e.target.value)}
                style={inputStyle(theme)}
              />

              <button onClick={adicionarAgendamentoInterno} style={primaryButton(theme)}>
                Adicionar agendamento
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: "18px",
                marginTop: "20px",
              }}
            >
              {agendamentos.map((item) => (
                <div key={item.id} style={panelStyle(theme)}>
                  <h3 style={{ color: theme.text, marginTop: 0 }}>{item.cliente}</h3>
                  <p style={{ color: theme.textSoft }}>✂️ {item.servico}</p>
                  <p style={{ color: theme.textSoft }}>👨‍💼 {item.profissional}</p>
                  <p style={{ color: theme.textSoft }}>📅 {item.data}</p>
                  <p style={{ color: theme.textSoft }}>🕒 {item.horario}</p>

                  <button onClick={() => removerAgendamento(item.id)} style={dangerButton()}>
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tela === "barbearia" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: "24px" }}>
              Configurações da Barbearia
            </h1>

            <div style={panelStyle(theme)}>
              <input
                placeholder="Nome da barbearia"
                value={perfil.nomeBarbearia}
                onChange={(e) =>
                  setPerfil({
                    ...perfil,
                    nomeBarbearia: e.target.value,
                  })
                }
                style={inputStyle(theme)}
              />

              <input
                placeholder="WhatsApp"
                value={perfil.whatsapp}
                onChange={(e) =>
                  setPerfil({
                    ...perfil,
                    whatsapp: e.target.value,
                  })
                }
                style={inputStyle(theme)}
              />

              <input
                placeholder="Slug do link ex: studio-barber"
                value={perfil.slug}
                onChange={(e) =>
                  setPerfil({
                    ...perfil,
                    slug: e.target.value,
                  })
                }
                style={inputStyle(theme)}
              />

              <input
                type="time"
                value={perfil.abertura}
                onChange={(e) =>
                  setPerfil({
                    ...perfil,
                    abertura: e.target.value,
                  })
                }
                style={inputStyle(theme)}
              />

              <input
                type="time"
                value={perfil.fechamento}
                onChange={(e) =>
                  setPerfil({
                    ...perfil,
                    fechamento: e.target.value,
                  })
                }
                style={inputStyle(theme)}
              />

              <div style={{ marginBottom: "12px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={aoTrocarLogo}
                  style={{ color: theme.text }}
                />
              </div>

              <button onClick={salvarPerfil} style={primaryButton(theme)}>
                Salvar configurações
              </button>
            </div>
          </>
        )}

        {tela === "link" && (
          <>
            <h1 style={{ color: theme.text, marginBottom: "24px" }}>
              Link do Cliente
            </h1>

            <div style={panelStyle(theme)}>
              <p style={{ color: theme.textSoft, lineHeight: "1.7" }}>
                Esse é o link que você pode mandar para o cliente agendar atendimento.
              </p>

              <div style={linkBoxStyle(theme)}>{linkPublico}</div>

              <button onClick={() => navigator.clipboard.writeText(linkPublico)} style={primaryButton(theme)}>
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
  const [perfilPublico, setPerfilPublico] = useState({
    nomeBarbearia: "Studio Barber",
    whatsapp: "",
    slug,
  });

  useEffect(() => {
    try {
      const todasChaves = Object.keys(localStorage);
      const chavePerfil = todasChaves.find((chave) => chave.startsWith("perfil_studio_barber_"));

      if (chavePerfil) {
        const perfilSalvo = JSON.parse(localStorage.getItem(chavePerfil) || "{}");
        setPerfilPublico({
          nomeBarbearia: perfilSalvo.nomeBarbearia || "Studio Barber",
          whatsapp: perfilSalvo.whatsapp || "",
          slug: perfilSalvo.slug || slug,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar perfil público:", error);
    }
  }, [slug]);

  function abrirWhatsApp(servico) {
    const numero = (perfilPublico.whatsapp || "").replace(/\D/g, "");
    if (!numero) {
      alert("WhatsApp da barbearia não configurado.");
      return;
    }

    const texto = encodeURIComponent(
      `Olá! Quero agendar ${servico} na barbearia ${perfilPublico.nomeBarbearia}.`
    );

    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
  }

  return (
    <div style={styles.publicWrap}>
      <div style={styles.publicContainer}>
        <div style={styles.publicCard}>
          <div style={styles.publicLogo}>💈</div>

          <h1 style={styles.publicTitulo}>{perfilPublico.nomeBarbearia}</h1>
          <p style={styles.publicSubtitulo}>Agende seu horário com facilidade</p>

          <div style={styles.publicInfo}>
            <strong>Link:</strong> {slug}
          </div>

          <div style={styles.publicServicos}>
            <button onClick={() => abrirWhatsApp("Corte")} style={styles.publicBtn}>
              Agendar Corte
            </button>

            <button onClick={() => abrirWhatsApp("Barba")} style={styles.publicBtnSec}>
              Agendar Barba
            </button>

            <button onClick={() => abrirWhatsApp("Corte + Barba")} style={styles.publicBtnSec}>
              Agendar Corte + Barba
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function menuStyle(ativo, theme) {
  return {
    width: "100%",
    textAlign: "left",
    background: ativo ? theme.primary : "transparent",
    color: ativo ? "#111827" : theme.text,
    border: "none",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
    marginBottom: "10px",
  };
}

function cardInfoStyle(theme) {
  return {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "18px",
    padding: "22px",
    boxShadow: theme.shadow,
  };
}

function panelStyle(theme) {
  return {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "18px",
    padding: "22px",
    boxShadow: theme.shadow,
    marginTop: "18px",
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

function linkBoxStyle(theme) {
  return {
    padding: "14px",
    borderRadius: "12px",
    background: theme.input,
    border: `1px solid ${theme.border}`,
    color: theme.text,
    wordBreak: "break-all",
    margin: "14px 0",
  };
}

function primaryButton(theme) {
  return {
    background: theme.primary,
    color: "#111827",
    border: "none",
    padding: "14px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
    marginRight: "10px",
  };
}

function dangerButton() {
  return {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "10px",
  };
}

const styles = {
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
  publicServicos: {
    display: "grid",
    gap: "12px",
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
  publicBtnSec: {
    width: "100%",
    background: "transparent",
    color: "#fff",
    border: "1px solid #334155",
    padding: "16px",
    borderRadius: "14px",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "16px",
  },
};