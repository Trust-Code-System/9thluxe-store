"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CategoryFiltersProps {
  brands: string[]
  mobile?: boolean
  sortOnly?: boolean
}

export function CategoryFilters({ brands, mobile = false, sortOnly = false }: CategoryFiltersProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<string>("")

  if (sortOnly) {
    return (
      <Select defaultValue="newest">
        <SelectTrigger className="w-36 bg-transparent">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="price-low">Price: Low to High</SelectItem>
          <SelectItem value="price-high">Price: High to Low</SelectItem>
          <SelectItem value="rating">Highest Rated</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (mobile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Brand</h3>
            <div className="space-y-2">
              {brands.slice(1).map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBrands([...selectedBrands, brand])
                      } else {
                        setSelectedBrands(selectedBrands.filter((b) => b !== brand))
                      }
                    }}
                  />
                  <Label htmlFor={brand} className="text-sm font-normal cursor-pointer">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3">Price Range</h3>
            <div className="space-y-2">
              {[
                "Under ₦100,000",
                "₦100,000 – ₦500,000",
                "₦500,000 – ₦1,000,000",
                "Over ₦1,000,000",
              ].map((range) => (
                <div key={range} className="flex items-center space-x-2">
                  <Checkbox
                    id={range}
                    checked={priceRange === range}
                    onCheckedChange={(checked) => {
                      setPriceRange(checked ? range : "")
                    }}
                  />
                  <Label htmlFor={range} className="text-sm font-normal cursor-pointer">
                    {range}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-24 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brands.slice(1).map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBrands([...selectedBrands, brand])
                      } else {
                        setSelectedBrands(selectedBrands.filter((b) => b !== brand))
                      }
                    }}
                  />
                  <Label htmlFor={brand} className="text-sm font-normal cursor-pointer">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "Under ₦100,000",
                "₦100,000 – ₦500,000",
                "₦500,000 – ₦1,000,000",
                "Over ₦1,000,000",
              ].map((range) => (
                <div key={range} className="flex items-center space-x-2">
                  <Checkbox
                    id={range}
                    checked={priceRange === range}
                    onCheckedChange={(checked) => {
                      setPriceRange(checked ? range : "")
                    }}
                  />
                  <Label htmlFor={range} className="text-sm font-normal cursor-pointer">
                    {range}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}





