import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLowStockProducts } from "@/lib/services/product-service";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { AlertTriangle, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await requireAdmin();

  const lowStockProducts = await getLowStockProducts(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Inventory Management
        </h1>
        <p className="text-muted-foreground">
          Monitor stock levels and manage inventory.
        </p>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-warning/50 bg-warning/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle className="text-lg">Low Stock Alert</CardTitle>
              <Badge variant="destructive">{lowStockProducts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {lowStockProducts.length} product
                {lowStockProducts.length !== 1 ? "s" : ""} with stock ≤ 10 units
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.stock === 0 ? "destructive" : "secondary"
                            }
                          >
                            {product.stock} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              Update Stock
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lowStockProducts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                All products have sufficient stock
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
