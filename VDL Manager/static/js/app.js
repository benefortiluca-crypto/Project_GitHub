// VDL Manager Pro - SPA Application Engine
// Developed for Satiz TPM

// Global Application States
let projectData = null;            // Active VDL project info
let currentUserToken = localStorage.getItem("currentUserToken") || "";
let currentUserRole = localStorage.getItem("currentUserRole") || "";
let currentUserUsername = localStorage.getItem("currentUserUsername") || "";
let activeProjectId = localStorage.getItem("activeProjectId") ? parseInt(localStorage.getItem("activeProjectId"), 10) : null;        // Active Project Database ID
let documentsData = [];            // Loaded list of document objects
let filteredDocumentsData = [];    // Filtered documents list for grid
let uniqueHandsValues = [];        // Unique hands names in the system
let contactsData = {};             // Rubrica contacts (hands -> {to, cc})
let emailSettings = {};            // Global system settings
let activeFilters = {};            // Multi-column filter status: { columnName: Set([selected_values]) }
let sortColumn = null;             // Column currently sorted
let sortDirection = 'asc';         // Sort order 'asc' or 'desc'
let isGridDirty = false;           // Track unsaved cell modifications
let allSuppliers = [];            // List of all suppliers globally
let projectSuppliers = [];        // List of suppliers assigned to active project
let supplierTransmittals = [];    // List of registered supplier transmittals (IN & OUT)

// Custom Tracking Columns (appended automatically on upload)
const CUSTOM_TRACKING_COLUMNS = [
    "Hands",
    "1° Invio previsione",
    "Promise date",
    "Next issue forecast date",
    "Last Code receive",
    "TR Out",
    "Actual Date",
    "TR In",
    "Return Code",
    "Return Date",
    "TR Out1",
    "Actual Date1",
    "TR In1",
    "Return Code1",
    "Return Date1",
    "TR Out2",
    "Actual Date2",
    "TR In2",
    "Return Code2",
    "Return Date2",
    "TR Out3",
    "Actual Date3",
    "TR In3",
    "Return Code3",
    "Return Date3",
    "TR Out4",
    "Actual Date4",
    "TR In4",
    "Return Code4",
    "Return Date4",
    "TR Out5",
    "Actual Date5",
    "TR In5",
    "Return Code5",
    "Return Date5",
    "TR Out6",
    "Actual Date6",
    "TR In6",
    "Return Code6",
    "Return Date6"
];


// Document Ready Bootstrap
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Choose icon based on type
    let icon = "fa-info-circle";
    if (type === 'success') icon = "fa-circle-check";
    if (type === 'error') icon = "fa-circle-exclamation";
    if (type === 'warning') icon = "fa-triangle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto-remove animation
    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 4000);
}

// 1. Navigation & Routing System
function initNavigation() {
    const navItems = document.querySelectorAll(".sidebar .nav-item");
    const sections = document.querySelectorAll(".view-section");
    const pageTitle = document.getElementById("page-title");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            // Warn if grid has unsaved modifications and moving away from table
            if (isGridDirty && item.getAttribute("data-target") !== 'table-editor') {
                if (!confirm("Hai delle modifiche non salvate nella tabella. Vuoi davvero cambiare pagina? Le modifiche andranno perse.")) {
                    return;
                }
                // Reset dirty states
                isGridDirty = false;
                document.getElementById("btn-save-grid").classList.remove("btn-teal");
                document.getElementById("btn-save-grid").classList.add("btn-primary");
            }

            // Remove active class
            navItems.forEach(n => n.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            // Add active class
            item.classList.add("active");
            const target = item.getAttribute("data-target");
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.classList.add("active");
            }

            // Update title
            const label = item.querySelector("span").textContent;
            pageTitle.textContent = label;

            // Trigger specific section loaders
            if (target === 'reminder-center') {
                loadReminderCenter();
            } else if (target === 'contacts-db') {
                loadContactsGrid();
            } else if (target === 'settings-section') {
                loadSettings();
            } else if (target === 'dashboard') {
                loadDashboardStats();
            } else if (target === 'suppliers-db') {
                loadSuppliersRegistry();
            } else if (target === 'transmittal-fornitore-in') {
                loadSupplierTransmittalsIn();
            } else if (target === 'transmittal-fornitore-out') {
                loadSupplierTransmittalsOut();
            } else if (target === 'supplier-vdl-editor') {
                loadSupplierVdlSection();
            } else if (target === 'admin-access-control') {
                loadAdminUsers();
                loadAdminProjects();
            } else if (target === 'transmittal-invio-cliente') {
                renderClientTransmittalsTable();
            } else if (target === 'project-specifications') {
                loadProjectSpecifications();
            } else if (target === 'revisione-documentazione') {
                loadRevisioneDocumentazione();
            }
        });
    });

    // Dashboard Quick navigations
    const btnGotoTable = document.getElementById("btn-goto-table");
    if (btnGotoTable) {
        btnGotoTable.addEventListener("click", () => {
            const tableNavItem = document.getElementById("nav-table-editor");
            if (tableNavItem) tableNavItem.click();
        });
    }
}

async function initApp() {
    initNavigation();
    if (typeof initUploadZone === 'function') initUploadZone();
    if (typeof initDiagnosticsControls === 'function') initDiagnosticsControls();
    if (typeof initSettingsForm === 'function') initSettingsForm();
    if (typeof initProjectSpecificSettingsForm === 'function') initProjectSpecificSettingsForm();
    if (typeof initContactForm === 'function') initContactForm();
    if (typeof initTableGridControls === 'function') initTableGridControls();
    if (typeof initReminderCenterControls === 'function') initReminderCenterControls();
    if (typeof initProjectControls === 'function') initProjectControls();
    initTransmittalControls();
    if (typeof initSuppliersControls === 'function') initSuppliersControls();
    initSupplierTransmittalsControls();
    if (typeof initSupplierVdlControls === 'function') initSupplierVdlControls();
    initProjectSpecificationsControls();
    initRevisioneDocumentazioneControls();
    initCellDocumentUploadControls();
    initDashboardDetails();
    initAuthControls();

    currentUserToken = "local_admin_token";
    currentUserRole = "Admin";
    currentUserUsername = "ADMIN";
    
    localStorage.setItem("currentUserToken", currentUserToken);
    localStorage.setItem("currentUserRole", currentUserRole);
    localStorage.setItem("currentUserUsername", currentUserUsername);
    
    hideLoginOverlay();
    
    await loadSettings(true); 
    await loadProjectsList();
    
    if (activeProjectId) {
        await loadActiveProject();
        await loadSettings(true);
    } else {
        renderEmptyGrid();
    }
}

// 2.5 Project Controls
async function loadProjectsList() {
    try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        if (data.status === 'success') {
            const select = document.getElementById("global-project-select");
            select.innerHTML = '<option value="">Nessun progetto selezionato</option>';
            data.projects.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.project_name}</option>`;
            });
            
            if (activeProjectId) {
                const projectExists = data.projects.some(p => p.id === activeProjectId);
                if (projectExists) {
                    select.value = activeProjectId;
                } else if (data.projects.length > 0) {
                    activeProjectId = data.projects[0].id;
                    localStorage.setItem("activeProjectId", activeProjectId);
                    select.value = activeProjectId;
                } else {
                    activeProjectId = null;
                    localStorage.removeItem("activeProjectId");
                    select.value = "";
                }
            } else if (data.projects.length > 0) {
                activeProjectId = data.projects[0].id;
                localStorage.setItem("activeProjectId", activeProjectId);
                select.value = activeProjectId;
            } else {
                activeProjectId = null;
                localStorage.removeItem("activeProjectId");
                select.value = "";
            }
        }
    } catch(e) {
        console.error("Error loading projects", e);
    }
}
function initProjectControls() {
    const projSelect = document.getElementById("global-project-select");
    if (projSelect) {
        projSelect.addEventListener("change", async () => {
            activeProjectId = projSelect.value ? parseInt(projSelect.value, 10) : null;
            if (activeProjectId) {
                localStorage.setItem("activeProjectId", activeProjectId);
                await loadActiveProject();
    try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        if (data.status === 'success') {
            const select = document.getElementById("global-project-select");
            select.innerHTML = '<option value="">Nessun progetto selezionato</option>';
            data.projects.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.project_name}</option>`;
            });
            
            if (activeProjectId) {
                const projectExists = data.projects.some(p => p.id === activeProjectId);
                if (projectExists) {
                    select.value = activeProjectId;
                } else if (data.projects.length > 0) {
                    activeProjectId = data.projects[0].id;
                    localStorage.setItem("activeProjectId", activeProjectId);
                    select.value = activeProjectId;
                } else {
                    activeProjectId = null;
                    localStorage.removeItem("activeProjectId");
                    select.value = "";
                }
            } else if (data.projects.length > 0) {
                activeProjectId = data.projects[0].id;
                localStorage.setItem("activeProjectId", activeProjectId);
                select.value = activeProjectId;
            } else {
                activeProjectId = null;
                localStorage.removeItem("activeProjectId");
                select.value = "";
            }
        }
    } catch(e) {
        console.error("Error loading projects", e);
    }
}
function initProjectControls() {
    const projSelect = document.getElementById("global-project-select");
    if (projSelect) {
        projSelect.addEventListener("change", async () => {
            activeProjectId = projSelect.value ? parseInt(projSelect.value, 10) : null;
            if (activeProjectId) {
                localStorage.setItem("activeProjectId", activeProjectId);
                await loadActiveProject();
            } else {
                localStorage.removeItem("activeProjectId");
                projectData = null;
                
                const navSpecs = document.getElementById("nav-project-specifications");
                if (navSpecs) navSpecs.style.display = "none";
                const navRevisions = document.getElementById("nav-revisione-documentazione");
                if (navRevisions) navRevisions.style.display = "none";
                updateViewsWarningsState();
                
                document.getElementById("stat-project-name").textContent = "Nessuno";
                document.getElementById("project-details-card").style.display = "none";
                const statusCard = document.getElementById("project-status-card");
                if (statusCard) statusCard.style.display = "none";
                toggleTransmittalForms();
                renderEmptyGrid();
                documentsData = [];
                filteredDocumentsData = [];
                applyFiltersAndSort();

                // Clear/reset project inputs
                const pCompany = document.getElementById("proj-company");
                const pContractor = document.getElementById("proj-contractor");
                const pContractorNum = document.getElementById("proj-contractor-num");
                const pVendorNum = document.getElementById("proj-vendor-num");
                const pName = document.getElementById("proj-name");
                
                if (pCompany) pCompany.value = "";
                if (pContractor) pContractor.value = "";
                if (pContractorNum) pContractorNum.value = "";
                if (pVendorNum) pVendorNum.value = "";
                if (pName) pName.value = "";
                
                const cardTitle = document.getElementById("proj-card-title");
                if (cardTitle) cardTitle.innerHTML = `<i class="fa-solid fa-folder-plus text-accent"></i> Crea Nuovo Progetto`;
                
                const cardDesc = document.getElementById("proj-card-desc");
                if (cardDesc) cardDesc.textContent = "Inserisci i metadati del progetto. Verrà creata una nuova scheda progetto in cui potrai successivamente importare la VDL e la Rubrica Contatti.";
                
                const btnText = document.getElementById("btn-create-project-text");
                if (btnText) btnText.textContent = "Crea e Salva Progetto";
                
                const deselectBtn = document.getElementById("btn-deselect-project-data");
                if (deselectBtn) deselectBtn.style.display = "none";
            }
            await loadSettings(true);
        });
    }

    const newProjForm = document.getElementById("new-project-form");
    if (newProjForm) {
        newProjForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const company = document.getElementById("proj-company").value;
            const contractor = document.getElementById("proj-contractor").value;
            const contractorNum = document.getElementById("proj-contractor-num").value;
            const vendorNum = document.getElementById("proj-vendor-num").value;
            const projName = document.getElementById("proj-name").value;

            try {
                let url = "/api/project/new";
                let method = "POST";
                if (activeProjectId) {
                    url = `/api/project/${activeProjectId}`;
                    method = "PUT";
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        company: company,
                        contractor: contractor,
                        contractor_proj_num: contractorNum,
                        vendor_proj_num: vendorNum,
                        project_name: projName
                    })
                });
                const data = await response.json();
                if (data.status === 'success') {
                    if (activeProjectId) {
                        showToast("Progetto aggiornato!", "success");
                    } else {
                        showToast("Progetto creato!", "success");
                        newProjForm.reset();
                        activeProjectId = data.project_id;
                        localStorage.setItem("activeProjectId", activeProjectId);
                    }
                    await loadProjectsList();
                    await loadActiveProject();
                    
                    document.querySelector('.nav-item[data-target="dashboard"]').click();
                }
            } catch (error) {
                showToast("Errore durante il salvataggio dei dati del progetto.", "error");
            }
        });
    }
}

window.deselectActiveProjectFromData = function() {
    activeProjectId = null;
    localStorage.removeItem("activeProjectId");
    projectData = null;
    
    const select = document.getElementById("global-project-select");
    if (select) select.value = "";
    
    const navSpecs = document.getElementById("nav-project-specifications");
    if (navSpecs) navSpecs.style.display = "none";
    const navRevisions = document.getElementById("nav-revisione-documentazione");
    if (navRevisions) navRevisions.style.display = "none";
    updateViewsWarningsState();
    
    document.getElementById("stat-project-name").textContent = "Nessuno";
    document.getElementById("project-details-card").style.display = "none";
    const statusCard = document.getElementById("project-status-card");
    if (statusCard) statusCard.style.display = "none";
    toggleTransmittalForms();
    renderEmptyGrid();
    documentsData = [];
    filteredDocumentsData = [];
    applyFiltersAndSort();
    
    const pCompany = document.getElementById("proj-company");
    const pContractor = document.getElementById("proj-contractor");
    const pContractorNum = document.getElementById("proj-contractor-num");
    const pVendorNum = document.getElementById("proj-vendor-num");
    const pName = document.getElementById("proj-name");
    
    if (pCompany) pCompany.value = "";
    if (pContractor) pContractor.value = "";
    if (pContractorNum) pContractorNum.value = "";
    if (pVendorNum) pVendorNum.value = "";
    if (pName) pName.value = "";
    
    const cardTitle = document.getElementById("proj-card-title");
    if (cardTitle) cardTitle.innerHTML = `<i class="fa-solid fa-folder-plus text-accent"></i> Crea Nuovo Progetto`;
    
    const cardDesc = document.getElementById("proj-card-desc");
    if (cardDesc) cardDesc.textContent = "Inserisci i metadati del progetto. Verrà creata una nuova scheda progetto in cui potrai successivamente importare la VDL e la Rubrica Contatti.";
    
    const deselectBtn = document.getElementById("btn-deselect-project-data");
    if (deselectBtn) deselectBtn.style.display = "none";
};

async function loadActiveProject() {
    if (!activeProjectId) return;
    try {
        const response = await fetch(`/api/project/${activeProjectId}`);
        const data = await response.json();
        if (data.status === 'success') {
            projectData = data.project;
            
            const pCompany = document.getElementById("proj-company");
            const pContractor = document.getElementById("proj-contractor");
            const pContractorNum = document.getElementById("proj-contractor-num");
            const pVendorNum = document.getElementById("proj-vendor-num");
            const pName = document.getElementById("proj-name");
            
            if (pCompany) pCompany.value = projectData.company || "";
            if (pContractor) pContractor.value = projectData.contractor || "";
            if (pContractorNum) pContractorNum.value = projectData.contractor_proj_num || "";
            if (pVendorNum) pVendorNum.value = projectData.vendor_proj_num || "";
            if (pName) pName.value = projectData.project_name || "";
            
            document.getElementById("stat-project-name").textContent = projectData.project_name || "Nessuno";
            const statusCard = document.getElementById("project-status-card");
            if (statusCard) statusCard.style.display = "flex";
            
            const detailsCard = document.getElementById("project-details-card");
            if (detailsCard) {
                detailsCard.style.display = "block";
                document.getElementById("info-proj-name").textContent = projectData.project_name || "-";
                let dateStr = "-";
                if (projectData.created_at) {
                    try {
                        const d = new Date(projectData.created_at);
                        dateStr = d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT", {hour: '2-digit', minute:'2-digit'});
                    } catch(e) {
                        dateStr = projectData.created_at;
                    }
                }
                document.getElementById("info-proj-date").textContent = dateStr;
                document.getElementById("info-proj-cols").textContent = (projectData.columns ? projectData.columns.length : 0);
            }
            
            const deselectBtn = document.getElementById("btn-deselect-project-data");
            if (deselectBtn) deselectBtn.style.display = "inline-block";
            
            const cardTitle = document.getElementById("proj-card-title");
            if (cardTitle) cardTitle.innerHTML = `<i class="fa-solid fa-folder-open text-accent"></i> Dettagli Progetto Attivo`;
            
            const navSpecs = document.getElementById("nav-project-specifications");
            if (navSpecs) navSpecs.style.display = "flex";
            const navRevisions = document.getElementById("nav-revisione-documentazione");
            if (navRevisions) navRevisions.style.display = "flex";
            
            // Reload modules
            if (typeof loadProjectSuppliers === 'function') await loadProjectSuppliers();
            if (typeof loadVdlDocumentsFilesMapping === 'function') await loadVdlDocumentsFilesMapping();
            
            await fetchDocuments();
            updateViewsWarningsState();
        }
    } catch (err) {
        console.error("Errore caricamento progetto:", err);
    }
}

async function fetchDocuments() {
    if (!activeProjectId) return;
    try {
        const response = await fetch(`/api/documents?project_id=${activeProjectId}`);
        const data = await response.json();
        if (data.status === 'success') {
            documentsData = data.documents || [];
            filteredDocumentsData = [...documentsData];
            applyFiltersAndSort();
        }
    } catch (err) {
        console.error("Errore recupero documenti:", err);
    }
}

function renderEmptyGrid() {
    documentsData = [];
    filteredDocumentsData = [];
    applyFiltersAndSort();
}

function initUploadZone() {
    const fileInput = document.getElementById("file-input");
    const uploadZone = document.getElementById("upload-zone");
    
    if (fileInput) {
        fileInput.addEventListener("change", async () => {
            if (!activeProjectId) {
                showToast("Seleziona prima un progetto in alto.", "warning");
                fileInput.value = "";
                return;
            }
            if (fileInput.files.length > 0) {
                await handleFileUpload(fileInput.files[0]);
                fileInput.value = "";
            }
        });
    }
    
    if (uploadZone && fileInput) {
        uploadZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadZone.classList.add("dragover");
        });
        
        uploadZone.addEventListener("dragleave", () => {
            uploadZone.classList.remove("dragover");
        });
        
        uploadZone.addEventListener("drop", async (e) => {
            e.preventDefault();
            uploadZone.classList.remove("dragover");
            
            if (!activeProjectId) {
                showToast("Seleziona prima un progetto in alto.", "warning");
                return;
            }
            
            if (e.dataTransfer.files.length > 0) {
                await handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }
}

async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", activeProjectId);
    
    showToast("Importazione in corso...", "info");
    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (data.status === 'success') {
            showToast("VDL importata con successo!", "success");
            await loadActiveProject();
            await fetchDocuments();
        } else {
            showToast(data.detail || "Errore importazione.", "error");
        }
    } catch (err) {
        showToast("Errore di rete durante l'upload.", "error");
    }
}

function initDiagnosticsControls() {
    const btnDownload = document.getElementById("btn-download-error-log");
    const btnClear = document.getElementById("btn-clear-error-log");
    
    if (btnDownload) {
        btnDownload.addEventListener("click", downloadErrorLog);
    }
    if (btnClear) {
        btnClear.addEventListener("click", clearErrorLog);
    }
}

async function downloadErrorLog() {
    try {
        const response = await fetch("/api/admin/error-log");
        if (!response.ok) {
            const data = await response.json();
            showToast(data.detail || "Nessun log di errore trovato.", "error");
            return;
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "backend_errors.log";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast("Log di errore scaricato con successo.", "success");
    } catch (err) {
        console.error(err);
        showToast("Errore di rete durante il download del log.", "error");
    }
}

async function clearErrorLog() {
    if (!confirm("Sei sicuro di voler cancellare interamente il file di log degli errori?")) return;
    try {
        const response = await fetch("/api/admin/error-log/clear", { method: "POST" });
        const data = await response.json();
        if (response.ok && data.status === "success") {
            showToast(data.message, "success");
        } else {
            showToast(data.detail || "Errore durante la cancellazione del log.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Errore di rete durante la cancellazione del log.", "error");
    }
}

function initTableGridControls() {
    const searchInput = document.getElementById("grid-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            applyFiltersAndSort();
        });
    }

    const btnAddRow = document.getElementById("btn-add-row");
    if (btnAddRow) {
        btnAddRow.addEventListener("click", () => {
            openDocModal();
        });
    }

    const btnSaveGrid = document.getElementById("btn-save-grid");
    if (btnSaveGrid) {
        btnSaveGrid.addEventListener("click", async () => {
            await saveGridModifications();
        });
    }

    const btnResetFilters = document.getElementById("btn-reset-filters");
    if (btnResetFilters) {
        btnResetFilters.addEventListener("click", () => {
            resetAllFilters();
        });
    }

    const btnAddCycle = document.getElementById("btn-add-cycle");
    if (btnAddCycle) {
        btnAddCycle.addEventListener("click", async () => {
            await addRevisionCycle();
        });
    }

    const btnExportExcel = document.getElementById("btn-export-excel");
    if (btnExportExcel) {
        btnExportExcel.addEventListener("click", async () => {
            await exportGridToExcel();
        });
    }

    // Modal save button
    const btnSaveDocRow = document.getElementById("btn-save-doc-row");
    if (btnSaveDocRow) {
        btnSaveDocRow.addEventListener("click", async () => {
            await saveNewDocFromModal();
        });
    }

    // Popover outside clicks
    document.addEventListener("click", (e) => {
        const popover = document.getElementById("filter-popover");
        if (!popover || !popover.classList.contains("active")) return;
        
        // If clicked outside popover and outside any filter trigger
        if (!popover.contains(e.target) && !e.target.closest(".filter-trigger")) {
            closeFilterPopover();
        }
    });

    // Popover actions
    const popoverBtnApply = document.getElementById("popover-btn-apply"); if (popoverBtnApply) popoverBtnApply.addEventListener("click", () => {
        applyPopoverFilter();
    });
    
    const popoverBtnClear = document.getElementById("popover-btn-clear"); if (popoverBtnClear) popoverBtnClear.addEventListener("click", () => {
        clearPopoverFilter();
    });

    const popoverSearch = document.getElementById("popover-search");
    if (popoverSearch) {
        popoverSearch.addEventListener("input", (e) => {
            filterPopoverCheckboxList(e.target.value);
        });
    }

    // Check Fornitori button
    const btnCheckSuppliers = document.getElementById("btn-check-suppliers");
    if (btnCheckSuppliers) {
        btnCheckSuppliers.addEventListener("click", () => {
            openCrossCheckModal();
        });
    }
}

// Cross Check Modal Logic
async function openCrossCheckModal(prefetchedWarnings = null) {
    if (!activeProjectId) return;
    const modal = document.getElementById("cross-check-modal");
    if (!modal) return;
    
    const tbody = document.getElementById("cross-check-body");
    modal.classList.add("active");
    
    if (prefetchedWarnings !== null) {
        renderCrossCheckWarnings(prefetchedWarnings, tbody);
        return;
    }
    
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Analisi in corso...</td></tr>`;
    
    try {
        const res = await fetch(`/api/project/${activeProjectId}/cross-warnings`);
        const data = await res.json();
        
        if (data.status === 'success') {
            renderCrossCheckWarnings(data.warnings || [], tbody);
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">Errore durante l'analisi.</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">Errore di rete.</td></tr>`;
    }
}

function renderCrossCheckWarnings(warnings, tbody) {
    if (warnings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #10b981;"><i class="fa-solid fa-circle-check" style="margin-right: 8px;"></i> Nessuna anomalia riscontrata. Tutti i documenti fornitori sono allineati.</td></tr>`;
        return;
    }
    
    let html = "";
    warnings.forEach(w => {
        html += `
            <tr>
                <td style="font-weight: 600; color: var(--primary-light);">${escapeHtml(w.document_number)}</td>
                <td>${escapeHtml(w.description)}</td>
                <td><span class="badge" style="background: rgba(37,99,235,0.1); color: var(--primary-light);">${escapeHtml(w.supplier_name)}</span></td>
                <td style="color: var(--text-muted);">${w.supplier_date || '-'}</td>
                <td style="color: #ef4444; font-weight: 500;">
                    ${w.client_date ? w.client_date : 'Mai Emesso'}
                    <div style="font-size: 11px; margin-top: 4px; opacity: 0.8;">${escapeHtml(w.reason)}</div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function closeCrossCheckModal() {
    const modal = document.getElementById("cross-check-modal");
    if (modal) modal.classList.remove("active");
}

async function exportGridToExcel() {
    if (!projectData) {
        showToast("Carica una VDL per poter esportare i dati.", "warning");
        return;
    }
    
    if (filteredDocumentsData.length === 0) {
        showToast("Nessun dato corrispondente ai filtri attuali da esportare.", "warning");
        return;
    }
    
    const btn = document.getElementById("btn-export-excel");
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Esportazione...`;
    btn.disabled = true;
    
    try {
        const response = await fetch("/api/project/export", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                project_id: activeProjectId,
                columns: projectData.columns,
                documents: filteredDocumentsData
            })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Errore durante l'esportazione.");
        }
        
        const blob = await response.blob();
        
        // Extract filename from header
        let filename = `VDL_Export_${projectData.project_name.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
        const disposition = response.headers.get('content-disposition');
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) { 
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        
        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast("Tabella esportata con successo in Excel!", "success");
    } catch (e) {
        console.error("Export error:", e);
        showToast(e.message || "Errore di rete durante l'esportazione.", "error");
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

async function addRevisionCycle() {
    if (!projectData) {
        showToast("Seleziona un progetto attivo prima di aggiungere un ciclo.", "warning");
        return;
    }
    
    if (isGridDirty) {
        showToast("Salva le modifiche pendenti prima di aggiungere un ciclo di revisione.", "warning");
        return;
    }
    
    const btn = document.getElementById("btn-add-cycle");
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Aggiunta in corso...`;
    btn.disabled = true;
    
    try {
        const response = await fetch(`/api/project/${activeProjectId}/add-cycle`, {
            method: "POST"
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Errore durante l'aggiunta del ciclo.");
        }
        
        showToast(data.message, "success");
        // Reload project and table to show new columns
        await loadProjectDetails(activeProjectId);
        await loadDocumentsForGrid(activeProjectId);
    } catch (e) {
        console.error("Add cycle error:", e);
        showToast(e.message || "Errore di rete.", "error");
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}
// Reset all grid filters
function resetAllFilters() {
    if (!projectData) return;
    
    projectData.columns.forEach((col, colIdx) => {
        activeFilters[col] = new Set();
    });
    
    // Clear global search
    document.getElementById("grid-search").value = "";
    
    // Update triggers visual
    document.querySelectorAll(".filter-trigger").forEach(trig => {
        trig.classList.remove("active");
    });
    
    showToast("Tutti i filtri delle colonne sono stati rimossi.", "success");
    applyFiltersAndSort();
}

// 8. Excel Table Renderer Engine
function renderGridTable() {
    const head = document.getElementById("vdl-grid-head");
    const body = document.getElementById("vdl-grid-body");
    
    if (!projectData || projectData.columns.length === 0) {
        renderEmptyGrid();
        return;
    }
    
    // RENDER HEADERS
    let headerHTML = "<tr>";
    
    // Add row index number column
    headerHTML += `<th style="width: 50px; text-align: center; background: #0f162a; position: sticky; left: 0; z-index: 5; cursor: pointer;" onclick="selectAllGrid()" title="Seleziona tutto">#</th>`;
    
    projectData.columns.forEach((col, colIdx) => {
        const isTracking = CUSTOM_TRACKING_COLUMNS.includes(col);
        const colStyle = isTracking ? 'style="border-bottom-color: var(--primary);"' : '';
        const isFiltered = activeFilters[col] && activeFilters[col].size > 0;
        const activeFilterClass = isFiltered ? "active" : "";
        
        headerHTML += `
            <th ${colStyle} data-col-idx="${colIdx}" onclick="selectColumn(${colIdx})" style="cursor: cell;" title="Seleziona intera colonna">
                <div class="header-cell-content">
                    <span class="header-sort-title" onclick="toggleSortColumn('${col}')" style="cursor: pointer; flex: 1; display: flex; align-items: center; gap: 6px;">
                        ${col}
                        ${sortColumn === col ? (sortDirection === 'asc' ? '<i class="fa-solid fa-arrow-up-short-wide" style="font-size:10px; color:var(--primary);"></i>' : '<i class="fa-solid fa-arrow-down-wide-short" style="font-size:10px; color:var(--primary);"></i>') : ''}
                    </span>
                    <span class="filter-trigger ${activeFilterClass}" onclick="openFilterPopover(event, '${col}')">
                        <i class="fa-solid fa-filter"></i>
                    </span>
                </div>
            </th>
        `;
    });
    
    // Action column header
    headerHTML += `<th style="width: 80px; text-align: center;">Azioni</th>`;
    headerHTML += "</tr>";
    head.innerHTML = headerHTML;
    
    // RENDER ROWS
    if (filteredDocumentsData.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="100%" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    Nessun documento corrisponde ai criteri di ricerca/filtro impostati.
                </td>
            </tr>
        `;
        document.getElementById("lbl-shown-rows").textContent = "0";
        document.getElementById("lbl-total-rows").textContent = documentsData.length;
        return;
    }
    
    let bodyHTML = "";
    filteredDocumentsData.forEach((doc, idx) => {
        bodyHTML += `<tr>`;
        
        // Static row index
        bodyHTML += `<td style="text-align: center; background: #0f162a; position: sticky; left: 0; z-index: 3; font-weight: 600; color: var(--text-muted); border-right: 2px solid var(--border-color); cursor: pointer;" onclick="selectRow(${idx})" title="Seleziona intera riga">${idx + 1}</td>`;
        
        projectData.columns.forEach((col, colIdx) => {
            const val = doc[col] !== undefined && doc[col] !== null ? doc[col] : "";
            const isTracking = CUSTOM_TRACKING_COLUMNS.includes(col);
            
            // Check if this specific cell value differs from the clean loaded version
            // For simple visualization, row is dirty, let's keep track if is_dirty
            const isRowDirty = doc.is_dirty;
            
            let classes = [];
            const isComputed = (col === "Next issue forecast date" || col === "Last Code receive");
            if (isComputed) {
                classes.push("cell-locked");
            } else {
                classes.push("editable");
            }
            if (isTracking) classes.push("tracking-cell");
            
            // Simple check: we append cell-dirty class if row is dirty AND we find cell has been modified (handled inline)
            // To make it look perfect, let's rely on standard dataset or a specific dirty check.
            // For now, if the row is marked is_dirty, we highlight modified cells.
            
            bodyHTML += `
                <td class="${classes.join(' ')}" 
                    data-id="${doc.__id}" 
                    data-col="${col}" 
                    data-row-idx="${idx}"
                    data-col-idx="${colIdx}"
                    onmousedown="handleCellMouseDown(event, this)"
                    onmouseenter="handleCellMouseEnter(event, this)"
                    ondblclick="startCellEdit(this)">
                    ${getCellInnerHtml(col, val)}
                </td>
            `;
        });
        
        // Delete button actions
        bodyHTML += `
            <td style="text-align: center;">
                <button class="btn btn-danger" onclick="deleteDocument(${doc.__id})" style="padding: 4px 8px; font-size: 11px;">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        bodyHTML += "</tr>";
    });
    
    body.innerHTML = bodyHTML;
    
    // Update counters
    document.getElementById("lbl-shown-rows").textContent = filteredDocumentsData.length;
    document.getElementById("lbl-total-rows").textContent = documentsData.length;
}

// 9. Excel Multi-column Filters & Search
function applyFiltersAndSort() {
    const searchText = document.getElementById("grid-search").value.toLowerCase().trim();
    
    filteredDocumentsData = documentsData.filter(doc => {
        // A. Global Search Filter
        if (searchText) {
            let matchesSearch = false;
            for (const col of projectData.columns) {
                const cellVal = String(doc[col] || "").toLowerCase();
                if (cellVal.includes(searchText)) {
                    matchesSearch = true;
                    break;
                }
            }
            if (!matchesSearch) return false;
        }
        
        // B. Column Specific Checkbox Filters
        for (const col of projectData.columns) {
            const allowedSet = activeFilters[col];
            if (allowedSet && allowedSet.size > 0) {
                const cellVal = String(doc[col] || "").trim();
                const displayVal = cellVal === "" ? "(Vuoto)" : cellVal;
                if (!allowedSet.has(displayVal)) {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    // C. Sorting
    if (sortColumn) {
        filteredDocumentsData.sort((a, b) => {
            let valA = String(a[sortColumn] || "").trim();
            let valB = String(b[sortColumn] || "").trim();
            
            // Try to sort numerically if both represent numbers
            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
                return sortDirection === 'asc' ? numA - numB : numB - numA;
            }
            
            // Try date comparison robustly
            const dateA = Date.parse(valA);
            const dateB = Date.parse(valB);
            if (!isNaN(dateA) && !isNaN(dateB)) {
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            }
            
            // Fallback: regular alphabetical
            return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
    }
    
    renderGridTable();
}

function toggleSortColumn(col) {
    if (sortColumn === col) {
        // Toggle direction
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = col;
        sortDirection = 'asc';
    }
    
    applyFiltersAndSort();
}

// 10. Interactive Inline Cell Editing
let activeEditCell = null;

function startCellEdit(cell) {
    if (currentUserRole === "Project Engineering") {
        showToast("Accesso in sola lettura: il tuo ruolo (Project Engineering) non consente la modifica diretta dei dati.", "warning");
        return;
    }
    const colName = cell.getAttribute("data-col");
    if (colName === "Next issue forecast date" || colName === "Last Code receive") {
        showToast("Questo campo è calcolato automaticamente e non può essere modificato manualmente.", "warning");
        return;
    }

    if (activeEditCell && activeEditCell !== cell) {
        stopCellEdit(activeEditCell, true); // save previous
    }
    
    activeEditCell = cell;
    const docId = cell.getAttribute("data-id");
    const currentVal = cell.textContent.trim();
    
    cell.classList.add("editing");
    cell.removeAttribute("ondblclick"); // Disable doubleclick temporary
    
    // Render appropriate editor type
    let editorHTML = "";
    
    // Check if column is a Date column (case insensitive)
    const isDateCol = colName.toLowerCase().includes("date") || 
                      colName.toLowerCase().includes("forecast") || 
                      colName.toLowerCase().includes("issue") || 
                      colName.toLowerCase().includes("actual");
                      
    const isHandsCol = colName.toLowerCase() === "hands";

    if (isHandsCol) {
        // Render dropdown selection populated with contacts or write-in options
        editorHTML = `<select id="cell-inline-editor">`;
        editorHTML += `<option value="" ${currentVal === "" ? 'selected' : ''}>Non specificato</option>`;
        
        // Populating select with current hands rubrica
        const currentHands = Object.keys(contactsData);
        currentHands.forEach(hands => {
            editorHTML += `<option value="${hands}" ${currentVal === hands ? 'selected' : ''}>${hands}</option>`;
        });
        
        // Include linked project suppliers
        projectSuppliers.forEach(s => {
            if (!currentHands.includes(s.name) && currentVal !== s.name) {
                editorHTML += `<option value="${s.name}">${s.name}</option>`;
            }
        });
        
        // Add default options if not in contacts and not in suppliers
        const projectSupplierNames = projectSuppliers.map(s => s.name);
        if (currentVal && !currentHands.includes(currentVal) && !projectSupplierNames.includes(currentVal)) {
            editorHTML += `<option value="${currentVal}" selected>${currentVal}</option>`;
        }
        
        // Option to add a new hands actor directly
        editorHTML += `<option value="__new__">+ Aggiungi Nuovo...</option>`;
        editorHTML += `</select>`;
    } else if (isDateCol && colName.toLowerCase() !== "hands") {
        // Render browser native date picker
        // Dates in cells are usually YYYY-MM-DD, let's normalize formatting if needed
        let formattedDate = currentVal;
        if (currentVal) {
            const dateParsed = Date.parse(currentVal);
            if (!isNaN(dateParsed)) {
                formattedDate = new Date(dateParsed).toISOString().split('T')[0];
            }
        }
        editorHTML = `<input type="date" id="cell-inline-editor" value="${formattedDate}">`;
    } else {
        // Regular textbox input
        editorHTML = `<input type="text" id="cell-inline-editor" value="${currentVal.replace(/"/g, '&quot;')}">`;
    }
    
    cell.innerHTML = editorHTML;
    const editor = document.getElementById("cell-inline-editor");
    editor.focus();
    
    // Event listeners for inline cell editor
    editor.addEventListener("blur", () => {
        stopCellEdit(cell, true);
    });
    
    editor.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            stopCellEdit(cell, true);
        } else if (e.key === "Escape") {
            stopCellEdit(cell, false); // Cancel
        }
    });

    editor.addEventListener("change", (e) => {
        if (isHandsCol && e.target.value === "__new__") {
            // Prompt to type new actor name
            const newHandsName = prompt("Inserisci il nome del nuovo attore (Hands):");
            if (newHandsName && newHandsName.trim()) {
                const cleanName = newHandsName.trim();
                // Add temporary option and select it
                const option = document.createElement("option");
                option.value = cleanName;
                option.text = cleanName;
                option.selected = true;
                editor.appendChild(option);
            } else {
                editor.value = currentVal;
            }
        }
    });
}

function stopCellEdit(cell, save) {
    if (!cell.classList.contains("editing")) return;
    
    const docId = parseInt(cell.getAttribute("data-id"));
    const colName = cell.getAttribute("data-col");
    const editor = document.getElementById("cell-inline-editor");
    let newVal = editor.value;
    
    // Restore double click trigger
    cell.setAttribute("ondblclick", "startCellEdit(this)");
    cell.classList.remove("editing");
    activeEditCell = null;
    
    if (!save) {
        // Restore previous text
        const doc = documentsData.find(d => d.__id === docId);
        cell.innerHTML = doc ? getCellInnerHtml(colName, doc[colName] || "") : "";
        return;
    }

    if (newVal === "__new__") newVal = ""; // Safe fallback
    
    // Find item in document array
    const doc = documentsData.find(d => d.__id === docId);
    if (doc) {
        const oldVal = doc[colName] !== undefined && doc[colName] !== null ? String(doc[colName]).trim() : "";
        const cleanNewVal = newVal.trim();
        
        if (oldVal !== cleanNewVal) {
            // Update local state
            doc[colName] = cleanNewVal;
            
            // Recalculate computed fields on frontend
            recalculateRowComputedFields(doc);
            
            doc.is_dirty = true;
            
            // Mark cell dirty visually
            cell.classList.add("cell-dirty");
            
            // Toggle grid overall dirty state
            isGridDirty = true;
            
            // Change Save button visual to warn user to persist
            const saveBtn = document.getElementById("btn-save-grid");
            saveBtn.classList.remove("btn-primary");
            saveBtn.classList.add("btn-teal");
            
            showToast("Modifiche non salvate in tabella. Clicca 'Salva Modifiche' per memorizzarle.", "warning");
            
            applyFiltersAndSort();
        } else {
            cell.innerHTML = getCellInnerHtml(colName, cleanNewVal);
        }
    }
}

// 11. Bulk save modifications to database
async function saveGridModifications() {
    if (!projectData) return;
    
    // Filter out rows modified locally
    const dirtyRows = documentsData.filter(d => d.is_dirty);
    if (dirtyRows.length === 0) {
        showToast("Nessuna modifica rilevata da salvare.", "info");
        return;
    }
    
    const saveBtn = document.getElementById("btn-save-grid");
    const originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...`;
    saveBtn.disabled = true;

    try {
        const response = await fetch(`/api/documents/save-all?project_id=${activeProjectId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dirtyRows)
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showToast(data.message, "success");
            
            // Clear dirty marks in local states
            documentsData.forEach(d => {
                d.is_dirty = false;
            });
            isGridDirty = false;
            
            // Reset button style
            saveBtn.classList.remove("btn-teal");
            saveBtn.classList.add("btn-primary");
            
            // Re-render spreadsheet to clear dirty borders
            applyFiltersAndSort();
        } else {
            showToast(data.detail || "Errore durante il salvataggio dei dati.", "error");
        }
    } catch (e) {
        console.error("Save all error:", e);
        showToast("Errore di rete durante il salvataggio.", "error");
    } finally {
        saveBtn.innerHTML = originalHTML;
        saveBtn.disabled = false;
    }
}

// 12. Modal Document Row Actions (Add row)
function openDocModal() {
    if (!projectData) {
        showToast("Devi prima caricare una VDL per poter aggiungere documenti.", "warning");
        return;
    }
    
    const container = document.getElementById("doc-form-fields-container");
    container.innerHTML = "";
    
    // Build form inputs dynamically based on project columns
    projectData.columns.forEach((col, colIdx) => {
        const isTracking = CUSTOM_TRACKING_COLUMNS.includes(col);
        const isDateCol = col.toLowerCase().includes("date") || 
                          col.toLowerCase().includes("forecast") || 
                          col.toLowerCase().includes("issue") || 
                          col.toLowerCase().includes("actual");
                          
        const isHandsCol = col.toLowerCase() === "hands";
        
        let inputHTML = "";
        
        if (isHandsCol) {
            inputHTML = `<select class="form-control" name="${col}" id="modal-field-${col.replace(/\s+/g, '-')}">`;
            inputHTML += `<option value="">Non specificato</option>`;
            Object.keys(contactsData).forEach(hands => {
                inputHTML += `<option value="${hands}">${hands}</option>`;
            });
            // Include linked project suppliers
            projectSuppliers.forEach(s => {
                if (!contactsData[s.name]) {
                    inputHTML += `<option value="${s.name}">${s.name}</option>`;
                }
            });
            inputHTML += `</select>`;
        } else if (isDateCol && col.toLowerCase() !== "hands") {
            inputHTML = `<input type="date" class="form-control" name="${col}" id="modal-field-${col.replace(/\s+/g, '-')}">`;
        } else {
            inputHTML = `<input type="text" class="form-control" name="${col}" id="modal-field-${col.replace(/\s+/g, '-')}">`;
        }
        
        container.innerHTML += `
            <div class="form-group">
                <label style="color: ${isTracking ? 'var(--accent-teal)' : 'var(--text-muted)'}; font-weight: ${isTracking ? '600' : '400'};">
                    ${col} ${isTracking ? ' (Tracking)' : ''}
                </label>
                ${inputHTML}
            </div>
        `;
    });
    
    document.getElementById("doc-modal").classList.add("active");
}

function closeDocModal() {
    document.getElementById("doc-modal").classList.remove("active");
    document.getElementById("doc-modal-form").reset();
}

async function saveNewDocFromModal() {
    const form = document.getElementById("doc-modal-form");
    const formData = new FormData(form);
    
    // Construct document JSON object
    const docObj = {};
    projectData.columns.forEach((col, colIdx) => {
        // Read form element
        const fieldId = `modal-field-${col.replace(/\s+/g, '-')}`;
        const elem = document.getElementById(fieldId);
        docObj[col] = elem ? elem.value.trim() : "";
    });
    
    const saveBtn = document.getElementById("btn-save-doc-row");
    saveBtn.disabled = true;
    saveBtn.textContent = "Aggiunta...";

    try {
        const response = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ document_data: docObj })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showToast(data.message, "success");
            closeDocModal();
            
            // Reload grid data
            await fetchDocuments();
            await loadDashboardStats();
        } else {
            showToast(data.detail || "Impossibile aggiungere il documento.", "error");
        }
    } catch (e) {
        console.error("Save row error:", e);
        showToast("Errore di rete.", "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fa-solid fa-check"></i> Aggiungi Riga`;
    }
}

// 13. Delete Document Row Action
async function deleteDocument(docId) {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questa riga documento dal database?")) {
        return;
    }
    
    try {
        const response = await fetch(`/api/documents/${docId}`, {
            method: "DELETE"
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showToast(data.message, "success");
            await fetchDocuments();
            await loadDashboardStats();
        } else {
            showToast(data.detail || "Impossibile eliminare la riga.", "error");
        }
    } catch (e) {
        console.error("Delete error:", e);
        showToast("Errore di rete.", "error");
    }
}

// 14. Excel-like column popover filter actions
let activeFilterPopoverCol = null;

function openFilterPopover(event, colName) {
    event.stopPropagation(); // Avoid body click trigger closure
    
    const trigger = event.currentTarget;
    const popover = document.getElementById("filter-popover");
    const searchInput = document.getElementById("popover-search");
    
    activeFilterPopoverCol = colName;
    searchInput.value = ""; // Reset search
    
    // POSITION POPOVER UNDER FILTER TRIGGER ICON
    const rect = trigger.getBoundingClientRect();
    popover.style.display = "block"; // Show first to get correct dimensions
    
    // Avoid horizontal boundaries overflow
    let left = rect.left + window.scrollX;
    if (left + 240 > window.innerWidth) {
        left = window.innerWidth - 260;
    }
    
    popover.style.left = `${left}px`;
    popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
    popover.classList.add("active");
    
    // EXTRACT UNIQUE VALUES FOR CHECKBOXES
    const uniqueValues = new Set();
    documentsData.forEach(doc => {
        const val = String(doc[colName] || "").trim();
        uniqueValues.add(val === "" ? "(Vuoto)" : val);
    });
    
    const sortedVals = Array.from(uniqueValues).sort((a, b) => {
        if (a === "(Vuoto)") return -1;
        if (b === "(Vuoto)") return 1;
        return a.localeCompare(b);
    });
    
    // RENDER OPTIONS LIST
    const list = document.getElementById("popover-options-list");
    list.innerHTML = "";
    
    const allowedSet = activeFilters[colName] || new Set();
    
    sortedVals.forEach((val, idx) => {
        // If allowedSet is empty, it means all values are selected by default.
        // If allowedSet has items, only check checked ones.
        const isChecked = allowedSet.size === 0 || allowedSet.has(val);
        
        list.innerHTML += `
            <label class="filter-option" data-value="${val.replace(/"/g, '&quot;')}">
                <input type="checkbox" value="${val.replace(/"/g, '&quot;')}" ${isChecked ? 'checked' : ''}>
                <span>${val}</span>
            </label>
        `;
    });
}

function filterPopoverCheckboxList(query) {
    const lowercaseQuery = query.toLowerCase().trim();
    const options = document.querySelectorAll("#popover-options-list .filter-option");
    
    options.forEach(opt => {
        const val = opt.getAttribute("data-value").toLowerCase();
        if (val.includes(lowercaseQuery)) {
            opt.style.display = "flex";
        } else {
            opt.style.display = "none";
        }
    });
}

function closeFilterPopover() {
    const popover = document.getElementById("filter-popover");
    if (popover) {
        popover.classList.remove("active");
        popover.style.display = "none";
    }
    activeFilterPopoverCol = null;
}

function applyPopoverFilter() {
    if (!activeFilterPopoverCol) return;
    
    const checkboxes = document.querySelectorAll("#popover-options-list input[type='checkbox']");
    const totalOptions = checkboxes.length;
    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
    
    const allowedSet = new Set();
    
    // If all are checked or none are checked, we treat it as all allowed (no filter)
    if (checkedBoxes.length > 0 && checkedBoxes.length < totalOptions) {
        checkedBoxes.forEach(cb => {
            allowedSet.add(cb.value);
        });
        
        // Mark trigger as active (colored)
        document.querySelectorAll(".filter-trigger").forEach(trig => {
            if (trig.getAttribute("data-col") === activeFilterPopoverCol) {
                trig.classList.add("active");
            }
        });
    } else {
        // Reset filter
        document.querySelectorAll(".filter-trigger").forEach(trig => {
            if (trig.getAttribute("data-col") === activeFilterPopoverCol) {
                trig.classList.remove("active");
            }
        });
    }
    
    activeFilters[activeFilterPopoverCol] = allowedSet;
    
    closeFilterPopover();
    applyFiltersAndSort();
    showToast(`Filtro colonna '${activeFilterPopoverCol}' applicato.`, "success");
}

function clearPopoverFilter() {
    if (!activeFilterPopoverCol) return;
    
    // Empty the set
    activeFilters[activeFilterPopoverCol] = new Set();
    
    // Uncheck all
    document.querySelectorAll("#popover-options-list input[type='checkbox']").forEach(cb => {
        cb.checked = true;
    });
    
    // Mark trigger as disabled
    document.querySelectorAll(".filter-trigger").forEach(trig => {
        if (trig.getAttribute("data-col") === activeFilterPopoverCol) {
            trig.classList.remove("active");
        }
    });
    
    closeFilterPopover();
    applyFiltersAndSort();
    showToast(`Filtro rimosso per la colonna '${activeFilterPopoverCol}'.`, "info");
}

// Helper function to build dynamic email subject prefix from project details
function getProjectSubjectPrefix() {
    if (!projectData) return "";
    const parts = [];
    if (projectData.vendor_proj_num) {
        const val = projectData.vendor_proj_num.toString().trim();
        if (val) parts.push(val);
    }
    if (projectData.project_name) {
        const val = projectData.project_name.toString().trim();
        if (val) parts.push(val);
    }
    if (projectData.contractor_proj_num) {
        const val = projectData.contractor_proj_num.toString().trim();
        if (val) parts.push(val);
    }
    return parts.length > 0 ? parts.join(" - ") : "";
}

// 15. Reminder Dashboard Center Logic
function initReminderCenterControls() {
    const handsSelect = document.getElementById("reminder-hands-select");
    const bufferInput = document.getElementById("reminder-buffer");
    const btnCalc = document.getElementById("btn-calc-reminders");
    const btnSend = document.getElementById("btn-send-reminders");
    
    if (handsSelect) {
        handsSelect.addEventListener("change", () => {
            // Automatically calculate delays on selection
            if (handsSelect.value) {
                const subjectInput = document.getElementById("reminder-subject");
                const actorName = handsSelect.value === "all" ? "TUTTI GLI ATTORI" : handsSelect.value;
                const prefix = getProjectSubjectPrefix();
                const baseSubject = `MISSING DOCUMENTATION - REMINDER - ${actorName}`;
                subjectInput.value = prefix ? `${prefix} - ${baseSubject}` : baseSubject;
                calculateOverdueDocuments();
            } else {
                resetReminderOutputs();
            }
        });
    }
    
    const langSelect = document.getElementById("reminder-language");
    if (langSelect) {
        langSelect.addEventListener("change", () => {
            if (handsSelect.value) calculateOverdueDocuments();
        });
    }
    
    if (btnCalc) {
        btnCalc.addEventListener("click", () => {
            calculateOverdueDocuments();
        });
    }
    
    if (btnSend) {
        btnSend.addEventListener("click", () => {
            sendReminderEmail();
        });
    }
    
    const btnMassMail = document.getElementById("btn-mass-mail");
    if (btnMassMail) {
        btnMassMail.addEventListener("click", async () => {
            await generateMassMails();
        });
    }
}

// 15.1 Mass Mailing Logic
async function generateMassMails() {
    if (!projectData) {
        showToast("Carica una VDL per poter inviare solleciti.", "warning");
        return;
    }
    if (!uniqueHandsValues || uniqueHandsValues.length === 0) {
        showToast("Nessun attore disponibile nel progetto.", "warning");
        return;
    }

    const btnMassMail = document.getElementById("btn-mass-mail");
    const originalText = btnMassMail.innerHTML;
    btnMassMail.disabled = true;
    btnMassMail.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generazione Bozze in corso...`;

    let generatedCount = 0;
    const bufferDays = parseInt(document.getElementById("reminder-buffer").value || "15");
    const lang = document.getElementById("reminder-language").value || "it";
    const sender = document.getElementById("reminder-sender").value.trim() || emailSettings.default_sender || "";
    const notes = document.getElementById("reminder-notes").value.trim();
    const prefix = getProjectSubjectPrefix();

    try {
        for (const hands of uniqueHandsValues) {
            if (hands === "all") continue;

            const baseSubject = `MISSING DOCUMENTATION - REMINDER - ${hands}`;
            const finalSubject = prefix ? `${prefix} - ${baseSubject}` : baseSubject;

            const reqBody = {
                project_id: parseInt(activeProjectId),
                hands_value: hands,
                exchange_time: bufferDays,
                sender_email: sender,
                subject: finalSubject,
                additional_notes: notes,
                language: lang
            };

            const response = await fetch("/api/reminder/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody)
            });

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                generatedCount++;
            }
        }

        if (generatedCount > 0) {
            showToast(`Sono state generate ${generatedCount} bozze email con successo!`, "success");
        } else {
            showToast("Nessun documento in ritardo trovato o nessun destinatario configurato in rubrica.", "info");
        }
    } catch (e) {
        console.error("Mass mailing error:", e);
        showToast("Errore durante la generazione massiva.", "error");
    } finally {
        btnMassMail.disabled = false;
        btnMassMail.innerHTML = originalText;
    }
}

// Populating Reminder interface selectors
async function loadReminderCenter() {
    if (!projectData) {
        showToast("Devi prima caricare una VDL per calcolare i solleciti.", "warning");
        resetReminderOutputs();
        return;
    }
    
    const handsSelect = document.getElementById("reminder-hands-select");
    const defaultBuffer = emailSettings.exchange_time || "15";
    document.getElementById("reminder-buffer").value = defaultBuffer;

    const subjectInput = document.getElementById("reminder-subject");
    if (subjectInput) {
        const prefix = getProjectSubjectPrefix();
        const actorName = handsSelect && handsSelect.value ? (handsSelect.value === "all" ? "TUTTI GLI ATTORI" : handsSelect.value) : "";
        const baseSubject = actorName ? `MISSING DOCUMENTATION - REMINDER - ${actorName}` : `MISSING DOCUMENTATION - REMINDER`;
        subjectInput.value = prefix ? `${prefix} - ${baseSubject}` : baseSubject;
    }

    try {
        // Fetch unique hands values from backend
        const response = await fetch("/api/reminder/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_id: parseInt(activeProjectId), hands_value: "all", exchange_time: parseInt(defaultBuffer) })
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            uniqueHandsValues = data.unique_hands || [];
            
            // Re-render select
            const previousVal = handsSelect.value;
            handsSelect.innerHTML = `<option value="">Seleziona un attore...</option>`;
            handsSelect.innerHTML += `<option value="all">TUTTI GLI ATTORI</option>`;
            
            uniqueHandsValues.forEach(val => {
                handsSelect.innerHTML += `<option value="${val}">${val}</option>`;
            });
            
            // Restore previous choice if valid
            if (previousVal && (previousVal === 'all' || uniqueHandsValues.includes(previousVal))) {
                handsSelect.value = previousVal;
                calculateOverdueDocuments();
            } else {
                resetReminderOutputs();
            }
        }
    } catch (e) {
        console.error("Error setting up reminders:", e);
    }
}

function resetReminderOutputs() {
    document.getElementById("overdue-docs-body").innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
                Seleziona un attore (Hands) e clicca "Aggiorna Scadenze" per visualizzare i ritardi.
            </td>
        </tr>
    `;
    
    document.getElementById("preview-email-to").textContent = "-";
    document.getElementById("preview-email-cc").textContent = "-";
    document.getElementById("preview-email-subject").textContent = "-";
    
    document.getElementById("preview-placeholder").style.display = "flex";
    document.getElementById("email-preview-iframe").style.display = "none";
    document.getElementById("btn-send-reminders").disabled = true;
}

// 16. Overdue Documents Delay Calculations
async function calculateOverdueDocuments() {
    const handsVal = document.getElementById("reminder-hands-select").value;
    const bufferDays = parseInt(document.getElementById("reminder-buffer").value || "15");
    const subjectLine = document.getElementById("reminder-subject").value || "Sollecito Consegna Documenti VDL";
    
    if (!handsVal) {
        showToast("Seleziona prima un attore (Hands) dall'elenco a tendina.", "warning");
        return;
    }
    
    const bodyTable = document.getElementById("overdue-docs-body");
    bodyTable.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 24px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 20px; color: var(--primary); margin-bottom: 8px; display: block;"></i>
                Calcolo dei ritardi in corso...
            </td>
        </tr>
    `;

    try {
        const response = await fetch("/api/reminder/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_id: parseInt(activeProjectId), hands_value: handsVal, exchange_time: bufferDays })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            const overdueDocs = data.overdue_documents || [];
            
            if (overdueDocs.length === 0) {
                bodyTable.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 24px; color: var(--accent-teal); font-weight: 600;">
                            <i class="fa-solid fa-circle-check" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                            Nessun documento in ritardo per l'attore selezionato!
                        </td>
                    </tr>
                `;
                resetEmailPreviewPane();
                return;
            }
            
            // Render table rows
            let rowsHTML = "";
            overdueDocs.forEach(doc => {
                rowsHTML += `
                    <tr>
                        <td style="font-weight: 600; color: white;">${doc.document_code}</td>
                        <td class="text-muted" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${doc.document_title}</td>
                        <td style="color: var(--accent-rose); font-weight: 500;">${doc.next_issue_forecast_date}</td>
                        <td style="font-style: italic; font-size: 11px;">${doc.last_filled_column || 'Inizio'}</td>
                        <td style="text-align: center;">
                            <span class="delay-badge">${doc.delay_days} gg</span>
                        </td>
                    </tr>
                `;
            });
            bodyTable.innerHTML = rowsHTML;
            
            // Trigger Live HTML preview generation
            await generateLiveEmailPreview(handsVal, bufferDays, subjectLine);
        } else {
            showToast(data.message || "Errore nel calcolo delle scadenze.", "error");
        }
    } catch (e) {
        console.error("Calc error:", e);
        showToast("Errore di rete durante il calcolo.", "error");
    }
}

function resetEmailPreviewPane() {
    document.getElementById("preview-email-to").textContent = "-";
    document.getElementById("preview-email-cc").textContent = "-";
    document.getElementById("preview-email-subject").textContent = "-";
    
    document.getElementById("preview-placeholder").style.display = "flex";
    document.getElementById("email-preview-iframe").style.display = "none";
    document.getElementById("btn-send-reminders").disabled = true;
}

// 17. Real-time Live HTML Email Preview
async function generateLiveEmailPreview(handsVal, bufferDays, subjectLine) {
    const additionalNotes = document.getElementById("reminder-notes").value;
    const senderEmail = emailSettings.sender_email || "";
    
    try {
        const response = await fetch("/api/reminder/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project_id: parseInt(activeProjectId),
                hands_value: handsVal,
                exchange_time: bufferDays,
                sender_email: document.getElementById("reminder-sender")?.value || senderEmail,
                subject: subjectLine,
                additional_notes: additionalNotes,
                language: document.getElementById("reminder-language")?.value || "it"
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            // Update email headers in DOM
            document.getElementById("preview-email-to").textContent = data.to || "Non configurato in Rubrica";
            document.getElementById("preview-email-cc").textContent = data.cc || "Nessuno (CC)";
            document.getElementById("preview-email-subject").textContent = data.subject;
            
            // Set HTML in sandbox iframe
            const iframe = document.getElementById("email-preview-iframe");
            iframe.srcdoc = data.html;
            
            document.getElementById("preview-placeholder").style.display = "none";
            iframe.style.display = "block";
            
            // Enable send button
            document.getElementById("btn-send-reminders").disabled = false;
        } else {
            showToast(data.message || "Rubrica email incompleta per questo attore. Vai nella pagina Contatti.", "warning");
            resetEmailPreviewPane();
        }
    } catch (e) {
        console.error("Preview error:", e);
    }
}

// 18. Send Reminder Action (Outlook COM or SMTP)
async function sendReminderEmail() {
    const handsVal = document.getElementById("reminder-hands-select").value;
    const bufferDays = parseInt(document.getElementById("reminder-buffer").value || "15");
    const subjectLine = document.getElementById("reminder-subject").value || "Sollecito Consegna Documenti VDL";
    const additionalNotes = document.getElementById("reminder-notes").value;
    const senderEmail = emailSettings.sender_email || "";
    
    const sendBtn = document.getElementById("btn-send-reminders");
    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generazione in corso...`;
    
    showToast("Preparazione ed invio sollecito email in corso...", "info");

    try {
        const response = await fetch("/api/reminder/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project_id: parseInt(activeProjectId),
                hands_value: handsVal,
                exchange_time: bufferDays,
                sender_email: document.getElementById("reminder-sender")?.value || senderEmail,
                subject: subjectLine,
                additional_notes: additionalNotes,
                language: document.getElementById("reminder-language")?.value || "it"
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            if (data.method === 'outlook') {
                showToast("✅ Bozza email aperta in Outlook! Controlla la finestra di Outlook.", "success");
            } else if (data.method === 'smtp') {
                showToast("✅ Email inviata con successo via SMTP!", "success");
            } else {
                showToast(`✅ Email generata e salvata localmente.`, "success");
            }
        } else if (response.ok && data.status === 'warning') {
            // Outlook fallback warning - not a network error
            showToast(`⚠️ ${data.message || "Outlook non raggiungibile. Assicurati che Outlook sia aperto."}`, "warning");
        } else {
            const errMsg = data.detail || data.message || "Impossibile completare l'operazione di invio email.";
            showToast(`❌ ${errMsg}`, "error");
        }
    } catch (e) {
        console.error("Send error:", e);
        showToast("❌ Errore di rete. Assicurati che il server VDL sia in esecuzione.", "error");
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
    }
}

// 19. Contacts Database CRUD Engine
function initContactForm() {
    const form = document.getElementById("contact-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const hands = document.getElementById("contact-hands").value.trim();
            const to = document.getElementById("contact-to").value.trim();
            const cc = document.getElementById("contact-cc").value.trim();
            
            try {
                const response = await fetch("/api/contacts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        project_id: parseInt(activeProjectId),
                        hands_value: hands,
                        to_emails: to,
                        cc_emails: cc
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.status === 'success') {
                    showToast(`Associazione contatti per '${hands}' salvata con successo.`, "success");
                    form.reset();
                    await loadContacts(); // Reload rubrica
                } else {
                    showToast(data.detail || "Impossibile salvare il contatto.", "error");
                }
            } catch (e) {
                console.error("Save contact error:", e);
                showToast("Errore di rete durante il salvataggio.", "error");
            }
        });
    }
}

async function loadContacts(silent = false) {
    try {
        const response = await fetch(`/api/contacts?project_id=${activeProjectId}`);
        contactsData = await response.json();
        
        if (!silent) {
            loadContactsGrid();
        }
    } catch (e) {
        console.error("Error fetching contacts:", e);
    }
}

function loadContactsGrid() {
    const grid = document.getElementById("contacts-grid");
    if (!grid) return;
    
    const keys = Object.keys(contactsData);
    
    if (keys.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-address-book" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.3;"></i>
                Nessun contatto configurato in rubrica.
            </div>
        `;
        return;
    }
    
    let html = "";
    keys.forEach(hands => {
        const details = contactsData[hands];
        html += `
            <div class="contact-card">
                <div class="contact-hands">
                    <i class="fa-solid fa-user-tag text-accent"></i> ${hands}
                </div>
                <div class="contact-field">
                    <span class="label">A:</span>
                    <span class="value">${details.to}</span>
                </div>
                <div class="contact-field">
                    <span class="label">CC:</span>
                    <span class="value">${details.cc || '-'}</span>
                </div>
                <div class="contact-card-actions">
                    <button class="btn btn-secondary" onclick="editContact('${hands.replace(/'/g, "\\'")}')" style="padding: 4px 8px; font-size: 11px;">
                        <i class="fa-solid fa-pen-to-square"></i> Modifica
                    </button>
                    <button class="btn btn-danger" onclick="deleteContact('${hands.replace(/'/g, "\\'")}')" style="padding: 4px 8px; font-size: 11px;">
                        <i class="fa-solid fa-trash-can"></i> Elimina
                    </button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function editContact(hands) {
    const details = contactsData[hands];
    if (details) {
        document.getElementById("contact-hands").value = hands;
        document.getElementById("contact-to").value = details.to;
        document.getElementById("contact-cc").value = details.cc;
        
        // Scroll to form nicely
        document.getElementById("contact-form").scrollIntoView({ behavior: 'smooth' });
        showToast(`Caricato '${hands}' per la modifica.`, "info");
    }
}

async function deleteContact(hands) {
    if (!confirm(`Sei sicuro di voler eliminare definitivamente i contatti associati a '${hands}'?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/contacts/${activeProjectId}/${encodeURIComponent(hands)}`, {
            method: "DELETE"
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showToast(`Contatto '${hands}' eliminato correttamente.`, "success");
            await loadContacts(); // Reload rubrica
        } else {
            showToast(data.detail || "Errore nella cancellazione.", "error");
        }
    } catch (e) {
        console.error("Delete contact error:", e);
        showToast("Errore di rete.", "error");
    }
}

// 20. Application Settings System
function initSettingsForm() {
    const form = document.getElementById("settings-form");
    if (!form) return;

    // Toggle SMTP settings block visibility based on radio buttons
    const modeRadios = document.querySelectorAll("input[name='email_mode']");
    modeRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            toggleSmtpPanel(e.target.value);
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const sender = document.getElementById("setting-sender").value.trim();
        const server = document.getElementById("setting-server").value.trim();
        const port = document.getElementById("setting-port").value.trim();
        const user = document.getElementById("setting-user").value.trim();
        const pass = document.getElementById("setting-password").value.trim();
        const exchange = document.getElementById("setting-exchange").value.trim();
        
        // Find selected mode
        const selectedMode = document.querySelector("input[name='email_mode']:checked").value;
        
        const saveBtn = form.querySelector("button[type='submit']");
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...`;

        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender_email: sender,
                    smtp_server: server,
                    smtp_port: port,
                    smtp_user: user,
                    smtp_password: pass,
                    email_mode: selectedMode,
                    exchange_time: exchange
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 'success') {
                showToast("Impostazioni globali salvate correttamente.", "success");
                
                // Update global memory settings state
                emailSettings = {
                    sender_email: sender,
                    smtp_server: server,
                    smtp_port: port,
                    smtp_user: user,
                    smtp_password: pass,
                    email_mode: selectedMode,
                    exchange_time: exchange
                };
                
                updateStatusBar(selectedMode);
            } else {
                showToast(data.detail || "Impostazioni non salvate.", "error");
            }
        } catch (e) {
            console.error("Save settings error:", e);
            showToast("Errore di rete durante il salvataggio.", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salva Impostazioni`;
        }
    });
}

function toggleSmtpPanel(mode) {
    const smtpPanel = document.getElementById("smtp-settings-panel");
    if (mode === 'smtp') {
        smtpPanel.style.display = "block";
    } else {
        smtpPanel.style.display = "none";
    }
}

async function loadSettings(silent = false) {
    try {
        const response = await fetch("/api/settings");
        emailSettings = await response.json();
        
        // Populate inputs in settings page
        document.getElementById("setting-sender").value = emailSettings.sender_email || "";
        document.getElementById("setting-server").value = emailSettings.smtp_server || "";
        document.getElementById("setting-port").value = emailSettings.smtp_port || "587";
        document.getElementById("setting-user").value = emailSettings.smtp_user || "";
        document.getElementById("setting-password").value = emailSettings.smtp_password || "";
        document.getElementById("setting-exchange").value = emailSettings.exchange_time || "15";
        
        const mode = emailSettings.email_mode || "outlook";
        const targetRadio = document.getElementById(`mode-${mode}`);
        if (targetRadio) {
            targetRadio.checked = true;
        }
        
        toggleSmtpPanel(mode);
        updateStatusBar(mode);
        
        // Populate project-specific settings if there is an active project
        const projCard = document.getElementById("project-settings-card");
        const projWarningCard = document.getElementById("project-settings-warning-card");
        if (projCard) {
            if (activeProjectId && projectData) {
                projCard.style.display = "block";
                if (projWarningCard) projWarningCard.style.display = "none";
                document.getElementById("project-settings-title-name").textContent = projectData.project_name;
                document.getElementById("proj-job-path").value = projectData.job_path || "";
                
                const format = projectData.revision_format || "numeric";
                const radio = document.getElementById(`rev-${format}`);
                if (radio) radio.checked = true;
                
                populateRevisionColumnsSelector();
            } else {
                projCard.style.display = "none";
                if (projWarningCard) projWarningCard.style.display = "block";
            }
        }
        // If admin, load registered projects recap in Settings
        if (currentUserRole === "Admin") {
            await loadSettingsProjects();
        }
    } catch (e) {
        console.error("Error fetching settings:", e);
    }
}

// 21. Dashboard Statistics Calculator
async function loadDashboardStats() {
    if (!projectData) {
        document.getElementById("stat-total-docs").textContent = "0";
        document.getElementById("stat-hands-count").textContent = "0";
        document.getElementById("stat-overdue-docs").textContent = "0";
        return;
    }
    
    try {
        const defaultBuffer = emailSettings.exchange_time || "15";
        
        // Let's call reminder calculation with hands="all" to get absolute counts
        const response = await fetch("/api/reminder/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_id: parseInt(activeProjectId), hands_value: "all", exchange_time: parseInt(defaultBuffer) })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            const overdueDocs = data.overdue_documents || [];
            const handsList = data.unique_hands || [];
            
            document.getElementById("stat-total-docs").textContent = documentsData.length;
            document.getElementById("stat-hands-count").textContent = handsList.length;
            document.getElementById("stat-overdue-docs").textContent = overdueDocs.length;
            
            // If on Dashboard page, also sync the metrics numbers
            const statTotalText = document.getElementById("stat-total-docs");
            const statOverdueText = document.getElementById("stat-overdue-docs");
            const statHandsText = document.getElementById("stat-hands-count");
            
            if (statTotalText) statTotalText.textContent = documentsData.length;
            if (statOverdueText) statOverdueText.textContent = overdueDocs.length;
            if (statHandsText) statHandsText.textContent = handsList.length;
        }
    } catch (e) {
        console.error("Stats fetching error:", e);
    }

    // Also refresh project status card
    await loadProjectStatus();
}

// 22. Project Document Status Breakdown
async function loadProjectStatus() {
    const card = document.getElementById("project-status-card");
    const content = document.getElementById("project-status-content");
    if (!card || !content) return;

    if (!activeProjectId) {
        card.style.display = "none";
        return;
    }

    card.style.display = "block";
    content.innerHTML = `<div style="color: var(--text-muted); font-size: 13px; font-style: italic;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i>Calcolo in corso...</div>`;

    try {
        const response = await fetch(`/api/project/${activeProjectId}/status`);
        const data = await response.json();

        if (!response.ok || data.status !== 'success') {
            content.innerHTML = `<div style="color:#f87171; font-size:13px;"><i class="fa-solid fa-circle-exclamation"></i> Errore nel calcolo dello stato.</div>`;
            return;
        }

        const perCode = data.per_code || {};
        const pending = data.pending || 0;
        const neverEmitted = data.never_emitted || 0;
        const total = data.total || 0;

        // Color palette for return codes
        const codeColors = [
            { bg: 'rgba(34,197,94,0.15)',  border: '#22c55e', text: '#4ade80' },  // green
            { bg: 'rgba(14,165,233,0.15)', border: '#0ea5e9', text: '#38bdf8' },  // sky
            { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', text: '#c084fc' },  // purple
            { bg: 'rgba(251,191,36,0.15)', border: '#fbbf24', text: '#fcd34d' },  // amber
            { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#fb923c' },  // orange
            { bg: 'rgba(20,184,166,0.15)', border: '#14b8a6', text: '#2dd4bf' },  // teal
        ];

        let html = '';

        // Per-code badges
        const codeEntries = Object.entries(perCode).sort((a, b) => b[1] - a[1]);
        codeEntries.forEach(([code, count], i) => {
            const color = codeColors[i % codeColors.length];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            html += `
                <div class="status-badge" style="
                    background: ${color.bg};
                    border: 1px solid ${color.border};
                    border-radius: 10px;
                    padding: 12px 18px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    min-width: 110px;
                    cursor: pointer;
                " onclick="openDashboardDetails('code_${code}')">
                    <span style="font-size: 26px; font-weight: 700; color: ${color.text}; line-height: 1;">${count}</span>
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: ${color.border}; text-transform: uppercase;">Codice ${code}</span>
                    <span style="font-size: 10px; color: var(--text-muted);">${pct}% del totale</span>
                </div>
            `;
        });

        // Pending badge (sent but not returned)
        if (pending > 0) {
            const pct = total > 0 ? Math.round((pending / total) * 100) : 0;
            html += `
                <div class="status-badge" style="
                    background: rgba(245,158,11,0.12);
                    border: 1px solid #f59e0b;
                    border-radius: 10px;
                    padding: 12px 18px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    min-width: 130px;
                    cursor: pointer;
                " onclick="openDashboardDetails('pending')">
                    <span style="font-size: 26px; font-weight: 700; color: #fcd34d; line-height: 1;">${pending}</span>
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #f59e0b; text-transform: uppercase;"><i class="fa-solid fa-clock"></i> In Attesa Ritorno</span>
                    <span style="font-size: 10px; color: var(--text-muted);">${pct}% del totale</span>
                </div>
            `;
        }

        // Never emitted badge (red warning)
        if (neverEmitted > 0) {
            const pct = total > 0 ? Math.round((neverEmitted / total) * 100) : 0;
            html += `
                <div class="status-badge" style="
                    background: rgba(239,68,68,0.12);
                    border: 1.5px solid #ef4444;
                    border-radius: 10px;
                    padding: 12px 18px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    min-width: 145px;
                    box-shadow: 0 0 12px rgba(239,68,68,0.18);
                    cursor: pointer;
                " onclick="openDashboardDetails('never_emitted')">
                    <span style="font-size: 26px; font-weight: 700; color: #f87171; line-height: 1;">${neverEmitted}</span>
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #ef4444; text-transform: uppercase;">
                        <i class="fa-solid fa-ban"></i> MAI EMESSI
                    </span>
                    <span style="font-size: 10px; color: var(--text-muted);">${pct}% del totale</span>
                </div>
            `;
        }

        if (!html) {
            html = `<div style="color: var(--text-muted); font-size: 13px; font-style: italic;"><i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>Nessun documento caricato per questo progetto.</div>`;
        }

        content.innerHTML = html;

    } catch (e) {
        console.error("Project status error:", e);
        content.innerHTML = `<div style="color:#f87171; font-size:13px;"><i class="fa-solid fa-circle-exclamation"></i> Errore di rete.</div>`;
    }
}


// ==========================================
// EXCEL-LIKE SELECTION AND CLIPBOARD ENGINE
// ==========================================

let isSelecting = false;
let selectionStartCell = null;
let selectedCells = new Set(); // Stores "rowIdx,colIdx" strings

function handleCellMouseDown(e, cell) {
    if (e.button !== 0) return; // Only left click
    if (activeEditCell) return; // Don't interfere if currently editing
    
    isSelecting = true;
    selectionStartCell = cell;
    
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        clearSelection();
    }
    
    selectCell(cell);
}

function handleCellMouseEnter(e, cell) {
    if (isSelecting && selectionStartCell) {
        clearSelection();
        drawSelectionBox(selectionStartCell, cell);
    }
}

document.addEventListener('mouseup', () => {
    isSelecting = false;
});

function clearSelection() {
    document.querySelectorAll('.cell-selected').forEach(c => c.classList.remove('cell-selected'));
    selectedCells.clear();
}

function selectCell(cell) {
    cell.classList.add('cell-selected');
    selectedCells.add(`${cell.dataset.rowIdx},${cell.dataset.colIdx}`);
}

function drawSelectionBox(startCell, endCell) {
    const startR = parseInt(startCell.dataset.rowIdx);
    const startC = parseInt(startCell.dataset.colIdx);
    const endR = parseInt(endCell.dataset.rowIdx);
    const endC = parseInt(endCell.dataset.colIdx);
    
    const minR = Math.min(startR, endR);
    const maxR = Math.max(startR, endR);
    const minC = Math.min(startC, endC);
    const maxC = Math.max(startC, endC);
    
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            const cell = document.querySelector(`td[data-row-idx="${r}"][data-col-idx="${c}"]`);
            if (cell) selectCell(cell);
        }
    }
}

function selectColumn(colIdx) {
    clearSelection();
    const cells = document.querySelectorAll(`td[data-col-idx="${colIdx}"]`);
    cells.forEach(c => selectCell(c));
}

function selectRow(rowIdx) {
    clearSelection();
    const cells = document.querySelectorAll(`td[data-row-idx="${rowIdx}"]`);
    cells.forEach(c => selectCell(c));
}

function selectAllGrid() {
    clearSelection();
    document.querySelectorAll('.view-section.active .vdl-grid td.editable').forEach(c => selectCell(c));
}

// Global Keyboard Listeners for Copy & Paste
document.addEventListener('keydown', async (e) => {
    // Escape to clear selection
    if (e.key === 'Escape') {
        if (!activeEditCell) clearSelection();
        return;
    }

    // Ctrl+A Select All
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT' && !activeEditCell && typeof activeSupplierEditCell === 'undefined' || !activeSupplierEditCell) {
            e.preventDefault();
            selectAllGrid();
        }
    }
    
    // Ctrl+C Copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedCells.size === 0 || activeEditCell || (typeof activeSupplierEditCell !== 'undefined' && activeSupplierEditCell)) return;
        
        // Prevent default only if we're capturing it
        e.preventDefault();
        
        let minR = Infinity, maxR = -Infinity;
        let minC = Infinity, maxC = -Infinity;
        
        Array.from(selectedCells).forEach(v => {
            const [r, c] = v.split(',').map(Number);
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
            minC = Math.min(minC, c);
            maxC = Math.max(maxC, c);
        });
        
        let tsv = "";
        for (let r = minR; r <= maxR; r++) {
            let rowTsv = [];
            for (let c = minC; c <= maxC; c++) {
                // We'll copy the bounding box
                const cell = document.querySelector(`.view-section.active td[data-row-idx="${r}"][data-col-idx="${c}"]`);
                rowTsv.push(cell ? cell.textContent.trim() : "");
            }
            tsv += rowTsv.join("\t") + "\n";
        }
        
        try {
            await navigator.clipboard.writeText(tsv);
            showToast("Celle copiate negli appunti", "info");
        } catch (err) {
            console.error('Copy failed', err);
        }
    }
    
    // Ctrl+V Paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (selectedCells.size === 0 || activeEditCell || (typeof activeSupplierEditCell !== 'undefined' && activeSupplierEditCell)) return;
        
        e.preventDefault();
        
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;
            
            const rows = text.replace(/\r\n/g, '\n').split('\n');
            if (rows[rows.length - 1] === "") rows.pop(); // Remove trailing newline
            
            // Find top-left anchor
            let minR = Infinity, minC = Infinity;
            Array.from(selectedCells).forEach(v => {
                const [r, c] = v.split(',').map(Number);
                minR = Math.min(minR, r);
                minC = Math.min(minC, c);
            });
            
            let pastedCount = 0;
            const modifiedDocs = new Set();
            
            // Detect target grid
            const firstCoords = Array.from(selectedCells)[0].split(',');
            const sampleCell = document.querySelector(`td[data-row-idx="${firstCoords[0]}"][data-col-idx="${firstCoords[1]}"]`);
            const isSupplierGrid = sampleCell && sampleCell.closest('#supplier-vdl-grid') !== null;
            const targetDataArray = isSupplierGrid ? supplierDocumentsData : filteredDocumentsData;
            
            // Helper to update a cell
            const updateCellData = (cell, val) => {
                const docId = cell.dataset.id;
                const colName = cell.dataset.col;
                if (colName === "Next issue forecast date" || colName === "Last Code receive") return;
                
                const doc = targetDataArray.find(d => d.__id == docId);
                if (doc && doc[colName] !== val) {
                    doc[colName] = val;
                    doc.is_dirty = true;
                    modifiedDocs.add(doc);
                    pastedCount++;
                    if (isSupplierGrid) cell.classList.add("cell-dirty");
                }
            };

            // Check if we are pasting a single value into multiple selected cells
            if (rows.length === 1 && rows[0].split('\t').length === 1 && selectedCells.size > 0) {
                const singleValue = rows[0];
                Array.from(selectedCells).forEach(v => {
                    const [r, c] = v.split(',').map(Number);
                    const cell = document.querySelector(`.view-section.active td[data-row-idx="${r}"][data-col-idx="${c}"]`);
                    if (cell) updateCellData(cell, singleValue);
                });
            } else {
                // Block paste anchored at minR, minC
                rows.forEach((rowStr, i) => {
                    const r = minR + i;
                    const cols = rowStr.split('\t');
                    cols.forEach((val, j) => {
                        const c = minC + j;
                        const cell = document.querySelector(`.view-section.active td[data-row-idx="${r}"][data-col-idx="${c}"]`);
                        if (cell) updateCellData(cell, val);
                    });
                });
            }

            // Recalculate computed fields on modified documents
            modifiedDocs.forEach(doc => {
                // Only main grid has computed fields via this function currently, but safe to call if fields match
                if (!isSupplierGrid) recalculateRowComputedFields(doc);
            });
            
            if (pastedCount > 0) {
                if (isSupplierGrid) {
                    const sBtn = document.getElementById("btn-save-supplier-grid");
                    if (sBtn) {
                        sBtn.classList.remove("btn-primary");
                        sBtn.classList.add("btn-teal");
                    }
                    renderSupplierGridTable();
                } else {
                    isGridDirty = true;
                    document.getElementById("btn-save-grid").classList.remove("btn-primary");
                    document.getElementById("btn-save-grid").classList.add("btn-teal");
                    renderGridTable();
                }
                
                // Reselect the pasted area
                clearSelection();
                const startCell = document.querySelector(`.view-section.active td[data-row-idx="${minR}"][data-col-idx="${minC}"]`);
                const endCell = document.querySelector(`.view-section.active td[data-row-idx="${minR + rows.length - 1}"][data-col-idx="${minC + (rows[0].split('\t').length) - 1}"]`);
                if (startCell && endCell) {
                    drawSelectionBox(startCell, endCell);
                }
                
                showToast(`Incollate ${pastedCount} celle. Ricordati di salvare le modifiche.`, "success");
            } else {
                showToast(`Nessuna modifica effettuata (dati identici).`, "info");
            }
        } catch(err) {
            console.error('Paste failed', err);
            showToast("Impossibile incollare: controlla i permessi degli appunti del browser.", "error");
        }
    }
});


// Delete Active Project logic
async function deleteProjectById(projectId, projectName) {
    if (!confirm(`Attenzione: Questa azione eliminerà DEFINITIVAMENTE il progetto '${projectName}', tutte le VDL e la Rubrica Contatti associati ad esso. Sei sicuro di voler procedere?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/project/${projectId}`, {
            method: "DELETE"
        });
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showToast(`Progetto '${projectName}' eliminato con successo.`, "success");
            
            // If the deleted project was the active one, clear active project states
            if (activeProjectId === projectId) {
                activeProjectId = null;
                localStorage.removeItem("activeProjectId");
                projectData = null;
                
                // Clear UI
                document.getElementById("stat-project-name").textContent = "Nessuno";
                document.getElementById("project-details-card").style.display = "none";
                toggleTransmittalForms();
                renderEmptyGrid();
                documentsData = [];
                filteredDocumentsData = [];
                applyFiltersAndSort();
            }
            
            // Reload project lists
            await loadProjectsList();
            if (typeof loadAdminProjects === 'function') {
                await loadAdminProjects();
                if (typeof loadSettingsProjects === 'function') {
                    await loadSettingsProjects();
                }
            }
        } else {
            showToast("Errore durante l'eliminazione del progetto.", "error");
        }
    } catch (e) {
        console.error("Delete error", e);
        showToast("Errore di rete durante l'eliminazione.", "error");
    }
}

async function deleteActiveProject() {
    if (!activeProjectId) return;
    await deleteProjectById(activeProjectId, projectData ? projectData.project_name : "");
}

// ==========================================
// TRANSMITTAL AND COMPUTED FIELDS HELPER FUNCTIONS
// ==========================================

// Parse date robustly on frontend matching backend
function parseDate(val) {
    if (val === null || val === undefined) return null;
    if (val instanceof Date) return val;
    
    const valStr = String(val).trim();
    if (!valStr || ["nan", "nat", "null", "-", ""].includes(valStr.toLowerCase())) {
        return null;
    }
    
    // Check if numeric (Excel serial date)
    const num = Number(valStr);
    if (!isNaN(num) && isFinite(num) && valStr !== "") {
        let days = num;
        if (days > 60) days -= 1;
        const baseDate = new Date(1899, 11, 30);
        baseDate.setDate(baseDate.getDate() + days);
        return baseDate;
    }
    
    // Custom DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyyMatch = valStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
        const year = parseInt(ddmmyyyyMatch[3], 10);
        return new Date(year, month, day);
    }
    
    // Custom YYYY-MM-DD or YYYY/MM/DD
    const yyyymmddMatch = valStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (yyyymmddMatch) {
        const year = parseInt(yyyymmddMatch[1], 10);
        const month = parseInt(yyyymmddMatch[2], 10) - 1;
        const day = parseInt(yyyymmddMatch[3], 10);
        return new Date(year, month, day);
    }
    
    // Standard Date parsing fallback
    const parsed = new Date(valStr);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }
    
    return null;
}

// Format Date as YYYY-MM-DD
function formatDate(date) {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Add days to date
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Get value from row by column name (case & space flexible)
function getRowVal(row, colName) {
    const norm = colName.toLowerCase().replace(/\s+/g, "").trim();
    for (const key in row) {
        if (key.toLowerCase().replace(/\s+/g, "").trim() === norm) {
            return row[key];
        }
    }
    return null;
}

// Set value in row by column name (case & space flexible)
function setRowVal(row, colName, val) {
    const norm = colName.toLowerCase().replace(/\s+/g, "").trim();
    for (const key in row) {
        if (key.toLowerCase().replace(/\s+/g, "").trim() === norm) {
            row[key] = val;
            return;
        }
    }
    row[colName] = val;
}

// Recalculate computed fields on frontend row object
function recalculateRowComputedFields(row) {
    // 1. Calculate Last Code receive
    let lastCode = "";
    const codeCols = ["Return Code6", "Return Code5", "Return Code4", "Return Code3", "Return Code2", "Return Code1", "Return Code"];
    for (const col of codeCols) {
        const val = getRowVal(row, col);
        if (val !== null && val !== undefined) {
            const valStr = String(val).trim();
            if (valStr && !["nan", "nat", "null", "-"].includes(valStr.toLowerCase())) {
                lastCode = valStr;
                break;
            }
        }
    }
    setRowVal(row, "Last Code receive", lastCode);

    // 2. Calculate Next issue forecast date
    let nextForecastStr = "";
    const dateCols = ["Return Date6", "Return Date5", "Return Date4", "Return Date3", "Return Date2", "Return Date1", "Return Date"];
    let lastReturnDate = null;
    for (const col of dateCols) {
        const val = getRowVal(row, col);
        if (val) {
            const dt = parseDate(val);
            if (dt) {
                lastReturnDate = dt;
                break;
            }
        }
    }

    if (lastReturnDate) {
        const exchangeTime = parseInt(emailSettings.exchange_time || "15", 10);
        const nextForecast = addDays(lastReturnDate, exchangeTime);
        nextForecastStr = formatDate(nextForecast);
    } else {
        // Fallback to Promise date
        const promiseVal = getRowVal(row, "Promise date");
        const promiseDt = promiseVal ? parseDate(promiseVal) : null;
        if (promiseDt) {
            nextForecastStr = formatDate(promiseDt);
        } else {
            // Fallback to 1° Invio previsione
            const prevVal = getRowVal(row, "1° Invio previsione");
            const prevDt = prevVal ? parseDate(prevVal) : null;
            if (prevDt) {
                nextForecastStr = formatDate(prevDt);
            }
        }
    }

    setRowVal(row, "Next issue forecast date", nextForecastStr);
    return row;
}

// Normalize document code for flexible matching (removes spaces, dashes, underscores)
function normalizeDocNum(val) {
    if (!val) return "";
    return String(val).toLowerCase().replace(/[\s\-\_]/g, "").trim();
}

// Fuzzy find document in memory by any identifier
function findMatchedDocument(docInput) {
    const normInput = normalizeDocNum(docInput);
    if (!normInput) return null;
    
    for (const doc of documentsData) {
        for (const col in doc) {
            if (col === "__id" || col === "is_dirty") continue;
            const cellVal = doc[col];
            if (cellVal && normalizeDocNum(cellVal) === normInput) {
                return doc;
            }
        }
    }
    return null;
}

// Toggle Visibility of warning vs form for transmittals depending on active project
function toggleTransmittalForms() {
    const warningCliente = document.getElementById("warning-tr-ritorno-cliente");
    const formCliente = document.getElementById("form-tr-ritorno-cliente");
    const warningFornitore = document.getElementById("warning-tr-invio-cliente");
    const formFornitore = document.getElementById("form-tr-invio-cliente");
    const formFornitoreCard = document.getElementById("form-tr-invio-cliente-card");
    const warningFornitoreIn = document.getElementById("warning-tr-fornitore-in");
    const formFornitoreIn = document.getElementById("form-tr-fornitore-in");
    const warningFornitoreOut = document.getElementById("warning-tr-fornitore-out");
    const formFornitoreOut = document.getElementById("form-tr-fornitore-out");
    
    // VDL Fornitori
    const warningVdlFornitore = document.getElementById("warning-vdl-fornitore");
    const formVdlFornitore = document.getElementById("form-vdl-fornitore");

    if (activeProjectId) {
        if (warningCliente) warningCliente.style.display = "none";
        if (formCliente) formCliente.style.display = "flex";
        if (warningFornitore) warningFornitore.style.display = "none";
        if (formFornitore) formFornitore.style.display = "flex";
        if (formFornitoreCard) formFornitoreCard.style.display = "block";
        if (warningFornitoreIn) warningFornitoreIn.style.display = "none";
        if (formFornitoreIn) formFornitoreIn.style.display = "block";
        if (warningFornitoreOut) warningFornitoreOut.style.display = "none";
        if (formFornitoreOut) formFornitoreOut.style.display = "block";
        
        if (warningVdlFornitore) warningVdlFornitore.style.display = "none";
        if (formVdlFornitore) formVdlFornitore.style.display = "block";
    } else {
        if (warningCliente) warningCliente.style.display = "block";
        if (formCliente) formCliente.style.display = "none";
        if (warningFornitore) warningFornitore.style.display = "block";
        if (formFornitore) formFornitore.style.display = "none";
        if (formFornitoreCard) formFornitoreCard.style.display = "none";
        if (warningFornitoreIn) warningFornitoreIn.style.display = "block";
        if (formFornitoreIn) formFornitoreIn.style.display = "none";
        if (warningFornitoreOut) warningFornitoreOut.style.display = "block";
        if (formFornitoreOut) formFornitoreOut.style.display = "none";
        
        if (warningVdlFornitore) warningVdlFornitore.style.display = "block";
        if (formVdlFornitore) formVdlFornitore.style.display = "none";
    }
}

// Initialize Transmittal Submit Listeners
function initTransmittalControls() {
    const formCliente = document.getElementById("form-tr-ritorno-cliente");
    if (formCliente) {
        formCliente.addEventListener("submit", (e) => handleTransmittalSubmit('ritorno-cliente', e));
    }
    const formFornitore = document.getElementById("form-tr-invio-cliente");
    if (formFornitore) {
        formFornitore.addEventListener("submit", (e) => handleTransmittalSubmit('invio-cliente', e));
    }
    
    // Bind search and copy button for Client Transmittal list
    const clientTrSearch = document.getElementById("client-tr-search");
    if (clientTrSearch) {
        clientTrSearch.addEventListener("input", () => {
            renderClientTransmittalsTable();
        });
    }
    const btnCopyClientTrTable = document.getElementById("btn-copy-client-tr-table");
    if (btnCopyClientTrTable) {
        btnCopyClientTrTable.addEventListener("click", () => {
            copyClientTransmittalsTable();
        });
    }

    toggleTransmittalForms();
}

// Handle Transmittal Submit
async function handleTransmittalSubmit(type, event) {
    event.preventDefault();
    if (!activeProjectId) {
        showToast("Seleziona prima un progetto in alto.", "warning");
        return;
    }

    let trNum, docInput, trCode = null, trDate;
    if (type === 'ritorno-cliente') {
        trNum = document.getElementById("tr-num-ritorno-cliente").value.trim();
        docInput = document.getElementById("tr-doc-ritorno-cliente").value.trim();
        trCode = document.getElementById("tr-code-ritorno-cliente").value.trim();
        trDate = document.getElementById("tr-date-ritorno-cliente").value;
    } else {
        trNum = document.getElementById("tr-num-invio-cliente").value.trim();
        docInput = document.getElementById("tr-doc-invio-cliente").value.trim();
        trDate = document.getElementById("tr-date-invio-cliente").value;
    }

    if (!docInput) {
        showToast("Inserisci un numero documento.", "warning");
        return;
    }

    // Find document using flexible matching
    const matchedDoc = findMatchedDocument(docInput);
    if (!matchedDoc) {
        showToast(`Documento '${docInput}' non trovato nella VDL del progetto corrente.`, "error");
        return;
    }

    // Cycles are suffix-based: "", "1", "2", "3", "4", "5", "6"
    const suffixes = ["", "1", "2", "3", "4", "5", "6"];
    let filled = false;

    if (type === 'ritorno-cliente') {
        // Find first empty "TR In"
        for (const suffix of suffixes) {
            const trInCol = `TR In${suffix}`;
            const currentVal = getRowVal(matchedDoc, trInCol);
            if (currentVal === null || currentVal === undefined || String(currentVal).trim() === "") {
                setRowVal(matchedDoc, `TR In${suffix}`, trNum);
                setRowVal(matchedDoc, `Return Code${suffix}`, trCode);
                setRowVal(matchedDoc, `Return Date${suffix}`, trDate);
                filled = true;
                break;
            }
        }
    } else {
        // Find first empty "TR Out"
        for (const suffix of suffixes) {
            const trOutCol = `TR Out${suffix}`;
            const currentVal = getRowVal(matchedDoc, trOutCol);
            if (currentVal === null || currentVal === undefined || String(currentVal).trim() === "") {
                setRowVal(matchedDoc, `TR Out${suffix}`, trNum);
                setRowVal(matchedDoc, `Actual Date${suffix}`, trDate);
                filled = true;
                break;
            }
        }
    }

    if (!filled) {
        showToast("Tutti i 7 cicli di tracciamento sono già pieni per questo documento.", "error");
        return;
    }

    // Recalculate computed fields
    recalculateRowComputedFields(matchedDoc);
    matchedDoc.is_dirty = true;

    // Show spinner visual on button
    const submitBtn = event.target.querySelector("button[type='submit']");
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Registrazione...`;

    // Persist immediately to the server
    try {
        const response = await fetch(`/api/documents/save-all?project_id=${activeProjectId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([matchedDoc])
        });

        const data = await response.json();
        if (response.ok && data.status === 'success') {
            showToast(`Transmittal registrato con successo!`, "success");
            
            // Reset form
            event.target.reset();
            
            // Reload grid and stats
            await fetchDocuments();
            await loadDashboardStats();
        } else {
            showToast(data.detail || "Errore durante il salvataggio del transmittal.", "error");
        }
    } catch (e) {
        console.error("Transmittal save error:", e);
        showToast("Errore di rete durante il salvataggio.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
    }
}


// =========================================================================
// --- SUPPLIERS & SUPPLIER TRANSMITTALS SYSTEM ---
// =========================================================================

// Initialize Suppliers Registry Controls
function initSuppliersControls() {
    const form = document.getElementById("supplier-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const sid = document.getElementById("supplier-id").value;
            const name = document.getElementById("supplier-name").value.trim();
            const item = document.getElementById("supplier-item").value.trim();

            const isEdit = !!sid;
            const url = isEdit ? `/api/suppliers/${sid}` : "/api/suppliers";
            const method = isEdit ? "PUT" : "POST";

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, item })
                });
                const data = await response.json();
                if (response.ok && data.status === "success") {
                    showToast(isEdit ? "Fornitore aggiornato!" : "Fornitore creato!", "success");
                    form.reset();
                    document.getElementById("supplier-id").value = "";
                    document.getElementById("supplier-form-title").textContent = "Nuovo Fornitore";
                    document.getElementById("btn-cancel-supplier-edit").style.display = "none";
                    await loadSuppliersRegistry();
                } else {
                    showToast(data.detail || "Errore durante il salvataggio.", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("Errore di rete.", "error");
            }
        });
    }

    const btnCancel = document.getElementById("btn-cancel-supplier-edit");
    if (btnCancel) {
        btnCancel.addEventListener("click", () => {
            form.reset();
            document.getElementById("supplier-id").value = "";
            document.getElementById("supplier-form-title").textContent = "Nuovo Fornitore";
            btnCancel.style.display = "none";
        });
    }

    const btnSaveAssign = document.getElementById("btn-save-project-suppliers");
    if (btnSaveAssign) {
        btnSaveAssign.addEventListener("click", async () => {
            if (!activeProjectId) {
                showToast("Seleziona prima un progetto in alto.", "warning");
                return;
            }
            const checkboxes = document.querySelectorAll("#project-suppliers-checklist input[type='checkbox']");
            const supplierIds = [];
            checkboxes.forEach(cb => {
                if (cb.checked) supplierIds.push(parseInt(cb.value, 10));
            });

            try {
                const response = await fetch(`/api/project/${activeProjectId}/suppliers`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ supplier_ids: supplierIds })
                });
                const data = await response.json();
                if (response.ok && data.status === "success") {
                    showToast("Assegnazioni fornitore salvate con successo!", "success");
                    await loadProjectSuppliers();
                } else {
                    showToast(data.detail || "Errore durante il salvataggio delle assegnazioni.", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("Errore di rete.", "error");
            }
        });
    }
}

// Initialize Supplier Transmittals Controls (IN & OUT)
function initSupplierTransmittalsControls() {
    const formIn = document.getElementById("tr-fornitore-in-form");
    if (formIn) {
        formIn.addEventListener("submit", async (e) => {
            e.preventDefault();
            await submitSupplierTransmittal("IN", e.target);
        });
    }

    const formOut = document.getElementById("tr-fornitore-out-form");
    if (formOut) {
        formOut.addEventListener("submit", async (e) => {
            e.preventDefault();
            await submitSupplierTransmittal("OUT", e.target);
        });
    }
}

// Load Suppliers Registry and render views
async function loadSuppliersRegistry() {
    try {
        const response = await fetch("/api/suppliers");
        const data = await response.json();
        if (data.status === "success") {
            allSuppliers = data.suppliers;
            renderSuppliersTable();
            renderProjectSuppliersChecklist();
            populateContactHandsDropdown();
        }
    } catch (err) {
        console.error("Error loading suppliers registry:", err);
    }
}

// Populate contact hands dropdown
function populateContactHandsDropdown() {
    const select = document.getElementById("contact-hands");
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="" disabled selected>Seleziona fornitore...</option>';
    allSuppliers.forEach(s => {
        select.innerHTML += `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.item)})</option>`;
    });
    
    if (currentVal) {
        select.value = currentVal;
    }
}

// Render global suppliers registry grid
function renderSuppliersTable() {
    const tbody = document.getElementById("suppliers-table-body");
    if (!tbody) return;

    if (allSuppliers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 40px;">
                    <i class="fa-solid fa-users" style="font-size: 28px; opacity: 0.2; margin-bottom: 10px; display: block;"></i>
                    Nessun fornitore registrato. Creane uno a sinistra!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allSuppliers.map(s => `
        <tr>
            <td style="text-align: center; color: var(--text-muted); font-weight: 600;">${s.id}</td>
            <td style="font-weight: 600; color: white;">${escapeHtml(s.name)}</td>
            <td><span class="delay-badge" style="background: rgba(16, 185, 129, 0.15); color: #a7f3d0;">${escapeHtml(s.item)}</span></td>
            <td style="text-align: center;">
                <div class="button-group" style="justify-content: center;">
                    <button class="btn btn-ghost" onclick="editSupplier(${s.id}, '${escapeJs(s.name)}', '${escapeJs(s.item)}')" style="padding: 4px 8px; font-size: 11px;">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteSupplier(${s.id})" style="padding: 4px 8px; font-size: 11px;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// Edit supplier mode
function editSupplier(id, name, item) {
    document.getElementById("supplier-id").value = id;
    document.getElementById("supplier-name").value = name;
    document.getElementById("supplier-item").value = item;
    document.getElementById("supplier-form-title").textContent = "Modifica Fornitore";
    document.getElementById("btn-cancel-supplier-edit").style.display = "inline-flex";
}

// Delete supplier
async function deleteSupplier(id) {
    if (!confirm("Sei sicuro di voler eliminare questo fornitore dal database? Verrà rimosso da tutti i progetti.")) return;
    try {
        const response = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
        const data = await response.json();
        if (response.ok && data.status === "success") {
            showToast("Fornitore eliminato con successo!", "success");
            await loadSuppliersRegistry();
            await loadProjectSuppliers();
        } else {
            showToast(data.detail || "Impossibile eliminare il fornitore.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Errore di rete.", "error");
    }
}

// Render active project supplier assignment checklist
function renderProjectSuppliersChecklist() {
    const container = document.getElementById("project-suppliers-checklist");
    if (!container) return;

    if (!activeProjectId) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px;">Seleziona un progetto in alto.</div>`;
        return;
    }

    if (allSuppliers.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px;">Nessun fornitore registrato nel DB.</div>`;
        return;
    }

    const assignedIds = new Set(projectSuppliers.map(ps => ps.id));

    container.innerHTML = allSuppliers.map(s => `
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 6px; border-radius: 4px; transition: background 0.2s;" class="supplier-assignment-item">
            <input type="checkbox" value="${s.id}" ${assignedIds.has(s.id) ? "checked" : ""} style="accent-color: var(--primary);">
            <span style="font-weight: 500; font-size: 13px;">${escapeHtml(s.name)} <span class="text-muted" style="font-size: 11px;">(${escapeHtml(s.item)})</span></span>
        </label>
    `).join("");
}

// Load suppliers linked to the active project
async function loadProjectSuppliers() {
    if (!activeProjectId) {
        projectSuppliers = [];
        toggleTransmittalForms();
        renderProjectSuppliersChecklist();
        return;
    }
    try {
        const response = await fetch(`/api/project/${activeProjectId}/suppliers`);
        const data = await response.json();
        if (data.status === "success") {
            projectSuppliers = data.suppliers;
            toggleTransmittalForms();
            renderProjectSuppliersChecklist();
        }
    } catch (err) {
        console.error("Error loading project suppliers:", err);
    }
}

// Load IN transmittals view
async function loadSupplierTransmittalsIn() {
    await loadProjectSuppliers();
    populateSupplierSelect("tr-in-supplier-select");
    await fetchSupplierTransmittalsLog("IN");
}

// Load OUT transmittals view
async function loadSupplierTransmittalsOut() {
    await loadProjectSuppliers();
    populateSupplierSelect("tr-out-supplier-select");
    await fetchSupplierTransmittalsLog("OUT");
}

// Populate supplier select dropdowns for IN/OUT views
function populateSupplierSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Scegli Fornitore...</option>';
    projectSuppliers.forEach(s => {
        select.innerHTML += `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.item)})</option>`;
    });
}

// Render dynamic checklist of supplier documents
async function renderSupplierDocsChecklist(containerId, supplierName, direction) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!supplierName || !activeProjectId) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 10px;">Scegli un fornitore per caricare la sua lista documenti.</div>`;
        return;
    }

    const supplierObj = projectSuppliers.find(s => s.name === supplierName);
    if (!supplierObj) return;
    
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 10px;"><i class="fa-solid fa-spinner fa-spin"></i> Caricamento...</div>`;

    try {
        const response = await fetch(`/api/supplier-vdl/${activeProjectId}/${supplierObj.id}/documents`);
        const data = await response.json();
        
        if (!data.documents || data.documents.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 10px; line-height: 1.4;">
                <i class="fa-solid fa-circle-exclamation text-rose" style="font-size: 16px; margin-bottom: 5px; display: block;"></i>
                Nessun documento trovato nella VDL del fornitore. Importa prima un file Excel VDL.
            </div>`;
            return;
        }

        // Store globally so submit function can use it
        window[`tempSupplierVDL_${direction}`] = data.documents;

        container.innerHTML = data.documents.map(d => {
            const docId = d.__id;
            let docCode = getDocCode(d);
            let docTitle = getDocTitle(d);

            return `
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <input type="checkbox" name="tr-doc-checkbox" value="${docId}" style="margin-top: 3px; accent-color: var(--primary);">
                        <div style="flex: 1;">
                            <span style="font-weight: 600; font-size: 12px; color: white; display: block; word-break: break-all;">${escapeHtml(docCode)}</span>
                            <span class="text-muted" style="font-size: 11px; display: block;">${escapeHtml(docTitle)}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-left: 24px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 10px; color: var(--text-muted); font-weight: 600;">Rev:</span>
                            <select class="form-control" name="tr-doc-rev-${docId}" style="padding: 2px 6px; font-size: 11px; width: 80px; height: auto;">
                                <option value="Rev. 0">Rev. 0</option>
                                <option value="Rev. A">Rev. A</option>
                                <option value="Rev. B">Rev. B</option>
                                <option value="Rev. C">Rev. C</option>
                                <option value="Rev. 1">Rev. 1</option>
                                <option value="Rev. 2">Rev. 2</option>
                            </select>
                        </div>
                        ${direction === 'IN' ? `
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 10px; color: var(--text-muted); font-weight: 600;">Esito:</span>
                            <select class="form-control" name="tr-doc-code-${docId}" style="padding: 2px 6px; font-size: 11px; width: 90px; height: auto;">
                                <option value="Code A">Code A</option>
                                <option value="Code B">Code B</option>
                                <option value="Code C">Code C</option>
                                <option value="Code D">Code D</option>
                                <option value="Code W">Code W</option>
                            </select>
                        </div>
                        ` : ""}
                    </div>
                </div>
            `;
        }).join("");
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 10px;">Errore caricamento VDL Fornitore.</div>`;
    }
}

// Fetch Supplier Transmittals log and render history table
async function fetchSupplierTransmittalsLog(direction) {
    const tbody = document.getElementById(direction === 'IN' ? "tr-in-history-table-body" : "tr-out-history-table-body");
    if (!tbody) return;

    if (!activeProjectId) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Nessun progetto selezionato.</td></tr>`;
        return;
    }

    try {
        const response = await fetch(`/api/project/${activeProjectId}/supplier-transmittals`);
        const data = await response.json();
        if (data.status === "success") {
            const filtered = data.transmittals.filter(t => t.direction === direction);
            
            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 45px;">
                            <i class="fa-solid fa-history" style="font-size: 26px; opacity: 0.15; margin-bottom: 8px; display: block;"></i>
                            Nessun transmittal registrato. Compila il modulo a sinistra!
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filtered.map(t => {
                const trDate = new Date(t.tr_date).toLocaleDateString('it-IT');
                const docChips = t.documents.map(d => `
                    <span class="delay-badge" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: #cbd5e1; font-size: 10px; margin: 2px; display: inline-block;">
                        ${escapeHtml(d.document_code)} (${escapeHtml(d.revision)}${direction === 'IN' ? ` - ${escapeHtml(d.return_code)}` : ""})
                    </span>
                `).join("");

                return `
                    <tr>
                        <td style="font-weight: 500; color: white;">${trDate}</td>
                        <td style="font-weight: 600; color: var(--accent);">${escapeHtml(t.supplier_name)}</td>
                        <td style="font-family: monospace; font-size: 12px; color: #a5f3fc; font-weight: 600;">${escapeHtml(t.tr_number)}</td>
                        <td>${docChips}</td>
                        <td style="text-align: center;">
                            <button class="btn btn-danger" onclick="deleteSupplierTransmittal(${t.id}, '${direction}')" style="padding: 4px 8px; font-size: 11px;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    } catch (err) {
        console.error(err);
    }
}

// Submit a new supplier transmittal
async function submitSupplierTransmittal(direction, formElement) {
    if (!activeProjectId) {
        showToast("Seleziona prima un progetto in alto.", "warning");
        return;
    }

    const select = document.getElementById(direction === 'IN' ? "tr-in-supplier-select" : "tr-out-supplier-select");
    const selectedSupplierName = select.value;
    const supplierObj = projectSuppliers.find(s => s.name === selectedSupplierName);
    if (!supplierObj) {
        showToast("Seleziona un fornitore valido dall'elenco.", "error");
        return;
    }

    const trNum = document.getElementById(direction === 'IN' ? "tr-in-num" : "tr-out-num").value.trim();
    const docInput = document.getElementById(direction === 'IN' ? "tr-in-doc" : "tr-out-doc").value.trim();
    const trDate = document.getElementById(direction === 'IN' ? "tr-in-date" : "tr-out-date").value;
    const trCode = direction === 'IN' ? document.getElementById("tr-in-code").value.trim() : null;
    const notes = document.getElementById(direction === 'IN' ? "tr-in-notes" : "tr-out-notes").value.trim();

    if (!docInput) { showToast("Inserisci il numero del documento.", "warning"); return; }
    if (!trNum)    { showToast("Inserisci il numero del transmittal.", "warning"); return; }
    if (!trDate)   { showToast("Inserisci la data.", "warning"); return; }

    const submitBtn = formElement.querySelector("button[type='submit']");
    const origHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Ricerca documento...`;

    try {
        // 1. Fetch supplier VDL from API
        const vdlResponse = await fetch(`/api/supplier-vdl/${activeProjectId}/${supplierObj.id}/documents`);
        const vdlData = await vdlResponse.json();

        if (!vdlData.documents || vdlData.documents.length === 0) {
            showToast(`Nessuna VDL trovata per ${supplierObj.name}. Importa prima il file Excel nella sezione VDL Fornitori.`, "error");
            return;
        }

        const supplierDocs = vdlData.documents;
        const columns = vdlData.columns || [];

        // 2. Search across ALL columns - don't rely on predefined column names
        // Priority cols for displaying the doc code in toasts/logs
        const docNumCols = ["Document number", "Numero documento", "Doc. No.", "Codice", "Document No", "Doc No", columns[0]].filter(Boolean);

        const matchedDoc = supplierDocs.find(doc => {
            // Search in every column present in this document row
            for (const col of columns) {
                if (col.startsWith("TR ") || col.startsWith("Return") || col.startsWith("Actual")) continue; // skip tracking cols
                const cellVal = String(doc[col] || "").trim().toLowerCase();
                const needle = docInput.trim().toLowerCase();
                if (cellVal && cellVal === needle) return true;
                if (cellVal && cellVal.includes(needle)) return true;
            }
            return false;
        });

        if (!matchedDoc) {
            showToast(`Documento '${docInput}' non trovato nella VDL di ${supplierObj.name}. Controlla il codice e riprova.`, "error");
            return;
        }

        // 3. Find first empty TR cycle and fill automatically
        const suffixes = ["", "1", "2", "3", "4", "5", "6"];
        let filled = false;
        // Try to get the display code from common columns, fallback to first non-empty column
        let documentCode = docInput;
        for (const col of docNumCols) {
            if (matchedDoc[col]) { documentCode = matchedDoc[col]; break; }
        }
        if (documentCode === docInput) {
            // fallback: take value from first column that contains our search term
            for (const col of columns) {
                const val = String(matchedDoc[col] || "").trim();
                if (val.toLowerCase().includes(docInput.toLowerCase())) { documentCode = val; break; }
            }
        }

        if (direction === 'IN') {
            for (const suffix of suffixes) {
                const val = matchedDoc[`TR In${suffix}`];
                if (val === null || val === undefined || String(val).trim() === "") {
                    matchedDoc[`TR In${suffix}`]       = trNum;
                    matchedDoc[`Return Code${suffix}`]  = trCode || "";
                    matchedDoc[`Return Date${suffix}`]  = trDate;
                    filled = true;
                    break;
                }
            }
        } else {
            for (const suffix of suffixes) {
                const val = matchedDoc[`TR Out${suffix}`];
                if (val === null || val === undefined || String(val).trim() === "") {
                    matchedDoc[`TR Out${suffix}`]     = trNum;
                    matchedDoc[`Actual Date${suffix}`] = trDate;
                    filled = true;
                    break;
                }
            }
        }

        if (!filled) {
            showToast(`Tutti i cicli per '${documentCode}' sono pieni. Aggiungi un ciclo dalla VDL Fornitori.`, "error");
            return;
        }

        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...`;

        // 4. Save updated VDL row
        await fetch(`/api/supplier-vdl/${activeProjectId}/${supplierObj.id}/save-all`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([matchedDoc])
        });

        // 5. Log transmittal record
        await fetch("/api/supplier-transmittals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project_id: activeProjectId,
                supplier_id: supplierObj.id,
                direction: direction,
                tr_number: trNum,
                tr_date: trDate,
                notes: notes,
                document_list: [{ document_id: matchedDoc.__id, document_code: documentCode, revision: "", return_code: trCode || "" }]
            })
        });

        showToast(`Transmittal ${direction} registrato su '${documentCode}' con successo!`, "success");
        formElement.reset();

        // Refresh VDL Fornitori tab if this supplier is open
        if (typeof loadSupplierVdlData === 'function' && window.activeSupplierId == supplierObj.id) {
            await loadSupplierVdlData(supplierObj.id);
        }
        await fetchSupplierTransmittalsLog(direction);

    } catch (err) {
        console.error(err);
        showToast("Errore di rete.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHTML;
    }
}

// Delete supplier transmittal
async function deleteSupplierTransmittal(trId, direction) {
    if (!confirm("Sei sicuro di voler eliminare questo record di transmittal?")) return;
    try {
        const response = await fetch(`/api/supplier-transmittals/${trId}`, { method: "DELETE" });
        const data = await response.json();
        if (response.ok && data.status === "success") {
            showToast("Transmittal eliminato.", "success");
            await fetchSupplierTransmittalsLog(direction);
        } else {
            showToast(data.detail || "Errore durante l'eliminazione.", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Errore di rete.", "error");
    }
}

async function loadAdminProjects() {
    if (currentUserRole !== "Admin") return;
    
    const tbody = document.getElementById("admin-projects-list");
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 24px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 20px; color: var(--primary); margin-bottom: 8px; display: block;"></i>
                Caricamento progetti...
            </td>
        </tr>
    `;
    
    try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            const projects = data.projects || [];
            
            if (projects.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
                            Nessun progetto registrato nel sistema.
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = "";
            projects.forEach(p => {
                let dateStr = "-";
                if (p.created_at) {
                    try {
                        const d = new Date(p.created_at);
                        dateStr = d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT", {hour: '2-digit', minute:'2-digit'});
                    } catch(e) {
                        dateStr = p.created_at;
                    }
                }
                
                html += `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${p.id}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); font-weight: 600; color: white;">${escapeHtml(p.project_name)}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${escapeHtml(p.company || "-")}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${escapeHtml(p.contractor || "-")}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">${dateStr}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); text-align: right;">
                            <button class="btn btn-danger" onclick="deleteProjectById(${p.id}, '${escapeJs(p.project_name)}')" style="padding: 4px 8px; font-size: 12px;">
                                <i class="fa-solid fa-trash"></i> Elimina
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            showToast("Impossibile caricare l'elenco dei progetti.", "error");
        }
    } catch(err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #ef4444;">Errore di connessione.</td></tr>`;
    }
}

window.deleteProjectById = deleteProjectById;
window.loadAdminProjects = loadAdminProjects;
window.loadSettingsProjects = loadSettingsProjects;

async function loadSettingsProjects() {
    if (currentUserRole !== "Admin") return;
    const tbody = document.getElementById("settings-projects-list");
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 24px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 20px; color: var(--primary); margin-bottom: 8px; display: block;"></i>
                Caricamento progetti...
            </td>
        </tr>
    `;
    
    try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            const projects = data.projects || [];
            
            if (projects.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
                            Nessun progetto registrato nel sistema.
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = "";
            projects.forEach(p => {
                let dateStr = "-";
                if (p.created_at) {
                    try {
                        const d = new Date(p.created_at);
                        dateStr = d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT", {hour: '2-digit', minute:'2-digit'});
                    } catch(e) {
                        dateStr = p.created_at;
                    }
                }
                
                html += `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${p.id}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); font-weight: 600; color: white;">${escapeHtml(p.project_name)}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${escapeHtml(p.company || "-")}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${escapeHtml(p.contractor || "-")}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">${dateStr}</td>
                        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); text-align: right;">
                            <button class="btn btn-danger" onclick="deleteProjectById(${p.id}, '${escapeJs(p.project_name)}')" style="padding: 4px 8px; font-size: 12px;">
                                <i class="fa-solid fa-trash"></i> Elimina
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            showToast("Impossibile caricare l'elenco dei progetti.", "error");
        }
    } catch(err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #ef4444;">Errore di connessione.</td></tr>`;
    }
}

// Utilities for escaping HTML to prevent injection and JS errors in dynamic rendering
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJs(str) {
    if (!str) return "";
    return String(str)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}

// ==========================================
// ACCESS AUTHORITY, AUTH FLOW & ROLE SYSTEM
// ==========================================

// Intercept all fetch requests globally
const originalFetch = window.fetch;
window.fetch = async function (url, options) {
    options = options || {};
    options.headers = options.headers || {};
    
    const token = localStorage.getItem("currentUserToken") || currentUserToken;
    if (token) {
        if (options.headers instanceof Headers) {
            options.headers.set("Authorization", `Bearer ${token}`);
        } else if (Array.isArray(options.headers)) {
            const hasAuth = options.headers.some(h => h[0].toLowerCase() === 'authorization');
            if (!hasAuth) {
                options.headers.push(["Authorization", `Bearer ${token}`]);
            }
        } else {
            if (!options.headers["Authorization"]) {
                options.headers["Authorization"] = `Bearer ${token}`;
            }
        }
    }
    
    try {
        const response = await originalFetch(url, options);
        if (response.status === 401) {
            // Only trigger logout if it wasn't the login or me endpoint failing
            if (!url.includes("/api/auth/login") && !url.includes("/api/auth/me")) {
                showToast("Sessione non valida o scaduta.", "error");
                handleSessionLogout();
            }
        }
        return response;
    } catch (err) {
        console.error("Fetch error caught in monkeypatch:", err);
        throw err;
    }
};

function initAuthControls() {
    // Panel switches
    const linkRegister = document.getElementById("link-show-register");
    const linkLogin = document.getElementById("link-show-login");
    const loginView = document.getElementById("login-view-panel");
    const registerView = document.getElementById("register-view-panel");
    
    if (linkRegister) {
        linkRegister.addEventListener("click", (e) => {
            e.preventDefault();
            loginView.style.display = "none";
            registerView.style.display = "block";
        });
    }
    
    if (linkLogin) {
        linkLogin.addEventListener("click", (e) => {
            e.preventDefault();
            registerView.style.display = "none";
            loginView.style.display = "block";
        });
    }
    
    // Forms submissions
    const loginForm = document.getElementById("login-form-submit");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value;
            
            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                if (response.ok) {
                    showToast("Login completato con successo!", "success");
                    currentUserToken = data.token;
                    currentUserRole = data.role;
                    currentUserUsername = data.username;
                    
                    localStorage.setItem("currentUserToken", currentUserToken);
                    localStorage.setItem("currentUserRole", currentUserRole);
                    localStorage.setItem("currentUserUsername", currentUserUsername);
                    
                    // Display dashboard & load app
                    hideLoginOverlay();
                    
                    // Reset selected views to Dashboard
                    const dashboardTab = document.querySelector('.sidebar [data-target="dashboard"]');
                    if (dashboardTab) dashboardTab.click();
                    
                    // Load and refresh settings, projects list and project data
                    await loadSettings(true); 
                    await loadProjectsList();
                    if (activeProjectId) {
                        await loadActiveProject();
                        await loadSettings(true);
                    } else {
                        renderEmptyGrid();
                    }
                } else {
                    showToast(data.detail || "Credenziali non valide.", "error");
                }
            } catch (err) {
                console.error("Login error:", err);
                showToast("Errore di connessione al server.", "error");
            }
        });
    }
    
    const registerForm = document.getElementById("register-form-submit");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("register-email").value.trim();
            const password = document.getElementById("register-password").value;
            const role = document.getElementById("register-role").value;
            
            try {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password, role })
                });
                
                const data = await response.json();
                if (response.ok) {
                    showToast("Registrazione completata! Ora puoi effettuare l'accesso.", "success");
                    // Switch to login panel
                    linkLogin.click();
                    // Pre-fill email
                    document.getElementById("login-email").value = username;
                    document.getElementById("login-password").value = "";
                } else {
                    showToast(data.detail || "Registrazione fallita.", "error");
                }
            } catch (err) {
                console.error("Register error:", err);
                showToast("Errore di connessione.", "error");
            }
        });
    }
    
    // Logout Sidebar Navigation Trigger
    const btnLogout = document.getElementById("nav-logout-btn");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            handleSessionLogout();
        });
    }
    
    // Admin Add User Button trigger
    const btnAdminAddUser = document.getElementById("btn-admin-add-user");
    if (btnAdminAddUser) {
        btnAdminAddUser.addEventListener("click", () => {
            openAdminUserModal();
        });
    }
    
    const btnAdminSaveUser = document.getElementById("btn-admin-save-user");
    if (btnAdminSaveUser) {
        btnAdminSaveUser.addEventListener("click", () => {
            saveAdminUser();
        });
    }
}

async function validateSession() {
    try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
            const profile = await response.json();
            currentUserRole = profile.user.role;
            currentUserUsername = profile.user.username;
            localStorage.setItem("currentUserRole", currentUserRole);
            localStorage.setItem("currentUserUsername", currentUserUsername);
            
            hideLoginOverlay();
            return true;
        }
    } catch (e) {
        console.error("Session validation error", e);
    }
    return false;
}

function showLoginOverlay() {
    const overlay = document.getElementById("login-overlay");
    if (overlay) overlay.style.display = "flex";
    
    // Empty credentials fields
    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";
    
    // Clear sidebar items profile badge
    const headerStatus = document.getElementById("header-user-status");
    if (headerStatus) headerStatus.style.display = "none";
}

function hideLoginOverlay() {
    const overlay = document.getElementById("login-overlay");
    if (overlay) overlay.style.display = "none";
    
    // Display header user profile badge
    const headerStatus = document.getElementById("header-user-status");
    if (headerStatus) {
        headerStatus.style.display = "flex";
        
        const usernameEl = document.getElementById("header-username");
        const roleEl = document.getElementById("header-role");
        
        usernameEl.textContent = currentUserUsername;
        roleEl.textContent = currentUserRole === "Project Manager" ? "PM" : (currentUserRole === "Document Controller" ? "DC" : (currentUserRole === "Project Engineering" ? "PE" : "Admin"));
        
        // Remove all color classes
        roleEl.className = "badge";
        if (currentUserRole === "Admin") roleEl.classList.add("badge-admin");
        else if (currentUserRole === "Project Manager") roleEl.classList.add("badge-pm");
        else if (currentUserRole === "Document Controller") roleEl.classList.add("badge-dc");
        else roleEl.classList.add("badge-pe");
    }
    
    // Adapt layout
    adaptUIByRole();
}

async function handleSessionLogout() {
    try {
        if (currentUserToken) {
            await fetch("/api/auth/logout", { method: "POST" });
        }
    } catch (e) {
        console.error("Logout API call failed", e);
    }
    
    currentUserToken = "";
    currentUserRole = "";
    currentUserUsername = "";
    
                        await loadSettings(true);
                    } else {
                        renderEmptyGrid();
                    }
                } else {
                    showToast(data.detail || "Credenziali non valide.", "error");
                }
            } catch (err) {
                console.error("Login error:", err);
                showToast("Errore di connessione al server.", "error");
            }
        });
    }
    
    const registerForm = document.getElementById("register-form-submit");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("register-email").value.trim();
            const password = document.getElementById("register-password").value;
            const role = document.getElementById("register-role").value;
            
            try {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password, role })
                });
                
                const data = await response.json();
                if (response.ok) {
                    showToast("Registrazione completata! Ora puoi effettuare l'accesso.", "success");
                    // Switch to login panel
                    linkLogin.click();
                    // Pre-fill email
                    document.getElementById("login-email").value = username;
                    document.getElementById("login-password").value = "";
                } else {
                    showToast(data.detail || "Registrazione fallita.", "error");
                }
            } catch (err) {
                console.error("Register error:", err);
                showToast("Errore di connessione.", "error");
            }
        });
    }
    
    // Logout Sidebar Navigation Trigger
    const btnLogout = document.getElementById("nav-logout-btn");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            handleSessionLogout();
        });
    }
    
    // Admin Add User Button trigger
    const btnAdminAddUser = document.getElementById("btn-admin-add-user");
    if (btnAdminAddUser) {
        btnAdminAddUser.addEventListener("click", () => {
            openAdminUserModal();
        });
    }
    
    const btnAdminSaveUser = document.getElementById("btn-admin-save-user");
    if (btnAdminSaveUser) {
        btnAdminSaveUser.addEventListener("click", () => {
            saveAdminUser();
        });
    }
}

async function validateSession() {
    try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
            const profile = await response.json();
            currentUserRole = profile.user.role;
            currentUserUsername = profile.user.username;
            localStorage.setItem("currentUserRole", currentUserRole);
            localStorage.setItem("currentUserUsername", currentUserUsername);
            
            hideLoginOverlay();
            return true;
        }
    } catch (e) {
        console.error("Session validation error", e);
    }
    return false;
}

function showLoginOverlay() {
    const overlay = document.getElementById("login-overlay");
    if (overlay) overlay.style.display = "flex";
    
    // Empty credentials fields
    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";
    
    // Clear sidebar items profile badge
    const headerStatus = document.getElementById("header-user-status");
    if (headerStatus) headerStatus.style.display = "none";
}

function hideLoginOverlay() {
    const overlay = document.getElementById("login-overlay");
    if (overlay) overlay.style.display = "none";
    
    // Display header user profile badge
    const headerStatus = document.getElementById("header-user-status");
    if (headerStatus) {
        headerStatus.style.display = "flex";
        
        const usernameEl = document.getElementById("header-username");
        const roleEl = document.getElementById("header-role");
        
        usernameEl.textContent = currentUserUsername;
        roleEl.textContent = currentUserRole === "Project Manager" ? "PM" : (currentUserRole === "Document Controller" ? "DC" : (currentUserRole === "Project Engineering" ? "PE" : "Admin"));
        
        // Remove all color classes
        roleEl.className = "badge";
        if (currentUserRole === "Admin") roleEl.classList.add("badge-admin");
        else if (currentUserRole === "Project Manager") roleEl.classList.add("badge-pm");
        else if (currentUserRole === "Document Controller") roleEl.classList.add("badge-dc");
        else roleEl.classList.add("badge-pe");
    }
    
    // Adapt layout
    adaptUIByRole();
}

async function handleSessionLogout() {
    try {
        if (currentUserToken) {
            await fetch("/api/auth/logout", { method: "POST" });
        }
    } catch (e) {
        console.error("Logout API call failed", e);
    }
    
    currentUserToken = "";
    currentUserRole = "";
    currentUserUsername = "";
    
    localStorage.removeItem("currentUserToken");
    localStorage.removeItem("currentUserRole");
    localStorage.removeItem("currentUserUsername");
    
    showToast("Sessione terminata con successo.", "info");
    showLoginOverlay();
}

function adaptUIByRole() {
    // 1. Sidebar element display constraints
    const navAdmin = document.getElementById("nav-admin-access-control");
    const settingsAdminProjectsCard = document.getElementById("settings-admin-projects-card");
    
    // Disable user admin access panel
    if (navAdmin) navAdmin.style.display = "none";
    if (settingsAdminProjectsCard) settingsAdminProjectsCard.style.display = "block";
}
// ADMINISTRATOR PANEL USER MANAGEMENT
// ==========================================

async function loadAdminUsers() {
    if (currentUserRole !== "Admin") return;
    
    const tbody = document.getElementById("admin-users-list");
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 24px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 20px; color: var(--primary); margin-bottom: 8px; display: block;"></i>
                Caricamento utenti registrati...
            </td>
        </tr>
    `;
    
    try {
        const response = await fetch("/api/admin/users");
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            const users = data.users || [];
            
            if (users.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
                            Nessun utente registrato nel sistema.
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = "";
            users.forEach(u => {
                const isSelf = u.username.toLowerCase() === currentUserUsername.toLowerCase();
                const avatarChar = u.username.substring(0, 2).toUpperCase();
                
                let roleClass = "badge-pe";
                let avatarClass = "avatar-pe";
                if (u.role === "Admin") { roleClass = "badge-admin"; avatarClass = "avatar-admin"; }
                else if (u.role === "Project Manager") { roleClass = "badge-pm"; avatarClass = "avatar-pm"; }
                else if (u.role === "Document Controller") { roleClass = "badge-dc"; avatarClass = "avatar-dc"; }
                
                html += `
                    <tr>
                        <td>${u.id}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div class="user-status-avatar ${avatarClass}">${avatarChar}</div>
                                <div>
                                    <div style="font-weight: 600; color: white;">${escapeHtml(u.username)}</div>
                                    <div style="font-size: 11px; color: var(--text-muted);">${isSelf ? 'Il tuo account attivo' : ''}</div>
                                </div>
                            </div>
                        </td>
                        <td><span class="badge ${roleClass}">${u.role}</span></td>
                        <td style="font-family: monospace; letter-spacing: 0.05em; color: var(--primary-light);">${escapeHtml(u.password)}</td>
                        <td style="color: var(--text-muted);">${u.created_at ? u.created_at.split(' ')[0] : '-'}</td>
                        <td style="text-align: right;">
                            <button class="btn btn-secondary" onclick="editAdminUser(${u.id}, '${escapeJs(u.username)}', '${escapeJs(u.password)}', '${escapeJs(u.role)}')" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;">
                                <i class="fa-solid fa-pen-to-square"></i> Modifica
                            </button>
                            <button class="btn btn-danger" onclick="deleteAdminUser(${u.id}, '${escapeJs(u.username)}')" ${isSelf ? 'disabled' : ''} style="padding: 4px 8px; font-size: 12px; opacity: ${isSelf ? '0.4' : '1'};">
                                <i class="fa-solid fa-user-xmark"></i> Elimina
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            showToast("Impossibile caricare l'elenco utenti.", "error");
        }
    } catch(err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #ef4444;">Errore di connessione.</td></tr>`;
    }
}

function openAdminUserModal(id = "", username = "", password = "", role = "Project Manager") {
    const modal = document.getElementById("admin-user-modal");
    if (!modal) return;
    
    document.getElementById("admin-user-id").value = id;
    document.getElementById("admin-user-username").value = username;
    document.getElementById("admin-user-password").value = password;
    document.getElementById("admin-user-role").value = role;
    
    document.getElementById("admin-user-modal-title").textContent = id ? "Modifica Utente Registrato" : "Crea Nuovo Utente";
    
    // If modifying existing user, lock username
    document.getElementById("admin-user-username").disabled = id !== "";
    
    modal.classList.add("active");
}

function closeAdminUserModal() {
    const modal = document.getElementById("admin-user-modal");
    if (modal) modal.classList.remove("active");
}

// Global functions exposed to onclick attributes
window.editAdminUser = function(id, username, password, role) {
    openAdminUserModal(id, username, password, role);
}

window.closeAdminUserModal = closeAdminUserModal;

window.deleteAdminUser = async function(id, username) {
    if (username.toLowerCase() === currentUserUsername.toLowerCase()) {
        showToast("Non puoi eliminare il tuo stesso account amministratore attivo.", "error");
        return;
    }
    
    if (!confirm(`Sei sicuro di voler eliminare DEFINITIVAMENTE l'utente '${username}'? L'azione non è reversibile.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: "DELETE"
        });
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showToast(data.message, "success");
            await loadAdminUsers();
        } else {
            showToast(data.detail || "Errore durante l'eliminazione.", "error");
        }
    } catch(err) {
        console.error(err);
        showToast("Errore di rete.", "error");
    }
}

async function saveAdminUser() {
    const id = document.getElementById("admin-user-id").value;
    const username = document.getElementById("admin-user-username").value.trim();
    const password = document.getElementById("admin-user-password").value;
    const role = document.getElementById("admin-user-role").value;
    
    if (!username || !password || !role) {
        showToast("Compila tutti i campi richiesti.", "warning");
        return;
    }
    
    const saveBtn = document.getElementById("btn-admin-save-user");
    const origHTML = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...`;
    
    try {
        let response;
        if (id) {
            // Update
            response = await fetch(`/api/admin/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role })
            });
        } else {
            // Create
            response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role })
            });
        }
        
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            showToast(data.message, "success");
            closeAdminUserModal();
            await loadAdminUsers();
        } else {
            showToast(data.detail || "Errore nel salvataggio dell'utente.", "error");
        }
    } catch(err) {
        console.error(err);
        showToast("Errore di rete durante il salvataggio.", "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origHTML;
    }
}

// ==========================================
// PREMIUM DASHBOARD DETAILS POPUP MODULE
// ==========================================

let currentDashboardDetailsDocs = [];

function getDocCode(doc) {
    let doc_id_code = "";
    // First pass: try fuzzy match for common document identity keys
    for (const k of Object.keys(doc)) {
        if (k === "__id") continue;
        const k_lower = k.toLowerCase().replace(/[\s_\-]/g, "");
        if (
            (k_lower.includes("doc") && (k_lower.includes("code") || k_lower.includes("number") || k_lower.includes("no") || k_lower.includes("num") || k_lower.includes("codice"))) ||
            k_lower === "internaldocumentnumber" || k_lower === "documentnumber" || k_lower === "codicedocumento" || k_lower === "codicedoc"
        ) {
            const val = String(doc[k] || "").trim();
            if (val) {
                doc_id_code = val;
                break;
            }
        }
    }
    // Fallback 1: try common exact matches
    if (!doc_id_code) {
        doc_id_code = String(doc["Internal Document Number"] || doc["Document Number"] || doc["Codice Documento"] || "").trim();
    }
    // Fallback 2: find first non-empty column that isn't ID
    if (!doc_id_code) {
        for (const k of Object.keys(doc)) {
            if (k !== "__id" && doc[k]) {
                doc_id_code = String(doc[k]).trim();
                break;
            }
        }
    }
    return doc_id_code || "-";
}

function getDocTitle(doc) {
    let doc_title = "";
    // First pass: try fuzzy match for Title/Description
    for (const k of Object.keys(doc)) {
        if (k === "__id") continue;
        const k_lower = k.toLowerCase().replace(/[\s_\-]/g, "");
        if (
            k_lower.includes("title") || 
            k_lower.includes("description") || 
            k_lower.includes("titolo") || 
            k_lower.includes("descrizione") ||
            k_lower.includes("nomedocumento") ||
            k_lower.includes("documentname")
        ) {
            const val = String(doc[k] || "").trim();
            if (val) {
                doc_title = val;
                break;
            }
        }
    }
    
    // Second pass fallback: check other keys that might represent the name/description
    if (!doc_title) {
        for (const k of Object.keys(doc)) {
            if (k === "__id") continue;
            const k_lower = k.toLowerCase().replace(/[\s_\-]/g, "");
            if (k_lower.includes("name") || k_lower.includes("nome") || k_lower.includes("documento")) {
                const val = String(doc[k] || "").trim();
                if (val) {
                    doc_title = val;
                    break;
                }
            }
        }
    }
    
    return doc_title || "Nessuna descrizione";
}

function getDocHands(doc) {
    for (const k of Object.keys(doc)) {
        const k_lower = k.toLowerCase().replace(/[\s_\-]/g, "");
        if (k_lower === "hands" || k_lower === "attore" || k_lower === "fornitore" || k_lower.includes("hands") || k_lower.includes("attore") || k_lower.includes("fornitore")) {
            const val = String(doc[k] || "").trim();
            if (val) return val;
        }
    }
    return String(doc["Hands"] || "-").trim();
}

function getDocPromiseDate(doc) {
    for (const k of Object.keys(doc)) {
        const k_lower = k.toLowerCase().replace(/[\s_\-]/g, "");
        if (k_lower === "promisedate" || k_lower === "dataattivita" || k_lower === "scadenza" || k_lower.includes("promise") || k_lower.includes("scadenza")) {
            const val = String(doc[k] || "").trim();
            if (val) return val;
        }
    }
    return String(doc["Promise date"] || "-").trim();
}

function getDocForecastDate(doc) {
    for (const k of Object.keys(doc)) {
        const k_lower = k.toLowerCase().replace(/[\s_\-]/g, "");
        if (k_lower === "nextissueforecastdate" || k_lower === "forecastdate" || k_lower === "previsione" || k_lower.includes("forecast") || k_lower.includes("previsione")) {
            const val = String(doc[k] || "").trim();
            if (val) return val;
        }
    }
    return String(doc["Next issue forecast date"] || "-").trim();
}

function getDocLastCode(doc) {
    for (const k of Object.keys(doc)) {
        const k_lower = k.toLowerCase().replace(/[\s_\-]/g, "");
        if (k_lower === "lastcodereceive" || k_lower === "codiceritorno" || k_lower === "ultimo_codice" || k_lower.includes("lastcode") || k_lower.includes("ritorno")) {
            const val = String(doc[k] || "").trim();
            if (val) return val;
        }
    }
    return String(doc["Last Code receive"] || "");
}

function filterDashboardDetailsModal() {
    const searchVal = document.getElementById("dashboard-details-search").value.toLowerCase().trim();
    const tbody = document.getElementById("dashboard-details-body");
    
    let filtered = currentDashboardDetailsDocs;
    if (searchVal) {
        filtered = currentDashboardDetailsDocs.filter(doc => {
            const code = getDocCode(doc).toLowerCase();
            const desc = getDocTitle(doc).toLowerCase();
            const hands = getDocHands(doc).toLowerCase();
            const lastCode = getDocLastCode(doc).toLowerCase();
            return code.includes(searchVal) || desc.includes(searchVal) || hands.includes(searchVal) || lastCode.includes(searchVal);
        });
    }
    
    document.getElementById("dashboard-details-count").textContent = filtered.length;
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
                    Nessun documento corrispondente ai criteri di ricerca.
                </td>
            </tr>
        `;
        return;
    }
    
    let html = "";
    filtered.forEach(doc => {
        const code = getDocCode(doc);
        const desc = getDocTitle(doc);
        const hands = getDocHands(doc);
        const promise = getDocPromiseDate(doc);
        const forecast = getDocForecastDate(doc);
        const lastCode = getDocLastCode(doc);
        
        let badgeColor = "var(--text-muted)";
        if (lastCode) {
            if (lastCode.toLowerCase().includes("a")) badgeColor = "#4ade80";
            else if (lastCode.toLowerCase().includes("b")) badgeColor = "#38bdf8";
            else if (lastCode.toLowerCase().includes("c")) badgeColor = "#fb923c";
            else badgeColor = "#c084fc";
        }
        
        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-light);">${escapeHtml(code)}</td>
                <td style="padding: 12px 16px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(desc)}">${escapeHtml(desc)}</td>
                <td style="padding: 12px 16px;">
                    <span class="badge" style="background: rgba(37,99,235,0.1); color: var(--primary-light);">${escapeHtml(hands)}</span>
                </td>
                <td style="padding: 12px 16px; color: var(--text-muted);">${promise || '-'}</td>
                <td style="padding: 12px 16px; color: var(--text-muted);">${forecast || '-'}</td>
                <td style="padding: 12px 16px;">
                    ${lastCode ? `<span class="badge" style="background: rgba(255,255,255,0.05); color: ${badgeColor}; border: 1px solid ${badgeColor}; font-weight: 600;">${escapeHtml(lastCode)}</span>` : '<span style="color: var(--text-muted); font-style: italic;">Nessuno</span>'}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

async function openDashboardDetails(type) {
    if (!projectData || !documentsData || documentsData.length === 0) {
        showToast("Seleziona prima un progetto attivo con documenti caricati.", "warning");
        return;
    }
    
    const modal = document.getElementById("dashboard-details-modal");
    if (!modal) return;
    
    // Reset search field
    const searchInput = document.getElementById("dashboard-details-search");
    if (searchInput) searchInput.value = "";
    
    // Set title based on type
    const titleSpan = document.querySelector("#dashboard-details-title span");
    
    let overdueCodes = [];
    if (type === 'overdue') {
        titleSpan.textContent = "Documenti in Ritardo (Scaduti)";
        try {
            const defaultBuffer = emailSettings.exchange_time || "15";
            const response = await fetch("/api/reminder/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: parseInt(activeProjectId), hands_value: "all", exchange_time: parseInt(defaultBuffer) })
            });
            const data = await response.json();
            if (data.status === 'success') {
                overdueCodes = (data.overdue_documents || []).map(d => String(d.document_code).trim());
            }
        } catch (e) {
            console.error("Errore recupero solleciti:", e);
        }
    } else if (type === 'all') {
        titleSpan.textContent = "Totale Documenti Progetto";
    } else if (type === 'pending') {
        titleSpan.textContent = "Documenti in Attesa Ritorno";
    } else if (type === 'never_emitted') {
        titleSpan.textContent = "Documenti Mai Emessi";
    } else if (type.startsWith('code_')) {
        const codeVal = type.replace('code_', '');
        titleSpan.textContent = `Documenti con Codice di Ritorno: ${codeVal}`;
    }
    
    // Identify TR Out columns
    const trOutCols = projectData.columns.filter(col => {
        const norm = col.toLowerCase().replace(/ /g, "").trim();
        return /^trout\d*$/.test(norm);
    });
    
    // Filter documents
    currentDashboardDetailsDocs = documentsData.filter(doc => {
        const docCode = getDocCode(doc);
        const lastCode = getDocLastCode(doc);
        
        let hasTrOut = false;
        for (const col of trOutCols) {
            const val = String(doc[col] || "").trim();
            if (val && !["nan", "nat", "null", "-", ""].includes(val.toLowerCase())) {
                hasTrOut = true;
                break;
            }
        }
        
        if (type === 'all') return true;
        if (type === 'overdue') return overdueCodes.includes(docCode);
        if (type === 'pending') return hasTrOut && !lastCode;
        if (type === 'never_emitted') return !hasTrOut && !lastCode;
        if (type.startsWith('code_')) {
            const codeVal = type.replace('code_', '');
            return lastCode.toLowerCase() === codeVal.toLowerCase();
        }
        return true;
    });
    
    // Populate and show modal
    filterDashboardDetailsModal();
    modal.classList.add("active");
}

function closeDashboardDetailsModal() {
    const modal = document.getElementById("dashboard-details-modal");
    if (modal) modal.classList.remove("active");
}

function initDashboardDetails() {
    const searchInput = document.getElementById("dashboard-details-search");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            filterDashboardDetailsModal();
        });
    }
}

// Global functions exposed to onclick attributes
window.openDashboardDetails = openDashboardDetails;
window.closeDashboardDetailsModal = closeDashboardDetailsModal;

// =========================================================================
// --- CUSTOMER TRANSMITTALS REGISTER LOGIC ---
// =========================================================================

function getClientTransmittalsList() {
    if (!documentsData) return [];
    const list = [];
    const suffixes = ["", "1", "2", "3", "4", "5", "6"];
    
    documentsData.forEach(doc => {
        const docCode = getDocCode(doc);
        const docTitle = getDocTitle(doc);
        
        suffixes.forEach(suffix => {
            const trOutNum = getRowVal(doc, `TR Out${suffix}`);
            if (trOutNum && trOutNum.toString().trim() && !["nan", "nat", "null", "-", ""].includes(trOutNum.toString().toLowerCase().trim())) {
                const trDateVal = getRowVal(doc, `Actual Date${suffix}`);
                let trDate = "";
                if (trDateVal) {
                    const parsed = parseDate(trDateVal);
                    if (parsed) {
                        trDate = formatDate(parsed);
                    } else {
                        trDate = String(trDateVal).trim();
                    }
                }
                list.push({
                    date: trDate || "-",
                    tr_number: trOutNum.toString().trim(),
                    document_code: docCode || "-",
                    document_title: docTitle || "Nessuna descrizione"
                });
            }
        });
    });
    
    // Sort by date (newest first), fallback to transmittal number
    list.sort((a, b) => {
        if (a.date && b.date && a.date !== "-" && b.date !== "-") {
            return b.date.localeCompare(a.date);
        }
        return b.tr_number.localeCompare(a.tr_number);
    });
    
    return list;
}

function renderClientTransmittalsTable() {
    const tbody = document.getElementById("client-tr-preview-table-body");
    if (!tbody) return;
    
    if (!activeProjectId || !documentsData || documentsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 45px;">
                    <i class="fa-solid fa-table" style="font-size: 26px; opacity: 0.15; margin-bottom: 8px; display: block;"></i>
                    Nessun transmittal registrato per questo progetto.
                </td>
            </tr>
        `;
        return;
    }
    
    const list = getClientTransmittalsList();
    const searchInput = document.getElementById("client-tr-search");
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    // Filter by search
    const filtered = list.filter(item => {
        if (!searchVal) return true;
        return item.tr_number.toLowerCase().includes(searchVal) ||
               item.document_code.toLowerCase().includes(searchVal) ||
               item.document_title.toLowerCase().includes(searchVal) ||
               item.date.toLowerCase().includes(searchVal);
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 45px;">
                    Nessun transmittal trovato per i criteri di ricerca.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(item => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 12px 16px; font-weight: 500; color: white;">${escapeHtml(item.date)}</td>
            <td style="padding: 12px 16px; font-family: monospace; font-size: 12px; color: #f43f5e; font-weight: 600;">${escapeHtml(item.tr_number)}</td>
            <td style="padding: 12px 16px; font-weight: 600; color: #38bdf8;">${escapeHtml(item.document_code)}</td>
            <td style="padding: 12px 16px; color: var(--text-muted); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(item.document_title)}">${escapeHtml(item.document_title)}</td>
        </tr>
    `).join("");
}

async function copyClientTransmittalsTable() {
    const list = getClientTransmittalsList();
    const searchInput = document.getElementById("client-tr-search");
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    const filtered = list.filter(item => {
        if (!searchVal) return true;
        return item.tr_number.toLowerCase().includes(searchVal) ||
               item.document_code.toLowerCase().includes(searchVal) ||
               item.document_title.toLowerCase().includes(searchVal) ||
               item.date.toLowerCase().includes(searchVal);
    });
    
    if (filtered.length === 0) {
        showToast("Nessun dato da copiare.", "warning");
        return;
    }
    
    // Header
    let tsv = "Data Invio\tNumero Transmittal\tCodice Documento\tDescrizione Documento\n";
    
    // Rows
    filtered.forEach(item => {
        tsv += `${item.date}\t${item.tr_number}\t${item.document_code}\t${item.document_title}\n`;
    });
    
    try {
        await navigator.clipboard.writeText(tsv);
        showToast("Tabella copiata negli appunti in formato Excel!", "success");
    } catch (err) {
        console.error("Copia fallita:", err);
        showToast("Impossibile copiare negli appunti automaticamente.", "error");
    }
}

// =========================================================================
// --- PROJECT INTEGRATION FILE MANAGEMENT & REVISION TRACKING FUNCTIONS ---
// =========================================================================

let vdlDocumentsFilesMapping = {};
let cellUploadTargetDocNum = null;
let projectSpecificationsList = [];

function getDocCodeColumn(columns) {
    if (!columns) return "";
    for (const k of columns) {
        const k_lower = k.toLowerCase().replace(/[\s_\-]/g, "");
        if (
            (k_lower.includes("doc") && (k_lower.includes("code") || k_lower.includes("number") || k_lower.includes("no") || k_lower.includes("num") || k_lower.includes("codice"))) ||
            k_lower === "internaldocumentnumber" || k_lower === "documentnumber" || k_lower === "codicedocumento" || k_lower === "codicedoc"
        ) {
            return k;
        }
    }
    return columns[0] || "";
}

function getCellInnerHtml(col, val) {
    if (!projectData) return val;
    const docCodeCol = getDocCodeColumn(projectData.columns);
    if (col === docCodeCol && val) {
        const fileInfo = vdlDocumentsFilesMapping[val];
        if (fileInfo) {
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                    <a href="#" class="vdl-doc-link" onclick="event.stopPropagation(); openFileLocally('${escapeJs(fileInfo.filepath)}', false);" style="color: var(--accent-light); text-decoration: underline; font-weight: 600;">${escapeHtml(val)}</a>
                    <div style="display: flex; gap: 6px;">
                        <i class="fa-solid fa-folder-open text-muted hover-highlight" title="Mostra nella cartella" onclick="event.stopPropagation(); openFileLocally('${escapeJs(fileInfo.filepath)}', true);" style="cursor: pointer; font-size: 11px;"></i>
                        <i class="fa-solid fa-cloud-arrow-up text-muted hover-highlight" title="Carica nuova versione" onclick="event.stopPropagation(); triggerCellFileUpload('${escapeJs(val)}');" style="cursor: pointer; font-size: 11px;"></i>
                    </div>
                </div>
            `;
        } else {
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                    <span class="text-muted" style="font-style: italic;">${escapeHtml(val)}</span>
                    <i class="fa-solid fa-cloud-arrow-up text-muted hover-highlight" title="Carica documento" onclick="event.stopPropagation(); triggerCellFileUpload('${escapeJs(val)}');" style="cursor: pointer; font-size: 11px;"></i>
                </div>
            `;
        }
    }
    return val;
}

async function loadVdlDocumentsFilesMapping() {
    if (!activeProjectId) {
        vdlDocumentsFilesMapping = {};
        return;
    }
    try {
        const response = await fetch(`/api/project/${activeProjectId}/vdl-documents/files`);
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            vdlDocumentsFilesMapping = data.files || {};
        } else {
            vdlDocumentsFilesMapping = {};
        }
    } catch (e) {
        console.error("Error fetching project document files mapping:", e);
        vdlDocumentsFilesMapping = {};
    }
}

function populateRevisionColumnsSelector() {
    const container = document.getElementById("revision-columns-selector-container");
    if (!container || !projectData || !projectData.columns) return;
    
    container.innerHTML = "";
    const selectedCols = projectData.revision_columns || [];
    
    projectData.columns.forEach(col => {
        const isChecked = selectedCols.includes(col) ? "checked" : "";
        container.innerHTML += `
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" name="rev_col" value="${escapeHtml(col)}" id="rev-col-cb-${escapeHtml(col)}" ${isChecked} style="cursor: pointer;">
                <label for="rev-col-cb-${escapeHtml(col)}" style="cursor: pointer; font-size: 12px; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(col)}">${escapeHtml(col)}</label>
            </div>
        `;
    });
}

function initProjectSpecificSettingsForm() {
    const form = document.getElementById("project-specific-settings-form");
    if (!form) return;
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeProjectId) return;
        
        const jobPath = document.getElementById("proj-job-path").value.trim();
        const selectedFormat = document.querySelector("input[name='revision_format']:checked").value;
        
        const checkedBoxes = document.querySelectorAll("input[name='rev_col']:checked");
        const selectedCols = Array.from(checkedBoxes).map(cb => cb.value);
        
        const saveBtn = form.querySelector("button[type='submit']");
        saveBtn.disabled = true;
        const originalHTML = saveBtn.innerHTML;
        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...`;
        
        try {
            const response = await fetch(`/api/project/${activeProjectId}/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_path: jobPath,
                    revision_format: selectedFormat,
                    revision_columns: selectedCols
                })
            });
            
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                showToast("Impostazioni di progetto salvate con successo.", "success");
                
                if (projectData) {
                    projectData.job_path = jobPath;
                    projectData.revision_format = selectedFormat;
                    projectData.revision_columns = selectedCols;
                }
                
                await loadVdlDocumentsFilesMapping();
                updateViewsWarningsState();
                
                if (document.getElementById("project-specifications").classList.contains("active")) {
                    await loadProjectSpecifications();
                }
                if (document.getElementById("revisione-documentazione").classList.contains("active")) {
                    await loadRevisioneDocumentazione();
                }
            } else {
                showToast(data.detail || "Impostazioni non salvate.", "error");
            }
        } catch (err) {
            console.error("Save project settings error:", err);
            showToast("Errore di rete durante il salvataggio.", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHTML;
        }
    });
}

function updateViewsWarningsState() {
    const hasJobPath = projectData && projectData.job_path && projectData.job_path.trim() !== "";
    
    const warningSpec = document.getElementById("warning-specifications");
    const containerSpec = document.getElementById("main-specifications-container");
    if (warningSpec && containerSpec) {
        if (activeProjectId && hasJobPath) {
            warningSpec.style.display = "none";
            containerSpec.style.display = "block";
        } else {
            warningSpec.style.display = "block";
            containerSpec.style.display = "none";
        }
    }
    
    const warningRev = document.getElementById("warning-revisions");
    const containerRev = document.getElementById("main-revisions-container");
    if (warningRev && containerRev) {
        if (activeProjectId && hasJobPath) {
            warningRev.style.display = "none";
            containerRev.style.display = "flex";
        } else {
            warningRev.style.display = "block";
            containerRev.style.display = "none";
        }
    }
}

async function loadProjectSpecifications() {
    if (!activeProjectId) return;
    
    const tbody = document.getElementById("specifications-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Caricamento in corso...</td></tr>`;
    
    try {
        const response = await fetch(`/api/project/${activeProjectId}/specifications`);
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            projectSpecificationsList = data.files || [];
            renderProjectSpecifications();
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">Errore nel caricamento delle specifiche.</td></tr>`;
        }
    } catch (err) {
        console.error("Load specs error:", err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">Errore di rete.</td></tr>`;
    }
}

function renderProjectSpecifications() {
    const tbody = document.getElementById("specifications-table-body");
    if (!tbody) return;
    
    const searchVal = document.getElementById("spec-search").value.toLowerCase().trim();
    const filtered = projectSpecificationsList.filter(f => f.name.toLowerCase().includes(searchVal));
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">Nessuna specifica corrispondente ai criteri impostati.</td></tr>`;
        return;
    }
    
    let html = "";
    filtered.forEach(f => {
        let sizeStr = "";
        if (f.size < 1024) sizeStr = `${f.size} B`;
        else if (f.size < 1024 * 1024) sizeStr = `${(f.size / 1024).toFixed(1)} KB`;
        else sizeStr = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
        
        html += `
            <tr style="cursor: pointer;" onclick="openFileLocally('${escapeJs(f.path)}', false);">
                <td style="font-weight: 600; color: var(--accent-light);"><i class="fa-solid fa-file-pdf" style="margin-right: 8px;"></i> ${escapeHtml(f.name)}</td>
                <td><span class="badge" style="background: rgba(37,99,235,0.1); color: var(--primary-light);">${escapeHtml(f.type)}</span></td>
                <td>${sizeStr}</td>
                <td>${f.modified}</td>
                <td style="text-align: center;" onclick="event.stopPropagation();">
                    <div style="display: flex; justify-content: center; gap: 8px;">
                        <button class="btn btn-secondary" onclick="openFileLocally('${escapeJs(f.path)}', true)" style="padding: 4px 8px; font-size: 11px;" title="Mostra nella cartella">
                            <i class="fa-solid fa-folder-open"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteSpecificationFile('${escapeJs(f.name)}')" style="padding: 4px 8px; font-size: 11px;" title="Elimina file">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

async function deleteSpecificationFile(filename) {
    if (!confirm(`Sei sicuro di voler eliminare definitivamente il file '${filename}'?`)) {
        return;
    }
    try {
        const response = await fetch(`/api/project/${activeProjectId}/specifications?filename=${encodeURIComponent(filename)}`, {
            method: "DELETE"
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            showToast("Specifica eliminata con successo.", "success");
            await loadProjectSpecifications();
        } else {
            showToast(data.detail || "Errore durante l'eliminazione.", "error");
        }
    } catch (err) {
        showToast("Errore di rete.", "error");
    }
}

function initProjectSpecificationsControls() {
    const dropZone = document.getElementById("spec-drop-zone");
    const fileInput = document.getElementById("spec-file-input");
    const specSearch = document.getElementById("spec-search");
    
    if (specSearch) {
        specSearch.addEventListener("input", () => {
            renderProjectSpecifications();
        });
    }
    
    if (dropZone && fileInput) {
        dropZone.addEventListener("click", () => {
            fileInput.click();
        });
        
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "var(--primary)";
            dropZone.style.background = "rgba(37, 99, 235, 0.08)";
        });
        
        dropZone.addEventListener("dragleave", (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "rgba(255, 255, 255, 0.15)";
            dropZone.style.background = "rgba(255, 255, 255, 0.01)";
        });
        
        dropZone.addEventListener("drop", async (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "rgba(255, 255, 255, 0.15)";
            dropZone.style.background = "rgba(255, 255, 255, 0.01)";
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                await uploadSpecificationFiles(files);
            }
        });
        
        fileInput.addEventListener("change", async (e) => {
            if (fileInput.files.length > 0) {
                await uploadSpecificationFiles(fileInput.files);
                fileInput.value = "";
            }
        });
    }
    
    // NotebookLM search binding
    const notebookInput = document.getElementById("notebook-search-input");
    const notebookBtn = document.getElementById("notebook-search-btn");
    
    if (notebookBtn && notebookInput) {
        notebookBtn.addEventListener("click", () => {
            performNotebookSearch();
        });
        notebookInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                performNotebookSearch();
            }
        });
    }
}

async function performNotebookSearch() {
    const input = document.getElementById("notebook-search-input");
    const container = document.getElementById("notebook-results-container");
    const loading = document.getElementById("notebook-loading");
    
    if (!input || !container || !loading || !activeProjectId) return;
    
    const query = input.value.trim();
    if (!query) {
        showToast("Inserisci un termine di ricerca o una domanda.", "warning");
        return;
    }
    
    loading.style.display = "block";
    container.innerHTML = "";
    
    try {
        const response = await fetch(`/api/project/${activeProjectId}/specifications/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        loading.style.display = "none";
        
        if (!response.ok) {
            container.innerHTML = `<div style="color: var(--rose); text-align: center; padding: 15px; font-size: 12px; border: 1px dashed var(--border); border-radius: 6px;">
                Errore: ${escapeHtml(data.detail || "Impossibile completare la ricerca.")}
            </div>`;
            return;
        }
        
        const results = data.results || [];
        if (results.length === 0) {
            container.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 25px 15px; font-size: 12px; border: 1px dashed var(--border); border-radius: 6px; background: rgba(255,255,255,0.01);">
                Nessun riscontro trovato nei documenti PDF delle specifiche. Prova con termini diversi.
            </div>`;
            return;
        }
        
        let html = "";
        results.forEach(res => {
            let snippetHtml = escapeHtml(res.snippet);
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            snippetHtml = snippetHtml.replace(regex, `<mark style="background: rgba(250, 204, 21, 0.3); color: #facc15; padding: 1px 3px; border-radius: 3px;">$1</mark>`);
            
            html += `
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-size: 12px; line-height: 1.5; color: var(--text-muted); font-style: italic;">
                        ${snippetHtml}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                        <span style="font-size: 11px; font-weight: 600; color: var(--accent-light); display: flex; align-items: center; gap: 4px; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <i class="fa-solid fa-file-pdf" style="font-size: 10px;"></i> ${escapeHtml(res.filename)} (Pag. ${res.page})
                        </span>
                        <button class="btn" onclick="openFileLocally('${escapeJs(res.filepath)}', false)" style="padding: 4px 8px; font-size: 10px; height: auto; border: 1px solid var(--border); background: rgba(255,255,255,0.05); display: flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-folder-open"></i> Apri PDF
                        </button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        loading.style.display = "none";
        container.innerHTML = `<div style="color: var(--rose); text-align: center; padding: 15px; font-size: 12px; border: 1px dashed var(--border); border-radius: 6px;">
            Errore di rete. Riprova.
        </div>`;
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function uploadSpecificationFiles(files) {
    if (!activeProjectId || !files || files.length === 0) return;
    
    showToast(`Caricamento di ${files.length} specifiche in corso...`, "warning");
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        
        try {
            const response = await fetch(`/api/project/${activeProjectId}/specifications/upload`, {
                method: "POST",
                body: formData
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                successCount++;
            } else {
                console.error(`Upload failed for ${file.name}:`, data.detail);
                failCount++;
            }
        } catch (err) {
            console.error(`Upload error for ${file.name}:`, err);
            failCount++;
        }
    }
    
    if (successCount > 0) {
        showToast(`${successCount} specifiche caricate con successo!`, "success");
    }
    if (failCount > 0) {
        showToast(`Impossibile caricare ${failCount} specifiche.`, "error");
    }
    
    await loadProjectSpecifications();
}

async function loadRevisioneDocumentazione() {
    if (!activeProjectId) return;
    await fetchDocuments();
    renderRevisioneDocumentazione();
}

function calculateCurrentRevision(doc, format) {
    const cycles = [
        { tr: "TR Out", revNumeric: "00", revAlpha: "A", revCombo: "A" },
        { tr: "TR Out1", revNumeric: "01", revAlpha: "B", revCombo: "B" },
        { tr: "TR Out2", revNumeric: "02", revAlpha: "C", revCombo: "C" },
        { tr: "TR Out3", revNumeric: "03", revAlpha: "D", revCombo: "D" },
        { tr: "TR Out4", revNumeric: "04", revAlpha: "E", revCombo: "E" },
        { tr: "TR Out5", revNumeric: "05", revAlpha: "F", revCombo: "00" },
        { tr: "TR Out6", revNumeric: "06", revAlpha: "G", revCombo: "01" }
    ];
    
    let maxCycleIndex = -1;
    for (let i = 0; i < cycles.length; i++) {
        const trVal = doc[cycles[i].tr] !== undefined && doc[cycles[i].tr] !== null ? String(doc[cycles[i].tr]).trim() : "";
        if (trVal && trVal.toLowerCase() !== "nan" && trVal.toLowerCase() !== "null" && trVal !== "-") {
            maxCycleIndex = i;
        }
    }
    
    if (maxCycleIndex === -1) {
        return "-";
    }
    
    const targetCycle = cycles[maxCycleIndex];
    if (format === "numeric") {
        return targetCycle.revNumeric;
    } else if (format === "alphabetic") {
        return targetCycle.revAlpha;
    } else {
        return targetCycle.revCombo;
    }
}

function renderRevisioneDocumentazione() {
    const thead = document.getElementById("revision-grid-thead");
    const tbody = document.getElementById("revision-grid-tbody");
    if (!thead || !tbody || !projectData) return;
    
    const format = projectData.revision_format || "numeric";
    const formatBadge = document.getElementById("revision-format-badge");
    if (formatBadge) {
        formatBadge.textContent = format === "numeric" ? "Numerico" : (format === "alphabetic" ? "Alfabetico" : "Combo");
    }
    
    const selectedCols = projectData.revision_columns || [];
    
    let headerHTML = "<tr>";
    headerHTML += `<th style="width: 50px; text-align: center; background: #0f162a; position: sticky; left: 0; z-index: 5;">#</th>`;
    
    selectedCols.forEach(col => {
        headerHTML += `<th style="background: #0f162a;">${escapeHtml(col)}</th>`;
    });
    
    headerHTML += `<th style="text-align: center; min-width: 120px; background: #0f172a; border-left: 1px solid var(--border-color);">Rev Attuale</th>`;
    headerHTML += "</tr>";
    thead.innerHTML = headerHTML;
    
    const searchVal = document.getElementById("revision-search").value.toLowerCase().trim();
    
    let filtered = documentsData;
    if (searchVal) {
        filtered = documentsData.filter(doc => {
            for (const col of selectedCols) {
                if (String(doc[col] || "").toLowerCase().includes(searchVal)) return true;
            }
            const code = getDocCode(doc);
            const title = getDocTitle(doc);
            if (code.toLowerCase().includes(searchVal) || title.toLowerCase().includes(searchVal)) return true;
            return false;
        });
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="100%" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    Nessun documento trovato.
                </td>
            </tr>
        `;
        return;
    }
    
    const docCodeCol = getDocCodeColumn(projectData.columns);
    
    let bodyHTML = "";
    filtered.forEach((doc, idx) => {
        bodyHTML += `<tr>`;
        bodyHTML += `<td style="text-align: center; background: #0f162a; position: sticky; left: 0; z-index: 3; font-weight: 600; color: var(--text-muted); border-right: 2px solid var(--border-color);">${idx + 1}</td>`;
        
        selectedCols.forEach(col => {
            const val = doc[col] !== undefined && doc[col] !== null ? doc[col] : "";
            
            if (col === docCodeCol && val) {
                const fileInfo = vdlDocumentsFilesMapping[val];
                if (fileInfo) {
                    bodyHTML += `
                        <td style="font-weight: 600; color: var(--accent-light);">
                            <a href="#" onclick="event.preventDefault(); openFileLocally('${escapeJs(fileInfo.filepath)}', false);" style="color: var(--accent-light); text-decoration: underline;">${escapeHtml(val)}</a>
                        </td>
                    `;
                } else {
                    bodyHTML += `<td>${escapeHtml(val)}</td>`;
                }
            } else {
                bodyHTML += `<td>${escapeHtml(val)}</td>`;
            }
        });
        
        const currentRev = calculateCurrentRevision(doc, format);
        
        bodyHTML += `<td style="text-align: center; border-left: 1px solid var(--border-color); font-weight: bold; color: var(--accent-light);">${escapeHtml(currentRev)}</td>`;
        bodyHTML += `</tr>`;
    });
    tbody.innerHTML = bodyHTML;
}

function initRevisioneDocumentazioneControls() {
    const revSearch = document.getElementById("revision-search");
    if (revSearch) {
        revSearch.addEventListener("input", () => {
            renderRevisioneDocumentazione();
        });
    }
}

function initCellDocumentUploadControls() {
    const input = document.getElementById("cell-vdl-document-file-input");
    if (!input) return;
    
    input.addEventListener("change", async () => {
        if (input.files.length > 0 && cellUploadTargetDocNum) {
            await uploadCellDocumentFile(cellUploadTargetDocNum, input.files[0]);
            input.value = "";
            cellUploadTargetDocNum = null;
        }
    });
}

async function uploadCellDocumentFile(documentNumber, file) {
    if (!activeProjectId) return;
    
    const formData = new FormData();
    formData.append("document_number", documentNumber);
    formData.append("file", file);
    
    showToast(`Caricamento del file per '${documentNumber}' in corso...`, "warning");
    try {
        const response = await fetch(`/api/project/${activeProjectId}/vdl-document/upload`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showToast(`Documento '${documentNumber}' caricato con successo!`, "success");
            await loadVdlDocumentsFilesMapping();
            applyFiltersAndSort();
            
            if (document.getElementById("revisione-documentazione").classList.contains("active")) {
                renderRevisioneDocumentazione();
            }
        } else {
            showToast(data.detail || "Errore durante il caricamento del file.", "error");
        }
    } catch (e) {
        console.error("Cell file upload error:", e);
        showToast("Errore di rete.", "error");
    }
}

function triggerCellFileUpload(documentNumber) {
    cellUploadTargetDocNum = documentNumber;
    const input = document.getElementById("cell-vdl-document-file-input");
    if (input) input.click();
}

async function openFileLocally(filepath, showInFolder = false) {
    if (!activeProjectId) return;
    try {
        const response = await fetch(`/api/project/${activeProjectId}/open-file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filepath: filepath,
                show_in_folder: showInFolder
            })
        });
        const data = await response.json();
        if (!response.ok) {
            showToast(data.detail || "Impossibile aprire il file.", "error");
        }
    } catch (e) {
        console.error("Open file error:", e);
        showToast("Errore di rete nell'apertura del file.", "error");
    }
}

// Expose functions globally
window.openFileLocally = openFileLocally;
window.deleteSpecificationFile = deleteSpecificationFile;
window.triggerCellFileUpload = triggerCellFileUpload;


