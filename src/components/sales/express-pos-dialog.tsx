"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { 
  Search, Plus, Minus, Trash2, CreditCard, Banknote, 
  Smartphone, Wallet, Receipt, Sparkles, ShoppingBag, X, Keyboard
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface ExpressPOSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CartItem {
  id: string; // Item UUID
  name: string;
  sku: string;
  basePrice: number;
  quantity: number;
  warehouseId: string;
}

export function ExpressPOSDialog({ open, onOpenChange, onSuccess }: ExpressPOSDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "CREDIT">("CASH");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch Items & Warehouses
  useEffect(() => {
    if (open) {
      fetchItems();
      fetchWarehouses();
      // Reset Cart and Form
      setCart([]);
      setPaymentMethod("CASH");
      setAmountReceived("");
      setSearchQuery("");
      
      // Auto focus search box
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  // Handle keyboard shortcut F8 for instant print & pay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === "F8") {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, cart, paymentMethod, amountReceived, warehouses, selectedWarehouseId]);

  const fetchItems = async () => {
    const res = await apiFetch<any[]>("/api/inventory/items");
    if (res.success) setInventoryItems(res.data || []);
  };

  const fetchWarehouses = async () => {
    const res = await apiFetch<any[]>("/api/inventory/warehouses");
    if (res.success) {
      setWarehouses(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedWarehouseId(res.data[0].id);
      }
    }
  };

  // Add Item to Cart
  const addToCart = (item: any) => {
    if (!selectedWarehouseId) {
      toast.error("Please select a warehouse first");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.warehouseId === selectedWarehouseId);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.warehouseId === selectedWarehouseId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          sku: item.sku,
          basePrice: Number(item.basePrice),
          quantity: 1,
          warehouseId: selectedWarehouseId,
        },
      ];
    });

    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  // Adjust quantities
  const updateQuantity = (itemId: string, warehouseId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId && item.warehouseId === warehouseId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove Item
  const removeFromCart = (itemId: string, warehouseId: string) => {
    setCart((prev) => prev.filter((item) => !(item.id === itemId && item.warehouseId === warehouseId)));
  };

  // Filtering items based on SKU or Name
  const filteredProducts = searchQuery
    ? inventoryItems.filter(
        (i) =>
          i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Cart math
  const cartSubtotal = cart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  const cartTax = cartSubtotal * 0.05; // 5% flat GST/VAT simulation
  const cartGrandTotal = cartSubtotal + cartTax;

  const returnChange = amountReceived 
    ? Math.max(0, Number(amountReceived) - cartGrandTotal) 
    : 0;

  // Checkout submission
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedInvoiceNo = `RINV-${Date.now().toString().slice(-6)}`;
      const currentYear = new Date().getFullYear();
      
      const payload = {
        customerId: "walkin", // Special keyword to resolve to 'Walk-in Customer'
        invoiceNumber: generatedInvoiceNo,
        financialYear: `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
        notes: `Retail walk-in transaction paid via ${paymentMethod}.`,
        paymentMethod,
        amountReceived: amountReceived ? Number(amountReceived) : cartGrandTotal,
        amountReturned: returnChange,
        items: cart.map((i) => ({
          itemId: i.id,
          warehouseId: i.warehouseId,
          quantity: i.quantity,
          unitPrice: i.basePrice,
        })),
      };

      const res = await apiFetch("/api/sales/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success("B2C POS Invoice successfully finalized & stock updated!");
        triggerReceiptPrint(payload, cartGrandTotal, cartSubtotal, cartTax);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.message || "Checkout failed");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during checkout");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger professional receipt printing view
  const triggerReceiptPrint = (payload: any, grandTotal: number, subtotal: number, tax: number) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      toast.warning("Pop-up blocker active. Invoice finalized but receipt print skipped.");
      return;
    }

    const itemRows = cart.map(
      (item) => `
      <tr>
        <td style="padding: 4px 0; font-family: monospace;">${item.name} (${item.quantity} x $${item.basePrice.toFixed(2)})</td>
        <td style="text-align: right; font-family: monospace;">$${(item.quantity * item.basePrice).toFixed(2)}</td>
      </tr>
    `
    ).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Retail Receipt - ${payload.invoiceNumber}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; }
            }
            body { padding: 20px; max-width: 80mm; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.4; color: #000; }
            .text-center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 style="margin: 0; text-transform: uppercase;">ZERON ERP RETAIL</h2>
            <p style="margin: 2px 0;">Premium Walk-in Store</p>
            <p style="margin: 2px 0;">Store Terminal: B2C-01</p>
          </div>
          <div class="divider"></div>
          <p style="margin: 3px 0;"><strong>Receipt No:</strong> ${payload.invoiceNumber}</p>
          <p style="margin: 3px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p style="margin: 3px 0;"><strong>Customer:</strong> Walk-in Retail Customer</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; padding-bottom: 4px;">Item</th>
                <th style="text-align: right; padding-bottom: 4px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between; margin: 3px 0;">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 3px 0;">
            <span>Tax (5%):</span>
            <span>$${tax.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 14px; font-weight: bold;">
            <span>GRAND TOTAL:</span>
            <span>$${grandTotal.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between; margin: 3px 0;">
            <span>Payment Mode:</span>
            <span>${payload.paymentMethod}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 3px 0;">
            <span>Paid Amount:</span>
            <span>$${payload.amountReceived.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 3px 0;">
            <span>Change Returned:</span>
            <span>$${payload.amountReturned.toFixed(2)}</span>
          </div>
          <div class="divider" style="margin-top: 15px;"></div>
          <div class="text-center" style="margin-top: 15px; font-size: 10px;">
            <p class="bold">THANK YOU FOR YOUR VISIT!</p>
            <p>Powered by ZeronERP Express B2C</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] sm:max-w-[1100px] h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modern Glass Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b bg-muted/40 shrink-0 min-w-0">
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold flex flex-wrap items-center gap-2">
                Express Retail POS Checkout
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono font-semibold whitespace-nowrap">
                  B2C Walk-in Mode
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Rapid barcode/manual scanning checkout terminal with F8 keyboard shortcut pay-out.
              </DialogDescription>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
              <Keyboard className="w-3.5 h-3.5 text-primary" />
              <span>Press <kbd className="font-sans font-bold bg-background px-1.5 py-0.5 rounded border shadow-sm">F8</kbd> to Finalize Pay & Print</span>
            </div>
          </div>
        </div>

        {/* Two-Column Grid Area */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row min-w-0">
          
          {/* Left Column: Product Search & Quick Add */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 md:border-r overflow-y-auto space-y-4 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Source Warehouse</Label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/25 outline-none font-medium"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Item SKU / Name Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Scan Barcode or Search SKU/Name..."
                    className="pl-10 h-10 rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Instant Search Results */}
            {searchQuery && (
              <div className="border rounded-xl bg-card shadow-lg divide-y max-h-48 overflow-y-auto z-10">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No products found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredProducts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="flex items-center justify-between p-3 hover:bg-muted/70 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">{formatCurrency(item.basePrice)}</span>
                        <Button size="sm" variant="secondary" className="h-7 px-2">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Cart Table list */}
            <div className="flex-1 flex flex-col min-h-[250px] border rounded-xl overflow-hidden bg-card/40 min-w-0">
              <div className="hidden sm:grid grid-cols-12 gap-2 p-3 bg-muted/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-5">Product Description</div>
                <div className="col-span-3 text-center">Quantity (packs)</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <Receipt className="w-10 h-10 mb-2 stroke-[1.25] text-primary/45" />
                    <p className="text-sm font-medium">Checkout register is empty</p>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">Scan or search items above to fill cart.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={`${item.id}-${item.warehouseId}`} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-2 p-3 items-stretch sm:items-center hover:bg-muted/30 transition-colors text-sm">
                      <div className="sm:col-span-5 min-w-0">
                        <div className="font-medium line-clamp-2 sm:line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                          <span>{item.sku}</span> • <span>{warehouses.find(w => w.id === item.warehouseId)?.code}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-center gap-2">
                        <span className="text-xs font-semibold uppercase text-muted-foreground sm:hidden">Packs</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-7 h-7 shrink-0 rounded-md"
                            onClick={() => updateQuantity(item.id, item.warehouseId, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-bold text-center w-8">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-7 h-7 shrink-0 rounded-md"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:contents">
                        <span className="text-xs font-semibold uppercase text-muted-foreground sm:hidden">Price</span>
                        <div className="sm:col-span-2 text-right font-medium text-muted-foreground">
                          {formatCurrency(item.basePrice)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:contents">
                        <span className="text-xs font-semibold uppercase text-muted-foreground sm:hidden">Total</span>
                        <div className="sm:col-span-2 text-right font-semibold text-primary flex items-center justify-end gap-2">
                          <span>{formatCurrency(item.basePrice * item.quantity)}</span>
                          <button 
                            onClick={() => removeFromCart(item.id, item.warehouseId)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary & Payment Panel */}
          <div className="w-full md:w-[380px] bg-muted/20 p-4 sm:p-6 flex flex-col shrink-0 justify-between min-w-0 border-t md:border-t-0">
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">Checkout Pay-out</h3>

              {/* Display Math Totals */}
              <div className="space-y-2.5 bg-card border p-4 rounded-xl shadow-sm">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax (Flat 5% B2C)</span>
                  <span>{formatCurrency(cartTax)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between text-lg font-black text-primary">
                  <span>GRAND TOTAL</span>
                  <span>{formatCurrency(cartGrandTotal)}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-medium text-sm transition-all ${
                      paymentMethod === "CASH"
                        ? "bg-primary border-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Banknote className="w-4 h-4" /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-medium text-sm transition-all ${
                      paymentMethod === "UPI"
                        ? "bg-primary border-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> UPI (QR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-medium text-sm transition-all ${
                      paymentMethod === "CARD"
                        ? "bg-primary border-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CREDIT")}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-medium text-sm transition-all ${
                      paymentMethod === "CREDIT"
                        ? "bg-primary border-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Wallet className="w-4 h-4" /> Store Credit
                  </button>
                </div>
              </div>

              {/* Cash Paid math helper */}
              {paymentMethod === "CASH" && (
                <div className="space-y-3 p-4 border rounded-xl bg-card shadow-sm animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <Label htmlFor="amountReceived" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount Paid by Customer</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">$</span>
                      <Input
                        id="amountReceived"
                        type="number"
                        placeholder="e.g. 50"
                        className="pl-7 font-semibold"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                      />
                    </div>
                  </div>

                  {Number(amountReceived) > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg border border-emerald-500/25">
                      <span>Change to Return</span>
                      <span className="text-sm font-black">{formatCurrency(returnChange)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Print & Finalize Action Buttons */}
            <div className="pt-4 border-t space-y-2">
              <Button
                type="button"
                className="w-full py-6 font-bold text-base rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-2 flex items-center justify-center scale-[1.01] transition-transform active:scale-[0.99]"
                disabled={isSubmitting || cart.length === 0}
                onClick={handleCheckout}
              >
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                {isSubmitting ? "Processing Checkout..." : "Finalize & Print (F8)"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Cancel Checkout
              </Button>
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
