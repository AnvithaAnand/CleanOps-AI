import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Rows3,
  Columns3,
  AlertTriangle,
  Download,
  Loader2,
  Shield,
  Eye,
  BarChart3,
  Bug,
} from "lucide-react";
import { useDataset, usePreviewData, useDownloadDataset } from "../hooks/useDatasets";
import { useProfile } from "../hooks/useProfile";
import { useIssues } from "../hooks/useIssues";
import { useTrustScore } from "../hooks/useTrustScore";
import TrustScoreGauge from "../components/charts/TrustScoreGauge";
import DistributionChart from "../components/charts/DistributionChart";
import IssueBreakdownChart from "../components/charts/IssueBreakdownChart";
import { cn, formatNumber, getSeverityColor } from "../lib/utils";

const tabs = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "data", label: "Data Preview", icon: Rows3 },
  { id: "columns", label: "Columns", icon: BarChart3 },
  { id: "issues", label: "Issues", icon: Bug },
];

export default function DatasetExplorer() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: dataset, isLoading } = useDataset(id);
  const { data: profile } = useProfile(id);
  const { data: issuesData } = useIssues(id);
  const { data: trustScore } = useTrustScore(id);
  const { data: preview } = usePreviewData(id);
  const downloadMut = useDownloadDataset();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dataset) {
    return <div className="text-center py-20 text-muted-foreground">Dataset not found</div>;
  }

  if (["uploaded", "profiling"].includes(dataset.status)) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Analyzing your dataset...</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Profiling columns, detecting issues, and calculating trust score.
        </p>
      </div>
    );
  }

  const openIssues = issuesData?.issues?.filter((i) => i.status === "open") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{dataset.name}</h2>
          <p className="text-sm text-muted-foreground">{dataset.original_filename}</p>
        </div>
        <div className="flex gap-2">
          {openIssues.length > 0 && (
            <Link
              to={`/dataset/${id}/issues`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-100"
            >
              <AlertTriangle className="w-4 h-4" />
              {openIssues.length} Issues
            </Link>
          )}
          <button
            onClick={() =>
              downloadMut.mutate({ id: dataset.id, name: dataset.name })
            }
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === tabId
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab
          dataset={dataset}
          trustScore={trustScore}
          issues={issuesData?.issues}
          profile={profile}
        />
      )}
      {activeTab === "data" && <DataTab preview={preview} />}
      {activeTab === "columns" && <ColumnsTab profile={profile} />}
      {activeTab === "issues" && (
        <IssuesTab issues={issuesData?.issues} datasetId={id} />
      )}
    </div>
  );
}

function OverviewTab({ dataset, trustScore, issues, profile }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 flex flex-col items-center">
        <TrustScoreGauge score={trustScore?.overall_score || dataset.trust_score || 0} />
        <div className="mt-4 w-full space-y-2">
          {trustScore?.dimensions?.map((dim) => (
            <div key={dim.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{dim.name}</span>
              <span className="font-medium">{Math.round(dim.score)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Rows" value={formatNumber(dataset.row_count)} />
          <MiniStat label="Columns" value={formatNumber(dataset.column_count)} />
          <MiniStat
            label="Issues"
            value={issues?.filter((i) => i.status === "open").length || 0}
          />
          <MiniStat label="Type" value={dataset.file_type.toUpperCase()} />
        </div>

        {issues && issues.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3">Issue Breakdown</h4>
            <IssueBreakdownChart issues={issues} />
          </div>
        )}

        {profile?.columns && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3">Column Types</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                profile.columns.reduce((acc, c) => {
                  acc[c.detected_type] = (acc[c.detected_type] || 0) + 1;
                  return acc;
                }, {})
              ).map(([type, count]) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-muted rounded-full text-xs font-medium"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DataTab({ preview }) {
  if (!preview) {
    return <div className="text-center py-10 text-muted-foreground">Loading preview...</div>;
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium">
          Showing {preview.rows.length} of {formatNumber(preview.total_rows)} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-12">
                #
              </th>
              {preview.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, idx) => (
              <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-3 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                {preview.columns.map((col) => (
                  <td
                    key={col}
                    className={cn(
                      "px-3 py-2 text-xs whitespace-nowrap max-w-[200px] truncate",
                      row[col] == null && "text-red-400 italic"
                    )}
                  >
                    {row[col] == null ? "null" : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnsTab({ profile }) {
  if (!profile?.columns) {
    return <div className="text-center py-10 text-muted-foreground">Loading profiles...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {profile.columns.map((col) => (
        <div key={col.id} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-sm">{col.column_name}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                {col.detected_type}
              </span>
            </div>
            {col.is_pii && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <Shield className="w-3 h-3 inline mr-1" />
                PII: {col.pii_type}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Nulls</p>
              <p className="text-sm font-medium">{col.null_percentage}%</p>
              <div className="h-1.5 bg-muted rounded-full mt-1">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{ width: `${Math.min(col.null_percentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unique</p>
              <p className="text-sm font-medium">{col.unique_percentage}%</p>
              <div className="h-1.5 bg-muted rounded-full mt-1">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${Math.min(col.unique_percentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duplicates</p>
              <p className="text-sm font-medium">{formatNumber(col.duplicate_count)}</p>
            </div>
          </div>

          {col.mean_value != null && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                Range: {col.min_value} — {col.max_value}
              </p>
              <p>
                Mean: {col.mean_value?.toFixed(2)} | Median:{" "}
                {col.median_value?.toFixed(2)}
              </p>
            </div>
          )}

          {col.distribution && (
            <div className="mt-3">
              <DistributionChart data={col.distribution} type="numeric" />
            </div>
          )}
          {!col.distribution && col.top_values && (
            <div className="mt-3">
              <DistributionChart data={col.top_values} type="categorical" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function IssuesTab({ issues, datasetId }) {
  if (!issues || issues.length === 0) {
    return (
      <div className="text-center py-10 bg-card border border-border rounded-xl">
        <AlertTriangle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-medium">No issues detected!</p>
        <p className="text-sm text-muted-foreground">Your dataset looks clean.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {issues.length} issue{issues.length !== 1 ? "s" : ""} found
        </span>
        <Link
          to={`/dataset/${datasetId}/issues`}
          className="text-sm text-primary hover:underline font-medium"
        >
          View Repair Studio
        </Link>
      </div>
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium uppercase",
                  getSeverityColor(issue.severity)
                )}
              >
                {issue.severity}
              </span>
              <div>
                <p className="text-sm font-medium">{issue.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {issue.issue_type} • {issue.affected_count} rows affected
                </p>
              </div>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs",
                issue.status === "open"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              )}
            >
              {issue.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
