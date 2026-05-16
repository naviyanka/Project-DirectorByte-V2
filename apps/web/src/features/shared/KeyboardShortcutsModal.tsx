import React, { useEffect } from 'react';
import { useUIStore } from '../../store/ui.store';
import { Modal } from '../../design-system/components/Modal/Modal';
import { Command, CornerDownLeft } from 'lucide-react';

export function KeyboardShortcutsModal() {
  const { activeModal, closeModal, openModal } = useUIStore();
  const isOpen = activeModal === 'keyboard-shortcuts';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        openModal('keyboard-shortcuts');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openModal]);

  const shortcuts = [
    { group: 'Global', items: [
      { key: '⌘ K', description: 'Open global search' },
      { key: '?', description: 'Show keyboard shortcuts' },
      { key: 'Esc', description: 'Close modal / dropdown' },
    ]},
    { group: 'Studio', items: [
      { key: '⌘ S', description: 'Manual save' },
      { key: '⌘ Enter', description: 'Run current stage' },
      { key: '[ / ]', description: 'Previous / Next stage' },
      { key: '⌘ Z', description: 'Undo changes' },
    ]},
    { group: 'Admin', items: [
      { key: '/', description: 'Focus search' },
    ]}
  ];

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && closeModal()}
      title="Keyboard Shortcuts"
      size="md"
    >
      <div className="space-y-6">
        {shortcuts.map((group) => (
          <div key={group.group}>
            <h3 className="text-xs font-bold text-hint uppercase tracking-wider mb-3">
              {group.group}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                  <span className="text-sm text-secondary">{item.description}</span>
                  <div className="flex gap-1">
                    {item.key.split(' ').map((k, i) => (
                      <kbd 
                        key={i} 
                        className="px-1.5 py-0.5 rounded bg-surface-300 border border-surface-400 text-[10px] font-mono font-bold text-primary shadow-sm"
                      >
                        {k === '⌘' ? <Command size={10} className="inline mr-0.5" /> : k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
