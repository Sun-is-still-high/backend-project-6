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
}

export default User;
