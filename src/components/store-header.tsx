import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useFilter } from "@/lib/filter-context";
import { useRef, useState, useMemo, useEffect } from "react";
import {
  ShoppingBag,
  Info,
  MessageCircle,
  MapPin,
  Instagram,
  Heart,
  Menu,
  X,
  Search,
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StoreHeader({ store }: { store: any }) {
  const { count: cartCount } = useCart(store.slug);
  const { count: favCount } = useFavorites(store.slug);
  const navigate = useNavigate();
  const location = useLocation();
  const { activeDept, activeCat, setActiveDept, setActiveCat } = useFilter();

  // ─── Category Drawer ─────────────────────────────────────────────
  const [isCategoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [drawerLevel, setDrawerLevel] = useState<"departments" | "subcategories">("departments");
  const [drawerDept, setDrawerDept] = useState<{ id: string; name: string } | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Reset drawer level when it closes
  useEffect(() => {
    if (!isCategoryMenuOpen) {
      setDrawerLevel("departments");
      setDrawerDept(null);
    }
  }, [isCategoryMenuOpen]);

  // ─── Search Overlay ───────────────────────────────────────────────
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isSearchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSearchOpen(false);
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    } else {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [isSearchOpen]);

  // ─── Data ─────────────────────────────────────────────────────────
  const { data: products = [] } = useQuery({
    queryKey: ["public-products", store.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, name, price, compare_at_price, featured, category_id, product_images(url, position)",
        )
        .eq("store_id", store.id)
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: cats = [] } = useQuery({
    queryKey: ["public-cats", store.id],
    queryFn: async () =>
      (
        await supabase
          .from("categories")
          .select("id,name,parent_id")
          .eq("store_id", store.id)
          .order("position")
      ).data ?? [],
  });

  const departments = (cats as any[]).filter((c) => !c.parent_id);
  const drawerSubcats = useMemo(
    () => (cats as any[]).filter((c) => c.parent_id === drawerDept?.id),
    [cats, drawerDept],
  );

  // ─── Search results ───────────────────────────────────────────────
  const isSearching = searchQuery !== debouncedQuery;
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return (products as any[]).filter((p) => p.name.toLowerCase().includes(q)).slice(0, 10);
  }, [products, debouncedQuery]);

  // ─── Helpers ──────────────────────────────────────────────────────
  function openWhatsApp() {
    if (!store.whatsapp) return;
    let clean = store.whatsapp.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = clean.substring(1);
    if (clean.length === 10 || clean.length === 11) clean = "55" + clean;
    window.open(`https://api.whatsapp.com/send?phone=${clean}`, "_blank");
  }

  function openInstagram() {
    if (!store.instagram) return;
    let url = store.instagram.trim();
    if (url.startsWith("@")) {
      url = `https://instagram.com/${url.substring(1)}`;
    } else if (!url.startsWith("http")) {
      url = `https://instagram.com/${url}`;
    }
    window.open(url, "_blank");
  }

  function openMaps() {
    const query = [store.address, store.city, store.state, store.zip_code]
      .filter(Boolean)
      .join(", ");
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      "_blank",
    );
  }

  function onSearchButtonClick() {
    const targetPath = `/loja/${store.slug}`;
    if (location.pathname !== targetPath) {
      navigate({ to: targetPath });
    }
    setSearchOpen(true);
  }

  function onResultClick(productId: string) {
    setSearchOpen(false);
    navigate({ to: `/loja/${store.slug}/produto/${productId}` });
  }

  function handleSearchClear() {
    if (searchQuery) {
      setSearchQuery("");
    } else {
      setSearchOpen(false);
    }
  }

  function selectSubcat(deptId: string, catId: string) {
    setActiveDept(deptId);
    setActiveCat(catId);
    setCategoryMenuOpen(false);
    const targetPath = `/loja/${store.slug}`;
    if (location.pathname !== targetPath) {
      navigate({ to: targetPath });
    }
  }

  function selectAll() {
    setActiveDept(null);
    setActiveCat(null);
    setCategoryMenuOpen(false);
    const targetPath = `/loja/${store.slug}`;
    if (location.pathname !== targetPath) {
      navigate({ to: targetPath });
    }
  }

  function selectDept(deptId: string) {
    setActiveDept(deptId);
    setActiveCat(null);
    setCategoryMenuOpen(false);
    const targetPath = `/loja/${store.slug}`;
    if (location.pathname !== targetPath) {
      navigate({ to: targetPath });
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
          {/* ── Mobile layout (< lg): hamburger + search | logo center | favorites + cart ── */}
          <div className="flex lg:hidden h-16 items-center relative w-full">
            {/* Left: hamburger + search */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                ref={hamburgerRef}
                variant="ghost"
                size="icon"
                aria-expanded={isCategoryMenuOpen}
                aria-haspopup="dialog"
                className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-10 w-10"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setCategoryMenuOpen((prev) => !prev)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSearchButtonClick}
                className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-10 w-10"
                title="Buscar"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>

            {/* Center: logo absolutely centered */}
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
              <Link to="/" className="flex items-center group pointer-events-auto">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="h-10 w-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-white font-black text-lg group-hover:scale-105 transition-transform">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            </div>

            {/* Right: favorites + cart */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <Link to="/favoritos" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-10 w-10 relative cursor-pointer"
                  title="Favoritos"
                  asChild
                >
                  <div>
                    <Heart className="h-5 w-5" />
                    {favCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white px-1 animate-in zoom-in-75">
                        {favCount}
                      </span>
                    )}
                  </div>
                </Button>
              </Link>
              <Link to="/carrinho" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-10 w-10 cursor-pointer"
                  title="Carrinho"
                  asChild
                >
                  <div>
                    <ShoppingBag className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white ring-2 ring-white px-1 animate-in zoom-in-75">
                        {cartCount}
                      </span>
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Desktop layout (≥ lg): logo left | icons right ── */}
          <div className="hidden lg:flex h-20 items-center justify-between gap-2 w-full">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center group min-w-0">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-12 w-12 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-900 text-white font-black text-lg group-hover:scale-105 transition-transform">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>

            {/* Right: Instagram + Info + Favorites + Cart */}
            <div className="flex items-center gap-2 shrink-0">
              {store.instagram && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openInstagram}
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-11 w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-11 w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                    title="Informações"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  aria-describedby={undefined}
                  className="sm:max-w-md rounded-[2rem] border-none shadow-2xl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                      Informações da Loja
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[1.5rem]">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className="h-16 w-16 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-slate-900 text-white font-black text-2xl">
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">
                          {store.name}
                        </h3>
                        {store.description && (
                          <p className="text-sm text-slate-500 mt-1 font-medium">
                            {store.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {(store.address || store.city || store.state) && (
                      <div className="space-y-3 bg-slate-50/50 p-6 rounded-[1.5rem]">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                          Localização
                        </h4>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="text-sm text-slate-600 font-medium">
                            {store.address && (
                              <p className="text-slate-900 font-bold">{store.address}</p>
                            )}
                            {(store.city || store.state) && (
                              <p>
                                {[store.city, store.state].filter(Boolean).join(", ")}
                                {store.zip_code && ` - ${store.zip_code}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {(store.whatsapp || store.instagram) && (
                      <div className="flex flex-col gap-3">
                        {store.whatsapp && (
                          <Button
                            onClick={openWhatsApp}
                            className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-200"
                          >
                            <MessageCircle className="mr-2 h-5 w-5" />
                            Conversar no WhatsApp
                          </Button>
                        )}
                        {store.instagram && (
                          <Button
                            onClick={openInstagram}
                            variant="outline"
                            className="w-full h-14 rounded-full font-bold border-slate-200 hover:bg-slate-50"
                          >
                            <Instagram className="mr-2 h-5 w-5" />
                            Ver no Instagram
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Link to="/favoritos" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-11 w-11 relative cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  title="Favoritos"
                  asChild
                >
                  <div>
                    <Heart className="h-5 w-5" />
                    {favCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white px-1 animate-in zoom-in-75">
                        {favCount}
                      </span>
                    )}
                  </div>
                </Button>
              </Link>

              <Link to="/carrinho" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 active:scale-90 hover:scale-110 h-11 w-11 cursor-pointer active:bg-slate-200/80 hover:shadow-sm"
                  title="Carrinho"
                  asChild
                >
                  <div>
                    <ShoppingBag className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white ring-2 ring-white px-1 animate-in zoom-in-75">
                        {cartCount}
                      </span>
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer keeps content from being hidden behind the fixed header */}
      <div className="h-16 lg:h-20" aria-hidden="true" />

      {/* ─── Category Drawer ─────────────────────────────────────────── */}
      <Sheet open={isCategoryMenuOpen} onOpenChange={setCategoryMenuOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-[320px] p-0 gap-0 border-r shadow-2xl z-[999] flex flex-col [&>button]:hidden"
        >
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background shrink-0">
            {drawerLevel === "departments" ? (
              <SheetTitle className="text-base font-black uppercase tracking-tight">
                Categorias
              </SheetTitle>
            ) : (
              <button
                onClick={() => setDrawerLevel("departments")}
                className="flex items-center gap-2 text-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
                <SheetTitle className="text-base font-black uppercase tracking-tight">
                  {drawerDept?.name}
                </SheetTitle>
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCategoryMenuOpen(false)}
              className="h-9 w-9 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sliding panels */}
          <div className="relative flex-1 overflow-hidden">
            {/* Level 1 – departments */}
            <div
              className={cn(
                "absolute inset-0 transition-transform duration-300 overflow-y-auto",
                drawerLevel === "departments" ? "translate-x-0" : "-translate-x-full",
              )}
            >
              {/* FILTRAR POR */}
              <div className="px-4 pt-5 pb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Filtrar por
                </p>

                {/* Todos */}
                <button
                  onClick={selectAll}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-full text-sm font-semibold transition-colors",
                    !activeDept && !activeCat
                      ? "bg-slate-900 text-white"
                      : "text-slate-800 hover:bg-slate-100",
                  )}
                >
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                  Todos
                </button>

                {/* Departments */}
                {departments.map((dept: any) => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      setDrawerDept(dept);
                      setDrawerLevel("subcategories");
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-full text-sm font-semibold transition-colors mt-1",
                      activeDept === dept.id
                        ? "bg-slate-900 text-white"
                        : "text-slate-800 hover:bg-slate-100",
                    )}
                  >
                    <LayoutGrid className="h-4 w-4 shrink-0" />
                    {dept.name}
                    <ChevronRight className="h-4 w-4 ml-auto shrink-0 opacity-50" />
                  </button>
                ))}
              </div>

              {/* INFORMAÇÕES DA LOJA */}
              <div className="border-t border-slate-100 px-4 pt-5 pb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Informações da Loja
                </p>

                {/* Location card */}
                {(store.address || store.city || store.state) && (
                  <button
                    onClick={openMaps}
                    className="flex items-start gap-3 w-full bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl px-4 py-3 mb-1 text-left"
                  >
                    <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {[store.address, store.city, store.state].filter(Boolean).join(", ")}
                      {store.zip_code && `, ${store.zip_code}`}
                    </p>
                  </button>
                )}

                {/* WhatsApp */}
                {store.whatsapp && (
                  <button
                    onClick={() => {
                      setCategoryMenuOpen(false);
                      openWhatsApp();
                    }}
                    className="flex items-center gap-3 w-full px-2 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    WhatsApp
                  </button>
                )}

                {/* Instagram */}
                {store.instagram && (
                  <button
                    onClick={() => {
                      setCategoryMenuOpen(false);
                      openInstagram();
                    }}
                    className="flex items-center gap-3 w-full px-2 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Instagram className="h-5 w-5 text-pink-500 shrink-0" />
                    Instagram
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-6 text-center">
                <p className="text-[10px] text-slate-400">Powered by Amanda Miranda</p>
              </div>
            </div>

            {/* Level 2 – subcategories */}
            <div
              className={cn(
                "absolute inset-0 transition-transform duration-300 overflow-y-auto",
                drawerLevel === "subcategories" ? "translate-x-0" : "translate-x-full",
              )}
            >
              {/* "Ver todos" of parent dept */}
              {drawerDept && (
                <button
                  onClick={() => selectDept(drawerDept.id)}
                  className="flex items-center w-full px-5 py-4 text-sm font-bold text-slate-900 border-b hover:bg-slate-50 transition-colors bg-slate-50/60"
                >
                  Ver todos em {drawerDept.name}
                </button>
              )}
              {drawerSubcats.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => selectSubcat(drawerDept!.id, cat.id)}
                  className="flex items-center w-full px-5 py-4 text-sm font-medium text-slate-700 border-b hover:bg-slate-50 transition-colors"
                >
                  {cat.name}
                </button>
              ))}
              {drawerSubcats.length === 0 && drawerDept && (
                <p className="px-5 py-8 text-sm text-slate-400 text-center">Nenhuma subcategoria</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Search Overlay ──────────────────────────────────────────── */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          {/* Panel — click inside doesn't close */}
          <div
            className="bg-white w-full max-w-2xl mx-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 h-11">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="text-center mt-2 pb-1">
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors py-1 px-4"
                >
                  Cancelar
                </button>
              </div>
            </div>

            {/* Results */}
            {debouncedQuery.trim() && (
              <div className="border-t max-h-[65vh] overflow-y-auto">
                <p className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isSearching
                    ? "Pesquisando..."
                    : searchResults.length === 0
                      ? "Nenhum resultado encontrado"
                      : "Resultados"}
                </p>
                {!isSearching && searchResults.length > 0 && (
                  <ul>
                    {searchResults.map((p: any) => {
                      const img = (p.product_images as any[])?.sort(
                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                      )[0]?.url;
                      return (
                        <li key={p.id}>
                          <button
                            onClick={() => onResultClick(p.id)}
                            className="flex items-center gap-3 w-full px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left"
                          >
                            {img ? (
                              <img
                                src={img}
                                alt={p.name}
                                className="h-12 w-12 rounded-lg object-cover shrink-0 bg-slate-100"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-slate-300" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {p.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {(p.price as number).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
