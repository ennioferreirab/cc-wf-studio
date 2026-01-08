/**
 * Claude Code Workflow Studio - Skill Node Component
 *
 * Feature: 001-skill-node
 * Purpose: Display and edit Skill nodes on the React Flow canvas
 *
 * Based on: specs/001-skill-node/design.md Section 6.1
 */

import type { SkillNodeData } from '@shared/types/workflow-definition';
import React from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import { useTranslation } from '../../i18n/i18n-context';
import { DeleteButton } from './DeleteButton';

/**
 * Get validation status icon
 */
function getValidationIcon(status: 'valid' | 'missing' | 'invalid'): string {
  switch (status) {
    case 'valid':
      return '✓';
    case 'missing':
      return '⚠';
    case 'invalid':
      return '✗';
  }
}

/**
 * Get validation status color
 */
function getValidationColor(status: 'valid' | 'missing' | 'invalid'): string {
  switch (status) {
    case 'valid':
      return 'var(--success-foreground)';
    case 'missing':
      return 'var(--warning-foreground)';
    case 'invalid':
      return 'var(--error-foreground)';
  }
}

/**
 * SkillNode Component
 */
export const SkillNodeComponent: React.FC<NodeProps<SkillNodeData>> = React.memo(
  ({ id, data, selected }) => {
    const { t } = useTranslation();

    // Get tooltip message based on validation status
    const getTooltipMessage = (status: 'valid' | 'missing' | 'invalid'): string => {
      switch (status) {
        case 'valid':
          return t('property.validationStatus.valid.tooltip');
        case 'missing':
          return t('property.validationStatus.missing.tooltip');
        case 'invalid':
          return t('property.validationStatus.invalid.tooltip');
      }
    };

    return (
      <div
        className={`skill-node ${selected ? 'selected' : ''}`}
        style={{
          position: 'relative',
          padding: '12px',
          borderRadius: '8px',
          border: `2px solid ${selected ? 'var(--focus-border)' : 'var(--panel-border)'}`,
          backgroundColor: 'var(--editor-background)',
          minWidth: '200px',
          maxWidth: '300px',
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
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>Skill</span>
          {/* Validation Status Icon */}
          <span
            style={{
              fontSize: '12px',
              color: getValidationColor(data.validationStatus),
              fontWeight: 'bold',
            }}
            title={getTooltipMessage(data.validationStatus)}
          >
            {getValidationIcon(data.validationStatus)}
          </span>
        </div>

        {/* Skill Name */}
        <div
          style={{
            fontSize: '13px',
            color: 'var(--foreground)',
            marginBottom: '8px',
            fontWeight: 500,
          }}
        >
          {data.name || 'Untitled Skill'}
        </div>

        {/* Description */}
        {data.description && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--description-foreground)',
              marginBottom: '8px',
              lineHeight: '1.4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {data.description}
          </div>
        )}

        {/* Scope Badge */}
        <div
          style={{
            fontSize: '10px',
            color: 'var(--badge-foreground)',
            backgroundColor:
              data.scope === 'user'
                ? 'var(--badge-background)'
                : data.scope === 'local'
                  ? 'var(--terminal-ansi-blue)'
                  : 'var(--button-secondary-background)',
            padding: '2px 6px',
            borderRadius: '3px',
            display: 'inline-block',
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '0.3px',
          }}
        >
          {data.scope}
        </div>

        {/* Allowed Tools Badge (if specified) */}
        {data.allowedTools && (
          <div
            style={{
              fontSize: '9px',
              color: 'var(--description-foreground)',
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={`Allowed Tools: ${data.allowedTools}`}
          >
            🔧 {data.allowedTools}
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

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: 'var(--button-background)',
            border: '2px solid var(--button-foreground)',
          }}
        />
      </div>
    );
  }
);

SkillNodeComponent.displayName = 'SkillNode';
