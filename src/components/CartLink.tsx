"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
export default function CartLink() { const { count } = useCart(); return <Link href="/carrito">Carrito{count > 0 && <span className="ml-1 rounded-full bg-navy px-2 py-0.5 text-xs text-white">{count}</span>}</Link>; }
