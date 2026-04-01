// Initialize Icons
lucide.createIcons();

// Toast Notification Utility
const Toast = {
    show(type, title, message, duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-circle';
        if (type === 'warning') iconName = 'alert-triangle';

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i data-lucide="x"></i></button>
        `;

        container.appendChild(toast);
        lucide.createIcons();

        const removeToast = () => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        };

        toast.querySelector('.toast-close').addEventListener('click', removeToast);

        if (duration > 0) {
            setTimeout(removeToast, duration);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnProcess = document.getElementById('btn-process');
    const captureInput = document.getElementById('capture-input');
    const modal = document.getElementById('processing-modal');
    
    // Init Google Service if Client ID is configured
    setTimeout(() => {
        const savedClientId = localStorage.getItem('googleClientId');
        if (savedClientId && typeof google !== 'undefined') {
            GoogleService.init(savedClientId);
        }
    }, 1000);

    // AI Processing (CODE Method)
    btnProcess.addEventListener('click', async () => {
        const text = captureInput.value.trim();
        if (!text) return;
        
        try {
            // UI Loading state
            btnProcess.disabled = true;
            if (btnProcess.querySelector('span')) btnProcess.querySelector('span').style.display = 'none';
            if (btnProcess.querySelector('i')) btnProcess.querySelector('i').style.display = 'none';
            if (btnProcess.querySelector('.btn-spinner')) btnProcess.querySelector('.btn-spinner').style.display = 'block';
            modal.classList.add('active');
            
            const apiKey = localStorage.getItem('geminiApiKey');
            const result = await AIService.processThought(text, apiKey);
            
            console.log("Dismemberment Result:", result);
            
            // Visual success indicator
            captureInput.value = '';
            
            if (btnProcess.querySelector('.btn-spinner')) btnProcess.querySelector('.btn-spinner').style.display = 'none';
            btnProcess.innerHTML = `<i data-lucide="check"></i> Extraído: ${result.tipo}`;
            btnProcess.style.backgroundColor = '#10b981';
            btnProcess.style.color = '#fff';
            lucide.createIcons();
            
            // Here we route to GoogleService based on result.tipo
            if (result.tipo === 'Accion') {
                try {
                    const savedSheetId = localStorage.getItem('googleSheetId') || '1n4YBwFQ3tj3sOWINAqyPPPKwiMp8IZh2zDYF5kuVmpM';
                    const savedSheetName = localStorage.getItem('googleSheetName') || 'Hoja 1';
                    const sheetId = savedSheetId;
                    const sheetRange = `${savedSheetName}!A1`;
                    // Intentamos con 'Hoja 1!A1' (nombre por defecto en español), si falla prueba con 'Sheet1!A1'
                    await GoogleService.appendToSheet(sheetId, sheetRange, [
                        [new Date().toLocaleDateString(), result.categoria, result.dimension, result.titulo, result.contenido, "Pendiente"]
                    ]);
                    console.log("Acción añadida a Google Sheets exitosamente.");
                    Toast.show('success', '¡Acción Capturada!', `Se guardó "${result.titulo}" en tu hoja de ruta.`);
                } catch(e) {
                    console.warn(e.message);
                    if(!e.message.includes('Solicitando')) {
                        Toast.show('error', 'Error en Sheets', 'Verifica el ID y Nombre de Hoja en Configuración. Revisa la consola para más detalles.');
                    }
                }
            } else {
                // If it's Theory, we create a Knowledge Document
                try {
                    const doc = await GoogleService.createDocument(result.titulo, result.contenido);
                    console.log("Documento de teoría creado en Google Docs:", doc);
                    Toast.show('success', '¡Conocimiento Destilado!', `Se creó el documento "${result.titulo}" en Google Docs.`);
                } catch(e) {
                    console.warn(e.message);
                    if(!e.message.includes('Solicitando')) {
                        Toast.show('error', 'Error en Google Docs', 'No se pudo crear el documento. Revisa la consola para más detalles.');
                    }
                }
            }
            
            setTimeout(() => {
                btnProcess.innerHTML = `
                    <i data-lucide="sparkles"></i>
                    <span>Procesar</span>
                    <div class="btn-spinner" style="display: none; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                `;
                btnProcess.style.backgroundColor = '';
                btnProcess.style.color = '';
                btnProcess.disabled = false;
                lucide.createIcons();
            }, 4000);
            
        } catch (error) {
            Toast.show('error', 'Error de Procesamiento IA', error.message);
            btnProcess.innerHTML = `
                <i data-lucide="sparkles"></i>
                <span>Procesar</span>
                <div class="btn-spinner" style="display: none; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            `;
            btnProcess.disabled = false;
            lucide.createIcons();
        } finally {
            modal.classList.remove('active');
        }
    });

    // Sync / Login Button
    const btnSync = document.getElementById('btn-sync');
    if (btnSync) {
        btnSync.addEventListener('click', () => {
            try {
                // Only attempt login if client ID exists
                if (!localStorage.getItem('googleClientId')) {
                    Toast.show('warning', 'Configuración Pendiente', 'Por favor, configura tu Google Client ID primero.');
                    settingsModal.classList.add('active');
                    return;
                }
                GoogleService.login();
            } catch (error) {
                Toast.show('error', 'Error de Autenticación', error.message);
            }
        });
    }

    // Settings Logic
    const navSettings = document.getElementById('nav-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const inputClientId = document.getElementById('google-client-id');
    const inputApiKey = document.getElementById('gemini-api-key');
    const inputSheetId = document.getElementById('google-sheet-id');
    const inputSheetName = document.getElementById('google-sheet-name');

    // Load saved settings
    if (inputClientId && inputApiKey) {
        inputClientId.value = localStorage.getItem('googleClientId') || '';
        inputApiKey.value = localStorage.getItem('geminiApiKey') || '';
    }
    if (inputSheetId) {
        inputSheetId.value = localStorage.getItem('googleSheetId') || '1n4YBwFQ3tj3sOWINAqyPPPKwiMp8IZh2zDYF5kuVmpM';
    }
    if (inputSheetName) {
        inputSheetName.value = localStorage.getItem('googleSheetName') || 'Hoja 1';
    }

    if(navSettings) {
        navSettings.addEventListener('click', (e) => {
            e.preventDefault();
            settingsModal.classList.add('active');
        });
    }

    if(btnCloseSettings) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    if(btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
            localStorage.setItem('googleClientId', inputClientId.value.trim());
            localStorage.setItem('geminiApiKey', inputApiKey.value.trim());
            if (inputSheetId) localStorage.setItem('googleSheetId', inputSheetId.value.trim());
            if (inputSheetName) localStorage.setItem('googleSheetName', inputSheetName.value.trim());
            
            btnSaveSettings.innerHTML = '<i data-lucide="check"></i> Guardado';
            btnSaveSettings.style.backgroundColor = '#10b981';
            lucide.createIcons();
            
            setTimeout(() => {
                btnSaveSettings.innerHTML = 'Guardar Configuración';
                btnSaveSettings.style.backgroundColor = '';
                settingsModal.classList.remove('active');
            }, 1500);
        });
    }

    // Sunday Sync Logic
    const navSundaySync = document.getElementById('nav-sunday-sync');
    const syncModal = document.getElementById('sunday-sync-modal');
    const btnCloseSyncModal = document.getElementById('btn-close-sync-modal');
    const btnRunSundaySync = document.getElementById('btn-run-sunday-sync');
    const chkPara = document.getElementById('chk-para');

    if (navSundaySync) {
        navSundaySync.addEventListener('click', (e) => {
            e.preventDefault();
            syncModal.classList.add('active');
        });
    }

    if (btnCloseSyncModal) {
        btnCloseSyncModal.addEventListener('click', () => {
            syncModal.classList.remove('active');
        });
    }

    if (btnRunSundaySync) {
        btnRunSundaySync.addEventListener('click', async () => {
            try {
                const originalText = btnRunSundaySync.innerHTML;
                btnRunSundaySync.innerHTML = '<div class="loader" style="width: 16px; height: 16px; border-width: 2px;"></div> Procesando...';
                btnRunSundaySync.disabled = true;

                // 1. Create PARA Folders in Google Drive if checked
                if (chkPara && chkPara.checked) {
                    if (!GoogleService.isLoggedIn()) {
                        GoogleService.login();
                        throw new Error("Solicitando autenticación con Google para crear carpetas en Drive.");
                    }
                    const folders = ['1. Proyectos', '2. Áreas', '3. Recursos', '4. Archivos'];
                    for (const f of folders) {
                        await GoogleService.createDriveFolder(f);
                        console.log(`Carpeta creada: ${f}`);
                    }
                    Toast.show('success', '¡Entorno Creado!', 'La estructura P.A.R.A se generó en tu Google Drive exitosamente.');
                    chkPara.checked = false; // Uncheck after creation
                }

                // 2. Simulate Metrics Recalculation
                const progressBars = document.querySelectorAll('.progress');
                progressBars.forEach(bar => {
                    const randomProgress = Math.floor(Math.random() * 60) + 40; // Random between 40 y 100
                    bar.style.width = `${randomProgress}%`;
                });

                // Success visual
                btnRunSundaySync.innerHTML = '<i data-lucide="check"></i> Mantenimiento Completado';
                btnRunSundaySync.style.backgroundColor = '#10b981';
                lucide.createIcons();

                setTimeout(() => {
                    btnRunSundaySync.innerHTML = originalText;
                    btnRunSundaySync.style.backgroundColor = '';
                    btnRunSundaySync.disabled = false;
                    syncModal.classList.remove('active');
                }, 2000);

            } catch (error) {
                console.error(error);
                if (!error.message.includes("Solicitando")) {
                    Toast.show('error', 'Mantenimiento Fallido', error.message);
                }
                btnRunSundaySync.innerHTML = '<i data-lucide="zap"></i> Ejecutar Mantenimiento Semanal';
                btnRunSundaySync.disabled = false;
            }
        });
    }
});
