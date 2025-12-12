import { gql } from "apollo-server";

export const typeDefs = gql`

  type User {
    _id: ID!
    username: String!
    email: String!
    createdAt: String!
  }

  type Task {
    _id: ID!
    title: String!
    project: Project!
    assignedTo: User
    status: String!    
    priority: String! 
    dueDate: String
  }

  type Project {
    _id: ID!
    name: String!
    description: String
    startDate: String!
    endDate: String!
    owner: User!
    members: [User!]!
    tasks: [Task!]!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateProjectInput {
    name: String!
    description: String
    startDate: String!
    endDate: String!
  }

  input UpdateProjectInput {
    name: String
    description: String
    startDate: String
    endDate: String
  }

  input TaskInput {
    title: String!
    assignedTo: ID
    priority: String! 
    dueDate: String
  }

  input UpdateTaskInput {
    status: String!    
  }

  type Query {
    myProjects: [Project!]!
    projectDetails(projectId: ID!): Project
    users: [User!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    addMember(projectId: ID!, userId: ID!): Project!
    createTask(projectId: ID!, input: TaskInput!): Task!
    updateTaskStatus(taskId: ID!, status: String!): Task! 
    deleteProject(id: ID!): String!
  }
`;