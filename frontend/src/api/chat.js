const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── Helper ───────────────────────────────────────────────────────────────────

const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

/**
 * Send a chat message and stream the response.
 * Returns a Response object whose body is an SSE stream.
 */
// NEW: Accept systemPrompt as a parameter
export const sendChatMessage = (message, userId, conversationId = null, model = null, systemPrompt = null) =>
    fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // NEW: Map it to the body payload
        body: JSON.stringify({ message, user_id: userId, conversation_id: conversationId, model, system_prompt: systemPrompt }),
    });

// ─── Conversations ────────────────────────────────────────────────────────────

export const fetchConversations = (userId) =>
    fetch(`${API_URL}/api/users/${userId}/conversations`).then(handleResponse);

export const fetchConversation = (convId) =>
    fetch(`${API_URL}/api/conversations/${convId}`).then(handleResponse);

export const deleteConversation = (convId) =>
    fetch(`${API_URL}/api/conversations/${convId}`, { method: 'DELETE' }).then(handleResponse);