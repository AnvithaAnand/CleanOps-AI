import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.lineage import LineageEdge, LineageNode


async def add_lineage_node(db: AsyncSession, dataset_id: str, node_type: str,
                            label: str, entity_id: str | None = None,
                            metadata: dict | None = None) -> LineageNode:
    node = LineageNode(
        dataset_id=dataset_id,
        node_type=node_type,
        label=label,
        entity_id=entity_id,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(node)
    await db.flush()
    return node


async def add_lineage_edge(db: AsyncSession, source_id: str, target_id: str,
                            edge_type: str) -> LineageEdge:
    edge = LineageEdge(source_node_id=source_id, target_node_id=target_id, edge_type=edge_type)
    db.add(edge)
    await db.flush()
    return edge


async def get_lineage_graph(db: AsyncSession, dataset_id: str) -> dict:
    result = await db.execute(
        select(LineageNode).where(LineageNode.dataset_id == dataset_id).order_by(LineageNode.created_at)
    )
    nodes = result.scalars().all()
    node_ids = {n.id for n in nodes}

    edges = []
    if node_ids:
        result = await db.execute(
            select(LineageEdge).where(LineageEdge.source_node_id.in_(node_ids))
        )
        edges = result.scalars().all()

    return {
        "nodes": [
            {
                "id": n.id,
                "node_type": n.node_type,
                "label": n.label,
                "entity_id": n.entity_id,
                "metadata": json.loads(n.metadata_json) if n.metadata_json else None,
                "created_at": n.created_at.isoformat(),
            }
            for n in nodes
        ],
        "edges": [
            {
                "id": e.id,
                "source": e.source_node_id,
                "target": e.target_node_id,
                "edge_type": e.edge_type,
            }
            for e in edges
        ],
    }
