import { ProductCard } from "@/components/products/ProductCard";
import { fetchShopifyProducts, type ShopifyProduct } from "@/lib/shopify";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Products() {
  const { data: products, isLoading, error, refetch } = useQuery<ShopifyProduct[]>({
    queryKey: ["shopify-products"],
    queryFn: () => fetchShopifyProducts(50),
  });

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-2">Synced from Shopify</p>
          </div>
          <div className="flex items-center gap-3 md:ml-auto">
            <Badge variant="outline" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Connected
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://admin.shopify.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Shopify Admin
              </a>
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="text-center py-12 space-y-4">
            <p className="text-destructive">Failed to load products. Please try again.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {products && products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground mt-1">
              Add products in your Shopify admin to see them here.
            </p>
          </div>
        )}

        {products && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        )}
      </div>
  );
}
