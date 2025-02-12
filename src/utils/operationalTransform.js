/**
 * Operational Transform utilities for collaborative text editing
 * Based on the transformation functions from the Jupiter protocol
 */

// Operation types
export const OP_TYPES = {
  INSERT: 'insert',
  DELETE: 'delete',
  RETAIN: 'retain',
  STYLE: 'style'
};

/**
 * Operation class representing a single text operation
 */
export class Operation {
  constructor(type, position, content = '', attributes = {}) {
    this.type = type;
    this.position = position;
    this.content = content;
    this.attributes = attributes;
  }

  static insert(position, content, attributes = {}) {
    return new Operation(OP_TYPES.INSERT, position, content, attributes);
  }

  static delete(position, length) {
    return new Operation(OP_TYPES.DELETE, position, length.toString());
  }

  static retain(position, length, attributes = {}) {
    return new Operation(OP_TYPES.RETAIN, position, length.toString(), attributes);
  }

  static style(position, length, attributes) {
    return new Operation(OP_TYPES.STYLE, position, length.toString(), attributes);
  }

  length() {
    return this.type === OP_TYPES.DELETE || this.type === OP_TYPES.RETAIN || this.type === OP_TYPES.STYLE
      ? parseInt(this.content)
      : this.content.length;
  }
}

/**
 * Transform two operations against each other
 * @param {Operation} op1 - First operation
 * @param {Operation} op2 - Second operation
 * @returns {[Operation, Operation]} Transformed operations
 */
export function transform(op1, op2) {
  if (op1.type === OP_TYPES.INSERT && op2.type === OP_TYPES.INSERT) {
    // Both insert: position adjustment based on insertion order
    if (op1.position < op2.position || (op1.position === op2.position && op1.content < op2.content)) {
      return [op1, Operation.insert(op2.position + op1.length(), op2.content, op2.attributes)];
    } else {
      return [Operation.insert(op1.position + op2.length(), op1.content, op1.attributes), op2];
    }
  }

  if (op1.type === OP_TYPES.DELETE && op2.type === OP_TYPES.DELETE) {
    // Both delete: adjust positions and lengths
    const pos1 = op1.position;
    const pos2 = op2.position;
    const len1 = op1.length();
    const len2 = op2.length();

    if (pos1 + len1 <= pos2) {
      // op1 completely before op2
      return [op1, Operation.delete(pos2 - len1, len2)];
    }
    
    if (pos2 + len2 <= pos1) {
      // op2 completely before op1
      return [Operation.delete(pos1 - len2, len1), op2];
    }
    
    // Overlapping deletes
    const newPos1 = Math.min(pos1, pos2);
    const newPos2 = Math.min(pos1, pos2);
    const newLen1 = pos1 + len1 - newPos1 - Math.max(0, (pos1 + len1) - (pos2 + len2));
    const newLen2 = pos2 + len2 - newPos2 - Math.max(0, (pos2 + len2) - (pos1 + len1));
    
    return [
      Operation.delete(newPos1, newLen1),
      Operation.delete(newPos2, newLen2)
    ];
  }

  if (op1.type === OP_TYPES.INSERT && op2.type === OP_TYPES.DELETE) {
    // Insert vs Delete
    if (op1.position <= op2.position) {
      return [op1, Operation.delete(op2.position + op1.length(), op2.length())];
    } else if (op1.position > op2.position + op2.length()) {
      return [Operation.insert(op1.position - op2.length(), op1.content, op1.attributes), op2];
    } else {
      return [Operation.insert(op2.position, op1.content, op1.attributes), op2];
    }
  }

  if (op1.type === OP_TYPES.DELETE && op2.type === OP_TYPES.INSERT) {
    // Delete vs Insert
    if (op2.position <= op1.position) {
      return [Operation.delete(op1.position + op2.length(), op1.length()), op2];
    } else if (op2.position > op1.position + op1.length()) {
      return [op1, Operation.insert(op2.position - op1.length(), op2.content, op2.attributes)];
    } else {
      return [op1, Operation.insert(op1.position, op2.content, op2.attributes)];
    }
  }

  if (op1.type === OP_TYPES.STYLE || op2.type === OP_TYPES.STYLE) {
    // Style operations
    return transformStyle(op1, op2);
  }

  return [op1, op2];
}

/**
 * Transform style operations
 */
function transformStyle(op1, op2) {
  if (op1.type === OP_TYPES.STYLE && op2.type === OP_TYPES.STYLE) {
    // Merge style attributes if they overlap
    if (op1.position === op2.position && op1.length() === op2.length()) {
      const mergedAttributes = { ...op1.attributes, ...op2.attributes };
      return [
        Operation.style(op1.position, op1.length(), mergedAttributes),
        Operation.style(op2.position, op2.length(), mergedAttributes)
      ];
    }
  }

  // Default transformation for other style combinations
  return [op1, op2];
}

/**
 * Apply an operation to a text string
 * @param {string} text - Original text
 * @param {Operation} operation - Operation to apply
 * @returns {string} Updated text
 */
export function applyOperation(text, operation) {
  switch (operation.type) {
    case OP_TYPES.INSERT:
      return text.slice(0, operation.position) + operation.content + text.slice(operation.position);
    
    case OP_TYPES.DELETE:
      return text.slice(0, operation.position) + text.slice(operation.position + operation.length());
    
    case OP_TYPES.RETAIN:
    case OP_TYPES.STYLE:
      return text; // These operations don't modify the text content
    
    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}

/**
 * Compose multiple operations into a single operation
 * @param {Operation[]} operations - Array of operations
 * @returns {Operation[]} Composed operations
 */
export function compose(operations) {
  if (operations.length === 0) return [];
  if (operations.length === 1) return operations;

  return operations.reduce((composed, op) => {
    if (composed.length === 0) return [op];

    const lastOp = composed[composed.length - 1];
    if (canCompose(lastOp, op)) {
      composed[composed.length - 1] = composeTwo(lastOp, op);
    } else {
      composed.push(op);
    }
    return composed;
  }, []);
}

/**
 * Check if two operations can be composed
 */
function canCompose(op1, op2) {
  if (op1.type !== op2.type) return false;
  if (op1.type === OP_TYPES.INSERT && op1.position + op1.length() === op2.position) return true;
  if (op1.type === OP_TYPES.DELETE && op1.position === op2.position) return true;
  if (op1.type === OP_TYPES.STYLE && 
      op1.position + op1.length() === op2.position &&
      JSON.stringify(op1.attributes) === JSON.stringify(op2.attributes)) return true;
  return false;
}

/**
 * Compose two compatible operations
 */
function composeTwo(op1, op2) {
  switch (op1.type) {
    case OP_TYPES.INSERT:
      return Operation.insert(op1.position, op1.content + op2.content, op1.attributes);
    
    case OP_TYPES.DELETE:
      return Operation.delete(op1.position, op1.length() + op2.length());
    
    case OP_TYPES.STYLE:
      return Operation.style(op1.position, op1.length() + op2.length(), op1.attributes);
    
    default:
      throw new Error(`Cannot compose operations of type: ${op1.type}`);
  }
}

export default {
  Operation,
  OP_TYPES,
  transform,
  applyOperation,
  compose
};
