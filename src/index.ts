import { Elysia } from "elysia";
import { auth } from "./modules/auth";

const app = new Elysia()
  .onError(({ code, error }) => {
    if (code === 'VALIDATION')
        return {
            status: "error",
            type: "validation",
            errors: error.all.map((error) => {
              return {
                property: error.path,
                message: error.message
              }
            })
        }
  })
  .use(auth)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
