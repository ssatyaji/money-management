import { app } from "./app";

const port = process.env.PORT || 3000;

app.listen(port);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📖 Swagger documentation is available at http://${app.server?.hostname}:${app.server?.port}/swagger`
);
