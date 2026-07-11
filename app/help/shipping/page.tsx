import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, Package, MapPin } from "lucide-react";
import { getCommerceConfig } from "@/lib/config/commerce";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping Information | Fádé",
  description: "Learn about our shipping options and delivery times.",
};

export default function ShippingPage() {
  const { shipping } = getCommerceConfig();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[-0.01em] mb-4">
            Shipping Information
          </h1>
          <p className="text-muted-foreground mb-8">
            We offer fast and secure shipping options to get your luxury items
            to you safely and on time.
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Standard Delivery</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Duration:</strong> 3-5 business days
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Cost:</strong>{" "}
                    {formatPrice(shipping.flatShippingFee)} (free for orders
                    over {formatPrice(shipping.freeShippingThreshold)})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Standard delivery is available nationwide. Your order will
                    be carefully packaged and shipped via our trusted courier
                    partners.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-2">Express Delivery</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Duration:</strong> 1-2 business days
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Cost:</strong> ₦35,000
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For urgent orders, choose express delivery. Available in
                    major cities including Lagos, Abuja, Port Harcourt, and
                    Ibadan.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Processing Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Orders are typically processed within 1-2 business days.
                  Processing time may be longer during peak seasons or for
                  custom orders.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    Orders placed before 2:00 PM are processed the same day
                  </li>
                  <li>
                    Orders placed after 2:00 PM are processed the next business
                    day
                  </li>
                  <li>Weekend orders are processed on the next business day</li>
                  <li>
                    You'll receive an email confirmation once your order ships
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Packaging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  All items are carefully packaged in premium boxes with
                  protective padding to ensure they arrive in perfect condition.
                  Luxury items are packaged in their original manufacturer boxes
                  when available.
                </p>
                <p className="text-sm text-muted-foreground">
                  Each package includes a certificate of authenticity and care
                  instructions for your item.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We currently ship to all states in Nigeria. Express delivery
                  is available in:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div>• Lagos</div>
                  <div>• Abuja</div>
                  <div>• Port Harcourt</div>
                  <div>• Ibadan</div>
                  <div>• Kano</div>
                  <div>• Enugu</div>
                  <div>• Kaduna</div>
                  <div>• Benin City</div>
                  <div>• Calabar</div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  For other locations, standard delivery is available. Delivery
                  times may vary for remote areas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Once your order ships, you'll receive an email with a tracking
                  number. You can use this number to track your package in
                  real-time through our courier partner's website.
                </p>
                <p className="text-sm text-muted-foreground">
                  You can also track your order by logging into your account and
                  viewing your order history.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
