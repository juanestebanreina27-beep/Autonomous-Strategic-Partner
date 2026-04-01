const AIService = {
    async processThought(text, apiKey) {
        if (!apiKey) throw new Error("Falta la API Key de Gemini en Configuración.");
        
        const prompt = `
Eres la IA de un Socio Estratégico Autónomo. 
El usuario ha capturado la siguiente idea o pensamiento rápido: "${text}"

Analiza esta idea según la metodología CODE (Capture, Organize, Distill, Express) y las 12 Dimensiones de Lifebook.
Determina con precisión:
1. Si esto es "Accion" (una tarea puntual, recordatorio o proyecto) o "Teoria" (conocimiento, resumen de un libro, reflexión personal).
2. A qué Categoría Maestra (Vida Personal, Vida Interior, Relaciones, Vida Empresarial, Proposito) pertenece de forma principal.
3. A qué Dimensión de las 12 pertenece (Salud y Forma Física, Vida Intelectual, Vida Emocional, Carácter, Vida Espiritual, Vida Amorosa, Familia, Vida Social, Finanzas, Carrera Profesional, Calidad de Vida, Visión de Vida).
4. Un título corto y claro.
5. Una descripción, desglose o próximos pasos procesados y refinados.

Devuelve SOLO un JSON puro (sin etiquetas markdown ni comillas bloque) con este formato exacto:
{
    "tipo": "Accion" o "Teoria",
    "categoria": "Categoría elegida",
    "dimension": "Dimensión elegida",
    "titulo": "Título corto",
    "contenido": "Descripción procesada"
}
`;

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        console.log("Testeando conexión al endpoint Gemini...", url.substring(0, 80) + "...");
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Detalles del error Gemini:", errText);
                if (response.status === 400) throw new Error("API Key inválida o mal formada. Revísala en Configuración.");
                if (response.status === 403) throw new Error("Permisos denegados para la API Key. Verifica en Google AI Studio.");
                if (response.status === 429) throw new Error("Límite de peticiones excedido (Rate Limit). Intenta de nuevo más tarde.");
                throw new Error(`Error ${response.status}: Ha ocurrido un problema al conectar con Gemini.`);
            }

            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("La IA no devolvió ninguna respuesta válida.");
            }

            try {
                const jsonText = data.candidates[0].content.parts[0].text;
                return JSON.parse(jsonText);
            } catch (e) {
                console.error("Error parseando JSON de Gemini:", e);
                throw new Error("La IA no pudo estructurar la respuesta correctamente. Intenta formularlo distinto.");
            }

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                 throw new Error("Problema de conexión a internet o el servidor está bloqueado (CORS).");
            }
            throw error; // Re-throw other custom errors
        }
    }
};
