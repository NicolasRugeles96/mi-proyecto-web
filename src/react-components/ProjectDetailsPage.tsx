import * as React from "react";
import * as Router from "react-router-dom";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";

import { ProjectsManager } from "../classes/ProjectsManager";
import { deleteDocument } from "../firebase";

import * as TEMPLATES from "../ui-templates";
import { setupComponents } from "../bim-components";
import { ComponentsGrid } from "../ui-templates/grids/components/src";

import { ProjectTasksList } from "./ProjectTasksList";

interface Props {
  projectsManager: ProjectsManager;
}

export function ProjectDetailsPage(props: Props) {
  const routeParams = Router.useParams<{ id: string }>();
  if (!routeParams.id) {
    return <p>Project ID is needed to see this page</p>;
  }

  const project = props.projectsManager.getProject(routeParams.id);
  if (!project) {
    return <p>The project with ID {routeParams.id} wasn't found.</p>;
  }

  const navigateTo = Router.useNavigate();

  // 🔥 Cuando el manager borra localmente, borramos en Firestore y navegamos
  props.projectsManager.OnProjectDeleted = async (id) => {
    await deleteDocument("/projects", id);
    navigateTo("/");
  };

  // ✅ Este ref apunta al <bim-grid /> del viewer
  const viewerGrid = React.useRef<BUI.Grid<["Main"]>>(null);

  // ✅ Guardamos el engineManager en un ref para que no se pierda entre renders
  const engineManagerRef = React.useRef<OBC.Components | null>(null);

  const setupGrid = async () => {
    const { current: grid } = viewerGrid;
    if (!grid) return;

    const { components, viewport } = await setupComponents();
    engineManagerRef.current = components;

    grid.elements = {
      sidebar: {
        template: TEMPLATES.gridSidebarTemplate,
        initialState: {},
      },
      componentsGrid: {
        template: TEMPLATES.componentsGridTemplate,
        initialState: { components, viewport },
      },
    };

    grid.layouts = {
      Main: {
        template: `
          "sidebar" auto
          "componentsGrid" 1fr
          /1fr
        `,
      },
    };

    grid.addEventListener(
      "elementcreated",
      (e: CustomEvent<BUI.ElementCreatedEventDetail<ComponentsGrid>>) => {
        const { name, element: componentsGrid } = e.detail;
        if (name !== "componentsGrid") return;
        grid.updateComponent.sidebar({ grid: componentsGrid });
      },
    );

    grid.layout = "Main";
  };

  React.useEffect(() => {
    setupGrid();

    return () => {
      engineManagerRef.current?.dispose();
      engineManagerRef.current = null;
    };
  }, []);

  return (
    <main id="project-details" className="page">
      <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {project.name}
          </h2>
          <p style={{ color: "#969696", margin: "6px 0 0" }}>
            {project.description}
          </p>
        </div>

        <button
          onClick={() => props.projectsManager.deleteProject(project.id)}
          style={{ backgroundColor: "#b33a3a" }}
        >
          Delete Project
        </button>
      </header>

      <div className="main-page-content">
        {/* 🧩 Columna izquierda: ToDos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 30, minWidth: 0 }}>
          <ProjectTasksList projectId={project.id} />
        </div>

        {/* 🎥 Columna derecha: viewer + tools */}
        <bim-grid ref={viewerGrid} className="viewer-grid" />
      </div>
    </main>
  );
}
