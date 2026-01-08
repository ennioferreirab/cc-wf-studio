/**
 * MCP Tool Search Component
 *
 * Feature: 001-mcp-node
 * Purpose: Search input for filtering MCP tools
 *
 * Based on: specs/001-mcp-node/plan.md Section 6.2
 * Task: T024
 */

import { useTranslation } from '../../i18n/i18n-context';

interface McpToolSearchProps {
  value: string;
  onChange: (query: string) => void;
  disabled?: boolean;
}

export function McpToolSearch({ value, onChange, disabled }: McpToolSearchProps) {
  const { t } = useTranslation();

  return (
    <div style={{ marginBottom: '12px' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('mcp.search.placeholder')}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: 'var(--input-background)',
          color: 'var(--input-foreground)',
          border: '1px solid var(--input-border)',
          borderRadius: '4px',
          fontSize: '13px',
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.border =
              '1px solid var(--focus-border, var(--input-border))';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = '1px solid var(--input-border)';
        }}
      />
    </div>
  );
}
