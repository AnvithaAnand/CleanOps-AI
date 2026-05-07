import { Link } from "react-router-dom";
import { Upload, Database, AlertTriangle, CheckCircle } from "lucide-react";
import { useDatasets } from "../hooks/useDatasets";
import DatasetCard from "../components/dashboard/DatasetCard";

export default function Dashboard() {
  const { data: datasets, isLoading } = useDatasets();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const total = datasets?.length || 0;
  const validated = datasets?.filter((d) => d.status === "validated").length || 0;
  const withIssues = datasets?.filter((d) => d.trust_score != null && d.trust_score < 80).length || 0;
  const healthy = datasets?.filter((d) => d.trust_score != null && d.trust_score >= 80).length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          label="Total Datasets"
          value={total}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Validated"
          value={validated}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          icon={AlertTriangle}
          label="Needs Attention"
          value={withIssues}
          color="text-yellow-600"
          bg="bg-yellow-50"
        />
        <StatCard
          icon={CheckCircle}
          label="Healthy (80+)"
          value={healthy}
          color="text-green-600"
          bg="bg-green-50"
        />
      </div>

      {total === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No datasets yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Upload your first dataset to get started with data profiling and
            quality analysis.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Dataset
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Your Datasets
            </h3>
            <Link
              to="/upload"
              className="text-sm text-primary hover:underline font-medium"
            >
              + Upload New
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((ds) => (
              <DatasetCard key={ds.id} dataset={ds} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={`w-11 h-11 ${bg} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
