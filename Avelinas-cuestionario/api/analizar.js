export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumen, nombre, especialidad, telefono, email } = req.body;

  // 1. Análisis con Claude
  let aiText = '';
  try {
    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Sos asistente de selección de personal de Avelinas, un centro de estética premium en Azul, Buenos Aires. Analizá el siguiente cuestionario de una candidata y generá un informe en español rioplatense, conciso y profesional.

${resumen}

El informe debe tener exactamente estas secciones (sin markdown, sin asteriscos, sin #):

RESUMEN EJECUTIVO
[2-3 oraciones describiendo el perfil general de la candidata]

PUNTOS FUERTES
[2-3 puntos concretos basados en sus respuestas]

PUNTOS DE ATENCIÓN
[Las señales de alerta más relevantes con contexto específico para un centro de estética]

PREGUNTAS RECOMENDADAS PARA LA ENTREVISTA
[3-4 preguntas específicas basadas en sus respuestas débiles o ambiguas]

RECOMENDACIÓN FINAL
[Una sola oración clara: INCORPORAR / ENTREVISTAR CON CAUTELA / DESCARTAR, con breve justificación]`
        }]
      })
    });
    const claudeData = await claudeResp.json();
    aiText = claudeData.content?.[0]?.text || '';
  } catch (err) {
    aiText = 'No disponible';
  }

  // 2. Envío por Web3Forms
  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: 'e6e12092-4656-448c-9399-0948c5f4e195',
        subject: `[Avelinas] Nueva candidata: ${nombre} — ${especialidad}`,
        from_name: 'Avelinas · Cuestionario',
        nombre,
        especialidad,
        telefono,
        email_candidata: email || '—',
        resumen,
        analisis_ia: aiText
      })
    });
  } catch (err) {
    // Si falla el mail, igual devolvemos el análisis
  }

  return res.status(200).json({ ok: true, analisis: aiText });
}
