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
            throw new Error(`Error ${response.status}: La llave puede estar mal escrita o falta recargar.`);
        }
        const data = await response.json();
        
        try {
            const jsonText = data.candidates[0].content.parts[0].text;
            return JSON.parse(jsonText);
        } catch (e) {
            throw new Error("El formato devuelto por Gemini no fue un JSON válido.");
        }
    }
};
