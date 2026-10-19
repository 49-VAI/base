// ================================================================
// ПОЧТАМТ — лёгкий клиент (подключается на всех страницах)
// Только клиент Supabase + проверка непрочитанных + bulk-операции.
// UI-логика живёт отдельно в mailbox.js (только mail.html)
// ================================================================

const MAILBOX_URL = 'https://dbgwirtttnaxmyaaejdl.supabase.co';
const MAILBOX_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZ3dpcnR0dG5heG15YWFlamRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MzQzMjcsImV4cCI6MjEwODAxMDMyN30.se2h44QDEGKy5WpcqldoL97ZOmdCMaeS6-fzI1MX5PM';

const MAILBOX_MY_SITE = 'vai';
const MAILBOX_BUCKET = 'mail-attachments';
const MAILBOX_MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAILBOX_MAX_ATTACHMENTS = 5;

const MAILBOX_RECIPIENTS = [
    { value: 'msb', label: 'МСБ (Медико-санитарный батальон)' }
];

// Отдельный клиент — не пересекается с основным supabaseClient
const mailboxClient = window.supabase.createClient(MAILBOX_URL, MAILBOX_ANON_KEY);

// ----------------------------------------------------------------
// Проверка непрочитанных + красная точка в навигации
// ----------------------------------------------------------------
async function mailboxGetUnreadCount() {
    const myId = window.currentProfile?.id;
    if (!myId) return 0;

    const { data, error } = await mailboxClient
        .from('messages')
        .select('id, read_by')
        .eq('to_site', MAILBOX_MY_SITE);

    if (error) throw new Error(error.message);

    return (data || []).filter(m => !(m.read_by || []).includes(myId)).length;
}

async function mailboxUpdateNavDot() {
    // Поддерживаем оба id — на случай, если nav.html ещё не обновлён в кэше
    const badge = document.getElementById('navMailBadge')
                || document.getElementById('navMailDot');
    if (!badge) return;

    try {
        const unread = await mailboxGetUnreadCount();
        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : String(unread);
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.warn('[mailbox] nav badge check failed:', e);
        badge.style.display = 'none';
    }
}

// ----------------------------------------------------------------
// Realtime-подписка на новые входящие (одна на вкладку)
// ----------------------------------------------------------------
let __mailboxNavChannel = null;

function mailboxSubscribeNav() {
    if (__mailboxNavChannel) return __mailboxNavChannel;

    __mailboxNavChannel = mailboxClient
        .channel('mailbox-nav-dot')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `to_site=eq.${MAILBOX_MY_SITE}`
        }, () => {
            mailboxUpdateNavDot();
        })
        .subscribe();

    return __mailboxNavChannel;
}

// ----------------------------------------------------------------
// Пометки прочитано / непрочитано (одиночные и пакетные)
// ----------------------------------------------------------------
async function mailboxMarkRead(id, userId) {
    const { data, error: e1 } = await mailboxClient
        .from('messages').select('read_by').eq('id', id).single();
    if (e1) throw new Error(e1.message);

    const current = data?.read_by || [];
    if (userId && current.includes(userId)) return;

    const updated = userId ? [...current, userId] : current;

    const { error } = await mailboxClient
        .from('messages')
        .update({
            read_by: updated,
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

async function mailboxMarkUnread(id, userId) {
    const { data, error: e1 } = await mailboxClient
        .from('messages').select('read_by').eq('id', id).single();
    if (e1) throw new Error(e1.message);

    const current = data?.read_by || [];
    const updated = userId ? current.filter(x => x !== userId) : current;

    const { error } = await mailboxClient
        .from('messages')
        .update({ read_by: updated, is_read: updated.length > 0 })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

async function mailboxBulkMarkRead(ids, userId) {
    if (!ids.length || !userId) return;

    const { data, error: e1 } = await mailboxClient
        .from('messages').select('id, read_by').in('id', ids);
    if (e1) throw new Error(e1.message);

    const now = new Date().toISOString();

    const updates = (data || []).map(m => {
        const cur = m.read_by || [];
        if (!cur.includes(userId)) cur.push(userId);
        return mailboxClient.from('messages')
            .update({ read_by: cur, is_read: true, read_at: now })
            .eq('id', m.id);
    });

    await Promise.all(updates);
}

async function mailboxBulkMarkUnread(ids, userId) {
    if (!ids.length || !userId) return;

    const { data, error: e1 } = await mailboxClient
        .from('messages').select('id, read_by').in('id', ids);
    if (e1) throw new Error(e1.message);

    const updates = (data || []).map(m => {
        const cur = (m.read_by || []).filter(x => x !== userId);
        return mailboxClient.from('messages')
            .update({ read_by: cur, is_read: cur.length > 0 })
            .eq('id', m.id);
    });

    await Promise.all(updates);
}

// ----------------------------------------------------------------
// Утилиты (используются и в mailbox.js, и потенциально в других UI)
// ----------------------------------------------------------------
function mailboxFileIcon(type, name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (type.startsWith('image/')) return '🖼';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx'].includes(ext)) return '📗';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜';
    return '📄';
}

function mailboxFormatSize(bytes) {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
}

function mailboxGetFileViewType(type, name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (type.startsWith('image/')) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (type.startsWith('text/') || ['txt','log','csv','json','xml','md','html','css','js','ts'].includes(ext)) return 'text';
    return 'unsupported';
}

function mailboxEscape(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function mailboxTranslitSafe(name) {
    const map = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z',
        'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
        'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
        'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
        'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'E','Ж':'Zh','З':'Z',
        'И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
        'С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sch',
        'Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya'
    };
    return String(name)
        .split('')
        .map(ch => map[ch] !== undefined ? map[ch] : ch)
        .join('')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ----------------------------------------------------------------
// Экспорт
// ----------------------------------------------------------------
window.mailboxClient = mailboxClient;
window.MAILBOX_MY_SITE = MAILBOX_MY_SITE;
window.MAILBOX_RECIPIENTS = MAILBOX_RECIPIENTS;
window.MAILBOX_MAX_ATTACHMENTS = MAILBOX_MAX_ATTACHMENTS;
window.MAILBOX_MAX_FILE_SIZE = MAILBOX_MAX_FILE_SIZE;
window.MAILBOX_BUCKET = MAILBOX_BUCKET;

window.mailboxGetUnreadCount = mailboxGetUnreadCount;
window.mailboxUpdateNavDot = mailboxUpdateNavDot;
window.mailboxSubscribeNav = mailboxSubscribeNav;

window.mailboxMarkRead = mailboxMarkRead;
window.mailboxMarkUnread = mailboxMarkUnread;
window.mailboxBulkMarkRead = mailboxBulkMarkRead;
window.mailboxBulkMarkUnread = mailboxBulkMarkUnread;

window.mailboxFileIcon = mailboxFileIcon;
window.mailboxFormatSize = mailboxFormatSize;
window.mailboxGetFileViewType = mailboxGetFileViewType;
window.mailboxEscape = mailboxEscape;
window.mailboxTranslitSafe = mailboxTranslitSafe;