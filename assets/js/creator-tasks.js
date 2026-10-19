/* RockyX Creator Tasks
   Frontend foundation — backend rewards are not connected yet.
*/

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_creator_tasks_v1";

  const TASKS = [
    {
      id: "complete-profile",
      title: "Complete Your Creator Profile",
      description: "Add a profile photo, bio, and creator details.",
      reward: 50,
      category: "Profile"
    },
    {
      id: "publish-video",
      title: "Publish Your First Video",
      description: "Share your first original video on RockyX Social.",
      reward: 100,
      category: "Content"
    },
    {
      id: "publish-three",
      title: "Share Three Videos",
      description: "Publish three original videos.",
      reward: 150,
      category: "Content"
    },
    {
      id: "engage-community",
      title: "Engage With the Community",
      description: "Respond to comments on your videos.",
      reward: 75,
      category: "Community"
    },
    {
      id: "weekly-creator",
      title: "Weekly Creator Challenge",
      description: "Complete the weekly creator challenge.",
      reward: 200,
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
      new CustomEvent("rockyx:creator-task-completed", {
        detail: result
      })
    );

    return result;
  }

  window.RockyXCreatorTasks = {
    getTasks: getTasks,
    getProgress: getProgress,
    completeTask: completeTask
  };

})();