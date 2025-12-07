import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo";
import { IResolvers } from "@graphql-tools/utils";
import { signToken} from "../auth";
import { createUser, validateUser} from "../collections/UserCollection"; 
import { User } from "../types/User";
import { Project } from "../types/Project";
import { Task } from "../types/Task";

const COLLECTION_USERS = "users";
const COLLECTION_PROJECTS = "projects"
const COLLECTION_TASKS = "tasks"

export const resolvers: IResolvers = {

  Query: {

    users: async () => {
      const db = getDb();
      return await db.collection<User>(COLLECTION_USERS).find().toArray();
    },

    myProjects: async (_, __, { user }) => {
      if (!user) throw new Error("No autenticado");
      const db = getDb();
      const userId = new ObjectId(user._id);

      const projectsOwned = await db.collection<Project>(COLLECTION_PROJECTS).find({ 
        owner: userId 
      }).toArray();

      const projectsMember = await db.collection<Project>(COLLECTION_PROJECTS).find({ 
        members: userId 
      }).toArray();

      return [...projectsOwned, ...projectsMember];
    },

    projectDetails: async (_, { projectId }, { user }) => {
      if (!user) throw new Error("No autenticado");
      const db = getDb();
      
      const project = await db.collection<Project>(COLLECTION_PROJECTS).findOne({ 
        _id: new ObjectId(projectId) 
      });

      if (!project) throw new Error("Proyecto no encontrado");
      
      const isOwner = project.owner.toString() === user._id.toString();
      const isMember = project.members.some(member => member.toString() === user._id.toString());

      if (!isOwner && !isMember) throw new Error("No tienes acceso a este proyecto");

      return project;
    }

  },

  Mutation: {

    register: async (_, { input }) => {
      const user = await createUser(input);
      const token = signToken(user._id!.toString());
      return { token, user };
    },

    login: async (_, { input }) => {
      const user = await validateUser(input.email, input.password);
      if (!user) throw new Error("Invalid credentials");
      const token = signToken(user._id!.toString());
      return { token, user };
    },

    createProject: async (_, { input }, { user }) => {
      if (!user) throw new Error("No autenticado");
      const db = getDb();

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      if (end <= start) throw new Error("La fecha fin debe ser posterior a la de inicio");

      const result = await db.collection<Project>(COLLECTION_PROJECTS).insertOne({
        name: input.name,
        description: input.description,
        startDate: start,
        endDate: end,
        owner: new ObjectId(user._id),
        members: []
      });

      return {
        _id: result.insertedId,
        name: input.name,
        description: input.description,
        startDate: start,
        endDate: end,
        owner: new ObjectId(user._id),
        members: []
      };
    },

    updateProject: async (_, { id, input }, { user }) => {
      if (!user) throw new Error("No autenticado");
      const db = getDb();
      const projectId = new ObjectId(id);

      const project = await db.collection<Project>(COLLECTION_PROJECTS).findOne({ _id: projectId });
      if (!project) throw new Error("Proyecto no encontrado");
      if (!project.owner.equals(new ObjectId(user._id))) throw new Error("Solo el owner puede editar");

      const newName = input.name || project.name;
      
      const newDescription = input.description || project.description;

      const newStartDate = input.startDate ? new Date(input.startDate) : project.startDate;
      const newEndDate = input.endDate ? new Date(input.endDate) : project.endDate;

      if (newEndDate <= newStartDate) {
         throw new Error("La fecha de fin debe ser posterior a la de inicio");
      }

      await db.collection<Project>(COLLECTION_PROJECTS).updateOne(
        { _id: projectId },
        { 
          $set: { 
            name: newName,
            description: newDescription,
            startDate: newStartDate,
            endDate: newEndDate
          } 
        }
      );

      return await db.collection<Project>(COLLECTION_PROJECTS).findOne({ _id: projectId });
    },

    addMember: async (_, { projectId, userId }, { user }) => {
      if (!user) throw new Error("No autenticado");
      const db = getDb();

      const project = await db.collection<Project>(COLLECTION_PROJECTS).findOne({ _id: new ObjectId(projectId)});
      if (!project) throw new Error("Proyecto no encontrado");
      if (!project.owner.equals(new ObjectId(user._id))) throw new Error("Solo el owner puede añadir miembros");

      await db.collection<Project>(COLLECTION_PROJECTS).updateOne(
        { _id: new ObjectId(projectId) },
        { $addToSet: { members: new ObjectId(userId) } }
      );

      return await db.collection<Project>(COLLECTION_PROJECTS).findOne({ _id: new ObjectId(projectId)});
    },

    createTask: async (_, { projectId, input }, { user }) => {
      if (!user) throw new Error("No autenticado");
      const db = getDb();
  
      const project = await db.collection<Project>(COLLECTION_PROJECTS).findOne({ _id: new ObjectId(projectId)});
      if (!project) throw new Error("Proyecto no encontrado");
      
      const isOwner = project.owner.equals(new ObjectId(user._id));
      const isMember = project.members.some(member => member.equals(new ObjectId(user._id)));

      if (!isOwner && !isMember) throw new Error("No puedes crear tareas en este proyecto");

      if (!["LOW", "MEDIUM", "HIGH"].includes(input.priority)) {
          throw new Error("Prioridad inválida (LOW, MEDIUM, HIGH)");
      }

      const result = await db.collection<Task>(COLLECTION_TASKS).insertOne({
        title: input.title,
        projectId: new ObjectId(projectId),
        status: "PENDING",
        priority: input.priority,
        assignedTo: input.assignedTo ? new ObjectId(input.assignedTo) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined
      });
      return {
        _id:result.insertedId,
        title: input.title,
        projectId: new ObjectId(projectId),
        status: "PENDING",
        priority: input.priority,
        assignedTo: input.assignedTo ? new ObjectId(input.assignedTo) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined
        
      };
    },

    updateTaskStatus: async (_, { taskId, status }, { user }) => {
      if (!user) throw new Error("No autenticado");
      const db = getDb();

      if (!["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)) {
        throw new Error("Estado inválido (PENDING, IN_PROGRESS, COMPLETED)");
      }

      const result = await db.collection<Task>(COLLECTION_TASKS).updateOne(
        { _id: new ObjectId(taskId)},
        { $set: {status: status}}
      );

      return await db.collection<Task>(COLLECTION_TASKS).findOne({ _id: new ObjectId(taskId)});
    },

    deleteProject: async (_, { id }, { user }) => {
      if (!user) throw new Error("No autenticado");
      const db = getDb();
      const projectId = new ObjectId(id);
  
      const project = await db.collection<Project>(COLLECTION_PROJECTS).findOne({ _id: projectId });
      if (!project) throw new Error("Proyecto no encontrado");
      if (!project.owner.equals(new ObjectId(user._id))) throw new Error("Solo el owner puede borrar");

      await db.collection(COLLECTION_TASKS).deleteMany({ projectId: projectId });
      
      await db.collection(COLLECTION_PROJECTS).deleteOne({ _id: projectId });

      return "Proyecto y tareas eliminados correctamente";
    },
  },

  Project: {

    owner: async (parent: Project) => {
      const db = getDb();
      return await db.collection<User>(COLLECTION_USERS).findOne({ _id: parent.owner });
    },

    members: async (parent: Project) => {
      const db = getDb();
      return await db.collection<User>(COLLECTION_USERS).find({ 
        _id: { $in: parent.members } 
      }).toArray();
    },

    tasks: async (parent: Project) => {
      const db = getDb();
      return await db.collection<Task>(COLLECTION_TASKS).find({ 
        projectId: parent._id 
      }).toArray();
    }
  },

  Task: {

    project: async (parent: Task) => {
      const db = getDb();
      return await db.collection<Project>(COLLECTION_PROJECTS).findOne({ _id: parent.projectId });
    },

    assignedTo: async (parent: Task) => {
      if (!parent.assignedTo) return null;
      const db = getDb();
      return await db.collection<User>(COLLECTION_USERS).findOne({ _id: parent.assignedTo });
    }
  }
};