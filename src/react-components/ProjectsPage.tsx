import * as React from "react";
import * as Router from "react-router-dom";
import * as Firestore from "firebase/firestore";
import { IProject, Project } from "../classes/Project";
import { ProjectCard } from "./ProjectCard";
import { SearchBox } from "./SearchBox";
import { ProjectsManager } from "../classes/ProjectsManager";
import { getCollection } from "../firebase";
import { appIcons } from "../globals";

// ✅ Importa el componente (ajusta la ruta si hace falta)
import { ProjectsForm } from "../react-components/ProjectsForm";

interface Props {
  projectsManager: ProjectsManager;
}

const projectsCollection = getCollection<IProject>("projects");

export function ProjectsPage(props: Props) {
  const [projects, setProjects] = React.useState<Project[]>(
    props.projectsManager.list
  );

  // ✅ dialog ref (React correcto)
  const newProjectDialogRef = React.useRef<HTMLDialogElement>(null);

  // ✅ refrescar UI cuando se crea
  props.projectsManager.OnProjectCreated = () => {
    setProjects([...props.projectsManager.list]);
  };

  // ✅ refrescar UI cuando se actualiza
  props.projectsManager.OnProjectUpdated = () => {
    setProjects([...props.projectsManager.list]);
  };

  const getFirestoreProjects = async () => {
    const firebaseProjects = await Firestore.getDocs(projectsCollection);

    for (const doc of firebaseProjects.docs) {
      const data = doc.data();
      const project: IProject = {
        ...data,
        finishDate: (data.finishDate as unknown as Firestore.Timestamp).toDate(),
      };

      try {
        props.projectsManager.newProject(project, doc.id);
      } catch (error) {
        // Ignora duplicados u otros errores
      }
    }
  };

  React.useEffect(() => {
    getFirestoreProjects();
  }, []);

  const projectCards = projects.map((project) => {
    return (
      <Router.Link to={`/project/${project.id}`} key={project.id}>
        <ProjectCard project={project} />
      </Router.Link>
    );
  });

  React.useEffect(() => {
    console.log("Projects state updated", projects);
  }, [projects]);

  // ✅ abrir modal (sin getElementById)
  const onNewProjectClick = () => {
    newProjectDialogRef.current?.showModal();
  };

  // ✅ cerrar modal
  const closeNewProjectModal = () => {
    newProjectDialogRef.current?.close();
  };

  const onExportProject = () => {
    props.projectsManager.exportToJSON();
  };

  const onImportProject = () => {
    props.projectsManager.importFromJSON();
  };

  const onProjectSearch = (value: string) => {
    setProjects(props.projectsManager.filterProjects(value));
  };

  return (
    <div className="page" id="projects-page" style={{ display: "flex" }}>
      <dialog ref={newProjectDialogRef} id="new-project-modal">
        <ProjectsForm
          projectsManager={props.projectsManager}
          mode="create"
          onCancel={closeNewProjectModal}
          onSuccess={closeNewProjectModal}
        />
      </dialog>

      <header>
        <bim-label style={{ fontSize: "1.3rem", color: "white" }}>
          Projects List
        </bim-label>

        <SearchBox onChange={(value) => onProjectSearch(value)} />

        <div style={{ display: "flex", alignItems: "center", columnGap: 15 }}>
          <bim-button
            onclick={onImportProject}
            icon={appIcons.UPLOAD}
            label="Upload"
          ></bim-button>

          <bim-button
            onclick={onExportProject}
            icon={appIcons.DOWNLOAD}
            label="Download"
          ></bim-button>

          <bim-button
            onclick={onNewProjectClick}
            icon={appIcons.ADD}
            label="New Project"
          ></bim-button>
        </div>
      </header>

      {projects.length > 0 ? (
        <div id="projects-list">{projectCards}</div>
      ) : (
        <p>There is no projects to display!</p>
      )}
    </div>
  );
}
