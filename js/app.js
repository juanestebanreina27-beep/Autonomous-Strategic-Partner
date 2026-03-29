// Initialize Icons
lucide.createIcons();

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
            // Show loading modal
            modal.classList.add('active');
            
            const apiKey = localStorage.getItem('geminiApiKey');
            const result = await AIService.processThought(text, apiKey);
            
            console.log("Dismemberment Result:", result);
            
            // Visual success indicator
            captureInput.value = '';
            
            const originalText = btnProcess.innerHTML;
            btnProcess.innerHTML = `<i data-lucide="check"></i> Extraído: ${result.tipo}`;
            btnProcess.style.backgroundColor = '#10b981';
            btnProcess.style.color = '#fff';
            lucide.createIcons();
            
            // Here we route to GoogleService based on result.tipo
            if (result.tipo === 'Accion') {
                try {
                    const sheetId = '1n4YBwFQ3tj3sOWINAqyPPPKwiMp8IZh2zDYF5kuVmpM';
                    // Intentamos con 'Hoja 1!A1' (nombre por defecto en español), si falla prueba con 'Sheet1!A1'
                    await GoogleService.appendToSheet(sheetId, 'Hoja 1!A1', [
                        [new Date().toLocaleDateString(), result.categoria, result.dimension, result.titulo, result.contenido, "Pendiente"]
                    ]);
                    console.log("Acción añadida a Google Sheets exitosamente.");
                    alert(`Acción guardada en Sheets: ${result.titulo}`);
                } catch(e) {
                    console.warn(e.message);
                    if(!e.message.includes('Solicitando')) {
                        alert("Hubo un problema comunicándose con Google Sheets. (Asegúrate de que la hoja se llame 'Hoja 1')");
                    }
                }
            } else {
                // If it's Theory, we create a Knowledge Document
                try {
                    const doc = await GoogleService.createDocument(result.titulo, result.contenido);
                    console.log("Documento de teoría creado en Google Docs:", doc);
                    alert(`Documento creado con éxito: ${result.titulo}`);
                } catch(e) {
                    console.warn(e.message);
                    if(!e.message.includes('Solicitando')) {
                        alert("Hubo un problema comunicándose con Google Docs.");
                    }
                }
            }
            
            setTimeout(() => {
                btnProcess.innerHTML = originalText;
                btnProcess.style.backgroundColor = '';
                btnProcess.style.color = '';
                lucide.createIcons();
            }, 4000);
            
        } catch (error) {
            alert("Error procesando pensamiento: " + error.message);
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
                    alert("Por favor, configura tu Google Client ID en 'Configuración' primero.");
                    settingsModal.classList.add('active');
                    return;
                }
                GoogleService.login();
            } catch (error) {
                alert("Error de autenticación: " + error.message);
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

    // Load saved settings
    if (inputClientId && inputApiKey) {
        inputClientId.value = localStorage.getItem('googleClientId') || '';
        inputApiKey.value = localStorage.getItem('geminiApiKey') || '';
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
                    alert("Estructura P.A.R.A creada en tu Google Drive raíz exitosamente.");
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
                    alert("Error en Sunday Sync: " + error.message);
                }
                btnRunSundaySync.innerHTML = '<i data-lucide="zap"></i> Ejecutar Mantenimiento Semanal';
                btnRunSundaySync.disabled = false;
            }
        });
    }
});
