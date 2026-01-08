/**
 * Skill Browser Dialog Component
 *
 * Feature: 001-skill-node
 * Purpose: Browse and select Claude Code Skills to add to workflow
 *
 * Based on: specs/001-skill-node/design.md Section 6.2
 */

import * as Dialog from '@radix-ui/react-dialog';
import type { SkillReference } from '@shared/types/messages';
import { NodeType } from '@shared/types/workflow-definition';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/i18n-context';
import { browseSkills, createSkill } from '../../services/skill-browser-service';
import { useWorkflowStore } from '../../stores/workflow-store';
import { type CreateSkillFormData, SkillCreationDialog } from './SkillCreationDialog';

interface SkillBrowserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'user' | 'project' | 'local';

export function SkillBrowserDialog({ isOpen, onClose }: SkillBrowserDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSkills, setUserSkills] = useState<SkillReference[]>([]);
  const [projectSkills, setProjectSkills] = useState<SkillReference[]>([]);
  const [localSkills, setLocalSkills] = useState<SkillReference[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillReference | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [isSkillCreationOpen, setIsSkillCreationOpen] = useState(false);
  const [filterText, setFilterText] = useState('');

  const { addNode, nodes } = useWorkflowStore();

  /**
   * 既存のノードと重ならない位置を計算する
   */
  const calculateNonOverlappingPosition = (
    defaultX: number,
    defaultY: number
  ): { x: number; y: number } => {
    const OFFSET_X = 30;
    const OFFSET_Y = 30;
    const NODE_WIDTH = 250;
    const NODE_HEIGHT = 100;

    let newX = defaultX;
    let newY = defaultY;

    for (let i = 0; i < 100; i++) {
      const hasOverlap = nodes.some((node) => {
        const xOverlap =
          Math.abs(node.position.x - newX) < NODE_WIDTH &&
          Math.abs(node.position.y - newY) < NODE_HEIGHT;
        return xOverlap;
      });

      if (!hasOverlap) {
        return { x: newX, y: newY };
      }

      newX += OFFSET_X;
      newY += OFFSET_Y;
    }

    return { x: newX, y: newY };
  };

  // Load Skills when dialog opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadSkills = async () => {
      setLoading(true);
      setError(null);
      setSelectedSkill(null);

      try {
        const skills = await browseSkills();
        const user = skills.filter((s) => s.scope === 'user');
        const project = skills.filter((s) => s.scope === 'project');
        const local = skills.filter((s) => s.scope === 'local');

        setUserSkills(user);
        setProjectSkills(project);
        setLocalSkills(local);

        // Switch to tab with skills if current tab is empty
        if (user.length === 0) {
          if (project.length > 0) {
            setActiveTab('project');
          } else if (local.length > 0) {
            setActiveTab('local');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('skill.error.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [isOpen, t]);

  /**
   * Handle refresh button click
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const skills = await browseSkills();
      const user = skills.filter((s) => s.scope === 'user');
      const project = skills.filter((s) => s.scope === 'project');
      const local = skills.filter((s) => s.scope === 'local');

      setUserSkills(user);
      setProjectSkills(project);
      setLocalSkills(local);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('skill.error.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddSkill = () => {
    if (!selectedSkill) {
      setError(t('skill.error.noSelection'));
      return;
    }

    // Add Skill node to canvas
    const position = calculateNonOverlappingPosition(300, 250);

    // For project Skills, skillPath is already relative from Extension
    // For personal Skills, skillPath is absolute
    // No conversion needed here - Extension already provides the correct format
    addNode({
      id: `skill-${Date.now()}`,
      type: NodeType.Skill,
      position,
      data: {
        name: selectedSkill.name,
        description: selectedSkill.description,
        skillPath: selectedSkill.skillPath,
        scope: selectedSkill.scope,
        validationStatus: selectedSkill.validationStatus,
        allowedTools: selectedSkill.allowedTools,
        outputPorts: 1,
      },
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedSkill(null);
    setError(null);
    setLoading(false);
    setFilterText('');
    onClose();
  };

  const handleSkillCreate = async (formData: CreateSkillFormData) => {
    await createSkill({
      name: formData.name,
      description: formData.description,
      instructions: formData.instructions,
      allowedTools: formData.allowedTools,
      scope: formData.scope as 'user' | 'project',
    });
    // Refresh skill list after creation
    const skills = await browseSkills();
    const user = skills.filter((s) => s.scope === 'user');
    const project = skills.filter((s) => s.scope === 'project');
    const local = skills.filter((s) => s.scope === 'local');
    setUserSkills(user);
    setProjectSkills(project);
    setLocalSkills(local);
  };

  // Compute filtered skills for ALL tabs simultaneously
  const filterLower = filterText.toLowerCase().trim();

  const filteredUserSkills = filterLower
    ? userSkills.filter((skill) => skill.name.toLowerCase().includes(filterLower))
    : userSkills;

  const filteredProjectSkills = filterLower
    ? projectSkills.filter((skill) => skill.name.toLowerCase().includes(filterLower))
    : projectSkills;

  const filteredLocalSkills = filterLower
    ? localSkills.filter((skill) => skill.name.toLowerCase().includes(filterLower))
    : localSkills;

  // Get skills for current tab (for list rendering)
  const currentSkills =
    activeTab === 'user'
      ? filteredUserSkills
      : activeTab === 'project'
        ? filteredProjectSkills
        : filteredLocalSkills;

  // Clear selection when selected skill is filtered out
  useEffect(() => {
    if (selectedSkill && !currentSkills.some((s) => s.skillPath === selectedSkill.skillPath)) {
      setSelectedSkill(null);
    }
  }, [currentSkills, selectedSkill]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Dialog.Content
            style={{
              backgroundColor: 'var(--editor-background)',
              border: '1px solid var(--panel-border)',
              borderRadius: '6px',
              padding: '24px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            {/* Header */}
            <Dialog.Title
              style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--foreground)',
              }}
            >
              {t('skill.browser.title')}
            </Dialog.Title>
            <Dialog.Description
              style={{
                margin: '0 0 20px 0',
                fontSize: '13px',
                color: 'var(--description-foreground)',
                lineHeight: '1.5',
              }}
            >
              {t('skill.browser.description')}
            </Dialog.Description>

            {/* Filter Input */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder={t('skill.browser.filterPlaceholder')}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  backgroundColor: 'var(--input-background)',
                  color: 'var(--input-foreground)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--panel-border)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('user')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    activeTab === 'user' ? '2px solid var(--focus-border)' : 'none',
                  color:
                    activeTab === 'user'
                      ? 'var(--foreground)'
                      : 'var(--description-foreground)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'user' ? 600 : 400,
                }}
              >
                {t('skill.browser.userTab')} ({filteredUserSkills.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('project')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    activeTab === 'project' ? '2px solid var(--focus-border)' : 'none',
                  color:
                    activeTab === 'project'
                      ? 'var(--foreground)'
                      : 'var(--description-foreground)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'project' ? 600 : 400,
                }}
              >
                {t('skill.browser.projectTab')} ({filteredProjectSkills.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('local')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    activeTab === 'local' ? '2px solid var(--focus-border)' : 'none',
                  color:
                    activeTab === 'local'
                      ? 'var(--foreground)'
                      : 'var(--description-foreground)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'local' ? 600 : 400,
                }}
              >
                {t('skill.browser.localTab')} ({filteredLocalSkills.length})
              </button>
            </div>

            {/* Scope Description */}
            <div
              style={{
                padding: '12px',
                marginBottom: '16px',
                backgroundColor: 'var(--blockquote-background)',
                borderLeft: '3px solid var(--blockquote-border)',
                borderRadius: '0 4px 4px 0',
                fontSize: '12px',
                color: 'var(--description-foreground)',
                lineHeight: '1.5',
              }}
            >
              {activeTab === 'user' && t('skill.browser.userDescription')}
              {activeTab === 'project' && t('skill.browser.projectDescription')}
              {activeTab === 'local' && t('skill.browser.localDescription')}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '16px',
                fontSize: '13px',
                backgroundColor: 'var(--button-secondary-background)',
                color: 'var(--button-secondary-foreground)',
                border: '1px solid var(--panel-border)',
                borderRadius: '4px',
                cursor: refreshing || loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>{refreshing ? t('skill.refreshing') : t('skill.action.refresh')}</span>
            </button>

            {/* Loading State */}
            {loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--description-foreground)',
                }}
              >
                {t('skill.browser.loading')}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--input-validation-error-background)',
                  border: '1px solid var(--input-validation-error-border)',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: 'var(--input-validation-error-foreground)',
                }}
              >
                {error}
              </div>
            )}

            {/* Skills List */}
            {!loading && !error && currentSkills.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--description-foreground)',
                }}
              >
                {t('skill.browser.noSkills')}
              </div>
            )}

            {!loading && !error && currentSkills.length > 0 && (
              <div
                style={{
                  border: '1px solid var(--panel-border)',
                  borderRadius: '4px',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
              >
                {currentSkills.map((skill) => (
                  <div
                    key={skill.skillPath}
                    onClick={() => setSelectedSkill(skill)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSkill(skill);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--panel-border)',
                      cursor: 'pointer',
                      backgroundColor:
                        selectedSkill?.skillPath === skill.skillPath
                          ? 'var(--list-active-selection-background)'
                          : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSkill?.skillPath !== skill.skillPath) {
                        e.currentTarget.style.backgroundColor =
                          'var(--list-hover-background)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSkill?.skillPath !== skill.skillPath) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--foreground)',
                          }}
                        >
                          {skill.name}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor:
                              skill.scope === 'user'
                                ? 'var(--badge-background)'
                                : skill.scope === 'local'
                                  ? 'var(--terminal-ansi-blue)'
                                  : 'var(--button-secondary-background)',
                            color:
                              skill.scope === 'user'
                                ? 'var(--badge-foreground)'
                                : skill.scope === 'local'
                                  ? 'var(--editor-background)'
                                  : 'var(--button-secondary-foreground)',
                            fontWeight: 500,
                          }}
                        >
                          {skill.scope === 'user'
                            ? t('skill.browser.userTab')
                            : skill.scope === 'local'
                              ? t('skill.browser.localTab')
                              : t('skill.browser.projectTab')}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color:
                            skill.validationStatus === 'valid'
                              ? 'var(--success-foreground)'
                              : skill.validationStatus === 'missing'
                                ? 'var(--warning-foreground)'
                                : 'var(--error-foreground)',
                        }}
                      >
                        {skill.validationStatus === 'valid'
                          ? '✓'
                          : skill.validationStatus === 'missing'
                            ? '⚠'
                            : '✗'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--description-foreground)',
                        marginBottom: '4px',
                      }}
                    >
                      {skill.description}
                    </div>
                    {skill.allowedTools && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--description-foreground)',
                        }}
                      >
                        {skill.allowedTools}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Create New Skill Button */}
            {!loading && (
              <button
                type="button"
                onClick={() => setIsSkillCreationOpen(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '16px',
                  fontSize: '13px',
                  border: '1px solid var(--button-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--button-secondary-background)',
                  color: 'var(--button-secondary-foreground)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'var(--button-secondary-hover-background)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'var(--button-secondary-background)';
                }}
              >
                + Create New Skill
              </button>
            )}

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '20px',
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  border: '1px solid var(--button-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--button-secondary-background)',
                  color: 'var(--button-secondary-foreground)',
                  cursor: 'pointer',
                }}
              >
                {t('skill.browser.cancelButton')}
              </button>
              <button
                type="button"
                onClick={handleAddSkill}
                disabled={!selectedSkill || loading}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: selectedSkill
                    ? 'var(--button-background)'
                    : 'var(--button-secondary-background)',
                  color: selectedSkill
                    ? 'var(--button-foreground)'
                    : 'var(--description-foreground)',
                  cursor: selectedSkill ? 'pointer' : 'not-allowed',
                  opacity: selectedSkill ? 1 : 0.5,
                }}
              >
                {t('skill.browser.selectButton')}
              </button>
            </div>

            {/* Skill Creation Dialog - nested dialog */}
            <SkillCreationDialog
              isOpen={isSkillCreationOpen}
              onClose={() => setIsSkillCreationOpen(false)}
              onSubmit={handleSkillCreate}
            />
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
