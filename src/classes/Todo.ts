export type TodoStatus = "todo" | "in-progress" | "done";
export type TodoPriority = "low" | "medium" | "high";

export interface ITodo {
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;

  /**
   * Importante para evitar errores si en algún sitio se hace entry.guids.includes(...)
   * (si no lo usas, igual lo guardamos como [] para mantener el schema estable)
   */
  guids: string[];
}

/** Objeto listo para UI (incluye id de Firestore) */
export interface Todo extends ITodo {
  id: string;
}
