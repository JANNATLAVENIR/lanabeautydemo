// Supabase Cloud-Powered Client API Mock & Real-Time Sync for Static Hosting (Vercel / Netlify)
import { supabase } from './supabase';

export function initClientApiMock() {
  if (typeof window === 'undefined') return;
  const originalFetch = window.fetch;

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();

    if (url.startsWith('/api/') || url.includes('/api/')) {
      const path = url.split('?')[0];
      const method = (init?.method || 'GET').toUpperCase();
      let body: any = null;
      try {
        if (init?.body) body = JSON.parse(init.body as string);
      } catch {}

      try {
        if (path === '/api/homepage-settings') {
          if (method === 'POST') {
            await supabase.from('homepage_settings').upsert({ id: 1, settings: body });
            window.dispatchEvent(new CustomEvent('lana_settings_updated', { detail: body }));
            return new Response(JSON.stringify({ success: true, settings: body }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          const { data } = await supabase.from('homepage_settings').select('settings').limit(1).maybeSingle();
          if (data?.settings) {
            return new Response(JSON.stringify(data.settings), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }

        if (path === '/api/products') {
          if (method === 'POST') {
            const newProd = { ...body, id: body.id || 'prod_' + Date.now() };
            await supabase.from('products').upsert(newProd);
            return new Response(JSON.stringify(newProd), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          const { data } = await supabase.from('products').select('*');
          if (data && data.length > 0) {
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }

        if (path === '/api/orders') {
          if (method === 'POST') {
            const newOrder = { id: Math.floor(100000 + Math.random() * 900000), created_at: new Date().toISOString(), status: 'Pending', ...body };
            await supabase.from('orders').insert(newOrder);
            return new Response(JSON.stringify({ success: true, order: newOrder }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (data) {
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }

        if (path === '/api/categories') {
          if (method === 'POST') {
            const newCat = { ...body, id: body.id || 'cat_' + Date.now() };
            await supabase.from('categories').upsert(newCat);
            return new Response(JSON.stringify(newCat), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          const { data } = await supabase.from('categories').select('*');
          if (data && data.length > 0) {
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }

        if (path === '/api/promo-codes') {
          if (method === 'POST') {
            await supabase.from('promo_codes').upsert(body);
            return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          const { data } = await supabase.from('promo_codes').select('*');
          if (data) {
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }

        if (path === '/api/promo-codes/validate') {
          const code = body?.code;
          const { data } = await supabase.from('promo_codes').select('*').ilike('code', code).maybeSingle();
          if (data) {
            return new Response(JSON.stringify({ valid: true, discountPercent: data.discount_percent || data.discountPercent }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify({ valid: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (path === '/api/admin/login') {
          return new Response(JSON.stringify({ success: true, admin: { username: 'admin' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (path === '/api/admin/logout') {
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      } catch (dbErr) {
        // Fallback to local storage if offline
      }

      // Fallback to localStorage mock API if Supabase query fails or returns empty
      const getDb = () => {
        try {
          const raw = localStorage.getItem('lana_static_db');
          if (raw) return JSON.parse(raw);
        } catch {}
        return {
          products: [],
          settings: { storeName: 'Maison LANA', whatsappNumber: '' },
          categories: [],
          orders: [],
          customers: [],
          reviews: [],
          promoCodes: [],
          stores: []
        };
      };

      const saveDb = (db: any) => {
        try {
          localStorage.setItem('lana_static_db', JSON.stringify(db));
        } catch {}
      };

      const db = getDb();

      if (path === '/api/homepage-settings') {
        if (method === 'POST') {
          db.settings = { ...db.settings, ...body };
          saveDb(db);
          window.dispatchEvent(new CustomEvent('lana_settings_updated', { detail: db.settings }));
          return new Response(JSON.stringify({ success: true, settings: db.settings }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(db.settings), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (path === '/api/products') {
        if (method === 'POST') {
          const newProd = { id: 'prod_' + Date.now(), ...body };
          db.products.push(newProd);
          saveDb(db);
          return new Response(JSON.stringify(newProd), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(db.products), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (path === '/api/orders') {
        if (method === 'POST') {
          const newOrder = { id: Math.floor(100000 + Math.random() * 900000), createdAt: new Date().toISOString(), status: 'Pending', ...body };
          db.orders.unshift(newOrder);
          saveDb(db);
          return new Response(JSON.stringify({ success: true, order: newOrder }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify(db.orders), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (path === '/api/categories') {
        return new Response(JSON.stringify(db.categories), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (path === '/api/promo-codes') {
        return new Response(JSON.stringify(db.promoCodes), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (path === '/api/admin/login') {
        return new Response(JSON.stringify({ success: true, admin: { username: 'admin' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (path === '/api/admin/logout') {
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return originalFetch(input, init);
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: customFetch,
      writable: true,
      configurable: true
    });
  } catch (e) {}
}
