import * as React from "react";
import * as Firestore from "firebase/firestore";
import { deleteDocument, getCollection } from "../firebase";
import { SearchBox } from "./SearchBox";
import { Todo } from "../classes/Todo";
import { TodoCard } from "./TodoCard";
import { TodoForm } from "./TodoForm";

interface Props {
  projectId: string;
}

export function ProjectTasksList(props: Props) {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const [todoToEdit, setTodoToEdit] = React.useState<Todo | null>(null);
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  const openNew = () => {
    setTodoToEdit(null);
    dialogRef.current?.showModal();
  };

  const openEdit = (todo: Todo) => {
    setTodoToEdit(todo);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  const loadTodos = React.useCallback(async () => {
    setLoading(true);
    try {
      const path = `/projects/${props.projectId}/activities`;
      const col = getCollection<any>(path);
      const snap = await Firestore.getDocs(col);

      const data: Todo[] = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          title: raw.title ?? "",
          description: raw.description ?? "",
          status: raw.status ?? "todo",
          priority: raw.priority ?? "medium",
          guids: raw.guids ?? [],
        };
      });

      setTodos(data);
    } finally {
      setLoading(false);
    }
  }, [props.projectId]);

  React.useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const onSaved = (saved: Todo) => {
    setTodos((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      if (!exists) return [saved, ...prev];
      return prev.map((t) => (t.id === saved.id ? saved : t));
    });
    closeDialog();
  };

  const onDelete = async (todo: Todo) => {
    const ok = confirm(`Delete "${todo.title}"?`);
    if (!ok) return;

    const path = `/projects/${props.projectId}/activities`;
    await deleteDocument(path, todo.id);

    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
  };

  const filtered = todos.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="dashboard-card" style={{ padding: 20, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h3 style={{ margin: 0 }}>ToDos</h3>
        <button onClick={openNew}>New</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <SearchBox
          width="100%"
          placeholder="Search To-Do's by name..."
          onChange={setSearch}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {loading && <p style={{ color: "#969696" }}>Loading...</p>}

        {!loading && filtered.length === 0 && (
          <p style={{ color: "#969696" }}>No ToDos found.</p>
        )}

        {filtered.map((todo) => (
          <TodoCard key={todo.id} todo={todo} onEdit={openEdit} onDelete={onDelete} />
        ))}
      </div>

      <dialog ref={dialogRef} className="form-dialog">
        <TodoForm
          projectId={props.projectId}
          todoToEdit={todoToEdit}
          onCancel={closeDialog}
          onSaved={onSaved}
        />
      </dialog>
    </div>
  );
}
