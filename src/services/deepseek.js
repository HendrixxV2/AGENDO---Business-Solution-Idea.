/**
 * Agendo — DeepSeek client (frontend side)
 *
 * IMPORTANT: The DeepSeek API key MUST live in the backend only (see .env.example).
 * This module never holds or sends the key. It calls a same-origin proxy route
 * (e.g. POST /api/deepseek) that the backend implements using DEEPSEEK_API_KEY
 * from its own environment variables.
 *
 * If no backend proxy is configured, requests degrade gracefully so the
 * onboarding flow keeps working without AI.
 */

const PROXY_URL = '/api/deepseek/chat'

export async function deepSeekChat({ messages, temperature = 0.4, maxTokens = 400 } = {}) {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, temperature, maxTokens }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek proxy responded ${response.status}`)
    }

    const data = await response.json()
    return {
      ok: true,
      content: data.content || data.choices?.[0]?.message?.content || '',
      source: 'deepseek'
    }
  } catch (error) {
    // No backend proxy configured: degrade gracefully. Never leak a key here.
    return {
      ok: false,
      content: null,
      source: 'offline',
      error: error.message
    }
  }
}

/**
 * Generates a welcome / WhatsApp message for a barbershop using DeepSeek.
 * Falls back to a static template when the backend proxy is unavailable.
 */
export async function generateWelcomeMessage({ shopName, services, whatsapp }) {
  const servicesList = services
    .map((s) => `- ${s.name}: $${s.price} (${s.duration} min)`)
    .join('\n')

  const ai = await deepSeekChat({
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant for Agendo, a SaaS for barbershops. Write a short, friendly, Spanish-language welcome message a barber can send by WhatsApp to share their booking page. Keep it under 60 words, include the booking link placeholder {{LINK}}, and end with a clear call to action. Do not invent prices.'
      },
      {
        role: 'user',
        content: `Barbershop: ${shopName}\nServices:\n${servicesList}\nWhatsApp: ${whatsapp || '—'}`
      }
    ],
    temperature: 0.5,
    maxTokens: 220
  })

  if (ai.ok && ai.content) {
    return { message: ai.content, source: ai.source }
  }

  // Static fallback so the feature works without a backend
  const fallback = `Hola 👋 Te invito a reservar tu cita en *${shopName}*.\n\nNuestros servicios:\n${servicesList}\n\nReserva tu horario aquí: {{LINK}}\n\n¡Te esperamos! 💈\n(Enlace generado con Agendo)`
  return { message: fallback, source: 'offline-fallback' }
}
