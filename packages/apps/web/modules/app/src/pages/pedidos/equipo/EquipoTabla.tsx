import { useState } from "react";
import { useNavigate } from "react-router";
import { observer } from "mobx-react-lite";
import { Avatar } from "@/elements/ui/avatar";
import { Badge } from "@/elements/ui/badge";
import { Dropdown, DropdownItem } from "@/elements/ui/dropdown";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/elements/ui/table";
import {
  UserIcon,
  MoreDotIcon,
  PencilIcon,
  UserCircleIcon,
} from "@/icons";
import { operadoresStore, rolesStore, sessionStore, type Operador } from "@/stores";
import { resumenGrupos } from "./equipo.constants";

// ═══════════════════════════════════════════════════════════════════════════
// TABLA DEL EQUIPO (Elements UI)
// ═══════════════════════════════════════════════════════════════════════════

/** true si la persona tiene excepciones sobre las capacidades de su rol. */
function tieneAjustes(op: Operador): boolean {
  return (op.capacidadesExtra?.length ?? 0) > 0 || (op.capacidadesRemovidas?.length ?? 0) > 0;
}

/** Obtiene las iniciales de 1 o 2 letras para el fallback del avatar. */
function obtenerIniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface GrupoEquipo {
  id: string;
  titulo: string;
  esPendiente?: boolean;
  operadores: Operador[];
}

export const EquipoTabla = observer(({ operadores }: { operadores: Operador[] }) => {
  const navigate = useNavigate();
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);

  if (operadores.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay personas que coincidan con el filtro.</p>
      </div>
    );
  }

  // Separar operadores pendientes de los aprobados para visibilidad inmediata
  const pendientesOps = operadores.filter((o) => o.estado === "pendiente");
  const noPendientes = operadores.filter((o) => o.estado !== "pendiente");

  const grupos: GrupoEquipo[] = [];

  // Grupo prioritario de pendientes de aprobación si existen
  if (pendientesOps.length > 0) {
    grupos.push({
      id: "pendientes",
      titulo: "Pendientes de aprobación",
      esPendiente: true,
      operadores: pendientesOps,
    });
  }

  // Agrupación de operadores aprobados / activos / inactivos por rol
  grupos.push(
    {
      id: "admins",
      titulo: "Administradores",
      operadores: noPendientes.filter((o) => o.rolId === "admin_tienda"),
    },
    {
      id: "supervisores",
      titulo: "Supervisores",
      operadores: noPendientes.filter((o) => o.rolId === "supervisor_pedidos"),
    },
    {
      id: "vendedores",
      titulo: "Vendedores y Operadores",
      operadores: noPendientes.filter((o) => o.rolId === "vendedor"),
    },
    {
      id: "otros",
      titulo: "Otros Miembros",
      operadores: noPendientes.filter(
        (o) => o.rolId !== "admin_tienda" && o.rolId !== "supervisor_pedidos" && o.rolId !== "vendedor"
      ),
    }
  );

  const gruposVisibles = grupos.filter((g) => g.operadores.length > 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/70 border-b border-gray-100 dark:border-gray-800 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell header className="font-semibold text-gray-700 dark:text-gray-300 pl-6 py-3.5">
                Nombre y Cargo
              </TableCell>
              <TableCell header className="font-semibold text-gray-700 dark:text-gray-300">
                Capacidades
              </TableCell>
              <TableCell header className="font-semibold text-gray-700 dark:text-gray-300">
                Rol y Acceso
              </TableCell>
              <TableCell header className="text-right font-semibold text-gray-700 dark:text-gray-300 pr-6">
                Acciones
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {gruposVisibles.map((grupo) => (
              <GrupoSection
                key={grupo.id}
                grupo={grupo}
                menuAbiertoId={menuAbiertoId}
                onSetMenuAbiertoId={setMenuAbiertoId}
                onAbrir={(id) => navigate(`/pedidos/equipo/${id}`)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN DE GRUPO CON DIVISOR VISUAL
// ═══════════════════════════════════════════════════════════════════════════

const GrupoSection = observer(
  ({
    grupo,
    menuAbiertoId,
    onSetMenuAbiertoId,
    onAbrir,
  }: {
    grupo: GrupoEquipo;
    menuAbiertoId: string | null;
    onSetMenuAbiertoId: (id: string | null) => void;
    onAbrir: (id: string) => void;
  }) => {
    return (
      <>
        {/* Encabezado de grupo con separador punteado */}
        <tr
          className={
            grupo.esPendiente
              ? "bg-warning-50/30 dark:bg-warning-500/10"
              : "bg-gray-50/40 dark:bg-white/[0.01]"
          }
        >
          <td colSpan={4} className="px-6 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                  grupo.esPendiente
                    ? "text-warning-700 dark:text-warning-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {grupo.esPendiente && (
                  <span className="inline-block h-2 w-2 rounded-full bg-warning-500 animate-pulse" />
                )}
                {grupo.titulo} ({grupo.operadores.length})
              </span>
              <div
                className={`h-px flex-1 border-b border-dashed ${
                  grupo.esPendiente
                    ? "border-warning-300 dark:border-warning-500/30"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              />
            </div>
          </td>
        </tr>

        {/* Filas del grupo */}
        {grupo.operadores.map((op) => (
          <FilaEquipo
            key={op.id}
            op={op}
            isMenuOpen={menuAbiertoId === op.id}
            onToggleMenu={() =>
              onSetMenuAbiertoId(menuAbiertoId === op.id ? null : op.id)
            }
            onCloseMenu={() => onSetMenuAbiertoId(null)}
            onAbrir={() => onAbrir(op.id)}
          />
        ))}
      </>
    );
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// FILA DE OPERADOR
// ═══════════════════════════════════════════════════════════════════════════

const FilaEquipo = observer(
  ({
    op,
    isMenuOpen,
    onToggleMenu,
    onCloseMenu,
    onAbrir,
  }: {
    op: Operador;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    onAbrir: () => void;
  }) => {
    const navigate = useNavigate();
    const rol = rolesStore.porId(op.rolId);
    const capacidades = rolesStore.capacidadesEfectivas(op);
    const grupos = resumenGrupos(capacidades);
    const ajustes = tieneAjustes(op);
    const esPendiente = op.estado === "pendiente";
    const puedeVerComo = op.estado === "activo";

    const verComo = () => {
      if (!puedeVerComo) return;
      onCloseMenu();
      sessionStore.simular(op.id);
      navigate(sessionStore.homePathActual);
    };

    // Determinación del badge de Rol con tokens NECTO
    let userTypeConfig: { label: string; variant: "solid" | "light"; color: "primary" | "dark" | "light" | "info" } = {
      label: rol?.nombre || "Operador",
      variant: "solid",
      color: "dark",
    };

    if (op.rolId === "admin_tienda") {
      userTypeConfig = {
        label: "Admin",
        variant: "solid",
        color: "primary", // Necto Brand Orange (#FF3F1A)
      };
    } else if (op.rolId === "supervisor_pedidos") {
      userTypeConfig = {
        label: "Supervisor",
        variant: "solid",
        color: "dark",
      };
    } else if (op.rolId === "vendedor") {
      userTypeConfig = {
        label: "Vendedor",
        variant: "light",
        color: "dark",
      };
    }

    // Determinación del badge de Acceso con tokens NECTO
    let accessBadge: { label: string; color: "primary" | "warning" | "light" } = {
      label: esPendiente ? "Sin acceso aún" : "Estándar",
      color: esPendiente ? "warning" : "light",
    };

    if (!esPendiente) {
      if (op.rolId === "admin_tienda" || capacidades.length >= 16) {
        accessBadge = {
          label: "Acceso Total",
          color: "primary", // Necto Brand Tint
        };
      } else if (ajustes) {
        accessBadge = {
          label: "Personalizado",
          color: "warning", // Necto Warning Tint
        };
      }
    }

    return (
      <TableRow
        className={`transition-colors ${
          esPendiente
            ? "bg-warning-50/20 dark:bg-warning-500/10 hover:bg-warning-50/40"
            : "hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
        }`}
      >
        {/* Columna 1: Nombre y Cargo */}
        <TableCell className="py-4 pl-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onAbrir}>
            <Avatar
              src={op.avatarUrl || ""}
              initials={obtenerIniciales(op.nombre)}
              size="medium"
              status={esPendiente ? "busy" : op.estado === "activo" ? "online" : "none"}
              alt={op.nombre}
              className="ring-2 ring-gray-100 dark:ring-gray-800 shadow-xs flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {op.nombre}
                </span>
                {esPendiente && (
                  <Badge color="warning" size="xs" className="font-medium">
                    Pendiente
                  </Badge>
                )}
                {op.estado === "inactivo" && (
                  <Badge color="light" size="xs" className="font-medium text-gray-500">
                    Suspendido
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {op.cargo || op.email}
              </span>
            </div>
          </div>
        </TableCell>

        {/* Columna 2: Capacidades */}
        <TableCell className="py-4">
          <div className="flex flex-wrap items-center gap-1.5 cursor-pointer" onClick={onAbrir}>
            {esPendiente ? (
              <span className="text-xs italic text-warning-700 dark:text-warning-400">
                Se habilitarán al aprobar la solicitud
              </span>
            ) : grupos.length > 0 ? (
              <>
                {grupos.map((g) => (
                  <Badge
                    key={g}
                    color="info"
                    size="sm"
                    className="font-medium"
                  >
                    {g}
                  </Badge>
                ))}
                {ajustes && (
                  <span title="Tiene capacidades ajustadas a mano respecto a su rol">
                    <Badge color="warning" size="sm" className="font-medium">
                      Ajustes
                    </Badge>
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400">Sin acceso</span>
            )}
          </div>
        </TableCell>

        {/* Columna 3: Rol y Acceso */}
        <TableCell className="py-4">
          <div className="flex items-center gap-2">
            {/* Rol Badge con icono */}
            <Badge
              variant={userTypeConfig.variant}
              color={userTypeConfig.color}
              size="sm"
              startIcon={<UserIcon className="h-3 w-3 stroke-current" />}
            >
              {userTypeConfig.label}
            </Badge>

            {/* Acceso Badge */}
            <Badge
              variant="light"
              color={accessBadge.color}
              size="sm"
            >
              {accessBadge.label}
            </Badge>
          </div>
        </TableCell>

        {/* Columna 4: Acciones */}
        <TableCell className="py-4 text-right pr-6">
          <div className="flex items-center justify-end gap-3 relative">
            {/* Botón de acción directa si está pendiente */}
            {esPendiente && (
              <button
                type="button"
                onClick={() => operadoresStore.aprobar(op.id)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-success-500 text-white hover:bg-success-600 shadow-xs transition-colors cursor-pointer"
              >
                Aprobar
              </button>
            )}

            {/* Botón Ver perfil */}
            <button
              onClick={onAbrir}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              <span>Ver perfil</span>
              <span className="text-xs">&gt;</span>
            </button>

            {/* Menú contextual de tres puntos */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMenu();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                aria-label="Más opciones"
              >
                <MoreDotIcon className="h-4 w-4" />
              </button>

              {/* Elements Dropdown Menu */}
              <Dropdown
                isOpen={isMenuOpen}
                onClose={onCloseMenu}
                className="right-0 top-full mt-1 w-48 text-left z-20 shadow-lg border border-gray-100 dark:border-gray-800"
              >
                <DropdownItem
                  onClick={verComo}
                  className={!puedeVerComo ? "opacity-50 pointer-events-none" : ""}
                >
                  <span className="flex items-center gap-2">
                    <UserCircleIcon className="h-4 w-4 text-gray-400" />
                    <span>Ver como (Simular)</span>
                  </span>
                </DropdownItem>

                <DropdownItem onClick={() => { onCloseMenu(); onAbrir(); }}>
                  <span className="flex items-center gap-2">
                    <PencilIcon className="h-4 w-4 text-gray-400" />
                    <span>Editar capacidades</span>
                  </span>
                </DropdownItem>

                <hr className="my-1 border-gray-100 dark:border-gray-800" />

                {op.estado === "pendiente" && (
                  <>
                    <DropdownItem
                      onClick={() => {
                        operadoresStore.aprobar(op.id);
                        onCloseMenu();
                      }}
                    >
                      <span className="text-success-600 font-medium">Aprobar operador</span>
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => {
                        operadoresStore.rechazar(op.id);
                        onCloseMenu();
                      }}
                    >
                      <span className="text-error-600 font-medium">Rechazar solicitud</span>
                    </DropdownItem>
                  </>
                )}

                {op.estado === "activo" && (
                  <DropdownItem
                    onClick={() => {
                      operadoresStore.desactivar(op.id);
                      onCloseMenu();
                    }}
                  >
                    <span className="text-warning-600 font-medium">Suspender</span>
                  </DropdownItem>
                )}

                {op.estado === "inactivo" && (
                  <DropdownItem
                    onClick={() => {
                      operadoresStore.activar(op.id);
                      onCloseMenu();
                    }}
                  >
                    <span className="text-success-600 font-medium">Activar</span>
                  </DropdownItem>
                )}
              </Dropdown>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);
