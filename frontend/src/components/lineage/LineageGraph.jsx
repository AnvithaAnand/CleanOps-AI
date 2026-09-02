import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { useLineage } from "../../hooks/useLineage";

const NODE_W = 180;
const NODE_H = 64;

const nodeTypeColors = {
  upload:  { bg: "var(--accent-bg)",  border: "var(--accent-border)",  text: "var(--accent)" },
  import:  { bg: "var(--accent-bg)",  border: "var(--accent-border)",  text: "var(--accent)" },
  profile: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#10b981" },
  issues:  { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#f59e0b" },
  repair:  { bg: "rgba(6,182,212,0.1)",  border: "rgba(6,182,212,0.3)",  text: "#06b6d4" },
  version: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.3)", text: "#8b5cf6" },
};

const nodeTypeIcons = {
  upload: "⬆", import: "🔗", profile: "📊", issues: "⚠", repair: "🔧", version: "📦",
};

function CustomNode({ data }) {
  const colors = nodeTypeColors[data.node_type] || nodeTypeColors.upload;
  return (
    <div
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14 }}>{nodeTypeIcons[data.node_type] || "●"}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, textTransform: "capitalize" }}>
          {data.node_type}
        </span>
      </div>
      <span style={{ fontSize: 11, color: "var(--text-primary)", lineHeight: 1.35 }}>
        {data.label}
      </span>
      {data.metadata?.trust_score != null && (
        <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
          Trust: {Math.round(data.metadata.trust_score)}%
        </span>
      )}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function layoutGraph(rawNodes, rawEdges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  rawNodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  rawEdges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const nodes = rawNodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "custom",
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: n,
    };
  });

  const edges = rawEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border-strong)" },
    style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
    label: e.edge_type?.replace(/_/g, " "),
    labelStyle: { fontSize: 9, fill: "var(--text-faint)" },
    labelBgStyle: { fill: "var(--bg-card)", fillOpacity: 0.9 },
  }));

  return { nodes, edges };
}

export default function LineageGraph({ datasetId }) {
  const { data, isLoading, error } = useLineage(datasetId);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!data?.nodes?.length) return { nodes: [], edges: [] };
    return layoutGraph(data.nodes, data.edges);
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => { setNodes(layoutedNodes); }, [layoutedNodes, setNodes]);
  useEffect(() => { setEdges(layoutedEdges); }, [layoutedEdges, setEdges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--text-muted)" }}>
        <span className="text-sm">Loading lineage...</span>
      </div>
    );
  }

  if (error || !data?.nodes?.length) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-2">
        <span style={{ fontSize: 32 }}>🔗</span>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No lineage data yet</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Lineage is recorded automatically as you profile and repair datasets</p>
      </div>
    );
  }

  return (
    <div style={{ height: 420, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        style={{ background: "var(--bg-hover)" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border)" gap={20} size={1} />
        <Controls
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        />
        <MiniMap
          nodeColor={(n) => nodeTypeColors[n.data?.node_type]?.text || "var(--accent)"}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  );
}
