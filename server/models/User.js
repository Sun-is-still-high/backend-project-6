import { Model } from 'objection';
import objectionUnique from 'objection-unique';

const unique = objectionUnique({
  fields: ['email'],
  identifiers: ['id'],
  message: 'errors.emailAlreadyInUse',
});

class User extends unique(Model) {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'passwordDigest'],
      properties: {
        id: { type: 'integer' },
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        passwordDigest: { type: 'string', minLength: 1 },
      },
    };
  }

  static get virtualAttributes() {
    return ['fullName'];
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Map camelCase to snake_case for database columns
  $formatDatabaseJson(json) {
    const dbJson = super.$formatDatabaseJson(json);
    const result = {};

    if (dbJson.firstName !== undefined) result.first_name = dbJson.firstName;
    if (dbJson.lastName !== undefined) result.last_name = dbJson.lastName;
    if (dbJson.passwordDigest !== undefined) result.password_digest = dbJson.passwordDigest;
    if (dbJson.email !== undefined) result.email = dbJson.email;
    if (dbJson.id !== undefined) result.id = dbJson.id;

    return result;
  }

  // Map snake_case to camelCase when reading from database
  $parseDatabaseJson(json) {
    const parsed = super.$parseDatabaseJson(json);
    return {
      id: parsed.id,
      firstName: parsed.first_name,
      lastName: parsed.last_name,
      email: parsed.email,
      passwordDigest: parsed.password_digest,
      createdAt: parsed.created_at,
      updatedAt: parsed.updated_at,
    };
  }
}

export default User;
