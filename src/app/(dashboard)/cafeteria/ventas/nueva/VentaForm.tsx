"use client";

import { useMemo, useState, useTransition } from "react";
import { registrarVentaAction } from "./actions";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria_nombre?: string | null;
}

interface ItemCarrito {
  producto_id: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export function VentaForm({ productos }: { productos: Producto[] }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cliente, setCliente] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [busqueda, productos]);

  const total = items.reduce((a, i) => a + i.cantidad * i.precio_unitario, 0);

  function agregar(p: Producto) {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto_id === p.id);
      if (existente) {
        return prev.map((i) =>
          i.producto_id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      return [...prev, { producto_id: p.id, nombre_producto: p.nombre, cantidad: 1, precio_unitario: Number(p.precio) }];
    });
  }

  function cambiarCantidad(productoId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.producto_id === productoId ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0),
    );
  }

  function quitar(productoId: string) {
    setItems((prev) => prev.filter((i) => i.producto_id !== productoId));
  }

  function registrar() {
    if (items.length === 0) {
      setError("Agrega al menos un producto a la venta.");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("fecha", fecha);
    fd.set("cliente_nombre", cliente);
    fd.set("items", JSON.stringify(items));
    startTransition(async () => {
      try {
        await registrarVentaAction(fd);
      } catch (e) {
        // redirect() lanza internamente; solo mostramos errores reales
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
          setError(e.message);
        } else {
          throw e;
        }
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Catálogo de productos */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Productos</h2>
        <input
          type="search"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        {filtrados.length === 0 ? (
          <p className="text-sm text-slate-500">No hay productos disponibles.</p>
        ) : (
          <div className="grid max-h-[28rem] gap-2 overflow-y-auto sm:grid-cols-2">
            {filtrados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => agregar(p)}
                className="rounded-lg border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50"
              >
                <p className="text-sm font-medium text-slate-900">{p.nombre}</p>
                <p className="text-xs text-slate-500">{fmt(Number(p.precio))}</p>
                <p className="text-[11px] text-slate-400">Stock: {p.stock}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Carrito */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Venta actual</h2>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="fecha" className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
            <input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="cliente" className="mb-1 block text-xs font-medium text-slate-600">Cliente (opcional)</label>
            <input
              id="cliente"
              type="text"
              placeholder="Mostrador"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Haz clic en los productos para agregarlos.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((i) => (
              <li key={i.producto_id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{i.nombre_producto}</p>
                  <p className="text-xs text-slate-500">{fmt(i.precio_unitario)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(i.producto_id, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-sm hover:bg-slate-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{i.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(i.producto_id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-sm hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
                <p className="w-24 text-right text-sm font-semibold text-slate-900">
                  {fmt(i.cantidad * i.precio_unitario)}
                </p>
                <button
                  type="button"
                  onClick={() => quitar(i.producto_id)}
                  aria-label={`Quitar ${i.nombre_producto}`}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-slate-700">Total</p>
          <p className="text-2xl font-bold text-brand-700">{fmt(total)}</p>
        </div>

        {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={registrar}
          disabled={pending || items.length === 0}
          className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Registrando..." : `Registrar venta (${fmt(total)})`}
        </button>
      </section>
    </div>
  );
}
