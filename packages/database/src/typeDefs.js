const { gql } = require('apollo-server');

const typeDefs = gql`
  type Query {
    getUsers: [User!]!
    getUser(id: String!): User
    getCompany(id: String!): Company
    getCompanies: [Company!]!
    getForms: [Form!]!
    getForm(id: String!): Form
    getFormInputs: [FormInput!]!
    login(email: String!, password: String!): AuthData!
  }

  input InputOptionInput {
    value: String!
  }

  type Mutation {
    createUser(email: String!, name: String!, last_name: String!, password: String!, company_name: String!): User!
    updateUser(email: String!, name: String!, last_name: String!): User!
    updatePassword(old_password: String!, password: String!, password_confirmation: String!): User!
    deleteUser(id: String!): User!
    addUser(email: String!, name: String!, last_name: String!): User!

    createForm(name: String!, title: String!, description: String!): Form!
    createFormInput(label: String!, placeholder: String, type: String!, formId: ID!, options: [InputOptionInput]): FormInput!
  }

  type AuthData {
    userId: ID!
    companyId: ID!
    token: String!
    tokenExpiration: Int!
}

  type User {
    id: ID!
    name: String!
    last_name: String!
    phone_number: String
    password: String!
    email: String!
    company: Company!
  }

  type Company {
    id: ID!
    name: String!
    users: [User!]!
    forms: [Form!]!
  }

  type Form {
    id: ID!
    name: String!
    title: String!
    description: String!
    status: Boolean!
    creator: String!
    responses: Int
    company: Company!
    inputs: [FormInput!]
  }

  type FormInput {
    id: ID!
    label: String!
    placeholder: String
    type: String!
    form: Form!
    options: [InputOption!]
  }

  type InputOption {
    id: ID!
    value: String!
    formInput: FormInput!
  }
`;

module.exports = typeDefs;