/**
 * Number Parameter Input Component
 *
 * Feature: 001-mcp-node
 * Purpose: Input component for number/integer-type MCP tool parameters
 *
 * Based on: specs/001-mcp-node/plan.md Section 6.3
 * Task: T033
 */

import type { ToolParameter } from '@shared/types/mcp-node';
import { useState } from 'react';
import { useTranslation } from '../../../i18n/i18n-context';

interface NumberParameterProps {
  parameter: ToolParameter & {
    minimum?: number;
    maximum?: number;
    default?: unknown;
  };
  value: number | string;
  onChange: (value: number | string) => void;
  error?: string;
}

export function NumberParameter({ parameter, value, onChange, error }: NumberParameterProps) {
  const { t } = useTranslation();
  const [touched, setTouched] = useState(false);

  const handleChange = (newValue: string) => {
    if (!touched) {
      setTouched(true);
    }
    onChange(newValue);
  };

  const showError = touched && error;

  const inputType = parameter.type === 'integer' ? 'number' : 'number';
  const step = parameter.type === 'integer' ? '1' : 'any';

  return (
    <div style={{ marginBottom: '12px' }}>
      <label
        htmlFor={`param-${parameter.name}`}
        style={{
          display: 'block',
          marginBottom: '4px',
          fontSize: '13px',
          color: 'var(--foreground)',
        }}
      >
        {parameter.name}
        {parameter.required && (
          <span style={{ color: 'var(--error-foreground)', marginLeft: '4px' }}>*</span>
        )}
      </label>

      {parameter.description && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--description-foreground)',
            marginBottom: '4px',
          }}
        >
          {parameter.description}
        </div>
      )}

      <input
        id={`param-${parameter.name}`}
        type={inputType}
        step={step}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={
          parameter.default !== undefined
            ? String(parameter.default)
            : t('mcp.parameter.enterValue')
        }
        min={parameter.minimum}
        max={parameter.maximum}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: '13px',
          backgroundColor: 'var(--input-background)',
          color: 'var(--input-foreground)',
          border: showError
            ? '1px solid var(--input-validation-error-border)'
            : '1px solid var(--input-border)',
          borderRadius: '2px',
          outline: 'none',
        }}
      />

      {showError && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: 'var(--error-foreground)',
          }}
        >
          {error}
        </div>
      )}

      {(parameter.minimum !== undefined || parameter.maximum !== undefined) && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '11px',
            color: 'var(--description-foreground)',
          }}
        >
          {parameter.minimum !== undefined &&
            `${t('mcp.parameter.minimum')}: ${parameter.minimum} `}
          {parameter.maximum !== undefined && `${t('mcp.parameter.maximum')}: ${parameter.maximum}`}
        </div>
      )}
    </div>
  );
}
