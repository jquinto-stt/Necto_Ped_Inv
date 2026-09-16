import { useNavigate } from "react-router";
import { observer } from "mobx-react-lite";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/elements/ui/table";
import { operadoresStore, rolesStore, sessionStore, type Operador } from "@/stores";
import { ESTADO_META, resumenGrupos } from "./equipo.constants";

// ═══════════════════════════════════════════════════════════════════════════
// TABLA DEL EQUIPO
// ═══════════════════════════════════════════════════════════════════════════
//
// Columnas: Nombre · Correo · Rol · Capacidades · Estado · Acciones.
//
// La columna "Rol" y la de "Capacidades" son la diferencia frente a la pantalla
// legacy de Operadores: allí se listaban las secciones que la persona podía
// ver; aquí se muestra **qué rol tiene** y qué grupos de capacidades le
// conceden sus capacidades efectivas (rol ∪ extras \ removidas).
//
// El clic en la fila NAVEGA al perfil (`/pedidos/equipo/:id`) en vez de abrir un
// modal: un perfil con editor de rol y 16 capacidades no cabe bien en un modal,
// y una ruta se puede compartir y recargar.
//
// ═══════════════════════════════════════════════════════════════════════════

/** true si la persona tiene excepciones sobre las capacidades de su rol. */
function tieneAjustes(op: Operador): boolean {
  return (op.capacidadesExtra?.length ?? 0) > 0 || (op.capacidadesRemovidas?.length ?? 0) > 0;
}

export const EquipoTabla = observer(({ operadores }: { operadores: Operador[] }) => {
  const navigate = useNavigate();

  if (operadores.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay personas que coincidan con el filtro.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Nombre</TableCell>
              <TableCell header>Correo electrónico</TableCell>
              <TableCell header>Rol</TableCell>
              <TableCell header>Capacidades</TableCell>
              <TableCell header>Estado</TableCell>
              <TableCell header className="text-right">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operadores.map((op) => (
              <FilaEquipo key={op.id} op={op} onAbrir={() => navigate(`/pedidos/equipo/${op.id}`)} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// FILA
// ═══════════════════════════════════════════════════════════════════════════

const FilaEquipo = observer(({ op, onAbrir }: { op: Operador; onAbrir: () => void }) => {
  const navigate = useNavigate();
  const estado = ESTADO_META[op.estado];
  const rol = rolesStore.porId(op.rolId);
  const capacidades = rolesStore.capacidadesEfectivas(op);
  const grupos = resumenGrupos(capacidades);
  const ajustes = tieneAjustes(op);

  // Las celdas informativas son clickeables; la de acciones no (para no
  // disparar la navegación al pulsar un botón).
  const celdaClickeable = "cursor-pointer transition-colors";

  // "Ver como" solo tiene sentido sobre una persona activa: `simular()` rechaza
  // a las pendientes y suspendidas (invariante C8). Se muestra deshabilitado en
  // vez de oculto para que el admin entienda por qué no puede.
  const puedeVerComo = op.estado === "activo";

  const verComo = () => {
    if (!puedeVerComo) return;
    sessionStore.simular(op.id);
    // Al simular, la sesión pierde `team.manage` (el rol de la persona no lo
    // tiene), así que quedarse en /pedidos/equipo mostraría "sin acceso".
    // Navegamos al inicio que la persona SÍ puede ver.
    navigate(sessionStore.homePathActual);
  };

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
      <TableCell className={`font-medium text-gray-800 dark:text-white/90 ${celdaClickeable}`}>
        <div onClick={onAbrir}>{op.nombre}</div>
      </TableCell>

      <TableCell className={`text-gray-500 dark:text-gray-400 ${celdaClickeable}`}>
        <div onClick={onAbrir}>{op.email}</div>
      </TableCell>

      <TableCell className={celdaClickeable}>
        <div onClick={onAbrir}>
          {rol ? (
            <span className="text-sm text-gray-700 dark:text-gray-300">{rol.nombre}</span>
          ) : (
            <span className="text-sm text-gray-400">Sin rol</span>
          )}
        </div>
      </TableCell>

      <TableCell className={celdaClickeable}>
        <div onClick={onAbrir} className="flex flex-wrap items-center gap-1">
          {grupos.length > 0 ? (
            <>
              {grupos.map((g) => (
                <Badge key={g} color="info" size="sm">{g}</Badge>
              ))}
              {ajustes && (
                <span title="Tiene capacidades ajustadas a mano respecto a su rol">
                  <Badge color="warning" size="sm">Ajustes</Badge>
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">Sin acceso</span>
          )}
        </div>
      </TableCell>

      <TableCell className={celdaClickeable}>
        <div onClick={onAbrir}>
          <Badge color={estado.color} size="sm">{estado.label}</Badge>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {/* El `title` va en un envoltorio, no en el Button: `ButtonProps` no lo
              acepta, y además un botón deshabilitado no emite eventos de ratón
              en todos los navegadores, así que el tooltip debe vivir fuera. */}
          <span title={puedeVerComo ? `Entrar como ${op.nombre}` : "Solo se puede ver como una persona activa"}>
            <Button size="sm" variant="ghost" disabled={!puedeVerComo} onClick={verComo}>
              Ver como
            </Button>
          </span>

          {op.estado === "pendiente" && (
            <Button size="sm" onClick={() => operadoresStore.aprobar(op.id)}>Aprobar</Button>
          )}
          {op.estado === "activo" && (
            <Button size="sm" variant="outline" onClick={() => operadoresStore.desactivar(op.id)}>Suspender</Button>
          )}
          {op.estado === "inactivo" && (
            <Button size="sm" variant="outline" onClick={() => operadoresStore.activar(op.id)}>Activar</Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});
