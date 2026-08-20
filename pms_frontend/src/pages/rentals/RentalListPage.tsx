import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  RefreshCw,
} from "lucide-react";

import { apiClient } from "../../api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "../../components/Breadcrumb";
import { StatusBadge } from "../../components/StatusBadge";

interface RentalAccount {
  id: number;
  rental_id_display: string;
  rental_account_number: string;

  lease: number;
  lease_number: string;

  tenant_id: number;
  tenant_name: string;

  unit_id: number;
  unit_number: string;

  property_id: number;
  property_name: string;

  rent_type: string;
  status: string;
  billing_frequency: string;

  rent_amount: string | number;
  service_charge: string | number;
  parking_fee: string | number;
  utility_charge: string | number;
  internet_fee: string | number;
  other_charge: string | number;

  outstanding_balance: string | number;

  created_at: string;
  updated_at: string;
}

interface RentalResponse {
  results?: RentalAccount[];
  count?: number;
}

function money(value: string | number | null | undefined) {
  return `ETB ${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function label(value: string | undefined) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function RentalListPage() {
  const [rentals, setRentals] = useState<RentalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rentType, setRentType] = useState("all");

  async function loadRentals() {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status !== "all") {
        params.status = status;
      }

      if (rentType !== "all") {
        params.rent_type = rentType;
      }

      const { data } = await apiClient.get<RentalResponse | RentalAccount[]>(
        "/rentals/",
        { params }
      );

      setRentals(
        Array.isArray(data)
          ? data
          : data.results ?? []
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Could not load rental accounts."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRentals();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, rentType]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Rental Management" },
          { label: "Rentals" },
        ]}
      />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Rental Management
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Manage rental accounts, billing configuration and outstanding balances.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadRentals}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>

          <Link to="/rentals/new">
            <Button variant="accent">
              <Plus className="h-4 w-4" />
              New Rental
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              className="pl-9"
              placeholder="Search rental, lease, tenant, unit or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={rentType}
            onValueChange={setRentType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rent Type" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="parking">Parking</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {error && (
        <div className="mb-4 rounded-md border border-danger/30 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium">
                  Rental Account
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Lease
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Tenant
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Property / Unit
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Type
                </th>

                <th className="text-right px-4 py-3 font-medium">
                  Rent
                </th>

                <th className="text-right px-4 py-3 font-medium">
                  Outstanding
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Status
                </th>

                <th className="text-right px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Loading rental accounts...
                  </td>
                </tr>
              ) : rentals.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No rental accounts found.
                  </td>
                </tr>
              ) : (
                rentals.map((rental) => (
                  <tr
                    key={rental.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/rentals/${rental.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {rental.rental_id_display}
                      </Link>

                      <div className="text-xs text-muted-foreground mt-0.5">
                        {rental.rental_account_number}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {rental.lease_number}
                    </td>

                    <td className="px-4 py-3">
                      {rental.tenant_name}
                    </td>

                    <td className="px-4 py-3">
                      <div>{rental.property_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Unit {rental.unit_number}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {label(rental.rent_type)}
                    </td>

                    <td className="px-4 py-3 text-right font-tabular">
                      {money(rental.rent_amount)}
                    </td>

                    <td className="px-4 py-3 text-right font-tabular">
                      {money(rental.outstanding_balance)}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={rental.status} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/rentals/${rental.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Link to={`/rentals/${rental.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}