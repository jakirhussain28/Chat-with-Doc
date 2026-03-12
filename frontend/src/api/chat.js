const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
};

// ─── Document Upload ──────────────────────────────────────────────────────────

export const uploadDocument = (file, conversationId, chunkSize, chunkOverlap, embedModel) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversation_id', conversationId || "null");
    formData.append('chunk_size', chunkSize);
    formData.append('chunk_overlap', chunkOverlap);
    formData.append('embed_model', embedModel);

    return fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
    }).then(handleResponse);
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const sendChatMessage = (message, userId, conversationId = null, model = null, embedModel = null, systemPrompt = null, options = {}) =>
    fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message, 
            user_id: userId, 
            conversation_id: conversationId, 
            model, 
            embed_model: embedModel, 
            system_prompt: systemPrompt,
            ...options 
        }),
    });

// ─── Conversations ────────────────────────────────────────────────────────────

export const fetchConversations = (userId) =>
    fetch(`${API_URL}/api/users/${userId}/conversations`).then(handleResponse);

export const fetchConversation = (convId) =>
    fetch(`${API_URL}/api/conversations/${convId}`).then(handleResponse);

export const deleteConversation = (convId) =>
    fetch(`${API_URL}/api/conversations/${convId}`, { method: 'DELETE' }).then(handleResponse);