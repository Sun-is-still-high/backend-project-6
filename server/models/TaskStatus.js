import { Model } from 'objection';

class TaskStatus extends Model {
  static get tableName() {
    return 'task_statuses';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
      },
    };
  }

  $formatDatabaseJson(json) {
    const dbJson = super.$formatDatabaseJson(json);
    const result = {};

    if (dbJson.name !== undefined) result.name = dbJson.name;
    if (dbJson.id !== undefined) result.id = dbJson.id;

    return result;
  }

  $parseDatabaseJson(json) {
    const parsed = super.$parseDatabaseJson(json);
    return {
      id: parsed.id,
      name: parsed.name,
      createdAt: parsed.created_at,
      updatedAt: parsed.updated_at,
    };
  }
}

export default TaskStatus;
