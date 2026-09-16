import { Link, useNavigate, useLocation } from "react-router";
import { observer } from "mobx-react-lite";
import {
  BaseAppSidebar,
  MenuSectionHeader,
  MenuItem,
} from "@/shell";
import { useSidebarContext } from "@/shell/sidebar/SidebarContext";
import { sessionStore } from "@/stores";
import {
  GridIcon,
  TaskIcon,
  ListIcon,
  ShootingStarIcon,
  PlugInIcon,
  InfoIcon,
  ArrowRightIcon,
  CalenderIcon,
  PlusIcon,
  PieChartIcon,
  GroupIcon,
} from "@/icons";

// ═══════════════════════════════════════════════════════════════════════════
// LOGO COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const Logo = () => (
  <Link to="/dashboard" className="flex items-center">
    <img
      src="/images/logo/necto-full.svg"
      alt="NECTO"
      className="h-5 w-auto"
    />
  </Link>
);

const LogoCollapsed = () => (
  <Link
    to="/dashboard"
    className="flex items-center justify-center h-10 w-10 rounded-xl border-2 border-brand-500"
  >
    <img
      src="/images/logo/necto-icon.svg"
      alt="NECTO"
      className="h-6 w-6"
    />
  </Link>
);

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER — pinned actions (Configuracion, Ayuda, Cerrar sesion)
// ═══════════════════════════════════════════════════════════════════════════

const SidebarFooter = observer(() => {
  const { isExpanded: showExpanded } = useSidebarContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: integrate with Cognito sign-out
    // Cerrar sesión borra todo el estado (módulos, rol, simulación) y su
    // persistencia en localStorage vía reset().
    sessionStore.reset();
    navigate("/login");
  };

  const rowClasses = `menu-item group menu-item-inactive ${
    !showExpanded ? "xl:justify-center" : "xl:justify-start"
  }`;

  return (
    <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4 pb-6">
      <ul className="flex flex-col gap-1">
        <li>
          <Link to="/configuracion" className={rowClasses}>
            <span className="menu-item-icon-size menu-item-icon-inactive">
              <PlugInIcon />
            </span>
            {showExpanded && <span className="menu-item-text">Configuracion</span>}
          </Link>
        </li>
        <li>
          <Link to="/ayuda" className={rowClasses}>
            <span className="menu-item-icon-size menu-item-icon-inactive">
              <InfoIcon />
            </span>
            {showExpanded && <span className="menu-item-text">Ayuda</span>}
          </Link>
        </li>
        <li>
          <button
            onClick={handleLogout}
            className={`menu-item group text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 cursor-pointer ${
              !showExpanded ? "xl:justify-center" : "xl:justify-start"
            }`}
          >
            <span className="menu-item-icon-size text-error-500">
              <ArrowRightIcon />
            </span>
            {showExpanded && <span className="menu-item-text">Cerrar sesion</span>}
          </button>
        </li>
      </ul>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR CONTENT — Sistema de Turnos
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SIMULATION BANNER — indicador de "modo simulación" con salida
// ═══════════════════════════════════════════════════════════════════════════

const SimulacionBanner = observer(() => {
  const { isExpanded: showExpanded } = useSidebarContext();
  const navigate = useNavigate();

  if (!sessionStore.isSimulando) return null;

  const nombre = sessionStore.operadorSimulado?.nombre ?? "Operador";

  const salir = () => {
    // `salirSimulacion()` RESTAURA la sesión previa (no la resetea), así que
    // volvemos al inicio del admin y no al login. Antes esto mandaba a /login
    // porque la salida limpiaba toda la sesión.
    sessionStore.salirSimulacion();
    navigate(sessionStore.moduloEntryPath);
  };

  return (
    <div className="mb-4 rounded-lg border border-warning-300 bg-warning-50 p-3 dark:border-warning-500/40 dark:bg-warning-500/10">
      {showExpanded ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-warning-600 dark:text-orange-400">
            Viendo como
          </p>
          <p className="mt-1 truncate text-sm font-medium text-gray-800 dark:text-white/90">{nombre}</p>
          <button
            onClick={salir}
            className="mt-2 text-xs font-medium text-warning-600 underline hover:text-warning-700 dark:text-orange-400"
          >
            Salir de vista
          </button>
        </>
      ) : (
        <button
          onClick={salir}
          aria-label="Salir de vista"
          className="flex w-full items-center justify-center text-warning-600 dark:text-orange-400"
          title="Viendo como — salir"
        >
          <ArrowRightIcon />
        </button>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR CONTENT — Sistema de Turnos
// ═══════════════════════════════════════════════════════════════════════════

const SidebarContent = observer(() => {
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname === path;

  // El menú se adapta a los módulos de la sesión. Ya NO hay fallback
  // "fail-open": `RequireSession` garantiza que hay una sesión utilizable antes
  // de renderizar el shell, así que mostrar todo cuando no hay selección era
  // justamente el agujero que se cerró (contrato §2 / invariante C3).
  const verTurnos = sessionStore.hasModulo("turnos");
  const verAgendamiento = sessionStore.hasModulo("agendamiento");
  const verPedidos = sessionStore.hasModulo("pedidos");

  // Cada bloque pregunta por SU módulo: los ids de sección se repiten entre
  // módulos (`inicio`, `crear`), así que `puedeVerSeccion(modulo, id)` es la
  // firma canónica (contrato §1.5).
  //
  // El ítem "Operadores" (turnos/agendamiento) es legado congelado: usa
  // `accesoTotal` hasta que esos módulos migren a capacidades (contrato §5).
  // El de pedidos ya usa la capacidad real `team.manage`.
  const puedeTurnos = (seccionId: string) => sessionStore.puedeVerSeccion("turnos", seccionId);
  const puedeAgendamiento = (seccionId: string) => sessionStore.puedeVerSeccion("agendamiento", seccionId);
  const puedePedidos = (seccionId: string) => sessionStore.puedeVerSeccion("pedidos", seccionId);
  const puedeGestionarEquipo = sessionStore.hasPermission("team.manage");

  /**
   * Matcher de subárbol, para ítems que tienen rutas hijas.
   *
   * El perfil de una persona es `/pedidos/equipo/:id`, así que un `isActive`
   * exacto apagaría el ítem "Equipo" al abrir un perfil. No se usa en general
   * porque un prefijo ingenuo marcaría de más (`/pedidos` también marcaría
   * `/pedidos/crear`).
   */
  const esRutaConHijas = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="flex flex-col flex-1">
      <SimulacionBanner />

      <div className="flex flex-col gap-6">
        {/* TURNOS */}
        {verTurnos && (
          <div>
            <MenuSectionHeader title="Turnos" />
            <ul className="flex flex-col gap-1">
              {puedeTurnos("inicio") && <MenuItem icon={<GridIcon />} name="Inicio" path="/dashboard" isActive={isActive} />}
              {puedeTurnos("turnos") && <MenuItem icon={<TaskIcon />} name="Mis Turnos" path="/turnos" isActive={isActive} />}
              {puedeTurnos("recepcion") && <MenuItem icon={<PlusIcon />} name="Crear turno" path="/recepcion" isActive={isActive} />}
              {puedeTurnos("colas") && <MenuItem icon={<ListIcon />} name="Filas" path="/colas" isActive={isActive} />}
              {puedeTurnos("encuestas") && <MenuItem icon={<ShootingStarIcon />} name="Encuestas" path="/encuestas" isActive={isActive} />}
              {sessionStore.accesoTotal && (
                <MenuItem icon={<GroupIcon />} name="Operadores" path="/turnos/operadores" isActive={isActive} />
              )}
            </ul>
          </div>
        )}

        {/* AGENDAMIENTO */}
        {verAgendamiento && (
          <div>
            <MenuSectionHeader title="Agendamiento" />
            <ul className="flex flex-col gap-1">
              {puedeAgendamiento("profesionales") && <MenuItem icon={<GroupIcon />} name="Profesionales" path="/agendamiento/profesionales" isActive={isActive} />}
              {puedeAgendamiento("agenda") && <MenuItem icon={<ListIcon />} name="Agenda" path="/agendamiento" isActive={isActive} />}
              {puedeAgendamiento("calendario") && <MenuItem icon={<CalenderIcon />} name="Calendario" path="/agendamiento/calendario" isActive={isActive} />}
              {puedeAgendamiento("crear") && <MenuItem icon={<PlusIcon />} name="Agendar cita" path="/agendamiento/crear" isActive={isActive} />}
              {puedeAgendamiento("analitica") && <MenuItem icon={<PieChartIcon />} name="Analítica" path="/agendamiento/analitica" isActive={isActive} />}
              {sessionStore.accesoTotal && (
                <MenuItem icon={<GroupIcon />} name="Operadores" path="/agendamiento/operadores" isActive={isActive} />
              )}
            </ul>
          </div>
        )}

        {/* PEDIDOS */}
        {verPedidos && (
          <div>
            <MenuSectionHeader title="Pedidos" />
            <ul className="flex flex-col gap-1">
              {puedePedidos("inicio") && <MenuItem icon={<GridIcon />} name="Inicio" path="/pedidos/inicio" isActive={isActive} />}
              {puedePedidos("tablero") && <MenuItem icon={<ListIcon />} name="Tablero" path="/pedidos" isActive={isActive} />}
              {puedePedidos("crear") && <MenuItem icon={<PlusIcon />} name="Crear pedido" path="/pedidos/crear" isActive={isActive} />}
              {puedePedidos("historial") && <MenuItem icon={<TaskIcon />} name="Historial" path="/pedidos/historial" isActive={isActive} />}
              {puedePedidos("configuracion") && <MenuItem icon={<PlugInIcon />} name="Configuración" path="/pedidos/config" isActive={isActive} />}
              {puedeGestionarEquipo && (
                <MenuItem icon={<GroupIcon />} name="Equipo" path="/pedidos/equipo" isActive={esRutaConHijas} />
              )}
            </ul>
          </div>
        )}
      </div>

      <SidebarFooter />
    </nav>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AppSidebar — NECTO-branded navigation for the queue management system.
 * @kgId 8025fcb3eb97
 */
export const AppSidebar = () => (
  <BaseAppSidebar logo={<Logo />} logoCollapsed={<LogoCollapsed />}>
    <SidebarContent />
  </BaseAppSidebar>
);

export default AppSidebar;
