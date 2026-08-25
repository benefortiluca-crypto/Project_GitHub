// ==========================================
// SUPPLIER VDL ENGINE
// ==========================================

let supplierDocumentsData = [];
let supplierVdlColumns = [];
let activeSupplierId = null;

// UI Elements (populated in init)
let supplierSelect, btnImport, fileInput, btnSave, btnAddCycle, btnExport, searchInput, btnResetFilters;

// Initialize Supplier VDL Controls
function initSupplierVdlControls() {
    supplierSelect = document.getElementById("supplier-vdl-select");
    btnImport = document.getElementById("btn-import-supplier-vdl");
    fileInput = document.getElementById("supplier-vdl-file-input");
    btnSave = document.getElementById("btn-save-supplier-grid");
    btnAddCycle = document.getElementById("btn-add-supplier-cycle");
    btnExport = document.getElementById("btn-export-supplier-excel");
    searchInput = document.getElementById("supplier-grid-search");
    btnResetFilters = document.getElementById("btn-reset-supplier-filters");

    if (!supplierSelect) return;

    supplierSelect.addEventListener("change", async (e) => {
        activeSupplierId = e.target.value;
        if (activeSupplierId) {
            btnImport.disabled = false;
            btnAddCycle.disabled = false;
            btnSave.disabled = false;
            btnExport.disabled = false;
            btnResetFilters.disabled = false;
            await loadSupplierVdlData(activeSupplierId);
        } else {
            resetSupplierVdlView();
        }
    });

    fileInput.addEventListener("change", async (e) => {
        if (e.target.files.length > 0 && activeSupplierId && activeProjectId) {
            await importSupplierVdlExcel(e.target.files[0]);
        }
    });

    btnSave.addEventListener("click", async () => {
        await saveSupplierGridModifications();
    });

    btnAddCycle.addEventListener("click", async () => {
        await addSupplierRevisionCycle();
    });

    btnExport.addEventListener("click", () => {
        if (!activeProjectId || !activeSupplierId) return;
        window.location.href = `/api/supplier-vdl/${activeProjectId}/${activeSupplierId}/export`;
    });

    searchInput.addEventListener("input", () => {
        renderSupplierGridTable();
    });
}

// Called by the navigation router when user clicks on "VDL Fornitori"
async function loadSupplierVdlSection() {
    // Ensure project suppliers are loaded first
    if (typeof loadProjectSuppliers === 'function') {
        await loadProjectSuppliers();
    }
    // Re-init references in case they weren't set yet
    if (!supplierSelect) {
        initSupplierVdlControls();
    }
    // Populate the dropdown with fresh data
    populateSupplierVdlDropdown();
    // If a supplier was already selected, reload its data
    if (activeSupplierId) {
        await loadSupplierVdlData(activeSupplierId);
    }
}

function populateSupplierVdlDropdown() {
    if (!projectSuppliers) return;
    const currentVal = supplierSelect.value;
    supplierSelect.innerHTML = '<option value="">Scegli Fornitore...</option>';
    projectSuppliers.forEach(s => {
        supplierSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.item})</option>`;
    });
    if (currentVal && projectSuppliers.some(s => s.id == currentVal)) {
        supplierSelect.value = currentVal;
    }
}

function resetSupplierVdlView() {
    btnImport.disabled = true;
    btnAddCycle.disabled = true;
    btnSave.disabled = true;
    btnExport.disabled = true;
    btnResetFilters.disabled = true;
    activeSupplierId = null;
    supplierDocumentsData = [];
    supplierVdlColumns = [];
    
    document.getElementById("supplier-vdl-grid-head").innerHTML = "";
    document.getElementById("supplier-vdl-grid-body").innerHTML = `
        <tr>
            <td colspan="100%" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-hand-pointer" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.3;"></i>
                Seleziona un fornitore dal menu a tendina.
            </td>
        </tr>
    `;
}

async function loadSupplierVdlData(supplierId) {
    if (!activeProjectId) return;
    try {
        const response = await fetch(`/api/supplier-vdl/${activeProjectId}/${supplierId}/documents`);
        const data = await response.json();
        if (data.status === 'success') {
            supplierDocumentsData = data.documents || [];
            supplierVdlColumns = data.columns || [];
            renderSupplierGridTable();
        }
    } catch (e) {
        console.error("Error loading supplier VDL:", e);
        showToast("Errore durante il caricamento della VDL Fornitore.", "error");
    }
}

async function importSupplierVdlExcel(file) {
    const formData = new FormData();
    formData.append("file", file);
    
    const originalBtn = btnImport.innerHTML;
    btnImport.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Caricamento...`;
    btnImport.disabled = true;

    try {
        const response = await fetch(`/api/supplier-vdl/${activeProjectId}/${activeSupplierId}/import`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            showToast(data.message, "success");
            fileInput.value = "";
            await loadSupplierVdlData(activeSupplierId);
        } else {
            showToast(data.detail || "Errore importazione.", "error");
        }
    } catch (e) {
        console.error("Import error:", e);
        showToast("Errore di rete.", "error");
    } finally {
        btnImport.innerHTML = originalBtn;
        btnImport.disabled = false;
    }
}

function renderSupplierGridTable() {
    const head = document.getElementById("supplier-vdl-grid-head");
    const body = document.getElementById("supplier-vdl-grid-body");
    
    if (supplierVdlColumns.length === 0) {
        head.innerHTML = "";
        body.innerHTML = `
            <tr>
                <td colspan="100%" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-cloud-arrow-up" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.3;"></i>
                    Nessuna VDL caricata per questo fornitore. Importa un file Excel.
                </td>
            </tr>
        `;
        return;
    }
    
    // RENDER HEADERS
    let headerHTML = "<tr>";
    headerHTML += `<th style="width: 50px; text-align: center; background: #0f162a; position: sticky; left: 0; z-index: 5;">#</th>`;
    
    supplierVdlColumns.forEach(col => {
        headerHTML += `<th title="${col}">${col}</th>`;
    });
    headerHTML += "</tr>";
    head.innerHTML = headerHTML;
    
    // SEARCH FILTER
    const searchText = searchInput.value.toLowerCase().trim();
    const filteredDocs = supplierDocumentsData.filter(doc => {
        if (!searchText) return true;
        for (const col of supplierVdlColumns) {
            if (String(doc[col] || "").toLowerCase().includes(searchText)) return true;
        }
        return false;
    });

    if (filteredDocs.length === 0) {
        body.innerHTML = `<tr><td colspan="100%" style="text-align: center; padding: 40px; color: var(--text-muted);">Nessun documento trovato.</td></tr>`;
        return;
    }
    
    // RENDER ROWS
    let bodyHTML = "";
    filteredDocs.forEach((doc, idx) => {
        bodyHTML += `<tr>`;
        bodyHTML += `<td style="text-align: center; background: #0f162a; position: sticky; left: 0; z-index: 3; font-weight: 600; color: var(--text-muted); border-right: 2px solid var(--border-color);">${idx + 1}</td>`;
        
        supplierVdlColumns.forEach((col, colIdx) => {
            const val = doc[col] !== undefined && doc[col] !== null ? doc[col] : "";
            const isComputed = (col === "Next issue forecast date" || col === "Last Code receive");
            const classes = isComputed ? "cell-locked" : "editable";
            
            bodyHTML += `
                <td class="${classes}" 
                    data-id="${doc.__id}" 
                    data-col="${col}"
                    data-row-idx="${idx}"
                    data-col-idx="${colIdx}"
                    onmousedown="handleCellMouseDown(event, this)"
                    onmouseenter="handleCellMouseEnter(event, this)"
                    ondblclick="startSupplierCellEdit(this)">
                    ${escapeHtml(val)}
                </td>
            `;
        });
        bodyHTML += "</tr>";
    });
    
    body.innerHTML = bodyHTML;
}

// Inline editing
let activeSupplierEditCell = null;

function startSupplierCellEdit(cell) {
    const colName = cell.getAttribute("data-col");
    if (colName === "Next issue forecast date" || colName === "Last Code receive") {
        showToast("Questo campo è calcolato automaticamente.", "warning");
        return;
    }

    if (activeSupplierEditCell && activeSupplierEditCell !== cell) {
        stopSupplierCellEdit(activeSupplierEditCell, true);
    }
    
    activeSupplierEditCell = cell;
    const currentVal = cell.textContent.trim();
    
    cell.classList.add("editing");
    cell.removeAttribute("ondblclick");
    
    cell.innerHTML = `<input type="text" id="supplier-cell-editor" value="${currentVal.replace(/"/g, '&quot;')}">`;
    const editor = document.getElementById("supplier-cell-editor");
    editor.focus();
    
    editor.addEventListener("blur", () => stopSupplierCellEdit(cell, true));
    editor.addEventListener("keydown", (e) => {
        if (e.key === "Enter") stopSupplierCellEdit(cell, true);
        else if (e.key === "Escape") stopSupplierCellEdit(cell, false);
    });
}

function stopSupplierCellEdit(cell, save) {
    if (!cell.classList.contains("editing")) return;
    
    const docId = parseInt(cell.getAttribute("data-id"));
    const colName = cell.getAttribute("data-col");
    const editor = document.getElementById("supplier-cell-editor");
    const newVal = editor.value.trim();
    
    cell.setAttribute("ondblclick", "startSupplierCellEdit(this)");
    cell.classList.remove("editing");
    activeSupplierEditCell = null;
    
    const doc = supplierDocumentsData.find(d => d.__id === docId);
    if (!save) {
        cell.textContent = doc ? (doc[colName] || "") : "";
        return;
    }

    if (doc) {
        const oldVal = doc[colName] !== undefined && doc[colName] !== null ? String(doc[colName]).trim() : "";
        if (oldVal !== newVal) {
            doc[colName] = newVal;
            doc.is_dirty = true;
            cell.classList.add("cell-dirty");
            btnSave.classList.remove("btn-primary");
            btnSave.classList.add("btn-teal");
            showToast("Modifica locale effettuata. Ricordati di salvare.", "info");
        }
        cell.textContent = newVal;
    }
}

async function saveSupplierGridModifications() {
    if (!activeProjectId || !activeSupplierId) return;
    
    const dirtyRows = supplierDocumentsData.filter(d => d.is_dirty);
    if (dirtyRows.length === 0) {
        showToast("Nessuna modifica rilevata.", "info");
        return;
    }
    
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...`;
    btnSave.disabled = true;

    try {
        const response = await fetch(`/api/supplier-vdl/${activeProjectId}/${activeSupplierId}/save-all`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dirtyRows)
        });
        
        if (response.ok) {
            showToast("Modifiche salvate con successo!", "success");
            dirtyRows.forEach(d => d.is_dirty = false);
            btnSave.classList.remove("btn-teal");
            btnSave.classList.add("btn-primary");
            renderSupplierGridTable();
        } else {
            showToast("Errore durante il salvataggio.", "error");
        }
    } catch (e) {
        console.error("Save error:", e);
        showToast("Errore di rete.", "error");
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = originalText;
    }
}

async function addSupplierRevisionCycle() {
    if (!activeProjectId || !activeSupplierId) return;
    if (!confirm("Aggiungere un nuovo ciclo di revisione per questo fornitore? Verranno create nuove colonne TR Out, Actual Date, ecc.")) return;
    
    try {
        const response = await fetch(`/api/supplier-vdl/${activeProjectId}/${activeSupplierId}/add-cycle`, { method: "POST" });
        const data = await response.json();
        if (response.ok && data.status === "success") {
            showToast(data.message || "Ciclo aggiunto.", "success");
            await loadSupplierVdlData(activeSupplierId);
        } else {
            showToast(data.detail || "Errore.", "error");
        }
    } catch (e) {
        console.error("Cycle error:", e);
        showToast("Errore di rete.", "error");
    }
}

// Call init on script load
document.addEventListener('DOMContentLoaded', () => {
    initSupplierVdlControls();
});
