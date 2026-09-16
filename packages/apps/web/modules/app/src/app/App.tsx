import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import { observer } from "mobx-react-lite";
import { queuesStore, sessionStore } from "@/stores";
import { AppShell } from "@/app/AppShell";
import { DashboardPage, OperadorInicioTurnos } from "@/pages/dashboard";
import { TurnosPage } from "@/pages/turnos";
import { ColasPage } from "@/pages/colas";
import { RecepcionPage } from "@/pages/recepcion";
import { SurveyPage } from "@/pages/survey";
import { EncuestasPage, EncuestaCompartir } from "@/pages/encuestas";
import { DisplayScreen } from "@/pages/display";
import { AgendaPage, ProfesionalesPage, CalendarioPage, CitaDetallePage, CrearCitaPage, AnaliticaPage } from "@/pages/agendamiento";
import { TableroPage, CrearPedidoPage, InicioPage as PedidosInicioPage, HistorialPage as PedidosHistorialPage, ConfigPage as PedidosConfigPage, EquipoPage, PerfilOperadorPage } from "@/pages/pedidos";
import { SeleccionarPage } from "@/pages/seleccionar";
import { SimuladorWhatsApp } from "@/pages/simulador";
import { OperadorRegistroPage } from "@/pages/operador";
import { OperadoresTurnosPage, OperadoresAgendamientoPage } from "@/pages/operadores";
import { SeccionGuard } from "@/app/SeccionGuard";
import { RequireSession } from "@/app/RequireSession";
import { CapabilityGuard } from "@/app/CapabilityGuard";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import SignInForm from "@/pages/auth/sign-in";
import SignUpForm from "@/pages/auth/sign-up";
import ResetPasswordForm from "@/pages/auth/reset-password";
import { AuthPageLayout } from "@/layouts/auth";

/**
 * App - Clean starter application with minimal shell
 * 
 * This is the clean version for starting new applications.
 * Run with: npm run dev
 * 
 * For the full-featured demo, run: npm run demo
 * 
 * @agents Arquitectura de Rutas
 * 
 * Este archivo define todas las rutas de la aplicación. Las rutas se organizan
 * en dos categorías:
 * 
 * ## 1. Rutas con Shell
 * 
 * Las rutas que comparten el layout común (sidebar + header) van dentro de
 * `<Route element={<AppShell />}>`. El shell renderiza las rutas hijas usando
 * `<Outlet />`.
 * 
 * ```tsx
 * <Route element={<AppShell />}>
 *   <Route path="/" element={<Dashboard />} />
 *   <Route path="/users" element={<Users />} />
 *   <Route path="/settings" element={<Settings />} />
 * </Route>
 * ```
 * 
 * Para agregar una nueva página con shell:
 * 1. Crear el componente en `src/pages/`
 * 2. Importarlo aquí
 * 3. Agregar `<Route path="/ruta" element={<Componente />} />` dentro del shell
 * 4. Actualizar el menú en `AppSidebar.tsx`
 * 
 * ## 2. Rutas Standalone
 * 
 * Las rutas que NO usan el shell van fuera. Útil para:
 * - Login/Registro
 * - Landing pages
 * - Páginas de error
 * - Cualquier página con layout diferente
 * 
 * ```tsx
 * <Route path="/login" element={<LoginPage />} />
 * ```
 * 
 * ## Múltiples Shells (Micrositios)
 * 
 * Si necesitas diferentes layouts para diferentes secciones:
 * 
 * ```tsx
 * <Routes>
 *   <Route element={<AdminShell />}>
 *     <Route path="/admin/*" element={...} />
 *   </Route>
 *   <Route element={<PublicShell />}>
 *     <Route path="/public/*" element={...} />
 *   </Route>
 * </Routes>
 * ```
 * 
 * Ver `demo/DemoApp.tsx` para un ejemplo completo con documentación extendida.
 * 
 * ## Archivos Relacionados
 * 
 * - `AppShell.tsx` - Layout wrapper (sidebar + header + Outlet)
 * - `AppSidebar.tsx` - Menú de navegación (personalizar aquí)
 * - `../pages/` - Componentes de página
 * @kgId d91162d0d213
 */

/**
 * InicioTurnos — decide qué "Inicio" mostrar en /dashboard:
 * - Operador simulado en Turnos → su inicio personal (OperadorInicioTurnos).
 * - Cualquier otro caso (admin) → el panel de control completo (DashboardPage).
 */
const InicioTurnos = observer(() => {
  const op = sessionStore.operadorSimulado;
  if (op && op.modulo === "turnos") return <OperadorInicioTurnos />;
  return <DashboardPage />;
});

/**
 * Encuestas — decide qué vista mostrar en /encuestas:
 * - Operador simulado → solo el apartado para compartir el link (EncuestaCompartir).
 * - Admin → la vista completa con estadísticas y configuración (EncuestasPage).
 */
const Encuestas = observer(() => {
  if (sessionStore.isSimulando) return <EncuestaCompartir />;
  return <EncuestasPage />;
});

/**
 * RedireccionViendoComo — cierra la antigua ruta `/operador/login`.
 *
 * Esa ruta era el simulador de operador ("Viendo como"), una página STANDALONE
 * fuera de `RequireSession` y por tanto **sin ningún guard**: cualquiera que
 * escribiera la URL podía impersonar a cualquier operador activo. Ahora la
 * impersonación es una herramienta de administrador y vive en Equipo
 * (`/pedidos/equipo`, capacidad `team.manage`), así que aquí solo queda una
 * redirección.
 *
 * Se conserva la ruta en vez de borrarla para no romper enlaces o marcadores
 * antiguos. El destino depende de la sesión: mandar a Equipo a quien no puede
 * gestionar el equipo lo dejaría contra el guard, así que va a `/seleccionar`.
 */
const RedireccionViendoComo = () => (
  <Navigate
    to={sessionStore.hasPermission("team.manage") ? "/pedidos/equipo" : "/seleccionar"}
    replace
  />
);

export default function App() {
  // Load queues from the backend once on startup (falls back to local data).
  useEffect(() => {
    queuesStore.loadQueues();
  }, []);

  return (
    <Routes>
      {/* ════════════════════════════════════════════════════════════════════
          RUTAS CON SHELL
          Páginas que comparten el layout AppShell (sidebar + header).
          RequireSession es la puerta: sin sesión utilizable no se entra (H2).
          ════════════════════════════════════════════════════════════════════ */}
      <Route element={<RequireSession><AppShell /></RequireSession>}>
        {/* Turnos — protegidas por SeccionGuard en modo simulación */}
        <Route path="/dashboard" element={<SeccionGuard seccion="inicio"><InicioTurnos /></SeccionGuard>} />
        <Route path="/turnos" element={<SeccionGuard seccion="turnos"><TurnosPage /></SeccionGuard>} />
        <Route path="/recepcion" element={<SeccionGuard seccion="recepcion"><RecepcionPage /></SeccionGuard>} />
        <Route path="/colas" element={<SeccionGuard seccion="colas"><ColasPage /></SeccionGuard>} />
        <Route path="/encuestas" element={<SeccionGuard seccion="encuestas"><Encuestas /></SeccionGuard>} />
        {/* Agendamiento — protegidas por SeccionGuard en modo simulación */}
        <Route path="/agendamiento" element={<SeccionGuard seccion="agenda"><AgendaPage /></SeccionGuard>} />
        <Route path="/agendamiento/profesionales" element={<SeccionGuard seccion="profesionales"><ProfesionalesPage /></SeccionGuard>} />
        <Route path="/agendamiento/calendario" element={<SeccionGuard seccion="calendario"><CalendarioPage /></SeccionGuard>} />
        <Route path="/agendamiento/detalles" element={<SeccionGuard seccion="agenda"><CitaDetallePage /></SeccionGuard>} />
        <Route path="/agendamiento/crear" element={<SeccionGuard seccion="crear"><CrearCitaPage /></SeccionGuard>} />
        <Route path="/agendamiento/analitica" element={<SeccionGuard seccion="analitica"><AnaliticaPage /></SeccionGuard>} />
        {/* Pedidos — gobernadas por CAPACIDAD, no por lista de secciones.
            Turnos y Agendamiento siguen con SeccionGuard (Fase 2 es solo pedidos).
            Nota: `settings.read` da acceso a la página de configuración, pero
            guardar cambios requiere además `settings.manage` (gating en la página). */}
        <Route path="/pedidos/inicio" element={<CapabilityGuard capacidad="orders.read"><PedidosInicioPage /></CapabilityGuard>} />
        <Route path="/pedidos" element={<CapabilityGuard capacidad="orders.read"><TableroPage /></CapabilityGuard>} />
        <Route path="/pedidos/crear" element={<CapabilityGuard capacidad="orders.create"><CrearPedidoPage /></CapabilityGuard>} />
        <Route path="/pedidos/historial" element={<CapabilityGuard capacidad="orders.read"><PedidosHistorialPage /></CapabilityGuard>} />
        <Route path="/pedidos/config" element={<CapabilityGuard capacidad="settings.read"><PedidosConfigPage /></CapabilityGuard>} />
        {/* Equipo de pedidos — pantalla nueva (Fase 3).
            El perfil es una RUTA, no un modal, así que se puede enlazar y
            recargar. Ambas rutas exigen `team.manage`.

            `/pedidos/operadores` se conserva como redirección para no romper
            enlaces o marcadores existentes. */}
        <Route path="/pedidos/equipo" element={<CapabilityGuard capacidad="team.manage"><EquipoPage /></CapabilityGuard>} />
        <Route path="/pedidos/equipo/:id" element={<CapabilityGuard capacidad="team.manage"><PerfilOperadorPage /></CapabilityGuard>} />
        <Route path="/pedidos/operadores" element={<Navigate to="/pedidos/equipo" replace />} />

        {/* Equipo — solo para quien puede gestionar el equipo.
            Antes usaban el centinela `seccion="__solo_admin__"`, un string
            mágico que no existía en ningún catálogo; ahora es una capacidad
            real (`team.manage`), asignable a cualquier rol.
            Turnos y Agendamiento siguen en la pantalla legacy de Operadores. */}
        <Route path="/turnos/operadores" element={<CapabilityGuard capacidad="team.manage"><OperadoresTurnosPage /></CapabilityGuard>} />
        <Route path="/agendamiento/operadores" element={<CapabilityGuard capacidad="team.manage"><OperadoresAgendamientoPage /></CapabilityGuard>} />
        <Route path="/configuracion" element={<PlaceholderPage title="Configuracion" />} />
        <Route path="/ayuda" element={<PlaceholderPage title="Ayuda" />} />
      </Route>

      {/* ════════════════════════════════════════════════════════════════════
          RUTAS STANDALONE
          Páginas sin shell - tienen su propio layout completo
          ════════════════════════════════════════════════════════════════════ */}
      <Route path="/seleccionar" element={<SeleccionarPage />} />
      <Route path="/operador/registro" element={<OperadorRegistroPage />} />
      {/* Ruta deprecada: la impersonación vive ahora en Equipo. Ver
          `RedireccionViendoComo`. El componente `OperadorLoginPage` sigue en el
          repo sin ruta; se borra cuando confirmemos que nadie lo necesita. */}
      <Route path="/operador/login" element={<RedireccionViendoComo />} />
      <Route path="/wa" element={<SimuladorWhatsApp />} />
      <Route path="/display" element={<DisplayScreen />} />
      <Route path="/s/:token" element={<SurveyPage />} />
      <Route path="/login" element={<AuthPageLayout><SignInForm /></AuthPageLayout>} />
      <Route path="/register" element={<AuthPageLayout><SignUpForm /></AuthPageLayout>} />
      <Route path="/forgot-password" element={<AuthPageLayout><ResetPasswordForm /></AuthPageLayout>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
