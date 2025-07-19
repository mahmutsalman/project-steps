class UndoRedoSystem {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 50;
  }

  executeCommand(command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    
    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    
    const command = this.redoStack.pop();
    command.execute();
    this.undoStack.push(command);
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export class DeleteStepCommand {
  constructor(step, projectId, deleteStepFn, createStepFn) {
    this.step = step;
    this.projectId = projectId;
    this.deleteStepFn = deleteStepFn;
    this.createStepFn = createStepFn;
  }

  async execute() {
    await this.deleteStepFn(this.step.id);
  }

  async undo() {
    await this.createStepFn(this.step);
  }
}

export const undoRedoSystem = new UndoRedoSystem();