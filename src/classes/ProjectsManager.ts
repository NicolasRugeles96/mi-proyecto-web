import { IProject, Project } from "./Project"

export class ProjectsManager {
  list: Project[] = []
  OnProjectCreated = (project: Project) => {}
  OnProjectDeleted = (id: string) => {}

  // ✅ nuevo callback: notifica cuando se actualiza un proyecto
  OnProjectUpdated = (project: Project) => {}

  filterProjects(value: string) {
    const filteredProjects = this.list.filter((project) => {
      return project.name.includes(value)
    })
    return filteredProjects
  }

  newProject(data: IProject, id?: string) {
    const projectNames = this.list.map((project) => {
      return project.name
    })
    const nameInUse = projectNames.includes(data.name)
    if (nameInUse) {
      throw new Error(`A project with the name "${data.name}" already exists`)
    }

    const project = new Project(data, id)
    this.list.push(project)
    this.OnProjectCreated(project)
    return project
  }

  getProject(id: string) {
    const project = this.list.find((project) => {
      return project.id === id
    })
    return project
  }

  // ✅ actualizar un proyecto existente
  updateProject(id: string, data: Partial<IProject>) {
    const project = this.getProject(id)
    if (!project) {
      throw new Error("Project not found.")
    }

    // ✅ si cambia el nombre, validamos que no choque con otro proyecto
    if (data.name && data.name !== project.name) {
      const nameExists = this.list.some((p) => p.name === data.name && p.id !== id)
      if (nameExists) {
        throw new Error(`A project with the name "${data.name}" already exists`)
      }
    }

    // ✅ aplicamos cambios (solo lo que venga)
    if (data.name !== undefined) project.name = data.name
    if (data.description !== undefined) project.description = data.description
    if (data.status !== undefined) project.status = data.status
    if (data.userRole !== undefined) project.userRole = data.userRole
    if (data.finishDate !== undefined) project.finishDate = data.finishDate

    // ✅ avisamos a la UI
    this.OnProjectUpdated(project)

    return project
  }

  deleteProject(id: string) {
    const project = this.getProject(id)
    if (!project) {
      return
    }
    const remaining = this.list.filter((project) => {
      return project.id !== id
    })
    this.list = remaining
    this.OnProjectDeleted(id)
  }

  exportToJSON(fileName: string = "projects") {
    const json = JSON.stringify(this.list, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  importFromJSON() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      const json = reader.result
      if (!json) {
        return
      }
      const projects: IProject[] = JSON.parse(json as string)
      for (const project of projects) {
        try {
          this.newProject(project)
        } catch (error) {
          // Ignoramos proyectos duplicados u otros errores de importación
        }
      }
    })
    input.addEventListener("change", () => {
      const filesList = input.files
      if (!filesList) {
        return
      }
      reader.readAsText(filesList[0])
    })
    input.click()
  }
}
