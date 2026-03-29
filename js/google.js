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
    }
    
    // Aquí implementaremos luego las llamadas a Drive API, Sheets API y Docs API
    // Ejemplo: createDocument(title, content), appendToSheet(spreadsheetId, data), etc.
};
