// src/react-components/ProjectsForm.tsx
import * as React from "react";
import * as Firestore from "firebase/firestore";
import { getCollection, updateDocument } from "../firebase";
import type { IProject, ProjectStatus, UserRole } from "../classes/Project";
import type { Project } from "../classes/Project";
import type { ProjectsManager } from "../classes/ProjectsManager";

type ProjectsFormMode = "create" | "edit";

interface ProjectsFormProps {
  projectsManager: ProjectsManager;

  // ✅ "create" para crear, "edit" para editar
  mode: ProjectsFormMode;

  // ✅ obligatorio en modo "edit" (el proyecto a editar)
  project?: Project;

  // ✅ el padre normalmente usará esto para cerrar el <dialog>
  onCancel?: () => void;

  // ✅ opcional: por si quieres hacer algo extra al guardar
  onSuccess?: (project: Project) => void;
}

// 🔧 Helpers: formatear fecha para <input type="date">
const pad2 = (n: number) => String(n).padStart(2, "0");
const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

// 🔧 Helpers: normalizar strings por si vienen con mayúsculas (compatibilidad)
const normalizeStatus = (raw: string): ProjectStatus => {
  const v = raw.trim().toLowerCase();
  if (v === "pending") return "pending";
  if (v === "active") return "active";
  if (v === "finished") return "finished";
  return "pending";
};

const normalizeRole = (raw: string): UserRole => {
  const v = raw.trim().toLowerCase();
  if (v === "architect") return "architect";
  if (v === "engineer") return "engineer";
  if (v === "developer") return "developer";
  if (v === "management") return "management";
  return "architect";
};

export function ProjectsForm(props: ProjectsFormProps) {
  // ✅ colección Firestore (igual que en tu ProjectsPage)
  const projectsCollection = React.useMemo(
    () => getCollection<IProject>("projects"),
    [],
  );

  const isEdit = props.mode === "edit";

  // ✅ valores iniciales (si editas, precarga; si creas, defaults)
  const initialName = isEdit && props.project ? props.project.name : "";
  const initialDescription =
    isEdit && props.project ? props.project.description : "";

  const initialStatus: ProjectStatus =
    isEdit && props.project ? normalizeStatus(String(props.project.status)) : "pending";

  const initialRole: UserRole =
    isEdit && props.project ? normalizeRole(String(props.project.userRole)) : "architect";

  const initialFinishDate =
    isEdit && props.project
      ? toDateInputValue(props.project.finishDate)
      : toDateInputValue(new Date());

  // ✅ estado del formulario (controlado)
  const [name, setName] = React.useState(initialName);
  const [description, setDescription] = React.useState(initialDescription);
  const [status, setStatus] = React.useState<ProjectStatus>(initialStatus);
  const [userRole, setUserRole] = React.useState<UserRole>(initialRole);
  const [finishDate, setFinishDate] = React.useState(initialFinishDate);

  // ✅ UX: loading + errores
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ✅ si cambia el proyecto (modo edit), re-sincroniza el estado
  React.useEffect(() => {
    if (!isEdit || !props.project) return;
    setName(props.project.name);
    setDescription(props.project.description);
    setStatus(normalizeStatus(String(props.project.status)));
    setUserRole(normalizeRole(String(props.project.userRole)));
    setFinishDate(toDateInputValue(props.project.finishDate));
  }, [isEdit, props.project]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✅ validación mínima
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData: IProject = {
        name: name.trim(),
        description: description.trim(),
        status,
        userRole,
        finishDate: new Date(finishDate),
      };

      // =========================
      // ✅ CREATE
      // =========================
      if (!isEdit) {
        // 1) Guardar en Firestore y obtener el ID real
        const docRef = await Firestore.addDoc(projectsCollection, projectData);

        // 2) Crear localmente usando el mismo ID de Firestore
        const created = props.projectsManager.newProject(projectData, docRef.id);

        // 3) Avisar al padre y cerrar
        props.onSuccess?.(created);
        props.onCancel?.();
        return;
      }

      // =========================
      // ✅ EDIT
      // =========================
      if (!props.project) {
        throw new Error("Missing project to edit.");
      }

      // 1) Actualizar Firestore
      await updateDocument<IProject>("/projects", props.project.id, projectData);

      // 2) Actualizar local
      const updated = props.projectsManager.updateProject(props.project.id, projectData);

      // 3) Avisar al padre y cerrar
      props.onSuccess?.(updated);
      props.onCancel?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} id={isEdit ? "edit-project-form" : "new-project-form"}>
      <h2>{isEdit ? "Edit Project" : "New Project"}</h2>

      {/* ✅ error visible */}
      {error && (
        <p style={{ color: "#ff6b6b", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}

      <div className="input-list">
        <div className="form-field-container">
          <label>
            <span className="material-icons-round">apartment</span>
            Name
          </label>
          <input
            name="name"
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-field-container">
          <label>
            <span className="material-icons-round">article</span>
            Description
          </label>
          <textarea
            name="description"
            placeholder="Project description"
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-field-container">
          <label>
            <span className="material-icons-round">work</span>
            Role
          </label>
          <select
            name="userRole"
            value={userRole}
            onChange={(ev) => setUserRole(normalizeRole(ev.target.value))}
            disabled={isSubmitting}
          >
            <option value="architect">Architect</option>
            <option value="engineer">Engineer</option>
            <option value="developer">Developer</option>
            <option value="management">Management</option>
          </select>
        </div>

        <div className="form-field-container">
          <label>
            <span className="material-icons-round">flag</span>
            Status
          </label>
          <select
            name="status"
            value={status}
            onChange={(ev) => setStatus(normalizeStatus(ev.target.value))}
            disabled={isSubmitting}
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="finished">Finished</option>
          </select>
        </div>

        <div className="form-field-container">
          <label>
            <span className="material-icons-round">calendar_month</span>
            Finish date
          </label>
          <input
            name="finishDate"
            type="date"
            value={finishDate}
            onChange={(ev) => setFinishDate(ev.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="btns-container">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => props.onCancel?.()}
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
