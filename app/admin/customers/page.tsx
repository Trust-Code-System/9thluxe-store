import { Search, MoreHorizontal, Mail, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const customers = [
  {
    id: "1",

    name: "John Doe",

    email: "john@example.com",

    orders: 12,

    totalSpent: 25000000,

    status: "active",

    joinDate: "2024-01-01",
  },

  {
    id: "2",

    name: "Sarah Johnson",

    email: "sarah@example.com",

    orders: 8,

    totalSpent: 4500000,

    status: "active",

    joinDate: "2024-01-05",
  },

  {
    id: "3",

    name: "Michael Adeyemi",

    email: "michael@example.com",

    orders: 5,

    totalSpent: 15000000,

    status: "active",

    joinDate: "2024-01-10",
  },

  {
    id: "4",

    name: "Aisha Mohammed",

    email: "aisha@example.com",

    orders: 3,

    totalSpent: 750000,

    status: "inactive",

    joinDate: "2024-01-15",
  },

  {
    id: "5",

    name: "Chidi Okonkwo",

    email: "chidi@example.com",

    orders: 15,

    totalSpent: 35000000,

    status: "active",

    joinDate: "2023-12-01",
  },
];

export default function AdminCustomersPage() {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",

      currency: "NGN",

      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Customers
        </h1>

        <p className="text-muted-foreground">
          View and manage your customer base
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Customers</CardTitle>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input placeholder="Search customers..." className="pl-9" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>

                  <TableHead>Orders</TableHead>

                  <TableHead>Total Spent</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead>Joined</TableHead>

                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {customer.name

                              .split(" ")

                              .map((n) => n[0])

                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="font-medium">{customer.name}</p>

                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{customer.orders}</TableCell>

                    <TableCell>{formatPrice(customer.totalSpent)}</TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          customer.status === "active"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {new Date(customer.joinDate).toLocaleDateString("en-NG", {
                        month: "short",

                        day: "numeric",

                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>

                          <DropdownMenuItem className="text-destructive">
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing 1-5 of 5 customers
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="bg-transparent"
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled
                className="bg-transparent"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
