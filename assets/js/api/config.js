export const API_URL = 'https://vinyl-api-m6y9.onrender.com/api/v1'

export async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
        throw new Error(data?.message || 'Erro ao acessar a API')
    }

    return data
}