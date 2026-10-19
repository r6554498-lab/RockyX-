/* RockyX Template Creator Tasks
   Frontend foundation — verified rewards require a backend.
*/
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_template_creator_tasks_v1";
  const TASKS = [
    {
      id: "create-first-template",
      title: "Create Your First Template",
      description: "Create an editable template in RockyX Studio.",
      reward: 100,
      category: "Creation"
    },
    {
      id: "publish-approved-template",
      title: "Publish an Approved Template",
      description: "Get your template reviewed and approved for publishing.",
      reward: 150,
      category: "Publishing"
    },
    {
      id: "reach-100-uses",
      title: "Reach 100 Template Uses",
      description: "Help creators discover and use your templates.",
      reward: 200,
      category: "Growth"
    },
    {
      id: "reach-50-exports",
      title: "Reach 50 Completed Exports",
      description: "Help users create finished videos using your templates.",
      reward: 250,
      category: "Engagement"
    },
    {
      id: "weekly-template-challenge",
      title: "Weekly Template Challenge",
      description: "Complete the weekly template creation challenge.",
      reward: 300,
      category: "Challenge"
    }
  ];
  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        completed: [],
        points: 0
      };
    } catch (error) {
      return {
        completed: [],
        points: 0
      };
    }
  }
  function getTasks() {
    const state = loadState();
    return TASKS.map(function (task) {
      return {
        ...task,
        completed: state.completed.includes(task.id)
      };
    });
  }
  function getProgress() {
    const state = loadState();
    return {
      completedTasks: state.completed.length,
      totalTasks: TASKS.length,
      points: state.points,
      tasks: getTasks()
    };
  }
  function completeTask(taskId) {
    const task = TASKS.find(function (item) {
      return item.id === taskId;
    });
    if (!task) {
      return {
        success: false,
        message: "Task not found."
      };
    }
    const state = loadState();
    if (state.completed.includes(taskId)) {
      return {
        success: false,
        message: "This task has already been completed."
      };
    }
    state.completed.push(taskId);
    state.points += task.reward;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const result = {
      success: true,
      task: task,
      pointsEarned: task.reward,
      totalPoints: state.points
    };
    window.dispatchEvent(
      new CustomEvent("rockyx:template-creator-task-completed", {
        detail: result
      })
    );
    return result;
  }
  window.RockyXTemplateCreatorTasks = {
    getTasks: getTasks,
    getProgress: getProgress,
    completeTask: completeTask
  };
})();