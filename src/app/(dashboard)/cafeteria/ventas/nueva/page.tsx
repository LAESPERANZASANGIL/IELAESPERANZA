import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { listProductos } from "@/modules/cafeteria";
import { VentaForm } from "./VentaForm";

export default async function NuevaVentaPage() {
  const productos = await listProductos(true);

  return (
    <>
      <Header title="Nueva venta — Cafetería" />
      <main className="space-y-4 p-6">
        <Link href="/cafeteria/ventas" className="text-sm font-medium text-brand-700 hover:underline">
          ← Volver a ventas
        </Link>
        <VentaForm
          productos={productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            precio: Number(p.precio),
            stock: p.stock,
          }))}
        />
      </main>
    </>
  );
}
