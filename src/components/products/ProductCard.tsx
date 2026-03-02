import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ShopifyProduct } from "@/lib/shopify";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: ShopifyProduct;
}

export const ProductCard = React.memo(function ProductCard({ product }: ProductCardProps) {
  const { node } = product;
  const imageUrl = node.images.edges[0]?.node.url;
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const currency = node.priceRange.minVariantPrice.currencyCode;
  const variantCount = node.variants.edges.length;
  const allAvailable = node.variants.edges.every(v => v.node.availableForSale);
  const someAvailable = node.variants.edges.some(v => v.node.availableForSale);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={node.images.edges[0]?.node.altText || node.title}
            className="w-full h-full object-cover"
            loading="lazy"
            width={256}
            height={256}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge 
          className="absolute top-2 right-2"
          variant={allAvailable ? "default" : someAvailable ? "secondary" : "destructive"}
        >
          {allAvailable ? "In Stock" : someAvailable ? "Limited" : "Out of Stock"}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate" title={node.title}>
          {node.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
          {node.description || "No description"}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold">
            {currency} {price.toFixed(2)}
          </span>
          {variantCount > 1 && (
            <span className="text-sm text-muted-foreground">
              {variantCount} variants
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
