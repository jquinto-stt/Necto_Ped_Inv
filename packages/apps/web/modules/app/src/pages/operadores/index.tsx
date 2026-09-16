import { OperadoresPage } from "./OperadoresPage";

/**
 * Operadores del módulo Turnos.
 *
 * Pantalla **legacy**: gobierna el acceso con `permisos` (secciones marcadas a
 * mano), que es el modelo congelado para turnos y agendamiento (contrato §5).
 */
export const OperadoresTurnosPage = () => <OperadoresPage modulo="turnos" />;

/**
 * Operadores del módulo Agendamiento. Pantalla legacy, igual que la de Turnos.
 */
export const OperadoresAgendamientoPage = () => <OperadoresPage modulo="agendamiento" />;

// Nota: pedidos YA NO usa esta pantalla. Tiene la suya en `pages/pedidos/equipo`
// (personas con rol + capacidades, y una pestaña de roles). La ruta
// `/pedidos/operadores` redirige a `/pedidos/equipo`.

export { OperadoresPage };
