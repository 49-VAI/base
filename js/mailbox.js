// ================================================================
// ПОЧТАМТ — отправка и загрузка писем (только mail.html)
// Клиент и утилиты — в mailbox-client.js
// ================================================================

// mail.html подключает mailbox-client.js первым — клиент уже готов
const _mailboxClient = window.mailboxClient;

async function mailboxSend(payload) {
    const attachments = [];

    for (const file of (payload.files || [])) {
        if (file.size > MAILBOX_MAX_FILE_SIZE) {
            throw new Error(`Файл "${file.name}" больше 5 МБ`);
        }

        const safeName = mailboxTranslitSafe(file.name);
        const path = `${MAILBOX_MY_SITE}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;

        const { error: upErr } = await _mailboxClient.storage
            .from(MAILBOX_BUCKET)
            .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });

        if (upErr) throw new Error('Не удалось загрузить файл: ' + upErr.message);

        const { data: { publicUrl } } = _mailboxClient.storage
            .from(MAILBOX_BUCKET)
            .getPublicUrl(path);

        attachments.push({
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            url: publicUrl,
            path: path
        });
    }

    const { data, error } = await _mailboxClient.from('messages').insert({
        from_site: MAILBOX_MY_SITE,
        to_site: payload.toSite,
        from_position: payload.fromPosition,
        from_rank: payload.fromRank,
        from_name: payload.fromName,
        to_user: payload.toUser,
        subject: payload.subject,
        body: payload.body,
        attachments: attachments
    }).select().single();

    if (error) throw new Error('Не удалось отправить письмо: ' + error.message);
    return data;
}

async function mailboxLoadInbox() {
    const { data, error } = await _mailboxClient
        .from('messages')
        .select('*')
        .eq('to_site', MAILBOX_MY_SITE)
        .order('created_at', { ascending: false });
    if (error) throw new Error('Не удалось загрузить входящие: ' + error.message);
    return data || [];
}

async function mailboxLoadOutbox() {
    const { data, error } = await _mailboxClient
        .from('messages')
        .select('*')
        .eq('from_site', MAILBOX_MY_SITE)
        .order('created_at', { ascending: false });
    if (error) throw new Error('Не удалось загрузить исходящие: ' + error.message);
    return data || [];
}

function mailboxSubscribeInbox(callback) {
    const channel = _mailboxClient
        .channel('mailbox-inbox')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `to_site=eq.${MAILBOX_MY_SITE}`
        }, (payload) => {
            if (typeof callback === 'function') callback(payload.new);
        })
        .subscribe();
    return channel;
}

function mailboxUnsubscribe(channel) {
    if (channel) _mailboxClient.removeChannel(channel);
}

window.mailboxSend = mailboxSend;
window.mailboxLoadInbox = mailboxLoadInbox;
window.mailboxLoadOutbox = mailboxLoadOutbox;
window.mailboxSubscribeInbox = mailboxSubscribeInbox;
window.mailboxUnsubscribe = mailboxUnsubscribe;

// ================================================================
// ШАГ 17 — ПАГИНАЦИЯ INBOX / OUTBOX
// ================================================================

/**
 * Постраничная загрузка входящих.
 * @param {Object} opts - { page: 0-based, pageSize: до 200, по умолчанию 30 }
 * @returns {Promise<{rows: Array, total: number, page: number, pageSize: number, error}>}
 */
async function mailboxLoadInboxPaged(opts = {}) {
    const page = Math.max(0, parseInt(opts.page, 10) || 0);
    const pageSize = Math.max(1, Math.min(200, parseInt(opts.pageSize, 10) || 30));
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await _mailboxClient
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('to_site', MAILBOX_MY_SITE)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) return { rows: [], total: 0, page, pageSize, error };
    return { rows: data || [], total: count || 0, page, pageSize, error: null };
}

/**
 * Постраничная загрузка исходящих.
 */
async function mailboxLoadOutboxPaged(opts = {}) {
    const page = Math.max(0, parseInt(opts.page, 10) || 0);
    const pageSize = Math.max(1, Math.min(200, parseInt(opts.pageSize, 10) || 30));
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await _mailboxClient
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('from_site', MAILBOX_MY_SITE)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) return { rows: [], total: 0, page, pageSize, error };
    return { rows: data || [], total: count || 0, page, pageSize, error: null };
}

/**
 * Загрузка одного письма по id — для fallback, когда его нет
 * в текущей странице mailInbox/mailOutbox.
 */
async function mailboxLoadById(id) {
    if (!id) return null;
    const { data, error } = await _mailboxClient
        .from('messages').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data;
}

window.mailboxLoadInboxPaged = mailboxLoadInboxPaged;
window.mailboxLoadOutboxPaged = mailboxLoadOutboxPaged;
window.mailboxLoadById = mailboxLoadById;