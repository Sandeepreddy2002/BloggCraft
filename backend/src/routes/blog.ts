import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.split(" ")[1]; // Extract the token
  console.log("JWT Token:", token);
  console.log("JWT Secret:", c.env.JWT_SECRET);

  if (!token) {
    c.status(403);
    return c.json({ message: "Token not provided" });
  }

  try {
    const response = await verify(token, c.env.JWT_SECRET);
    console.log("JWT Verification Response:", response);

    if (response) {
      //@ts-ignore
      c.set("userId", response.id);
      await next();
    } else {
      c.status(403);
      return c.json({ message: "Unauthorized" });
    }
  } catch (e) {
    console.error("JWT Verification Error:", e);
    c.status(403);
    return c.json({ message: "Unauthorized: Invalid Token" });
  }
});

blogRouter.post("/a", async (c) => {
  const userId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const post = await prisma.blog.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: userId,
    },
  });

  return c.json({ id: post.id });
});

blogRouter.get("/:id",async (c) => {
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.blog.findUnique({
    where: {
      id,
    },
  });

  return c.json(post);
});

blogRouter.get('bulk', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	const posts = await prisma.blog.findFirst({});
	return c.json(posts);
})

blogRouter.put("/api/v1/blog", async (c) => {
  const userId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  prisma.blog.update({
    where: {
      id: body.id,
      authorId: userId,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return c.json({ message: "signin rout" });
});
