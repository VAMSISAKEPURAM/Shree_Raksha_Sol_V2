/**
 * ZOHO INVOICE - LIVE PROJECT STOPWATCH TIMER
 * Tracks billable hours in real-time, persists across reloads, logs to timesheets.
 */

(function (window) {
  'use strict';

  const Timer = {
    intervalId: null,

    init() {
      this.timerPill = document.getElementById('header-timer-pill');
      this.timerDisplay = document.getElementById('header-timer-display');
      this.timerProject = document.getElementById('header-timer-project');
      this.timerStopBtn = document.getElementById('header-timer-stop-btn');

      if (this.timerStopBtn) {
        this.timerStopBtn.addEventListener('click', () => this.stopAndLog());
      }

      this.checkActive();
    },

    checkActive() {
      const active = window.AppStore.data.activeTimer;
      if (active && active.isRunning) {
        this.startTicker(active);
      } else {
        this.stopTicker();
      }
    },

    start(projectId, taskId, description = '') {
      const active = {
        projectId,
        taskId,
        description,
        startTime: Date.now(),
        isRunning: true
      };
      window.AppStore.data.activeTimer = active;
      window.AppStore.save();
      this.startTicker(active);
      window.Toast.show('Live project timer started!', 'info');
    },

    startTicker(active) {
      if (this.intervalId) clearInterval(this.intervalId);

      const project = window.AppStore.getById('projects', active.projectId);
      if (this.timerProject) {
        this.timerProject.textContent = project ? project.name : 'Active Task';
      }
      if (this.timerPill) {
        this.timerPill.style.display = 'flex';
      }

      const updateTime = () => {
        const elapsedSec = Math.floor((Date.now() - active.startTime) / 1000);
        const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
        const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        if (this.timerDisplay) {
          this.timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
        }
      };

      updateTime();
      this.intervalId = setInterval(updateTime, 1000);
    },

    stopTicker() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (this.timerPill) {
        this.timerPill.style.display = 'none';
      }
    },

    stopAndLog() {
      const active = window.AppStore.data.activeTimer;
      if (!active || !active.isRunning) return;

      const elapsedMs = Date.now() - active.startTime;
      const elapsedHours = Math.max(0.1, Math.round((elapsedMs / (1000 * 60 * 60)) * 100) / 100);

      this.stopTicker();
      window.AppStore.data.activeTimer = null;
      window.AppStore.save();

      const project = window.AppStore.getById('projects', active.projectId);
      const rate = project ? (project.ratePerHour || 100) : 100;

      const newEntry = {
        id: 'time-' + Date.now(),
        projectId: active.projectId,
        taskId: active.taskId,
        date: new Date().toISOString().substring(0, 10),
        hours: elapsedHours,
        rate: rate,
        billable: true,
        invoiced: false,
        notes: active.description || 'Logged via Live Stopwatch Timer'
      };

      window.AppStore.add('timesheets', newEntry);
      window.Toast.show(`Timer stopped. ${elapsedHours} hrs logged successfully!`, 'success');

      // If user is currently on time-tracking view, refresh view
      if (window.location.hash === '#time-tracking') {
        window.TimeTrackingView.render();
      }
    },

    promptStartModal() {
      const projects = window.AppStore.getAll('projects');
      if (projects.length === 0) {
        window.Toast.show('Please create a project first.', 'warning');
        window.location.hash = '#time-tracking';
        return;
      }

      let projectOptions = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      let firstProj = projects[0];
      let taskOptions = (firstProj.tasks || []).map(t => `<option value="${t.id}">${t.name}</option>`).join('');

      const contentHtml = `
        <div class="form-group">
          <label class="form-label required">Select Project</label>
          <select id="timer-proj-select" class="input-select w-full">
            ${projectOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Select Task</label>
          <select id="timer-task-select" class="input-select w-full">
            ${taskOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notes / Work Description</label>
          <input type="text" id="timer-desc-input" class="form-control" placeholder="What are you working on?">
        </div>
      `;

      window.Modal.open({
        title: 'Start Live Stopwatch Timer',
        contentHtml,
        confirmText: 'Start Timer',
        onRender: (dialog) => {
          const projSelect = dialog.querySelector('#timer-proj-select');
          const taskSelect = dialog.querySelector('#timer-task-select');

          projSelect.addEventListener('change', () => {
            const p = window.AppStore.getById('projects', projSelect.value);
            if (p && p.tasks) {
              taskSelect.innerHTML = p.tasks.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }
          });
        },
        onConfirm: (_, dialog) => {
          const projId = dialog.querySelector('#timer-proj-select').value;
          const taskId = dialog.querySelector('#timer-task-select').value;
          const desc = dialog.querySelector('#timer-desc-input').value;
          this.start(projId, taskId, desc);
          return true;
        }
      });
    }
  };

  window.Timer = Timer;

})(window);
