// ================================================================
// КЛИЕНТ SUPABASE — ЕИС ВАИ
// Подключение к проекту Supabase
// ================================================================

const SUPABASE_URL = 'https://seutijfydfhclviahqbt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldXRpamZ5ZGZoY2x2aWFocWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNjE1MzIsImV4cCI6MjEwNTkzNzUzMn0.IY4qELNCmsdUi-FxSF06wjNV-5UTISzdPsrsw9JGkTc';

// Глобальный клиент
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

// ================================================================
// ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ И ПРОФИЛЯ
// ================================================================

async function getCurrentUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) return null;
    return user;
}

async function getCurrentProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Ошибка загрузки профиля:', error);
        return null;
    }
    return data;
}

// ================================================================
// ЭКСПОРТ
// ================================================================

window.SUPABASE_URL = SUPABASE_URL;
window.supabaseClient = supabaseClient;
window.getCurrentUser = getCurrentUser;
window.getCurrentProfile = getCurrentProfile;

// ================================================================
// RETRY-ОБЁРТКА — устойчивость к сетевым сбоям Supabase
// ================================================================
// Только для READ-операций (select). НЕ использовать для insert/update/delete —
// повторная запись опасна (двойное срабатывание).
//
// Использование:
//   const { data, error } = await sbRetry(() =>
//       supabaseClient.from('x').select('*')
//   );

async function sbRetry(fn, options = {}) {
    const retries = options.retries ?? 3;
    const baseDelay = options.baseDelay ?? 400;
    let lastResult = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        let result;
        try {
            result = await fn();
        } catch (e) {
            result = { data: null, error: e };
        }

        // Успех или нет ошибки → возвращаем
        if (!result || !result.error) return result;

        // Терминальная ошибка (RLS, неверный запрос, 401) → не ретраим
        const msg = String(result.error.message || '') + ' ' + String(result.error.details || '');

        // Сначала — «точно не ретраить»: ошибки валидации, RLS, авторизации
        const terminal =
            /jwt|unauthorized|forbidden|permission|rls|row-level|not found|pgrst1|schema|column|syntax|violates|unique constraint/i.test(msg);

        // «Точно ретраить»: сеть, таймаут, HTTP-2/2, stream, DNS
        const transient =
            !terminal && (
                /network|timeout|fetch|failed to fetch|econnrefused|econnreset|econnaborted|etimedout|enotfound|eai_again|socket hang up|http2|http\/2|protocol_error|stream|chunk|econnrefused|ECONN|UND_ERR|socket/i.test(msg)
                || ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN', 'UND_ERR_SOCKET'].includes(result.error.code)
                || /^5\d\d$/.test(String(result.error.code || ''))
                || result.error.status === 503
                || result.error.status === 502
                || result.error.status === 504
            );

        if (!transient) return result;

        lastResult = result;

        if (attempt < retries) {
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200;
            console.warn(`[sbRetry] попытка ${attempt + 1} провалена (${msg}), повтор через ${Math.round(delay)} мс`);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    return lastResult;
}

window.sbRetry = sbRetry;