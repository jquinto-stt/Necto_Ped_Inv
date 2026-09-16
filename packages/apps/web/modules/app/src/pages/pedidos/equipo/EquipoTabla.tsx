import { useState } from "react";
import { useNavigate } from "react-router";
import { observer } from "mobx-react-lite";
import { Avatar } from "@/elements/ui/avatar";
import { Badge } from "@/elements/ui/badge";
import { Dropdown, DropdownItem } from "@/elements/ui/dropdown";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/elements/ui/table";
import {
  UserIcon,
  TaskIcon,
  CheckCircleIcon,
  MoreDotIcon,
  ArrowRightIcon,
  PencilIcon,
  UserCircleIcon,
} from "@/icons";
import { operadoresStore, rolesStore, sessionStore, type Operador } from "@/stores";

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

/** Métricas mock de actividad/pedidos asociadas al operador. */
function obtenerStats(op: Operador) {
  if (op.rolId === "admin_tienda") return { activas: 3, completadas: 12 };
  if (op.rolId === "supervisor_pedidos") return { activas: 5, completadas: 8 };
  if (op.id === "d2") return { activas: 4, completadas: 10 };
  return { activas: 2, completadas: 7 };
}

interface GrupoEquipo {
  id: string;
  titulo: string;
  operadores: Operador[];
}

export const EquipoTabla = observer(({ operadores }: { operadores: Operador[] }) => {
  const navigate = useNavigate();
  const [seleccionados, setSeleccionados] = useState<Record<string, boolean>>({});
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);

  if (operadores.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay personas que coincidan con el filtro.</p>
      </div>
    );
  }

  // Agrupación por rol funcional para jerarquía visual
  const grupos: GrupoEquipo[] = [
    {
      id: "admins",
      titulo: "Admins",
      operadores: operadores.filter((o) => o.rolId === "admin_tienda"),
    },
    {
      id: "supervisores",
      titulo: "Supervisores",
      operadores: operadores.filter((o) => o.rolId === "supervisor_pedidos"),
    },
    {
      id: "vendedores",
      titulo: "Vendedores y Operadores",
      operadores: operadores.filter((o) => o.rolId === "vendedor"),
    },
    {
      id: "otros",
      titulo: "Otros Miembros",
      operadores: operadores.filter(
        (o) => o.rolId !== "admin_tienda" && o.rolId !== "supervisor_pedidos" && o.rolId !== "vendedor"
      ),
    },
  ].filter((g) => g.operadores.length > 0);

  const todosSeleccionados =
    operadores.length > 0 && operadores.every((o) => seleccionados[o.id]);

  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados({});
    } else {
      const nuevo: Record<string, boolean> = {};
      operadores.forEach((o) => {
        nuevo[o.id] = true;
      });
      setSeleccionados(nuevo);
    }
  };

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/70 border-b border-gray-100 dark:border-gray-800 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell header className="w-12 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={toggleTodos}
                  aria-label="Seleccionar todos"
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                />
              </TableCell>
              <TableCell header className="font-semibold text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                  <span>Name &amp; Designation</span>
                </div>
              </TableCell>
              <TableCell header className="font-semibold text-gray-700 dark:text-gray-300">
                Task Status
              </TableCell>
              <TableCell header className="font-semibold text-gray-700 dark:text-gray-300">
                User Type &amp; Access
              </TableCell>
              <TableCell header className="text-right font-semibold text-gray-700 dark:text-gray-300 pr-6">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {grupos.map((grupo) => (
              <GrupoSection
                key={grupo.id}
                grupo={grupo}
                seleccionados={seleccionados}
                onToggleSeleccion={toggleSeleccion}
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
    seleccionados,
    onToggleSeleccion,
    menuAbiertoId,
    onSetMenuAbiertoId,
    onAbrir,
  }: {
    grupo: GrupoEquipo;
    seleccionados: Record<string, boolean>;
    onToggleSeleccion: (id: string) => void;
    menuAbiertoId: string | null;
    onSetMenuAbiertoId: (id: string | null) => void;
    onAbrir: (id: string) => void;
  }) => {
    const grupoSeleccionado = grupo.operadores.every((o) => seleccionados[o.id]);

    const toggleGrupo = () => {
      grupo.operadores.forEach((o) => onToggleSeleccion(o.id));
    };

    return (
      <>
        {/* Encabezado de grupo con separador punteado */}
        <tr className="bg-gray-50/40 dark:bg-white/[0.01]">
          <td colSpan={5} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={grupoSeleccionado}
                onChange={toggleGrupo}
                aria-label={`Seleccionar grupo ${grupo.titulo}`}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {grupo.titulo} ({grupo.operadores.length})
              </span>
              <div className="h-px flex-1 border-b border-dashed border-gray-200 dark:border-gray-800" />
            </div>
          </td>
        </tr>

        {/* Filas del grupo */}
        {grupo.operadores.map((op) => (
          <FilaEquipo
            key={op.id}
            op={op}
            seleccionado={!!seleccionados[op.id]}
            onToggleSeleccion={() => onToggleSeleccion(op.id)}
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
    seleccionado,
    onToggleSeleccion,
    isMenuOpen,
    onToggleMenu,
    onCloseMenu,
    onAbrir,
  }: {
    op: Operador;
    seleccionado: boolean;
    onToggleSeleccion: () => void;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    onAbrir: () => void;
  }) => {
    const navigate = useNavigate();
    const rol = rolesStore.porId(op.rolId);
    const capacidades = rolesStore.capacidadesEfectivas(op);
    const ajustes = tieneAjustes(op);
    const stats = obtenerStats(op);
    const puedeVerComo = op.estado === "activo";

    const verComo = () => {
      if (!puedeVerComo) return;
      onCloseMenu();
      sessionStore.simular(op.id);
      navigate(sessionStore.homePathActual);
    };

    // Determinación del badge de User Type (Rol)
    let userTypeConfig = {
      label: rol?.nombre || "Operador",
      color: "dark" as const,
      className: "bg-gray-800 text-white dark:bg-gray-700",
    };

    if (op.rolId === "admin_tienda") {
      userTypeConfig = {
        label: "Admin",
        color: "primary" as const,
        className: "bg-[#635BFF] text-white",
      };
    } else if (op.rolId === "supervisor_pedidos") {
      userTypeConfig = {
        label: "Supervisor",
        color: "info" as const,
        className: "bg-blue-600 text-white",
      };
    } else if (op.rolId === "vendedor") {
      userTypeConfig = {
        label: "Vendedor",
        color: "dark" as const,
        className: "bg-slate-700 text-white",
      };
    }

    // Determinación del badge de Access
    let accessBadge = {
      label: "Partial Access",
      color: "light" as const,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };

    if (op.rolId === "admin_tienda" || capacidades.length >= 16) {
      accessBadge = {
        label: "Full Access",
        color: "error" as const,
        className: "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
      };
    } else if (ajustes) {
      accessBadge = {
        label: "Custom Access",
        color: "warning" as const,
        className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      };
    }

    return (
      <TableRow className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
        {/* Checkbox de selección */}
        <TableCell className="w-12 px-4 py-4">
          <input
            type="checkbox"
            checked={seleccionado}
            onChange={onToggleSeleccion}
            aria-label={`Seleccionar ${op.nombre}`}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
          />
        </TableCell>

        {/* Columna 1: Name & Designation */}
        <TableCell className="py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onAbrir}>
            <Avatar
              src={op.avatarUrl || ""}
              initials={obtenerIniciales(op.nombre)}
              size="medium"
              alt={op.nombre}
              className="ring-2 ring-gray-100 dark:ring-gray-800 shadow-sm flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {op.nombre}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {op.cargo || op.email}
              </span>
            </div>
          </div>
        </TableCell>

        {/* Columna 2: Task Status */}
        <TableCell className="py-4">
          <div className="flex items-center gap-2">
            {/* Active Tasks Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50/90 border border-gray-200/80 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:bg-gray-800/60 dark:border-gray-700">
              <span className="text-blue-500">
                <TaskIcon className="h-3.5 w-3.5" />
              </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{stats.activas}</span>
              <span className="text-gray-500 dark:text-gray-400">Active Tasks</span>
            </div>

            {/* Completed Tasks Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50/90 border border-gray-200/80 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:bg-gray-800/60 dark:border-gray-700">
              <span className="text-emerald-500">
                <CheckCircleIcon className="h-3.5 w-3.5" />
              </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{stats.completadas}</span>
              <span className="text-gray-500 dark:text-gray-400">Completed</span>
            </div>
          </div>
        </TableCell>

        {/* Columna 3: User Type & Access */}
        <TableCell className="py-4">
          <div className="flex items-center gap-2">
            {/* User Type Badge con icono */}
            <Badge
              variant="solid"
              size="sm"
              className={`${userTypeConfig.className} font-medium px-2.5 py-0.5 rounded-lg shadow-sm`}
              startIcon={<UserIcon className="h-3 w-3 stroke-current" />}
            >
              {userTypeConfig.label}
            </Badge>

            {/* Access Badge */}
            <Badge
              variant="light"
              size="sm"
              className={`${accessBadge.className} font-medium px-2.5 py-0.5 rounded-lg`}
            >
              {accessBadge.label}
            </Badge>
          </div>
        </TableCell>

        {/* Columna 4: Actions */}
        <TableCell className="py-4 text-right pr-6">
          <div className="flex items-center justify-end gap-3 relative">
            {/* View Profile Link/Button */}
            <button
              onClick={onAbrir}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              <span>View Profile</span>
              <span className="text-xs">&gt;</span>
            </button>

            {/* Context Menu Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMenu();
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
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
                  <DropdownItem
                    onClick={() => {
                      operadoresStore.aprobar(op.id);
                      onCloseMenu();
                    }}
                  >
                    <span className="text-emerald-600 font-medium">Aprobar operador</span>
                  </DropdownItem>
                )}

                {op.estado === "activo" && (
                  <DropdownItem
                    onClick={() => {
                      operadoresStore.desactivar(op.id);
                      onCloseMenu();
                    }}
                  >
                    <span className="text-amber-600 font-medium">Suspender</span>
                  </DropdownItem>
                )}

                {op.estado === "inactivo" && (
                  <DropdownItem
                    onClick={() => {
                      operadoresStore.activar(op.id);
                      onCloseMenu();
                    }}
                  >
                    <span className="text-emerald-600 font-medium">Activar</span>
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
