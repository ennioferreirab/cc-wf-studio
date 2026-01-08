/**
 * Claude Code Workflow Studio - IfElse Node Component
 *
 * Custom React Flow node for binary conditional branching (If/Else)
 * Fixed 2-way branching for True/False, Yes/No, Success/Error conditions
 */

import type { IfElseNodeData } from '@shared/types/workflow-definition';
import React, { useEffect } from 'react';
import { Handle, type NodeProps, Position, useUpdateNodeInternals } from 'reactflow';
import { DeleteButton } from './DeleteButton';

/**
 * IfElseNode Component
 */
export const IfElseNodeComponent: React.FC<NodeProps<IfElseNodeData>> = React.memo(
  ({ id, data, selected }) => {
    const updateNodeInternals = useUpdateNodeInternals();

    // Update React Flow's internal calculations when port count changes
    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    // Ensure exactly 2 branches (defensive programming)
    const branches = data.branches?.slice(0, 2) || [];

    return (
      <div
        className={`ifelse-node ${selected ? 'selected' : ''}`}
        style={{
          position: 'relative',
          padding: '12px',
          borderRadius: '8px',
          border: `2px solid ${selected ? 'var(--focus-border)' : 'var(--panel-border)'}`,
          backgroundColor: 'var(--editor-background)',
          minWidth: '180px',
          maxWidth: '280px',
        }}
      >
        {/* Delete Button */}
        <DeleteButton nodeId={id} selected={selected} />
        {/* Node Header */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--description-foreground)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          If/Else
        </div>

        {/* Branch Type Badge */}
        <div
          style={{
            fontSize: '10px',
            color: 'var(--badge-foreground)',
            backgroundColor: 'var(--badge-background)',
            padding: '2px 6px',
            borderRadius: '3px',
            marginBottom: '12px',
            display: 'inline-block',
          }}
        >
          2-way Branch
        </div>

        {/* Branches List */}
        {branches.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            {branches.map((branch, index) => (
              <div
                key={branch.id || `branch-${index}`}
                style={{
                  fontSize: '11px',
                  marginBottom: '8px',
                  padding: '6px 8px',
                  backgroundColor: 'var(--blockquote-background)',
                  borderLeft: `3px solid ${index === 0 ? 'var(--charts-green)' : 'var(--charts-red)'}`,
                  borderRadius: '3px',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '4px',
                  }}
                >
                  {branch.label}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--description-foreground)',
                    fontStyle: 'italic',
                  }}
                >
                  {branch.condition || '(条件未設定)'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: 'var(--button-background)',
            border: '2px solid var(--button-foreground)',
          }}
        />

        {/* Fixed 2 Output Handles */}
        {branches.map((branch, i) => (
          <Handle
            key={branch.id || `branch-${i}`}
            type="source"
            position={Position.Right}
            id={`branch-${i}`}
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'var(--button-background)',
              border: '2px solid var(--button-foreground)',
              top: `${((i + 1) / 3) * 100}%`, // Fixed positions for 2 branches (33%, 66%)
            }}
          />
        ))}
      </div>
    );
  }
);

IfElseNodeComponent.displayName = 'IfElseNode';
