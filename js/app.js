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
            
            // Here we will later route to GoogleService based on result.tipo
            if (result.tipo === 'Accion') {
                // await GoogleService.appendToSheet(...)
            } else {
                // await GoogleService.createDocument(...)
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
});
