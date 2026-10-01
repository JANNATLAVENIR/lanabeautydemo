import { supabase } from './supabase';

type SyncCallbacks = {
  refresh: () => void | Promise<void>;
};

/**
 * Keeps every open storefront synchronized with Admin changes.
 * Realtime is primary; polling/focus refresh is the safety net.
 */
export function startCatalogLiveSync({ refresh }: SyncCallbacks) {
  let refreshTimer: ReturnType<typeof setInterval> | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const scheduleRefresh = () => {
    if (disposed) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void refresh();
    }, 250);
  };

  const channel = supabase
    .channel('lana-catalog-live-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, scheduleRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, scheduleRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_settings' }, scheduleRefresh)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.info('[LANA] Live catalog sync connected.');
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('[LANA] Live sync unavailable; polling fallback remains active.');
    });

  // Polling guarantees synchronization even when Realtime is disabled/misconfigured.
  refreshTimer = setInterval(() => {
    void refresh();
  }, 8000);

  const onFocus = () => scheduleRefresh();
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onFocus);

  return () => {
    disposed = true;
    if (refreshTimer) clearInterval(refreshTimer);
    if (debounceTimer) clearTimeout(debounceTimer);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onFocus);
    void supabase.removeChannel(channel);
  };
}
