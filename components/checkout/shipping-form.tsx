"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Truck, Zap } from "lucide-react";

import { toast } from "sonner";

import { useCheckoutStore } from "@/lib/stores/checkout-store";

import { formatPrice } from "@/lib/format";

interface ShippingFormProps {
  onNext: () => void;

  deliveryMethod?: string;

  onDeliveryMethodChange?: (method: string) => void;

  standardDeliveryFee: number;

  freeShippingThreshold: number;
}

const nigerianStates = [
  "Abia",

  "Adamawa",

  "Akwa Ibom",

  "Anambra",

  "Bauchi",

  "Bayelsa",

  "Benue",

  "Borno",

  "Cross River",

  "Delta",

  "Ebonyi",

  "Edo",

  "Ekiti",

  "Enugu",

  "FCT",

  "Gombe",

  "Imo",

  "Jigawa",

  "Kaduna",

  "Kano",

  "Katsina",

  "Kebbi",

  "Kogi",

  "Kwara",

  "Lagos",

  "Nasarawa",

  "Niger",

  "Ogun",

  "Ondo",

  "Osun",

  "Oyo",

  "Plateau",

  "Rivers",

  "Sokoto",

  "Taraba",

  "Yobe",

  "Zamfara",
];

export function ShippingForm({
  onNext,
  deliveryMethod: propDeliveryMethod,
  onDeliveryMethodChange,
  standardDeliveryFee,
  freeShippingThreshold,
}: ShippingFormProps) {
  const { formData, updateFormData } = useCheckoutStore();

  const deliveryMethod = propDeliveryMethod || formData.deliveryMethod;

  const handleDeliveryMethodChange = (method: string) => {
    updateFormData({ deliveryMethod: method as "standard" | "express" });

    onDeliveryMethodChange?.(method);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    updateFormData({ [field]: value });
  };

  const handleContinue = () => {
    const { firstName, lastName, email, phone, address, city, state } =
      formData;

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Name required", {
        description: "Please enter your first and last name.",
      });

      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Valid email required", {
        description: "Please enter a valid email address.",
      });

      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      toast.error("Phone required", {
        description: "Please enter a valid phone number.",
      });

      return;
    }

    if (!address.trim()) {
      toast.error("Address required", {
        description: "Please enter your street address.",
      });

      return;
    }

    if (!city.trim()) {
      toast.error("City required", { description: "Please enter your city." });

      return;
    }

    if (!state) {
      toast.error("State required", {
        description: "Please select your state.",
      });

      return;
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>

              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>

              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>

            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>

            <Input
              id="phone"
              type="tel"
              placeholder="+234 8160591348"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shipping Address</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>

            <Input
              id="address"
              placeholder="123 Example Street"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address2">Apartment, Suite, etc. (optional)</Label>

            <Input
              id="address2"
              placeholder="Apt 4B"
              value={formData.address2}
              onChange={(e) => handleInputChange("address2", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>

              <Input
                id="city"
                placeholder="Lagos"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>

              <Select
                value={formData.state}
                onValueChange={(value) => handleInputChange("state", value)}
              >
                <SelectTrigger id="state" className="bg-transparent">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>

                <SelectContent>
                  {nigerianStates.map((state) => (
                    <SelectItem key={state} value={state.toLowerCase()}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>

              <Input
                id="postalCode"
                placeholder="100001"
                value={formData.postalCode}
                onChange={(e) =>
                  handleInputChange("postalCode", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Method */}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Method</CardTitle>
        </CardHeader>

        <CardContent>
          <RadioGroup
            value={deliveryMethod}
            onValueChange={handleDeliveryMethodChange}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="standard" id="standard" />

              <Label htmlFor="standard" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="font-medium">Standard Delivery</p>

                      <p className="text-sm text-muted-foreground">
                        3-5 business days
                      </p>
                    </div>
                  </div>

                  <span className="font-medium">
                    {formatPrice(standardDeliveryFee)} · free over{" "}
                    {formatPrice(freeShippingThreshold)}
                  </span>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="express" id="express" />

              <Label htmlFor="express" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-accent" />

                    <div>
                      <p className="font-medium">Express Delivery</p>

                      <p className="text-sm text-muted-foreground">
                        1-2 business days
                      </p>
                    </div>
                  </div>

                  <span className="font-medium">₦35,000</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Continue Button */}

      <Button onClick={handleContinue} className="w-full h-12 text-base">
        Continue to Payment
      </Button>
    </div>
  );
}
