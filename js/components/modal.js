/**
 * ZOHO INVOICE - DYNAMIC MODAL ENGINE
 */

(function (window) {
  'use strict';

  const Modal = {
    activeModal: null,

    open({
      title = '',
      contentHtml = '',
      size = 'md', // 'sm', 'md', 'lg', 'xl'
      onRender = null,
      onConfirm = null,
      confirmText = 'Save',
      cancelText = 'Cancel',
      confirmClass = 'btn-primary',
      showFooter = true
    }) {
      this.close();

      const mount = document.getElementById('modal-container');
      if (!mount) return;

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';

      backdrop.innerHTML = `
        <div class="modal-dialog modal-${size}" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="icon-btn-ghost btn-sm modal-close-btn" aria-label="Close modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            ${contentHtml}
          </div>
          ${showFooter ? `
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary modal-cancel-btn">${cancelText}</button>
            <button type="button" class="btn ${confirmClass} modal-confirm-btn">${confirmText}</button>
          </div>
          ` : ''}
        </div>
      `;

      // Event handlers
      const closeHandler = () => this.close();

      backdrop.querySelector('.modal-close-btn').addEventListener('click', closeHandler);
      const cancelBtn = backdrop.querySelector('.modal-cancel-btn');
      if (cancelBtn) cancelBtn.addEventListener('click', closeHandler);

      const confirmBtn = backdrop.querySelector('.modal-confirm-btn');
      if (confirmBtn && onConfirm) {
        confirmBtn.addEventListener('click', async (e) => {
          const shouldClose = await onConfirm(e, backdrop);
          if (shouldClose !== false) {
            this.close();
          }
        });
      }

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeHandler();
      });

      const keyHandler = (e) => {
        if (e.key === 'Escape') {
          closeHandler();
          document.removeEventListener('keydown', keyHandler);
        }
      };
      document.addEventListener('keydown', keyHandler);

      mount.appendChild(backdrop);
      this.activeModal = { backdrop, keyHandler };

      if (typeof onRender === 'function') {
        onRender(backdrop);
      }
    },

    close() {
      if (this.activeModal) {
        if (this.activeModal.keyHandler) {
          document.removeEventListener('keydown', this.activeModal.keyHandler);
        }
        if (this.activeModal.backdrop && this.activeModal.backdrop.parentNode) {
          this.activeModal.backdrop.remove();
        }
        this.activeModal = null;
      }
    },

    confirm({
      title = 'Are you sure?',
      message = 'This action cannot be undone.',
      confirmText = 'Yes, Proceed',
      cancelText = 'Cancel',
      danger = false,
      onConfirm
    }) {
      this.open({
        title,
        contentHtml: `<p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">${message}</p>`,
        size: 'sm',
        confirmText,
        cancelText,
        confirmClass: danger ? 'btn-danger' : 'btn-primary',
        onConfirm: async () => {
          if (typeof onConfirm === 'function') {
            await onConfirm();
          }
          return true;
        }
      });
    }
  };

  window.Modal = Modal;

})(window);
