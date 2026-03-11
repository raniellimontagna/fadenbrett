import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'
import { type Node, type Edge } from '@xyflow/react'

export type LayoutAlgorithm = 'force' | 'hierarchical' | 'radial'

const elk = new ELK()

const NODE_WIDTH = 224 // w-56 = 14rem = 224px
const NODE_HEIGHT = 150 // approximate card height

function getElkOptions(algorithm: LayoutAlgorithm): Record<string, string> {
  const base = {
    'elk.spacing.nodeNode': '80',
    'elk.padding': '[top=50,left=50,bottom=50,right=50]',
  }

  switch (algorithm) {
    case 'hierarchical':
      return {
        ...base,
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.layered.spacing.baseValue': '100',
        'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      }
    case 'radial':
      return {
        ...base,
        'elk.algorithm': 'radial',
        'elk.radial.compactor': 'WEDGE_COMPACTION',
      }
    case 'force':
    default:
      return {
        ...base,
        'elk.algorithm': 'force',
        'elk.force.iterations': '300',
      }
  }
}

export async function computeLayout(
  nodes: Node[],
  edges: Edge[],
  algorithm: LayoutAlgorithm,
  nodeIds?: string[],
): Promise<Map<string, { x: number; y: number }>> {
  // Filter to only card/note/frame nodes (skip notes if no nodeIds filter)
  const targetNodes = nodeIds
    ? nodes.filter((n) => nodeIds.includes(n.id))
    : nodes.filter((n) => n.type === 'card' || n.type === 'frame')

  const targetIds = new Set(targetNodes.map((n) => n.id))

  // Only include edges where both source and target are in the layout set
  const targetEdges = edges.filter(
    (e) => targetIds.has(e.source) && targetIds.has(e.target),
  )

  const elkNodes: ElkNode[] = targetNodes.map((node) => ({
    id: node.id,
    width: node.type === 'frame' ? (node.style?.width as number ?? 300) : NODE_WIDTH,
    height: node.type === 'frame' ? (node.style?.height as number ?? 200) : NODE_HEIGHT,
  }))

  const elkEdges: ElkExtendedEdge[] = targetEdges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }))

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: getElkOptions(algorithm),
    children: elkNodes,
    edges: elkEdges,
  }

  const layout = await elk.layout(graph)
  const result = new Map<string, { x: number; y: number }>()

  for (const child of layout.children ?? []) {
    if (child.x !== undefined && child.y !== undefined) {
      result.set(child.id, { x: child.x, y: child.y })
    }
  }

  return result
}
