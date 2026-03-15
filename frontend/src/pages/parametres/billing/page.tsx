import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon, Add01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type TransactionStatus = "pending" | "failed" | "paid";

interface Transaction {
  id: string;
  prestation: string;
  status: TransactionStatus;
  date: string;
  amount: string;
}

const statusLabels: Record<TransactionStatus, string> = {
  pending: "En attente",
  failed: "Échoué",
  paid: "Payé",
};

const transactions: Transaction[] = [
  {
    id: "#36223",
    prestation: "Forfait Pro — Abonnement mensuel",
    status: "pending",
    date: "10/12/2025",
    amount: "59,90 €"
  },
  {
    id: "#34283",
    prestation: "Migration des données vers HollyFork",
    status: "paid",
    date: "13/11/2025",
    amount: "299,90 €"
  },
  {
    id: "#32234",
    prestation: "HollyBox — Borne de commande",
    status: "paid",
    date: "13/10/2025",
    amount: "149,90 €"
  },
  {
    id: "#31354",
    prestation: "Forfait Pro — Abonnement mensuel",
    status: "failed",
    date: "13/09/2025",
    amount: "59,90 €"
  },
  {
    id: "#30254",
    prestation: "Formation équipe & onboarding",
    status: "paid",
    date: "15/08/2025",
    amount: "199,90 €"
  },
  {
    id: "#29876",
    prestation: "HollyConnect — Module QR code",
    status: "pending",
    date: "22/07/2025",
    amount: "79,90 €"
  }
];

export function BillingPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Facturation</CardTitle>
          <CardDescription>
            Abonnement mensuel | Prochain paiement le 09/02/2025 de{" "}
            <span className="font-medium">59,90 €</span>
          </CardDescription>
          <CardAction>
            <Button onClick={() => navigate("/settings/billing/pricing")}>Changer de plan</Button>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Moyen de paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="font-medium">Marie Dupont •••• 0392</div>
                <Badge variant="info">Principal</Badge>
              </div>
              <p className="text-muted-foreground text-sm">Expire déc. 2025</p>
            </div>
            <Button variant="outline" size="icon">
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-2">
              <div className="font-medium">Marie Dupont •••• 8461</div>
              <p className="text-muted-foreground text-sm">Expire juin 2025</p>
            </div>
            <Button variant="outline" size="icon">
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
            </Button>
          </div>

          <Button variant="outline" className="w-full">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Ajouter un moyen de paiement
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Prestation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const statusMap = {
                  pending: "warning",
                  failed: "destructive",
                  paid: "success"
                } as const;

                const statusClass = statusMap[transaction.status] ?? "secondary";

                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>{transaction.prestation}</TableCell>
                    <TableCell>
                      <Badge variant={statusClass}>{statusLabels[transaction.status]}</Badge>
                    </TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell className="text-right font-medium">{transaction.amount}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
