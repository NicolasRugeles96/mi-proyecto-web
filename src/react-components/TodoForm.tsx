import * as React from "react";
import * as Firestore from "firebase/firestore";
import { getCollection, updateDocument } from "../firebase";
import { ITodo, Todo, TodoPriority, TodoStatus } from "../classes/Todo";

interface Props {
  projectId: string;

  /** si viene null => modo crear; si viene todo => modo editar */
  todoToEdit: Todo | null;

  onCancel: () => void;

  /**
   * Devuelve el todo ya listo para UI (con id).
   * ProjectTasksList lo mete/actualiza en el state sin recargar toda la lista.
   */
  onSaved: (saved: Todo) => void;
}

const defaultValues: ITodo = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  guids: [],
};

export function TodoForm(props: Props) {
  const isEdit = Boolean(props.todoToEdit);

  const [title, setTitle] = React.useState(defaultValues.title);
  const [description, setDescription] = React.useState(defaultValues.description);
  const [status, setStatus] = React.useState<TodoStatus>(defaultValues.status);
  const [priority, setPriority] = React.useState<TodoPriority>(defaultValues.priority);
  const [saving, setSaving] = React.useState(false);

  // Si cambia el todo a editar, sincronizamos el formulario
  React.useEffect(() => {
    if (!props.todoToEdit) {
      setTitle(defaultValues.title);
      setDescription(defaultValues.description);
      setStatus(defaultValues.status);
      setPriority(defaultValues.priority);
      return;
    }

    setTitle(props.todoToEdit.title);
    setDescription(props.todoToEdit.description);
    setStatus(props.todoToEdit.status);
    setPriority(props.todoToEdit.priority);
  }, [props.todoToEdit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const payload: ITodo = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        guids: props.todoToEdit?.guids ?? [], // mantenemos el schema estable
      };

      // Guardaremos ToDos como subcolección del proyecto.
      // Puedes llamarla "todos" o "activities". Yo usaré "activities" por compatibilidad BIM típica.
      const path = `/projects/${props.projectId}/activities`;

      if (!isEdit) {
        const col = getCollection<ITodo>(path);
        const docRef = await Firestore.addDoc(col, payload);

        props.onSaved({ id: docRef.id, ...payload });
      } else {
        const id = props.todoToEdit!.id;
        await updateDocument(path, id, payload);

        props.onSaved({ id, ...payload });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ margin: 0 }}>
        {isEdit ? "Edit ToDo" : "New ToDo"}
      </h3>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Title
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Install windows in Level 2"
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        Description
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
        />
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as TodoStatus)}>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
        <button type="button" className="btn-secondary" onClick={props.onCancel} disabled={saving}>
          Cancel
        </button>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
