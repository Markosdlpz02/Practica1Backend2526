import { ApolloServer } from "apollo-server";
import { connectMongoDB } from "./db/mongo"
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { getUserFromToken } from "./auth";

const start = async () => {
  await connectMongoDB();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const token = req.headers.authorization || "";
      const user = token ? await getUserFromToken(token as string) : null;
      return { user };
    },
  });

  await server.listen({ port: 4000 });
  console.log("Servidor GraphQL listo");
};


start().catch(err=>console.error(err));