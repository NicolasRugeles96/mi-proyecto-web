import * as React from "react";
import { Todo, TodoPriority, TodoStatus } from "../classes/Todo";

interface Props {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

const statusLabel: Record<TodoStatus, string> = {
  "todo": "To do",
  "in-progress": "In progress",
  "done": "Done",
};

const priorityLabel: Record<TodoPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function TodoCard(props: Props) {
  const { todo } = props;

  return (
    <div className="todo-item todo-card" onClick={() => props.onEdit(todo)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="material-icons-round">task_alt</span>
            <h4 style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {todo.title}
            </h4>
          </div>

          <p style={{ margin: "8px 0 0", color: "#969696" }}>
            {todo.description}
          </p>
        </div>

        <div className="todo-badges" onClick={(e) => e.stopPropagation()}>
          <span className={`todo-badge status ${todo.status}`}>
            {statusLabel[todo.status]}
          </span>
          <span className={`todo-badge priority ${todo.priority}`}>
            {priorityLabel[todo.priority]}
          </span>

          <button
            className="todo-icon-btn"
            title="Delete"
            onClick={() => props.onDelete(todo)}
          >
            <span className="material-icons-round">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
