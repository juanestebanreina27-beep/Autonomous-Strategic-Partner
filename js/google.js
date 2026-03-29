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
            
            if (!createRes.ok) throw new Error("Error creando documento de Google Docs");
            
            const docInfo = await createRes.json();
            
            // Si hay contenido, insertarlo en el documento
            if (content) {
                await fetch(`https://docs.googleapis.com/v1/documents/${docInfo.documentId}:batchUpdate`, {
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
            }
            return docInfo;
            
        } catch (error) {
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
            
            if (!res.ok) throw new Error("Error añadiendo datos a Google Sheets");
            return await res.json();
        } catch (error) {
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
