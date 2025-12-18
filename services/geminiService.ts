

import { GoogleGenAI, Type } from "@google/genai";
import type { BookingRecord } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            fechaVuelo: { type: Type.STRING, description: 'Fecha del vuelo' },
            fechaHoraCorreo: { type: Type.STRING, description: 'Marca de tiempo del correo' },
            estatus: { type: Type.STRING, description: 'Estado de la reserva (AMEND, NEW BOOKING, CANCELLATION)' },
            codigoReserva: { type: Type.STRING, description: 'Código de reserva' },
            genero: { type: Type.STRING, description: 'Género (Mr. o Mrs.)' },
            nombreCompleto: { type: Type.STRING, description: 'Nombre completo' },
            fechaNacimiento: { type: Type.STRING, description: 'Fecha de nacimiento (DD/MM/YYYY)' },
            edad: { type: Type.INTEGER, description: 'Edad' },
            pasaporte: { type: Type.STRING, description: 'Número de pasaporte' },
            nacionalidad: { type: Type.STRING, description: 'Nacionalidad' },
            agencia: { type: Type.STRING, description: 'Agencia de viajes' },
            fechaInicio: { type: Type.STRING, description: 'Fecha de entrada' },
            fechaFin: { type: Type.STRING, description: 'Fecha de salida' },
            noches: { type: Type.INTEGER, description: 'Número de noches' },
            hotel: { type: Type.STRING, description: 'Nombre del hotel' },
            planDeComidas: { type: Type.STRING, description: 'Plan de comidas' },
            alojamiento: { type: Type.STRING, description: 'Tipo de alojamiento' },
            observaciones: { type: Type.STRING, description: 'Observaciones' },
        },
        required: [
            'fechaVuelo', 'fechaHoraCorreo', 'estatus', 'codigoReserva', 'genero', 'nombreCompleto',
            'fechaNacimiento', 'edad', 'pasaporte', 'nacionalidad', 'agencia', 'fechaInicio',
            'fechaFin', 'noches', 'hotel', 'planDeComidas', 'alojamiento'
        ]
    }
};


export const processBookingData = async (text: string): Promise<BookingRecord[]> => {
    const prompt = `
    Eres un sistema experto en extracción de datos. Analiza el siguiente texto no estructurado que contiene registros de reservas para una agencia de viajes.
    El texto representa una única tabla grande donde cada fila es el registro de un pasajero. Algunas filas pueden estar desalineadas o envueltas en varias líneas.

    Tu tarea es:
    1.  Analizar cada fila para extraer todos los detalles de la reserva disponibles para cada pasajero.
    2.  Las columnas son: Fecha Vuelo, Fecha Hora Correo, Estatus, Codigo Reserva, Género, Nombre Completo, Fecha Nacimiento, Edad, Pasaporte, Nacionalidad, Agencia, Fecha Inicio, Fecha Fin, Noches, Hotel, Plan de Comidas, Alojamiento, Observaciones. Ten en cuenta que el encabezado de 'Fecha Nacimiento' podría estar mal escrito como 'echa Nacimient'.
    3.  Combinar la información en un único registro estructurado para cada pasajero.
    4.  El campo 'pasaporte' a veces es un solo número o dos números. Combínalos en una sola cadena de texto.
    5.  Presta mucha atención a la alineación de las columnas, ya que podría ser imperfecta. Usa el contexto y los nombres de los encabezados para asociar correctamente los datos con las columnas.
    6.  Algunas 'observaciones' pueden estar vacías. Maneja esto asignando una cadena de texto vacía.
    7.  Asegúrate de que todos los campos tengan el tipo correcto según el esquema JSON proporcionado.
    8.  IMPORTANTE: Normaliza todas las fechas (Fecha Vuelo, Fecha Hora Correo, Fecha Nacimiento, Fecha Inicio, Fecha Fin) al formato estandar ISO "YYYY-MM-DD" (o "YYYY-MM-DD HH:mm:ss" si incluye hora). Si la fecha viene en formato DD.MM.YY, asume que es año 20xx (ej. 25 es 2025).
    9.  Devuelve el resultado final como un array de objetos JSON.

    Aquí están los datos:
    ${text}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });

        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        
        if (!Array.isArray(data)) {
            throw new Error("La respuesta de la IA no es un array.");
        }
        
        // Basic validation
        return data.map((item: any) => ({
            ...item,
            observaciones: item.observaciones || '' // Ensure observaciones is always a string
        }));

    } catch (error) {
        console.error("Error al llamar a la API de Gemini o al procesar la respuesta:", error);
        throw new Error("Falló el procesamiento de datos con la API de Gemini.");
    }
};