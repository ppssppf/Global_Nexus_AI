// Application State
const APP = {
  projects: [],
  currentRole: "developer",
  currentProjectId: null,
  init() {
    this.loadFromStorage()
    this.setupEventListeners()
    this.updateUI()
    this.checkManagerAccess()
  },

  loadFromStorage() {
    const stored = localStorage.getItem("mvmNexusProjects")
    if (stored) {
      this.projects = JSON.parse(stored)
    } else {
      // Demo data
      this.projects = [
        {
          id: Date.now() - 1000000,
          name: "Sistema de Recomendaciones con ML",
          description:
            "Implementación de sistema de recomendaciones usando aprendizaje automático para personalizar la experiencia del usuario.",
          leader: "Ana García",
          company: "TechCorp SA",
          aiLevel: "profundo",
          status: "aprobado",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 6,
          incentives: ["economico", "formacion"],
          startDate: "2024-11-01",
          endDate: "2025-05-01",
          progress: 45,
          aiUsage: "verificado",
          progressNotes: "Desarrollo en curso, usando GitHub Copilot y ChatGPT para generación de código",
        },
      ]
    }
  },

  saveToStorage() {
    localStorage.setItem("mvmNexusProjects", JSON.stringify(this.projects))
  },

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const module = e.target.dataset.module
        this.switchModule(module)
      })
    })

    // Role selector
    document.getElementById("roleSelector").addEventListener("change", (e) => {
      this.currentRole = e.target.value
      this.checkManagerAccess()
      this.updateUI()
    })

    // Project Modal
    document.getElementById("newProjectBtn").addEventListener("click", () => {
      this.openProjectModal()
    })

    document.getElementById("projectForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveProject()
    })

    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.closeModal("projectModal")
    })

    // Approval Modal
    document.getElementById("approvalForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.approveProject()
    })

    document.getElementById("rejectBtn").addEventListener("click", () => {
      this.rejectProject()
    })

    document.getElementById("cancelApprovalBtn").addEventListener("click", () => {
      this.closeModal("approvalModal")
    })

    // Progress Modal
    document.getElementById("progressPercentage").addEventListener("input", (e) => {
      document.getElementById("progressValue").textContent = e.target.value + "%"
    })

    document.getElementById("progressForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.updateProgress()
    })

    document.getElementById("cancelProgressBtn").addEventListener("click", () => {
      this.closeModal("progressModal")
    })

    // Close modal buttons
    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal")
        this.closeModal(modal.id)
      })
    })

    // History filters
    document.getElementById("filterLeader").addEventListener("input", () => this.renderHistory())
    document.getElementById("filterCompany").addEventListener("input", () => this.renderHistory())
    document.getElementById("filterStatus").addEventListener("change", () => this.renderHistory())
    document.getElementById("clearFilters").addEventListener("click", () => {
      document.getElementById("filterLeader").value = ""
      document.getElementById("filterCompany").value = ""
      document.getElementById("filterStatus").value = ""
      this.renderHistory()
    })
  },

  switchModule(moduleName) {
    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
    })
    event.target.classList.add("active")

    // Update modules
    document.querySelectorAll(".module").forEach((module) => {
      module.classList.remove("active")
    })
    document.getElementById(`${moduleName}-module`).classList.add("active")

    // Render content
    this.updateUI()
  },

  checkManagerAccess() {
    const managerLinks = document.querySelectorAll(".manager-only")
    if (this.currentRole === "manager") {
      managerLinks.forEach((link) => link.classList.add("enabled"))
    } else {
      managerLinks.forEach((link) => link.classList.remove("enabled"))
    }
  },

  updateUI() {
    this.renderProjects()
    this.renderPendingApprovals()
    this.renderTracking()
    this.renderHistory()
  },

  // Project Management Module
  openProjectModal(projectId = null) {
    this.currentProjectId = projectId
    const modal = document.getElementById("projectModal")
    const form = document.getElementById("projectForm")

    if (projectId) {
      const project = this.projects.find((p) => p.id === projectId)
      document.getElementById("modalTitle").textContent = "Editar Proyecto"
      document.getElementById("projectName").value = project.name
      document.getElementById("projectDescription").value = project.description
      document.getElementById("projectLeader").value = project.leader
      document.getElementById("projectCompany").value = project.company
      document.getElementById("aiLevel").value = project.aiLevel
      document.getElementById("estimatedDuration").value = project.estimatedDuration || ""
    } else {
      document.getElementById("modalTitle").textContent = "Nuevo Proyecto"
      form.reset()
    }

    modal.classList.add("active")
  },

  saveProject() {
    const name = document.getElementById("projectName").value
    const description = document.getElementById("projectDescription").value
    const leader = document.getElementById("projectLeader").value
    const company = document.getElementById("projectCompany").value
    const aiLevel = document.getElementById("aiLevel").value
    const estimatedDuration = document.getElementById("estimatedDuration").value
    const files = document.getElementById("projectDocuments").files

    if (this.currentProjectId) {
      // Edit existing project
      const project = this.projects.find((p) => p.id === this.currentProjectId)
      project.name = name
      project.description = description
      project.leader = leader
      project.company = company
      project.aiLevel = aiLevel
      project.estimatedDuration = estimatedDuration
      this.showToast("Proyecto actualizado correctamente", "success")
    } else {
      // Create new project
      const newProject = {
        id: Date.now(),
        name,
        description,
        leader,
        company,
        aiLevel,
        estimatedDuration,
        status: "pendiente",
        createdAt: new Date().toISOString(),
        documents: files.length,
        progress: 0,
      }

      this.projects.push(newProject)
      this.showToast(`Proyecto creado y enviado a Departamento de Innovación Tecnológica`, "success")

      // Simulate email notification
      setTimeout(() => {
        this.showToast("📧 Correo de notificación enviado al departamento de aprobación", "info")
      }, 1000)
    }

    this.saveToStorage()
    this.closeModal("projectModal")
    this.updateUI()
  },

  deleteProject(projectId) {
    if (confirm("¿Está seguro de eliminar este proyecto?")) {
      this.projects = this.projects.filter((p) => p.id !== projectId)
      this.saveToStorage()
      this.updateUI()
      this.showToast("Proyecto eliminado", "success")
    }
  },

  renderProjects() {
    const grid = document.getElementById("projectsGrid")
    const userProjects = this.projects.filter((p) => p.status !== "pendiente" || this.currentRole === "developer")

    if (userProjects.length === 0) {
      grid.innerHTML =
        '<div class="empty-state"><h3>No hay proyectos</h3><p>Crea tu primer proyecto usando el botón "Nuevo Proyecto"</p></div>'
      return
    }

    grid.innerHTML = userProjects
      .map(
        (project) => `
            <div class="project-card">
                <div class="project-card-header">
                    <div>
                        <h3>${project.name}</h3>
                        <span class="project-status status-${project.status}">${this.getStatusLabel(project.status)}</span>
                    </div>
                </div>
                <p>${project.description}</p>
                <div class="ai-level ai-${project.aiLevel}">
                    🤖 IA: ${this.getAILevelLabel(project.aiLevel)}
                </div>
                <div class="project-meta">
                    <div class="project-meta-item">
                        <strong>👤 Líder:</strong> ${project.leader}
                    </div>
                    <div class="project-meta-item">
                        <strong>🏢 Empresa:</strong> ${project.company}
                    </div>
                    <div class="project-meta-item">
                        <strong>📅 Creado:</strong> ${new Date(project.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-primary" onclick="APP.openProjectModal(${project.id})">Editar</button>
                    <button class="btn btn-danger" onclick="APP.deleteProject(${project.id})">Eliminar</button>
                </div>
            </div>
        `,
      )
      .join("")
  },

  // Approval Module
  renderPendingApprovals() {
    const container = document.getElementById("pendingProjects")
    const pending = this.projects.filter((p) => p.status === "pendiente")

    if (pending.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><h3>No hay proyectos pendientes</h3><p>Todos los proyectos han sido revisados</p></div>'
      return
    }

    container.innerHTML = pending
      .map(
        (project) => `
            <div class="approval-card">
                <div class="card-content">
                    <div class="card-info">
                        <h3>${project.name}</h3>
                        <p>${project.description}</p>
                        <div class="card-details">
                            <div class="detail-row">
                                <strong>Líder:</strong> <span>${project.leader}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Empresa:</strong> <span>${project.company}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Nivel de IA:</strong> <span class="ai-level ai-${project.aiLevel}">${this.getAILevelLabel(project.aiLevel)}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Duración estimada:</strong> <span>${project.estimatedDuration || "No especificada"} meses</span>
                            </div>
                            <div class="detail-row">
                                <strong>Documentos:</strong> <span>${project.documents || 0} archivo(s)</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-success" onclick="APP.openApprovalModal(${project.id})">Revisar Proyecto</button>
                    </div>
                </div>
            </div>
        `,
      )
      .join("")
  },

  openApprovalModal(projectId) {
    this.currentProjectId = projectId
    const project = this.projects.find((p) => p.id === projectId)
    const modal = document.getElementById("approvalModal")

    document.getElementById("approvalProjectDetails").innerHTML = `
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4 style="color: #2563eb; margin-bottom: 0.5rem;">${project.name}</h4>
                <p style="color: #6b7280; margin-bottom: 0.5rem;">${project.description}</p>
                <div style="display: flex; gap: 1rem;">
                    <span><strong>Líder:</strong> ${project.leader}</span>
                    <span><strong>IA:</strong> ${this.getAILevelLabel(project.aiLevel)}</span>
                </div>
            </div>
        `

    document.getElementById("approvalForm").reset()
    modal.classList.add("active")
  },

  approveProject() {
    const project = this.projects.find((p) => p.id === this.currentProjectId)
    const incentives = Array.from(document.querySelectorAll('input[name="incentive"]:checked')).map((cb) => cb.value)
    const startDate = document.getElementById("approvalStartDate").value
    const endDate = document.getElementById("approvalEndDate").value
    const userStories = document.getElementById("userStories").value
    const requirements = document.getElementById("requirements").value

    project.status = "aprobado"
    project.incentives = incentives
    project.startDate = startDate
    project.endDate = endDate
    project.userStories = userStories
    project.requirements = requirements
    project.approvedAt = new Date().toISOString()

    this.saveToStorage()
    this.closeModal("approvalModal")
    this.updateUI()
    this.showToast(`Proyecto "${project.name}" aprobado con éxito`, "success")
  },

  rejectProject() {
    const project = this.projects.find((p) => p.id === this.currentProjectId)
    project.status = "rechazado"
    project.rejectedAt = new Date().toISOString()

    this.saveToStorage()
    this.closeModal("approvalModal")
    this.updateUI()
    this.showToast(`Proyecto "${project.name}" rechazado`, "error")
  },

  // Tracking Module
  renderTracking() {
    const container = document.getElementById("trackingProjects")
    const approved = this.projects.filter((p) => p.status === "aprobado")

    if (approved.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><h3>No hay proyectos en seguimiento</h3><p>Los proyectos aprobados aparecerán aquí</p></div>'
      return
    }

    container.innerHTML = approved
      .map(
        (project) => `
            <div class="tracking-card">
                <div class="card-content">
                    <div class="card-info">
                        <h3>${project.name}</h3>
                        <div class="card-details">
                            <div class="detail-row">
                                <strong>Líder:</strong> <span>${project.leader}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Período:</strong> <span>${project.startDate} → ${project.endDate}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Uso de IA:</strong> <span>${this.getAIUsageLabel(project.aiUsage || "no-verificado")}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Incentivos:</strong> <span>${this.getIncentivesLabel(project.incentives)}</span>
                            </div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar" style="width: ${project.progress || 0}%">
                                    ${project.progress || 0}%
                                </div>
                            </div>
                        </div>
                        ${project.progressNotes ? `<p style="margin-top: 1rem; color: #6b7280; font-size: 0.9rem;">📝 ${project.progressNotes}</p>` : ""}
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="APP.openProgressModal(${project.id})">Actualizar Progreso</button>
                        ${project.progress >= 100 ? `<button class="btn btn-success" onclick="APP.completeProject(${project.id})">Marcar Completado</button>` : ""}
                    </div>
                </div>
            </div>
        `,
      )
      .join("")
  },

  openProgressModal(projectId) {
    this.currentProjectId = projectId
    const project = this.projects.find((p) => p.id === projectId)
    const modal = document.getElementById("progressModal")

    document.getElementById("progressProjectDetails").innerHTML = `
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4 style="color: #2563eb; margin-bottom: 0.5rem;">${project.name}</h4>
                <p style="color: #6b7280;">Progreso actual: <strong>${project.progress || 0}%</strong></p>
            </div>
        `

    document.getElementById("progressPercentage").value = project.progress || 0
    document.getElementById("progressValue").textContent = (project.progress || 0) + "%"
    document.getElementById("aiUsageVerification").value = project.aiUsage || "no-verificado"
    document.getElementById("progressNotes").value = project.progressNotes || ""

    modal.classList.add("active")
  },

  updateProgress() {
    const project = this.projects.find((p) => p.id === this.currentProjectId)
    const progress = Number.parseInt(document.getElementById("progressPercentage").value)
    const aiUsage = document.getElementById("aiUsageVerification").value
    const notes = document.getElementById("progressNotes").value

    project.progress = progress
    project.aiUsage = aiUsage
    project.progressNotes = notes
    project.lastUpdated = new Date().toISOString()

    this.saveToStorage()
    this.closeModal("progressModal")
    this.updateUI()
    this.showToast("Progreso actualizado correctamente", "success")
  },

  completeProject(projectId) {
    const project = this.projects.find((p) => p.id === projectId)
    project.status = "completado"
    project.completedAt = new Date().toISOString()

    this.saveToStorage()
    this.updateUI()
    this.showToast(`Proyecto "${project.name}" marcado como completado 🎉`, "success")
  },

  // History Module
  renderHistory() {
    const leaderFilter = document.getElementById("filterLeader").value.toLowerCase()
    const companyFilter = document.getElementById("filterCompany").value.toLowerCase()
    const statusFilter = document.getElementById("filterStatus").value

    let filtered = this.projects

    if (leaderFilter) {
      filtered = filtered.filter((p) => p.leader.toLowerCase().includes(leaderFilter))
    }
    if (companyFilter) {
      filtered = filtered.filter((p) => p.company.toLowerCase().includes(companyFilter))
    }
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Update stats
    document.getElementById("totalProjects").textContent = this.projects.length
    document.getElementById("approvedProjects").textContent = this.projects.filter(
      (p) => p.status === "aprobado" || p.status === "completado",
    ).length
    document.getElementById("pendingProjectsCount").textContent = this.projects.filter(
      (p) => p.status === "pendiente",
    ).length
    document.getElementById("rejectedProjects").textContent = this.projects.filter(
      (p) => p.status === "rechazado",
    ).length

    const container = document.getElementById("historyTable")

    if (filtered.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><h3>No se encontraron proyectos</h3><p>Intente ajustar los filtros</p></div>'
      return
    }

    container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Proyecto</th>
                        <th>Líder</th>
                        <th>Empresa</th>
                        <th>Nivel IA</th>
                        <th>Estado</th>
                        <th>Fecha Creación</th>
                        <th>Progreso</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered
                      .map(
                        (project) => `
                        <tr>
                            <td><strong>${project.name}</strong></td>
                            <td>${project.leader}</td>
                            <td>${project.company}</td>
                            <td><span class="ai-level ai-${project.aiLevel}">${this.getAILevelLabel(project.aiLevel)}</span></td>
                            <td><span class="project-status status-${project.status}">${this.getStatusLabel(project.status)}</span></td>
                            <td>${new Date(project.createdAt).toLocaleDateString()}</td>
                            <td>${project.progress || 0}%</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `
  },

  // Utility Functions
  closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active")
  },

  showToast(message, type = "info") {
    const toast = document.getElementById("toast")
    toast.textContent = message
    toast.className = `toast ${type} show`

    setTimeout(() => {
      toast.classList.remove("show")
    }, 3000)
  },

  getStatusLabel(status) {
    const labels = {
      pendiente: "Pendiente",
      aprobado: "Aprobado",
      rechazado: "Rechazado",
      completado: "Completado",
    }
    return labels[status] || status
  },

  getAILevelLabel(level) {
    const labels = {
      bajo: "Bajo",
      medio: "Medio",
      alto: "Alto",
      profundo: "Profundo",
    }
    return labels[level] || level
  },

  getAIUsageLabel(usage) {
    const labels = {
      verificado: "✓ Verificado",
      parcial: "⚠ Parcial",
      "no-verificado": "✗ No verificado",
    }
    return labels[usage] || usage
  },

  getIncentivesLabel(incentives) {
    if (!incentives || incentives.length === 0) return "Ninguno"
    const labels = {
      economico: "💰 Económico",
      laboral: "📈 Laboral",
      temporal: "⏰ Temporal",
      formacion: "🎓 Formación",
      recursos: "🛠 Recursos",
    }
    return incentives.map((i) => labels[i]).join(", ")
  },
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  APP.init()
})
