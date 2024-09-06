import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
const app = new Hono();


app.use('/api/v1/blog/*',async (c,next) => {
    const header = c.req.header('Authorization') || "";
	const token = header.split(" ")[1];
    console.log('here');
	const response = await verify(token,'secret');
	if(response.id)
	{
		await next();
	}
	else{
		c.status(403);
		return c.json('unauthorised');
	}
})

app.post("/api/v1/signup", async (c) => {
  const prisma = new PrismaClient({
    //@ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
	
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });
	
    
    const jwt =await sign({ id: user.id }, "secret");
    
    return c.json({ jwt });
  } catch (e) {
    c.status(403);
    return c.json({ error: "error while signing up" });
  }
});

app.post("/api/v1/signin",async (c) => {
  const prisma = new PrismaClient({
    //@ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
	const body = await c.req.json();
	const user = await prisma.user.findUnique({
		where : {
			email : body.email,
		}
	})

	if(!user)
	{
		return c.json({message : 'user not found'})
	}
	const jwt =await sign({id : user.id}, 'secret');
	return c.json({jwt});
  } catch (e) {
	c.status(403);
	return c.json({error : 'error while signing in'});
  }

});

app.get("/api/v1/blog/:id", (c) => {
  const id = c.req.param("id");
  console.log(id);
  return c.text("get blog route");
});

app.post("/api/v1/blog", (c) => {
  return c.text("signin route");
});

app.put("/api/v1/blog", (c) => {
  return c.text("signin route");
});
export default app;