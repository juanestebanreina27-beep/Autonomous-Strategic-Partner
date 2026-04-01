const GoogleService = {
    tokenClient: null,
    accessToken: null,

    init(clientId) {
        if (!clientId) return;
        
        // Initialize the Token Client for OAuth 2.0
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents',
            callback: (tokenResponse) => {
                if (tokenResponse.error !== undefined) {
                    throw (tokenResponse);
                }
                this.accessToken = tokenResponse.access_token;
                console.log("¡Autenticado con Google Workspace exitosamente!");
                // Trigger a UI update or custom event here if needed
                document.dispatchEvent(new CustomEvent('google-auth-success'));
            },
        });
    },

    login() {
        if (!this.tokenClient) throw new Error("El Google Client ID no está configurado. Ve a Configuración.");
        this.tokenClient.requestAccessToken();
    },

    isLoggedIn() {
        return this.accessToken !== null;
    },
    async createDocument(title, content) {
        if (!this.accessToken) {
            this.login();
            throw new Error("Solicitando autenticación con Google. Por favor, acepta la ventana emergente e intenta de nuevo.");
        }
        
        try {
            // Crear el documento
            const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: title })
            });
            
            if (createRes.status === 401 || createRes.status === 403) {
                 this.login();
                 throw new Error("Solicitando autenticación con Google. Tu sesión expiró o faltan permisos.");
            }
            if (!createRes.ok) {
                 const errText = await createRes.text();
                 console.error("Docs API Error:", errText);
                 throw new Error(`Error API Docs (${createRes.status}). Revisa la consola.`);
            }
            
            const docInfo = await createRes.json();
            
            // Si hay contenido, insertarlo en el documento
            if (content) {
                const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docInfo.documentId}:batchUpdate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        requests: [{
                            insertText: {
                                location: { index: 1 },
                                text: content + "\n\n— Generado por Socio Estratégico"
                            }
                        }]
                    })
                });

                if (!updateRes.ok) {
                    const errText = await updateRes.text();
                    console.error("Docs BatchUpdate Error:", errText);
                    throw new Error("El documento fue creado pero hubo un error insertando el texto.");
                }
            }
            return docInfo;
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                 throw new Error("Problema de conexión de red al intentar crear el documento de Google.");
            }
            console.error("Error en createDocument:", error);
            throw error;
        }
    },

    async appendToSheet(spreadsheetId, range, values) {
        if (!this.accessToken) {
            this.login();
            throw new Error("Solicitando autenticación con Google. Por favor, acepta e intenta de nuevo.");
        }
        
        try {
            const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: values // Ejemplo: [['Dato 1', 'Dato 2']]
                })
            });
            
            if (res.status === 401 || res.status === 403) {
                 this.login();
                 throw new Error("Solicitando autenticación con Google. Tu sesión expiró o faltan permisos.");
            }
            if (res.status === 404) {
                 throw new Error(`No se encontró el archivo Google Sheets con el ID proporcionado o el nombre de pestaña es incorrecto.`);
            }
            if (res.status === 400) {
                 throw new Error("El rango proporcionado parece ser inválido, o el archivo no es un Google Sheet compatible.");
            }
            if (!res.ok) {
                 const errText = await res.text();
                 console.error("Sheets API Error:", errText);
                 throw new Error(`Error API Sheets (${res.status}). Revisa la consola.`);
            }

            return await res.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                 throw new Error("Problema de conexión de red al intentar comunicarse con Google Sheets.");
            }
            console.error("Error en appendToSheet:", error);
            throw error;
        }
    },

    async createDriveFolder(folderName, parentId = null) {
        if (!this.accessToken) {
            this.login();
            throw new Error("Solicitando autenticación con Google.");
        }

        try {
            const body = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            if (parentId) {
                body.parents = [parentId];
            }

            const res = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Error creando carpeta en Drive");
            return await res.json();
        } catch(error) {
            console.error("Error en createDriveFolder:", error);
            throw error;
        }
    }
};
