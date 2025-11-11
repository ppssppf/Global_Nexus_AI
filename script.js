// Application State
const APP = {
  users: [],
  projects: [],
  currentUser: null,
  currentProjectId: null,
  tempUserStories: [],

  init() {
    this.loadFromStorage()
    this.setupEventListeners()
    this.checkAuth()
  },

  loadFromStorage() {
    // Load users
    const storedUsers = localStorage.getItem("mvmNexusUsers")
    if (storedUsers) {
      this.users = JSON.parse(storedUsers)
    } else {
      // Default users
      this.users = [
        {
          id: 1,
          name: "María González",
          username: "gerente",
          password: "123456",
          role: "manager",
        },
        {
          id: 2,
          name: "Juan Pérez",
          username: "lider",
          password: "123456",
          role: "leader",
        },
      ]
      this.saveUsers()
    }

    // Load projects
    const storedProjects = localStorage.getItem("mvmNexusProjects")
    if (storedProjects) {
      this.projects = JSON.parse(storedProjects)
    } else {
      // Demo project
      this.projects = []
      this.saveProjects()
    }
  },

  saveUsers() {
    localStorage.setItem("mvmNexusUsers", JSON.stringify(this.users))
  },

  saveProjects() {
    localStorage.setItem("mvmNexusProjects", JSON.stringify(this.projects))
  },

  checkAuth() {
    const sessionUser = sessionStorage.getItem("mvmNexusCurrentUser")
    if (sessionUser) {
      this.currentUser = JSON.parse(sessionUser)
      this.showMainApp()
    } else {
      this.showLogin()
    }
  },

  setupEventListeners() {
    // Login form
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleLogin()
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.handleLogout()
    })

    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const module = e.target.dataset.module
        this.switchModule(module)
      })
    })

    // Project Management
    document.getElementById("newProjectBtn").addEventListener("click", () => {
      this.openProjectModal()
    })

    document.getElementById("projectForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveProject()
    })

    // User Stories
    document.getElementById("addUserStoryBtn").addEventListener("click", () => {
      this.addUserStory()
    })

    // Calculate duration when dates change
    document.getElementById("projectStartDate").addEventListener("change", () => {
      this.calculateDuration()
    })
    document.getElementById("projectEndDate").addEventListener("change", () => {
      this.calculateDuration()
    })

    // Approval
    document.getElementById("approvalForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.approveProject()
    })

    document.getElementById("returnProjectBtn").addEventListener("click", () => {
      this.returnProject()
    })

    document.getElementById("rejectProjectBtn").addEventListener("click", () => {
      this.rejectProject()
    })

    // Tracking - Leader
    document.getElementById("leaderProgressForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.submitLeaderProgress()
    })

    // Tracking - Manager
    document.getElementById("managerProgressForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.approveManagerProgress()
    })

    document.getElementById("rejectProgressBtn").addEventListener("click", () => {
      this.rejectProgress()
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

    // User Registration
    document.getElementById("newUserBtn").addEventListener("click", () => {
      this.openUserModal()
    })

    document.getElementById("userForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveUser()
    })

    document.getElementById("cancelForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.confirmCancelProject()
    })

    // Close modals
    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modalId = e.target.dataset.modal
        this.closeModal(modalId)
      })
    })

    // Cancel buttons
    document.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal")
        this.closeModal(modal.id)
      })
    })
  },

  // Authentication
  handleLogin() {
    const username = document.getElementById("loginUsername").value
    const password = document.getElementById("loginPassword").value

    const user = this.users.find((u) => u.username === username && u.password === password)

    if (user) {
      this.currentUser = user
      sessionStorage.setItem("mvmNexusCurrentUser", JSON.stringify(user))
      this.showMainApp()
      this.showToast(`Bienvenido, ${user.name}`, "success")
    } else {
      this.showToast("Usuario o contraseña incorrectos", "error")
    }
  },

  handleLogout() {
    this.currentUser = null
    sessionStorage.removeItem("mvmNexusCurrentUser")
    this.showLogin()
    this.showToast("Sesión cerrada correctamente", "info")
  },

  showLogin() {
    document.getElementById("loginScreen").style.display = "flex"
    document.getElementById("mainApp").style.display = "none"
    document.getElementById("loginUsername").value = ""
    document.getElementById("loginPassword").value = ""
  },

  showMainApp() {
    document.getElementById("loginScreen").style.display = "none"
    document.getElementById("mainApp").style.display = "block"
    document.getElementById("currentUserName").textContent = this.currentUser.name
    document.getElementById("currentUserRole").textContent =
      this.currentUser.role === "manager" ? "(Gerente)" : "(Líder de Proyecto)"
    this.applyRolePermissions()
    this.updateUI()
  },

  applyRolePermissions() {
    const isManager = this.currentUser.role === "manager"

    // Show/hide navigation items
    document.querySelectorAll(".manager-only").forEach((el) => {
      el.style.display = isManager ? "" : "none"
    })

    document.querySelectorAll(".leader-only").forEach((el) => {
      el.style.display = isManager ? "none" : ""
    })

    // Show/hide sections
    document.querySelectorAll(".manager-only-section").forEach((el) => {
      el.style.display = isManager ? "" : "none"
    })

    document.querySelectorAll(".manager-only-input").forEach((el) => {
      el.style.display = isManager ? "" : "none"
    })

    // Set default active module based on role
    if (isManager) {
      this.switchModule("approval")
    } else {
      this.switchModule("projects")
    }
  },

  switchModule(moduleName) {
    // Update navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active")
      if (link.dataset.module === moduleName) {
        link.classList.add("active")
      }
    })

    // Update modules
    document.querySelectorAll(".module").forEach((module) => {
      module.classList.remove("active")
    })
    document.getElementById(`${moduleName}-module`).classList.add("active")

    // Render content
    this.updateUI()
  },

  updateUI() {
    if (!this.currentUser) return

    this.renderProjects()
    this.renderPendingApprovals()
    this.renderTracking()
    this.renderHistory()
    this.renderUsers()
  },

  // Project Management
  openProjectModal(projectId = null) {
    this.currentProjectId = projectId
    const modal = document.getElementById("projectModal")

    if (projectId) {
      const project = this.projects.find((p) => p.id === projectId)

      // Check if project can be edited
      if (project.status !== "devuelto") {
        this.showToast("Solo se pueden editar proyectos devueltos", "error")
        return
      }

      document.getElementById("modalTitle").textContent = "Editar Proyecto"
      document.getElementById("projectName").value = project.name
      document.getElementById("projectDescription").value = project.description
      document.getElementById("projectCompany").value = project.company
      document.getElementById("aiLevel").value = project.aiLevel
      document.getElementById("projectStartDate").value = project.startDate
      document.getElementById("projectEndDate").value = project.endDate

      this.tempUserStories = [...project.userStories]
      this.renderUserStories()
      this.calculateDuration()
    } else {
      document.getElementById("modalTitle").textContent = "Nuevo Proyecto"
      document.getElementById("projectForm").reset()
      this.tempUserStories = []
      this.renderUserStories()
      document.getElementById("durationDisplay").textContent = "Seleccione las fechas para calcular la duración"
    }

    modal.classList.add("active")
  },

  addUserStory() {
    const input = document.getElementById("newUserStory")
    const story = input.value.trim()

    if (story) {
      this.tempUserStories.push({
        id: Date.now(),
        text: story,
        completed: false,
        approved: false,
        pendingApproval: false,
      })
      input.value = ""
      this.renderUserStories()
    }
  },

  removeUserStory(id) {
    this.tempUserStories = this.tempUserStories.filter((s) => s.id !== id)
    this.renderUserStories()
  },

  renderUserStories() {
    const list = document.getElementById("userStoriesList")

    if (this.tempUserStories.length === 0) {
      list.innerHTML = '<li class="empty-story">No hay historias de usuario agregadas</li>'
      return
    }

    list.innerHTML = this.tempUserStories
      .map(
        (story) => `
            <li class="user-story-item">
                <span>${story.text}</span>
                <button type="button" class="btn-remove" onclick="APP.removeUserStory(${story.id})">×</button>
            </li>
        `,
      )
      .join("")
  },

  calculateDuration() {
    const startDate = document.getElementById("projectStartDate").value
    const endDate = document.getElementById("projectEndDate").value

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const months = Math.round(diffDays / 30)

      document.getElementById("durationDisplay").textContent =
        `${months} ${months === 1 ? "mes" : "meses"} (${diffDays} días)`
    }
  },

  saveProject() {
    const name = document.getElementById("projectName").value
    const description = document.getElementById("projectDescription").value
    const company = document.getElementById("projectCompany").value
    const aiLevel = document.getElementById("aiLevel").value
    const startDate = document.getElementById("projectStartDate").value
    const endDate = document.getElementById("projectEndDate").value

    const documentsInput = document.getElementById("projectDocuments")
    const documents = documentsInput.files.length > 0 ? Array.from(documentsInput.files).map((f) => f.name) : []

    if (this.tempUserStories.length === 0) {
      this.showToast("Debe agregar al menos una historia de usuario", "error")
      return
    }

    if (this.currentProjectId) {
      // Edit existing project
      const project = this.projects.find((p) => p.id === this.currentProjectId)
      project.name = name
      project.description = description
      project.company = company
      project.aiLevel = aiLevel
      project.startDate = startDate
      project.endDate = endDate
      project.userStories = [...this.tempUserStories]
      project.documents = documents
      project.status = "pendiente"
      project.updatedAt = new Date().toISOString()

      this.showToast("Proyecto actualizado y enviado con éxito, a la espera de aprobación", "success")
    } else {
      // Create new project
      const newProject = {
        id: Date.now(),
        name,
        description,
        company,
        aiLevel,
        startDate,
        endDate,
        userStories: [...this.tempUserStories],
        documents,
        leader: this.currentUser.name,
        leaderId: this.currentUser.id,
        status: "pendiente",
        createdAt: new Date().toISOString(),
        progress: 0,
      }

      this.projects.push(newProject)
      this.showToast("Proyecto enviado con éxito, a la espera de aprobación", "success")
    }

    this.saveProjects()
    this.closeModal("projectModal")
    this.updateUI()
  },

  cancelProject(projectId) {
    this.currentProjectId = projectId
    const project = this.projects.find((p) => p.id === projectId)

    if (project.status === "en-revision") {
      this.showToast("No puede cancelar un proyecto mientras está en revisión", "error")
      return
    }

    document.getElementById("cancelReason").value = ""
    document.getElementById("cancelModal").classList.add("active")
  },

  confirmCancelProject() {
    const reason = document.getElementById("cancelReason").value.trim()

    if (!reason) {
      this.showToast("Debe proporcionar una justificación", "error")
      return
    }

    const project = this.projects.find((p) => p.id === this.currentProjectId)
    project.status = "cancelado"
    project.canceledAt = new Date().toISOString()
    project.cancelReason = reason

    this.saveProjects()
    this.closeModal("cancelModal")
    this.updateUI()
    this.showToast("Proyecto cancelado", "info")
  },

  renderProjects() {
    const grid = document.getElementById("projectsGrid")

    // Show only current leader's projects
    const userProjects = this.projects.filter((p) => p.leaderId === this.currentUser.id)

    if (userProjects.length === 0) {
      grid.innerHTML =
        '<div class="empty-state"><h3>No hay proyectos</h3><p>Crea tu primer proyecto usando el botón "Nuevo Proyecto"</p></div>'
      return
    }

    grid.innerHTML = userProjects
      .map((project) => {
        const showEdit = project.status === "devuelto"
        const showCancel = project.status === "pendiente" || project.status === "aprobado"

        return `
            <div class="project-card">
                <div class="project-card-header">
                    <div>
                        <h3>${project.name}</h3>
                        <span class="project-status status-${project.status}">${this.getStatusLabel(project.status)}</span>
                    </div>
                </div>
                <p>${project.description}</p>
                <div class="ai-level ai-${project.aiLevel}">
                    IA: ${this.getAILevelLabel(project.aiLevel)}
                </div>
                <div class="project-meta">
                    <div class="project-meta-item">
                        <strong>Empresa:</strong> ${project.company}
                    </div>
                    <div class="project-meta-item">
                        <strong>Período:</strong> ${project.startDate} → ${project.endDate}
                    </div>
                    <div class="project-meta-item">
                        <strong>Historias de usuario:</strong> ${project.userStories.length}
                    </div>
                    ${
                      project.documents && project.documents.length > 0
                        ? `
                    <div class="project-meta-item">
                        <strong>Documentos:</strong> ${project.documents.length} archivo(s)
                    </div>
                    `
                        : ""
                    }
                    <div class="project-meta-item">
                        <strong>Creado:</strong> ${new Date(project.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="project-actions">
                    ${showEdit ? `<button class="btn btn-primary" onclick="APP.openProjectModal(${project.id})">Editar</button>` : ""}
                    ${showCancel ? `<button class="btn btn-danger" onclick="APP.cancelProject(${project.id})">Cancelar</button>` : ""}
                </div>
            </div>
        `
      })
      .join("")
  },

  // Approval Module
  renderPendingApprovals() {
    const container = document.getElementById("pendingProjects")
    const pending = this.projects.filter((p) => p.status === "pendiente" || p.status === "en-revision")

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
                        ${project.status === "en-revision" ? '<span class="project-status status-en-revision">En Revisión</span>' : ""}
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
                                <strong>Período:</strong> <span>${project.startDate} → ${project.endDate}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Historias de usuario:</strong> <span>${project.userStories.length}</span>
                            </div>
                            ${
                              project.documents && project.documents.length > 0
                                ? `
                            <div class="detail-row">
                                <strong>Documentos adjuntos:</strong> <span>${project.documents.join(", ")}</span>
                            </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="APP.openApprovalModal(${project.id})">Revisar Proyecto</button>
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

    if (project.status === "pendiente") {
      project.status = "en-revision"
      project.reviewStartedAt = new Date().toISOString()
      this.saveProjects()
      this.updateUI() // Refresh the UI to reflect status change
    }

    document.getElementById("approvalProjectDetails").innerHTML = `
            <div class="project-detail-box">
                <h4>${project.name}</h4>
                <p>${project.description}</p>
                <div class="detail-grid">
                    <div><strong>Líder:</strong> ${project.leader}</div>
                    <div><strong>Empresa:</strong> ${project.company}</div>
                    <div><strong>IA:</strong> ${this.getAILevelLabel(project.aiLevel)}</div>
                    <div><strong>Historias:</strong> ${project.userStories.length}</div>
                </div>
                ${
                  project.documents && project.documents.length > 0
                    ? `
                <div style="margin-top: 1rem;">
                    <strong>Documentos adjuntos:</strong>
                    <ul style="list-style: none; padding-left: 0; margin-top: 0.5rem;">
                        ${project.documents.map((doc) => `<li>📎 ${doc}</li>`).join("")}
                    </ul>
                </div>
                `
                    : ""
                }
                <div class="user-stories-preview">
                    <strong>Historias de Usuario:</strong>
                    <ul>
                        ${project.userStories.map((s) => `<li>${s.text}</li>`).join("")}
                    </ul>
                </div>
            </div>
        `

    document.getElementById("approvalForm").reset()
    modal.classList.add("active")
  },

  approveProject() {
    const project = this.projects.find((p) => p.id === this.currentProjectId)
    const incentive = document.getElementById("projectIncentive").value

    if (!incentive) {
      this.showToast("Debe seleccionar un incentivo", "error")
      return
    }

    project.status = "aprobado"
    project.incentive = incentive
    project.approvedAt = new Date().toISOString()
    project.approvedBy = this.currentUser.name

    this.saveProjects()
    this.closeModal("approvalModal")
    this.updateUI()
    this.showToast(`Proyecto "${project.name}" aprobado con éxito`, "success")
  },

  returnProject() {
    const project = this.projects.find((p) => p.id === this.currentProjectId)
    project.status = "devuelto"
    project.returnedAt = new Date().toISOString()

    this.saveProjects()
    this.closeModal("approvalModal")
    this.updateUI()
    this.showToast(`Proyecto devuelto al líder para mejoras`, "info")
  },

  rejectProject() {
    if (confirm("¿Está seguro de NO APROBAR este proyecto? Esta acción es permanente.")) {
      const project = this.projects.find((p) => p.id === this.currentProjectId)
      project.status = "no-aprobado"
      project.rejectedAt = new Date().toISOString()

      this.saveProjects()
      this.closeModal("approvalModal")
      this.updateUI()
      this.showToast(`Proyecto NO aprobado`, "error")
    }
  },

  // Tracking Module
  renderTracking() {
    const container = document.getElementById("trackingProjects")
    const isManager = this.currentUser.role === "manager"

    let approved
    if (isManager) {
      approved = this.projects.filter((p) => p.status === "aprobado")
    } else {
      approved = this.projects.filter((p) => p.status === "aprobado" && p.leaderId === this.currentUser.id)
    }

    if (approved.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><h3>No hay proyectos en seguimiento</h3><p>Los proyectos aprobados aparecerán aquí</p></div>'
      return
    }

    container.innerHTML = approved
      .map((project) => {
        const approvedCount = project.userStories.filter((s) => s.approved).length
        const pendingCount = project.userStories.filter((s) => s.pendingApproval).length
        const progress =
          project.userStories.length > 0 ? Math.round((approvedCount / project.userStories.length) * 100) : 0

        const showApproveButton = isManager && pendingCount > 0

        return `
                <div class="tracking-card">
                    <div class="card-content">
                        <div class="card-info">
                            <h3>${project.name}</h3>
                            <div class="card-details">
                                <div class="detail-row">
                                    <strong>Líder:</strong> <span>${project.leader}</span>
                                </div>
                                <div class="detail-row">
                                    <strong>Empresa:</strong> <span>${project.company}</span>
                                </div>
                                <div class="detail-row">
                                    <strong>Período:</strong> <span>${project.startDate} → ${project.endDate}</span>
                                </div>
                                <div class="detail-row">
                                    <strong>Incentivo:</strong> <span>${this.getIncentiveLabel(project.incentive)}</span>
                                </div>
                                <div class="detail-row">
                                    <strong>Historias aprobadas:</strong> <span>${approvedCount} de ${project.userStories.length}</span>
                                </div>
                                ${pendingCount > 0 ? `<div class="detail-row pending-indicator"><strong>⏳ Historias pendientes de aprobación:</strong> <span>${pendingCount}</span></div>` : ""}
                            </div>
                            <div class="progress-container">
                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar" style="width: ${progress}%">
                                        ${progress}%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-actions">
                            ${isManager && showApproveButton ? `<button class="btn btn-primary" onclick="APP.openManagerProgressModal(${project.id})">Aprobar Progreso (${pendingCount})</button>` : ""}
                            ${!isManager ? `<button class="btn btn-primary" onclick="APP.openLeaderProgressModal(${project.id})">Actualizar Progreso</button>` : ""}
                        </div>
                    </div>
                </div>
            `
      })
      .join("")
  },

  openLeaderProgressModal(projectId) {
    this.currentProjectId = projectId
    const project = this.projects.find((p) => p.id === projectId)
    const modal = document.getElementById("leaderProgressModal")

    const approvedCount = project.userStories.filter((s) => s.approved).length

    document.getElementById("leaderProgressDetails").innerHTML = `
            <div class="project-detail-box">
                <h4>${project.name}</h4>
                <p>Progreso actual: <strong>${approvedCount} de ${project.userStories.length}</strong> historias aprobadas</p>
            </div>
        `

    // Render user stories checklist
    const checklist = document.getElementById("userStoriesChecklistLeader")
    checklist.innerHTML = project.userStories
      .map((story, index) => {
        if (story.approved) {
          return `
                    <div class="story-checkbox disabled">
                        <input type="checkbox" id="story-leader-${index}" disabled checked>
                        <label for="story-leader-${index}">✓ ${story.text} <em>(Aprobada)</em></label>
                    </div>
                `
        } else if (story.pendingApproval) {
          return `
                    <div class="story-checkbox disabled">
                        <input type="checkbox" id="story-leader-${index}" disabled checked>
                        <label for="story-leader-${index}">⏳ ${story.text} <em>(Pendiente de aprobación)</em></label>
                    </div>
                `
        } else {
          return `
                    <div class="story-checkbox">
                        <input type="checkbox" id="story-leader-${index}" value="${index}">
                        <label for="story-leader-${index}">${story.text}</label>
                    </div>
                `
        }
      })
      .join("")

    document.getElementById("evidenceFile").value = ""
    modal.classList.add("active")
  },

  submitLeaderProgress() {
    const project = this.projects.find((p) => p.id === this.currentProjectId)
    const checkboxes = document.querySelectorAll("#userStoriesChecklistLeader input[type='checkbox']:not(:disabled)")
    const selectedIndices = Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => Number.parseInt(cb.value))

    const file = document.getElementById("evidenceFile").files[0]

    if (selectedIndices.length === 0) {
      this.showToast("Debe seleccionar al menos una historia completada", "error")
      return
    }

    if (!file) {
      this.showToast("Debe cargar un archivo de evidencia", "error")
      return
    }

    // Mark selected stories as pending approval
    selectedIndices.forEach((index) => {
      project.userStories[index].pendingApproval = true
      project.userStories[index].completedAt = new Date().toISOString()
      project.userStories[index].evidenceFile = file.name
    })

    project.lastUpdated = new Date().toISOString()

    this.saveProjects()
    this.closeModal("leaderProgressModal")
    this.updateUI()
    this.showToast("Progreso enviado al gerente para aprobación", "success")
  },

  openManagerProgressModal(projectId) {
    this.currentProjectId = projectId
    const project = this.projects.find((p) => p.id === projectId)
    const modal = document.getElementById("managerProgressModal")

    const pendingStories = project.userStories.filter((s) => s.pendingApproval)

    document.getElementById("managerProgressDetails").innerHTML = `
            <div class="project-detail-box">
                <h4>${project.name}</h4>
                <p><strong>${pendingStories.length}</strong> historias pendientes de aprobación</p>
            </div>
        `

    // Render pending user stories
    const checklist = document.getElementById("userStoriesChecklistManager")
    checklist.innerHTML = project.userStories
      .map((story, index) => {
        if (story.pendingApproval) {
          return `
                    <div class="story-checkbox">
                        <input type="checkbox" id="story-manager-${index}" value="${index}" checked>
                        <label for="story-manager-${index}">${story.text} <em>(${story.evidenceFile})</em></label>
                    </div>
                `
        }
        return ""
      })
      .filter((html) => html !== "")
      .join("")

    modal.classList.add("active")
  },

  approveManagerProgress() {
    const project = this.projects.find((p) => p.id === this.currentProjectId)
    const checkboxes = document.querySelectorAll("#userStoriesChecklistManager input[type='checkbox']")
    const selectedIndices = Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => Number.parseInt(cb.value))

    if (selectedIndices.length === 0) {
      this.showToast("Debe seleccionar al menos una historia para aprobar", "error")
      return
    }

    // Approve selected stories
    selectedIndices.forEach((index) => {
      project.userStories[index].approved = true
      project.userStories[index].pendingApproval = false
      project.userStories[index].approvedAt = new Date().toISOString()
      project.userStories[index].approvedBy = this.currentUser.name
    })

    project.lastApproved = new Date().toISOString()

    const allApproved = project.userStories.every((s) => s.approved)
    if (allApproved) {
      project.status = "completado"
      project.completedAt = new Date().toISOString()
      this.showToast(`Proyecto completado: todas las historias han sido aprobadas`, "success")
    }

    this.saveProjects()
    this.closeModal("managerProgressModal")
    this.updateUI()

    if (!allApproved) {
      this.showToast(
        `${selectedIndices.length} ${selectedIndices.length === 1 ? "historia aprobada" : "historias aprobadas"}`,
        "success",
      )
    }
  },

  rejectProgress() {
    if (confirm("¿Está seguro de NO APROBAR este progreso? Las historias volverán a estado pendiente.")) {
      const project = this.projects.find((p) => p.id === this.currentProjectId)

      // Revert all pending approval stories back to not completed
      project.userStories.forEach((story) => {
        if (story.pendingApproval) {
          story.pendingApproval = false
          story.completed = false
        }
      })

      project.lastRejection = new Date().toISOString()

      this.saveProjects()
      this.closeModal("managerProgressModal")
      this.updateUI()
      this.showToast("Progreso no aprobado. Las historias han vuelto a estado pendiente.", "error")
    }
  },

  // History Module
  renderHistory() {
    const companyFilter = document.getElementById("filterCompany").value.toLowerCase()
    const statusFilter = document.getElementById("filterStatus").value
    const isManager = this.currentUser.role === "manager"

    let filtered = this.projects

    // Leaders only see their own projects
    if (!isManager) {
      filtered = filtered.filter((p) => p.leaderId === this.currentUser.id)
    } else {
      // Managers can filter by leader
      const leaderFilter = document.getElementById("filterLeader").value.toLowerCase()
      if (leaderFilter) {
        filtered = filtered.filter((p) => p.leader.toLowerCase().includes(leaderFilter))
      }
    }

    if (companyFilter) {
      filtered = filtered.filter((p) => p.company.toLowerCase().includes(companyFilter))
    }
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Update stats (manager only)
    if (isManager) {
      document.getElementById("totalProjects").textContent = this.projects.length
      document.getElementById("approvedProjects").textContent = this.projects.filter(
        (p) => p.status === "aprobado" || p.status === "completado",
      ).length
      document.getElementById("pendingProjectsCount").textContent = this.projects.filter(
        (p) => p.status === "pendiente" || p.status === "en-revision",
      ).length
      document.getElementById("rejectedProjects").textContent = this.projects.filter(
        (p) => p.status === "no-aprobado",
      ).length
    }

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
                        ${isManager ? "<th>Líder</th>" : ""}
                        <th>Empresa</th>
                        <th>Nivel IA</th>
                        <th>Estado</th>
                        <th>Historias</th>
                        <th>Progreso</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered
                      .map((project) => {
                        const approvedCount = project.userStories
                          ? project.userStories.filter((s) => s.approved).length
                          : 0
                        const totalStories = project.userStories ? project.userStories.length : 0
                        const progress = totalStories > 0 ? Math.round((approvedCount / totalStories) * 100) : 0

                        return `
                            <tr>
                                <td><strong>${project.name}</strong></td>
                                ${isManager ? `<td>${project.leader}</td>` : ""}
                                <td>${project.company}</td>
                                <td><span class="ai-level ai-${project.aiLevel}">${this.getAILevelLabel(project.aiLevel)}</span></td>
                                <td><span class="project-status status-${project.status}">${this.getStatusLabel(project.status)}</span></td>
                                <td>${approvedCount}/${totalStories}</td>
                                <td>${progress}%</td>
                                <td>${new Date(project.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `
                      })
                      .join("")}
                </tbody>
            </table>
        `
  },

  // User Registration Module
  renderUsers() {
    const grid = document.getElementById("usersGrid")

    if (this.users.length === 0) {
      grid.innerHTML = '<div class="empty-state"><h3>No hay usuarios</h3></div>'
      return
    }

    grid.innerHTML = this.users
      .map(
        (user) => `
            <div class="user-card">
                <div class="user-icon">${user.name.charAt(0).toUpperCase()}</div>
                <h3>${user.name}</h3>
                <p class="user-role">${user.role === "manager" ? "Gerente" : "Líder de Proyecto"}</p>
                <p class="user-username">@${user.username}</p>
                <div class="user-actions">
                    <button class="btn btn-danger btn-small" onclick="APP.deleteUser(${user.id})">Eliminar</button>
                </div>
            </div>
        `,
      )
      .join("")
  },

  openUserModal() {
    document.getElementById("userForm").reset()
    document.getElementById("userModal").classList.add("active")
  },

  saveUser() {
    const name = document.getElementById("userName").value
    const username = document.getElementById("userUsername").value
    const password = document.getElementById("userPassword").value
    const role = document.getElementById("userRole").value

    // Check if username already exists
    if (this.users.find((u) => u.username === username)) {
      this.showToast("El nombre de usuario ya existe", "error")
      return
    }

    const newUser = {
      id: Date.now(),
      name,
      username,
      password,
      role,
      createdAt: new Date().toISOString(),
    }

    this.users.push(newUser)
    this.saveUsers()
    this.closeModal("userModal")
    this.updateUI()
    this.showToast(`Usuario ${name} registrado correctamente`, "success")
  },

  deleteUser(userId) {
    const user = this.users.find((u) => u.id === userId)

    // Prevent deleting current user
    if (userId === this.currentUser.id) {
      this.showToast("No puede eliminar su propio usuario", "error")
      return
    }

    if (confirm(`¿Está seguro de eliminar al usuario ${user.name}?`)) {
      this.users = this.users.filter((u) => u.id !== userId)
      this.saveUsers()
      this.updateUI()
      this.showToast("Usuario eliminado", "success")
    }
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
    }, 4000)
  },

  getStatusLabel(status) {
    const labels = {
      pendiente: "Pendiente",
      "en-revision": "En Revisión",
      devuelto: "Devuelto",
      aprobado: "Aprobado",
      "no-aprobado": "No Aprobado",
      cancelado: "Cancelado",
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

  getIncentiveLabel(incentive) {
    const labels = {
      economico: "Económico",
      laboral: "Laboral",
      temporal: "Temporal",
      formacion: "Formación",
      recursos: "Recursos",
      otro: "Otro",
    }
    return labels[incentive] || incentive
  },
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  APP.init()
})
