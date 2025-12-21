import { Model } from 'objection';
import User from './User.js';
import TaskStatus from './TaskStatus.js';

class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId', 'creatorId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: ['string', 'null'] },
        statusId: { type: 'integer' },
        creatorId: { type: 'integer' },
        executorId: { type: ['integer', 'null'] },
      },
    };
  }

  static get relationMappings() {
    return {
      status: {
        relation: Model.BelongsToOneRelation,
        modelClass: TaskStatus,
        join: {
          from: 'tasks.status_id',
          to: 'task_statuses.id',
        },
      },
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.creator_id',
          to: 'users.id',
        },
      },
      executor: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.executor_id',
          to: 'users.id',
        },
      },
    };
  }

  $formatDatabaseJson(json) {
    const dbJson = super.$formatDatabaseJson(json);
    const result = {};

    if (dbJson.name !== undefined) result.name = dbJson.name;
    if (dbJson.description !== undefined) result.description = dbJson.description;
    if (dbJson.statusId !== undefined) result.status_id = dbJson.statusId;
    if (dbJson.creatorId !== undefined) result.creator_id = dbJson.creatorId;
    if (dbJson.executorId !== undefined) result.executor_id = dbJson.executorId;
    if (dbJson.id !== undefined) result.id = dbJson.id;

    return result;
  }

  $parseDatabaseJson(json) {
    const parsed = super.$parseDatabaseJson(json);
    return {
      id: parsed.id,
      name: parsed.name,
      description: parsed.description,
      statusId: parsed.status_id,
      creatorId: parsed.creator_id,
      executorId: parsed.executor_id,
      createdAt: parsed.created_at,
      updatedAt: parsed.updated_at,
      status_id: parsed.status_id,
      creator_id: parsed.creator_id,
      executor_id: parsed.executor_id,
    };
  }
}

export default Task;
