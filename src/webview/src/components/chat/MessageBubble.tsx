/**
 * Message Bubble Component
 *
 * Displays a single message in the refinement chat.
 * Based on: /specs/001-ai-workflow-refinement/quickstart.md Section 3.2
 * Updated: Phase 3.7 - Added loading state for AI messages
 * Updated: Phase 3.8 - Added error state display
 */

import type { ConversationMessage } from '@shared/types/workflow-definition';
import { useResponsiveFonts } from '../../contexts/ResponsiveFontContext';
import { useTranslation } from '../../i18n/i18n-context';
import type { WebviewTranslationKeys } from '../../i18n/translation-keys';
import { useRefinementStore } from '../../stores/refinement-store';
import { getErrorMessageInfo } from '../../utils/error-messages';
import { IndeterminateProgressBar } from '../common/IndeterminateProgressBar';
import { ProgressBar } from './ProgressBar';
import { ToolExecutionIndicator } from './ToolExecutionIndicator';

interface MessageBubbleProps {
  message: ConversationMessage;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const { t } = useTranslation();
  const { timeoutSeconds } = useRefinementStore();
  const fontSizes = useResponsiveFonts();
  const isUser = message.sender === 'user';
  const isError = message.isError ?? false;
  const errorCode = message.errorCode;

  // Phase 3.9: Don't show loading when error state is active
  const isLoading = (message.isLoading ?? false) && !isError;

  // Get error message info if this is an error message
  const errorMessageInfo = isError && errorCode ? getErrorMessageInfo(errorCode) : null;
  const errorMessage = errorMessageInfo ? t(errorMessageInfo.messageKey) : '';
  const isRetryable = errorMessageInfo?.isRetryable ?? false;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: isError
            ? 'var(--input-validation-error-background)'
            : isUser
              ? 'var(--button-background)'
              : 'var(--editor-inactiveSelectionBackground)',
          color: isError
            ? 'var(--input-validation-error-foreground)'
            : isUser
              ? 'var(--button-foreground)'
              : 'var(--editor-foreground)',
          border: isError ? '1px solid var(--input-validation-error-border)' : 'none',
          wordWrap: 'break-word',
        }}
      >
        <div
          style={{
            fontSize: `${fontSizes.small}px`,
            opacity: 0.7,
            marginBottom: '4px',
          }}
        >
          {isUser ? 'User' : 'AI'}
        </div>

        {/* Error state: show error icon and message */}
        {isError && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span style={{ fontWeight: 500 }}>{errorMessage}</span>
            </div>
            {/* Retry button for retryable errors */}
            {isRetryable && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  marginTop: '8px',
                  padding: '4px 12px',
                  fontSize: `${fontSizes.button}px`,
                  fontWeight: 500,
                  backgroundColor: 'var(--button-background)',
                  color: 'var(--button-foreground)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-hover-background)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-background)';
                }}
              >
                {t('refinement.error.retryButton')}
              </button>
            )}
          </>
        )}

        {/* Normal content */}
        {!isError && message.content && (
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {message.translationKey
              ? t(message.translationKey as keyof WebviewTranslationKeys)
              : message.content}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <>
            {/* Tool execution indicator (only during tool execution) */}
            {message.toolInfo && !isUser && <ToolExecutionIndicator toolInfo={message.toolInfo} />}

            {/* Progress bar */}
            {timeoutSeconds === 0 ? (
              <IndeterminateProgressBar label={t('refinement.aiProcessing')} />
            ) : (
              <ProgressBar
                isProcessing={true}
                label={t('refinement.aiProcessing')}
                maxSeconds={timeoutSeconds}
              />
            )}
          </>
        )}

        {/* Timestamp (hide when loading or error) */}
        {!isLoading && !isError && (
          <div
            style={{
              fontSize: `${fontSizes.xsmall}px`,
              opacity: 0.5,
              marginTop: '4px',
              textAlign: 'right',
            }}
          >
            {new Date(message.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
