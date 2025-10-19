import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<any | null>(null);
  const [roosters, setRoosters] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const scans = JSON.parse(localStorage.getItem("rx_scans") || "[]");
      const found = scans.find((s: any) => s.id === id) || null;
      setRecord(found);
      const list = JSON.parse(localStorage.getItem("rx_roosters") || "[]");
      if (Array.isArray(list)) {
        const map: Record<string, string> = {};
        list.forEach((r: any) => (map[r.id] = r.name));
        setRoosters(map);
      }
    } catch {
      setRecord(null);
    }
  }, [id]);

  const roosterName = useMemo(() => {
    if (!record?.roosterId) return "Unassigned";
    return roosters[record.roosterId] || "Unknown";
  }, [record, roosters]);

  if (!record) {
    return (
      <div className="rounded-xl border p-10 text-center">
        <p className="mb-4">Report not found.</p>
        <Button asChild>
          <Link to="/scan">Start New Scan</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Health Report</h1>
        <p className="text-sm text-muted-foreground">Generated from your latest capture.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capture • {new Date(record.createdAt).toLocaleString()}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Rooster</div>
              <div className="font-medium">{roosterName}</div>
            </div>
            <div>
              <div className="text-muted-foreground">AR Overlay</div>
              <div className="font-medium">{record.overlay ? "On" : "Off"}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-muted-foreground text-sm">Posture</div>
              <Badge variant="secondary" className="mt-1">{record.results?.posture ?? "—"}</Badge>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Wing</div>
              <Badge variant="secondary" className="mt-1">{record.results?.wing ?? "—"}</Badge>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Legs</div>
              <Badge variant="secondary" className="mt-1">{record.results?.legs ?? "—"}</Badge>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Movement</div>
              <Badge variant="secondary" className="mt-1">{record.results?.movement ?? "—"}</Badge>
            </div>
          </div>

          {Array.isArray(record.injuries) || record.severity || record.notes ? (
            <div className="grid gap-3">
              <div>
                <div className="text-muted-foreground text-sm">Injuries</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(record.injuries || []).length ? (
                    record.injuries.map((i: string) => (
                      <Badge key={i} variant="secondary">{i}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground text-sm">Severity</div>
                  {record.severity ? (
                    <Badge variant={record.severity === "high" ? "destructive" : record.severity === "medium" ? "default" : "secondary"} className="mt-1">
                      {record.severity}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Notes</div>
                  <div className="mt-1 text-sm whitespace-pre-wrap">{record.notes || "—"}</div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button asChild>
          <Link to="/scan">New Scan</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/history">Open History</Link>
        </Button>
      </div>
    </div>
  );
}
