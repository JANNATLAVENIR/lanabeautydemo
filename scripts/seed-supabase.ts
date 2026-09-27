import dotenv from "dotenv";
dotenv.config();
import { Client } from "pg";
import { PRODUCTS, LOCAL_STORES, INITIAL_ORDERS } from "../src/constants";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[CRITICAL] DATABASE_URL is required for database seeding. Aborting.");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL for seeding.");

    // Seed Stores
    for (const store of LOCAL_STORES) {
      await client.query(`
        INSERT INTO public.stores (id, name, neighborhood, contact_person, phone, rating, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          neighborhood = EXCLUDED.neighborhood,
          contact_person = EXCLUDED.contact_person,
          phone = EXCLUDED.phone,
          rating = EXCLUDED.rating,
          is_active = EXCLUDED.is_active;
      `, [store.id, store.name, store.neighborhood, store.contactPerson, store.phone, store.rating, store.isActive]);
    }
    console.log(`Seeded ${LOCAL_STORES.length} stores.`);

    // Define atomic_decrement_inventory function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.atomic_decrement_inventory(p_items JSONB)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_item RECORD;
        v_prod RECORD;
        v_needed_qty INT;
        v_updated_inventory JSONB;
        v_inv JSONB;
        v_inv_record RECORD;
        v_results JSONB := '[]'::jsonb;
      BEGIN
        FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id TEXT, quantity INT) LOOP
          
          SELECT * INTO v_prod FROM public.products WHERE id = v_item.id FOR UPDATE;
          IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found in collections', v_item.id;
          END IF;

          v_needed_qty := v_item.quantity;
          v_updated_inventory := '[]'::jsonb;

          FOR v_inv IN SELECT * FROM jsonb_array_elements(v_prod.supplier_inventory) LOOP
            SELECT * INTO v_inv_record FROM jsonb_to_record(v_inv) AS y("storeId" TEXT, "stock" INT, "wholesaleCost" NUMERIC);
            
            IF v_needed_qty > 0 AND v_inv_record.stock > 0 THEN
              IF v_inv_record.stock >= v_needed_qty THEN
                v_inv_record.stock := v_inv_record.stock - v_needed_qty;
                v_needed_qty := 0;
              ELSE
                v_needed_qty := v_needed_qty - v_inv_record.stock;
                v_inv_record.stock := 0;
              END IF;
            END IF;

            v_updated_inventory := v_updated_inventory || jsonb_build_object(
              'storeId', v_inv_record."storeId",
              'stock', v_inv_record.stock,
              'wholesaleCost', v_inv_record."wholesaleCost"
            );
          END LOOP;

          IF v_needed_qty > 0 THEN
            RAISE EXCEPTION 'Insufficient inventory for "%".', v_prod.name;
          END IF;

          UPDATE public.products SET supplier_inventory = v_updated_inventory WHERE id = v_item.id;
          v_results := v_results || jsonb_build_object('id', v_item.id, 'supplier_inventory', v_updated_inventory);
        END LOOP;

        RETURN v_results;
      END;
      $$;
    `);
    console.log("Updated atomic_decrement_inventory SQL function.");

    // Seed Products with replenished stock
    for (const prod of PRODUCTS) {
      const refreshedInventory = (prod.supplierInventory || []).map(s => ({
        ...s,
        stock: Math.max(s.stock || 0, 35) // Ensure healthy stock per supplier
      }));

      await client.query(`
        INSERT INTO public.products (id, name, category, retail_price, image, description, volume, is_active, supplier_inventory)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          retail_price = EXCLUDED.retail_price,
          image = EXCLUDED.image,
          description = EXCLUDED.description,
          volume = EXCLUDED.volume,
          is_active = EXCLUDED.is_active,
          supplier_inventory = EXCLUDED.supplier_inventory;
      `, [
        prod.id,
        prod.name,
        prod.category,
        prod.retailPrice,
        prod.image,
        prod.description,
        prod.volume,
        prod.isActive,
        JSON.stringify(refreshedInventory)
      ]);
    }
    console.log(`Seeded & replenished ${PRODUCTS.length} products with healthy inventory.`);

    // Seed Initial Orders if not already present
    for (const ord of INITIAL_ORDERS) {
      await client.query(`
        INSERT INTO public.orders (id, customer_name, customer_phone, delivery_address, city, notes, items, total_price, status, assigned_store_ids)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING;
      `, [
        ord.id,
        ord.customerName,
        ord.customerPhone,
        ord.deliveryAddress,
        ord.city,
        ord.notes || "",
        JSON.stringify(ord.items || []),
        ord.totalPrice,
        ord.status,
        JSON.stringify(ord.assignedStoreIds || {})
      ]);
    }
    console.log(`Seeded ${INITIAL_ORDERS.length} initial orders.`);

    await client.end();
    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
